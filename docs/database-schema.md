# Database Schema

> **Note:** User will run `prisma db pull` to generate schema from existing database.

---

## OVERVIEW

**Database:** MySQL 8.0
**ORM:** Laravel Eloquent (current), Prisma (for recreation)

**Key Tables:**
- `accessibilities` - Widget configurations
- `stores` - Shopify store information
- `apps` - Application instances
- `users` - Laravel users
- `sessions` - Shopify sessions
- `jobs` - Queue jobs

---

## TABLE: accessibilities

### Purpose
Stores widget configuration and accessibility statement for each store/app combination.

### Schema

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| `id` | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| `app_id` | BIGINT | NULLABLE, INDEX | Foreign key to apps.id |
| `store_id` | BIGINT | NULLABLE, INDEX | Foreign key to stores.id |
| `status` | TINYINT | DEFAULT: 0 | Widget enable status (0=off, 1=on) |
| `icon` | LONGTEXT | NULLABLE | Icon identifier (JSON) |
| `position` | VARCHAR(256) | NULLABLE | Widget position |
| `options` | LONGTEXT | NULLABLE | Widget options (JSON) |
| `statement` | LONGTEXT | NULLABLE | Accessibility statement HTML |
| `created_at` | TIMESTAMP | NULLABLE | Creation timestamp |
| `updated_at` | TIMESTAMP | NULLABLE | Last update timestamp |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete timestamp |

### options Field Structure (JSON)

```json
{
  "color": "#ffffff",
  "size": "24",
  "background_color": "#FA6E0A",
  "offsetX": 0,
  "offsetY": 0,
  "locale": "en",
  "theme_bg_color": "#FA6E0A",
  "font": "8"
}
```

### Relationships

- **Belongs To:** `apps` (via `app_id`)
- **Belongs To:** `stores` (via `store_id`)

### Laravel Model

```php
class Accessibility extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'accessibilities';
    protected $primaryKey = 'id';

    protected $fillable = [
        'app_id',
        'store_id',
        'status',
        'icon',
        'position',
        'options',
        'statement',
    ];

    protected $casts = [
        'options' => 'array',  // Auto JSON encode/decode
    ];
}
```

### Prisma Schema (Expected Output)

```prisma
model Accessibility {
  id         BigInt    @id @default(autoincrement())
  appId      BigInt?   @map("app_id")
  storeId    BigInt?   @map("store_id")
  status     Int       @default(0) @db.TinyInt
  icon       String?   @db.LongText
  position   String?   @db.VarChar(256)
  options    String?   @db.LongText  // JSON string
  statement  String?   @db.LongText
  createdAt  DateTime? @map("created_at")
  updatedAt  DateTime? @map("updated_at")
  deletedAt  DateTime? @map("deleted_at")

  app   App?   @relation(fields: [appId], references: [id])
  store Store? @relation(fields: [storeId], references: [id])

  @@index([appId])
  @@index([storeId])
}
```

---

## TABLE: stores

### Purpose
Stores Shopify shop information and metadata. Extended from `sgt-shopify-core` submodule.

### Schema (Core + App Extensions)

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| `id` | BIGINT UNSIGNED | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR | NULLABLE | Store name |
| `contact_email` | VARCHAR | NULLABLE | Owner email |
| `shop_id` | VARCHAR | NULLABLE | Shopify shop ID |
| `shop_url` | VARCHAR | NULLABLE, UNIQUE | Shopify shop domain |
| `country` | VARCHAR | NULLABLE | Store country |
| `meta` | TEXT/JSON | NULLABLE | Additional metadata |
| `created_at` | TIMESTAMP | NULLABLE | Creation timestamp |
| `updated_at` | TIMESTAMP | NULLABLE | Last update timestamp |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete timestamp |

### Relationships

- **Has Many:** `accessibilities` (one per app)
- **Has Many:** `apps` (many-to-many through pivot)

### Laravel Model

```php
class Store extends \Saigontech\ShopifyCore\Http\Models\Store
{
    // Extended in local app
    public function accessibility(): HasOne
    {
        return $this->hasOne(Accessibility::class)
            ->where('app_id', AppConfig::currentAppId());
    }

    public function install(Session $session): Model
    {
        parent::install($session);

        if (!$this->accessibility()->exists()) {
            $accessibility = new Accessibility([
                'app_id' => AppConfig::currentAppId()
            ]);
            $accessibility->fill(config('shopify.accessibility.default'));
            $this->accessibility()->save($accessibility);

            MailService::sendWelcome($this->contact_email);
            ChatWorkService::pushInstalled($this->shop_url);
        }

        return $this;
    }

    public function uninstall(ShopifySession $session): Model
    {
        parent::uninstall($session);
        $this->accessibility()->delete();

        MailService::sendCancelSubscription($this->contact_email);
        ChatWorkService::pushUninstalled($this->shop_url);

        return $this;
    }
}
```

---

## TABLE: apps

### Purpose
Stores application instances (multi-tenancy support).

### Schema

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| `id` | BIGINT UNSIGNED | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR | NOT NULL | App name |
| `status` | VARCHAR | NOT NULL | App status |
| `created_at` | TIMESTAMP | NULLABLE | Creation timestamp |
| `updated_at` | TIMESTAMP | NULLABLE | Last update timestamp |

### Relationships

- **Has Many:** `accessibilities` (one per store)
- **Belongs To Many:** `stores` (many-to-many)

---

## TABLE: users (Laravel Default)

### Purpose
Laravel authentication users (not used for Shopify OAuth).

### Schema

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| `id` | BIGINT UNSIGNED | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR | NOT NULL | User name |
| `email` | VARCHAR | NOT NULL, UNIQUE | User email |
| `email_verified_at` | TIMESTAMP | NULLABLE | Email verification |
| `password` | VARCHAR | NOT NULL | Hashed password |
| `remember_token` | VARCHAR | NULLABLE | Remember me token |
| `created_at` | TIMESTAMP | NULLABLE | Creation timestamp |
| `updated_at` | TIMESTAMP | NULLABLE | Last update timestamp |

---

## TABLE: sessions (Shopify)

### Purpose
Stores Shopify OAuth sessions (from `sgt-shopify-core` submodule).

### Schema

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| `id` | VARCHAR | PRIMARY KEY | Session ID |
| `shop` | VARCHAR | NOT NULL, INDEX | Shop domain |
| `scope` | VARCHAR | NULLABLE | OAuth scope |
| `access_token` | VARCHAR | NULLABLE | Shopify access token |
| `user_id` | BIGINT | NULLABLE | User ID |
| `state` | VARCHAR | NULLABLE | OAuth state |
| `created_at` | TIMESTAMP | NULLABLE | Creation timestamp |
| `updated_at` | TIMESTAMP | NULLABLE | Last update timestamp |

---

## TABLE: jobs (Queue)

### Purpose
Queue jobs for background processing (emails, notifications).

### Schema

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| `id` | BIGINT UNSIGNED | PRIMARY KEY | Unique identifier |
| `queue` | VARCHAR | NOT NULL | Queue name |
| `payload` | LONGTEXT | NOT NULL | Job data (JSON) |
| `attempts` | UNSIGNED INT | DEFAULT: 0 | Retry count |
| `reserved_at` | INT | NULLABLE | Reserved timestamp |
| `available_at` | INT | NOT NULL | Available timestamp |
| `created_at` | INT | NOT NULL | Creation timestamp |

---

## OTHER TABLES

### password_resets
Password reset tokens (Laravel default).

### failed_jobs
Failed queue jobs for troubleshooting.

### personal_access_tokens
Laravel Sanctum API tokens.

---

## RELATIONSHIP DIAGRAM

```
stores (1) ----< (1) accessibilities
    |                         |
    |                         |
    |                         v
    |                    apps (1)
    |
    +----< (many) sessions
```

**Notes:**
- One store can have multiple accessibility records (one per app)
- Currently only one app exists
- Future: Multi-tenancy with multiple apps per store

---

## MIGRATIONS

### Initial Accessibility Table

```php
// 2022_11_16_063439_create_accessibilities_table.php

Schema::create('accessibilities', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->softDeletes();
    $table->timestamps();
    $table->foreignId('app_store_id')->index();  // Changed later
    $table->tinyInteger('status')->default(0);
    $table->longText('icon')->nullable();
    $table->string('position', 256)->nullable();
    $table->longText('options')->nullable();
    $table->longText('statement')->nullable();
});
```

### Foreign Key Change

```php
// 2022_12_01_152611_change_accessibilities_foreign_key.php

Schema::table('accessibilities', function (Blueprint $table) {
    $table->dropColumn('app_store_id');
    $table->bigInteger('app_id')->nullable();
    $table->bigInteger('store_id')->nullable();
});
```

---

## DEFAULT DATA

### Default Widget Configuration

```php
// config/shopify.php

'default' => [
    'status' => 0,  // Disabled by default
    'icon' => 'icon-circle',
    'position' => 'bottom-right',
    'options' => [
        'color' => '#ffffff',
        'size' => '24',
        'background_color' => '#FA6E0A',
        'offsetX' => null,
        'offsetY' => null,
        'locale' => 'en',
        'theme_bg_color' => '#FA6E0A',
        'font' => '8',
    ],
    'statement' => null,
]
```

---

## PRISMA CONVERSION NOTES

### Run Prisma DB Pull

```bash
# From new project root
prisma db pull

# This will:
# 1. Connect to existing MySQL database
# 2. Reverse-engineer schema
# 3. Generate schema.prisma file
```

### Expected Schema Output

```prisma
// prisma/schema.prisma

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Accessibility {
  id         BigInt    @id @default(autoincrement())
  appId      BigInt?   @map("app_id")
  storeId    BigInt?   @map("store_id")
  status     Int       @default(0) @db.TinyInt
  icon       String?   @db.LongText
  position   String?   @db.VarChar(256)
  options    String?   @db.LongText  // NOTE: Cast in app code
  statement  String?   @db.LongText
  createdAt  DateTime? @map("created_at")
  updatedAt  DateTime? @map("updated_at")
  deletedAt  DateTime? @map("deleted_at")

  app   App?   @relation(fields: [appId], references: [id])
  store Store? @relation(fields: [storeId], references: [id])

  @@index([appId])
  @@index([storeId])
}

model Store {
  id            BigInt          @id @default(autoincrement())
  name          String?         @db.VarChar(255)
  contactEmail  String?         @map("contact_email") @db.VarChar(255)
  shopId        String?         @map("shop_id") @db.VarChar(255)
  shopUrl       String?         @unique @map("shop_url") @db.VarChar(255)
  country       String?         @db.VarChar(255)
  meta          String?         @db.Text
  createdAt     DateTime?       @map("created_at")
  updatedAt     DateTime?       @map("updated_at")
  deletedAt     DateTime?       @map("deleted_at")

  accessibilities Accessibility[]
}

model App {
  id                BigInt          @id @default(autoincrement())
  name              String          @db.VarChar(255)
  status            String          @db.VarChar(255)
  createdAt         DateTime?       @map("created_at")
  updatedAt         DateTime?       @map("updated_at")

  accessibilities Accessibility[]
}

model User {
  id             BigInt       @id @default(autoincrement())
  name           String       @db.VarChar(255)
  email          String       @unique @db.VarChar(255)
  emailVerifiedAt DateTime?   @map("email_verified_at")
  password       String       @db.VarChar(255)
  rememberToken  String?      @map("remember_token") @db.VarChar(100)
  createdAt      DateTime?    @map("created_at")
  updatedAt      DateTime?    @map("updated_at")
}
```

---

## INDEXES

### Performance Indexes

```sql
-- accessibilities
CREATE INDEX idx_accessibilities_app_id ON accessibilities(app_id);
CREATE INDEX idx_accessibilities_store_id ON accessibilities(store_id);

-- sessions
CREATE INDEX idx_sessions_shop ON sessions(shop);

-- stores
CREATE UNIQUE INDEX idx_stores_shop_url ON stores(shop_url);
```

---

## DATA INTEGRITY

### Constraints

**Note:** No foreign key constraints are defined in migrations.

- Relationships are application-level (virtual)
- Allows flexibility but requires careful data management
- Consider adding FK constraints for new implementation

### Soft Deletes

Tables with soft deletes:
- `accessibilities` (`deleted_at`)
- `stores` (`deleted_at`)

**Important:** Queries must filter `WHERE deleted_at IS NULL` or use model's soft delete scope.

---

**Last Updated:** 2025-03-02
