# Shopify App Template (React Router)

A modern Shopify app template built with React Router, featuring Polaris web components for UI, Prisma for session storage, and seamless integration with the Shopify Admin GraphQL API.

## 🚀 Features

- **React Router v7** - File-based routing with flat route structure
- **Polaris Web Components** - Beautiful, accessible UI components
- **Prisma ORM** - Type-safe database access with session management
- **Shopify Admin API** - Full GraphQL support for data operations
- **TypeScript** - End-to-end type safety
- **Docker Support** - Containerized deployment ready
- **MySQL Database** - Production-ready session storage

## 📋 Prerequisites

- **Node.js**: `>=20.19 <22 || >=22.12`
- **Shopify CLI**: Latest version
- **Docker** (optional, for containerized development)
- **MySQL** (for production database)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shopify-app-template-react-router
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   npm run env
   ```

4. **Initialize database**
   ```bash
   # Start MySQL with Docker (optional)
   docker-compose up -d db

   # Run Prisma setup
   npm run setup
   ```

## 🏃 Development

### Start Development Server

```bash
npm run dev
```

This will:
- Start the Vite development server
- Launch the Shopify app tunnel
- Open your app in the browser

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

## 📚 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Shopify CLI |
| `npm run build` | Build the app for production |
| `npm run start` | Start production server |
| `npm run setup` | Generate Prisma Client and run migrations |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run prisma <command>` | Run Prisma CLI commands |
| `npm run graphql-codegen` | Generate TypeScript types from GraphQL |
| `npm run docker-start` | Start app in Docker container |

## 🏗️ Project Structure

```
├── app/
│   ├── routes/           # File-based routes
│   │   ├── app._index.tsx           # Main app page (/app)
│   │   ├── app.additional.tsx       # Additional pages
│   │   ├── webhooks.*.tsx           # Webhook handlers
│   │   └── auth.$.tsx               # Authentication routes
│   ├── shopify.server.ts  # Shopify app configuration
│   ├── db.server.ts       # Prisma client instance
│   └── root.tsx           # Root layout component
├── prisma/
│   └── schema.prisma      # Database schema
├── extensions/            # Shopify app extensions
├── public/                # Static assets
└── shopify.app.toml       # Shopify app configuration
```

## 🔐 Authentication

### Server-side Authentication

```typescript
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  // Use admin.graphql() for API calls
};
```

### Webhook Authentication

```typescript
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);
  // Handle webhook
};
```

## 🌐 GraphQL API Usage

```typescript
const { admin } = await authenticate.admin(request);
const response = await admin.graphql(`
  query {
    products(first: 25) {
      nodes {
        id
        title
      }
    }
  }
`);
const json = await response.json();
```

## 🗄️ Database Configuration

### MySQL (Default)

**Connection URL:**
```bash
DATABASE_URL="mysql://docker:docker@localhost:3306/docker"
```

**Start MySQL with Docker:**
```bash
docker-compose up -d db
```

**To switch databases:**

1. Update `datasource db` provider in `prisma/schema.prisma`
2. Update `DATABASE_URL` in `.env`
3. Run `npm run setup`

## 🐳 Docker Support

Build and run the app in a Docker container:

```bash
# Build the image
docker build -t shopify-app .

# Run the container
docker run -p 8080:8080 shopify-app
```

Or use the convenience script:

```bash
npm run docker-start
```

## 🎨 Navigation Patterns

For embedded apps, use these navigation methods:

- **Link component** from `react-router` or `@shopify/polaris` - NOT `<a>` tags
- **redirect** from `authenticate.admin` - NOT `redirect` from react-router
- **useSubmit** from `react-router` for form submissions

## 🔧 Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SHOPIFY_API_KEY` | API key from app settings |
| `SHOPIFY_API_SECRET` | API secret |
| `SHOPIFY_APP_URL` | App URL |
| `SCOPES` | Comma-separated list of required scopes |
| `DATABASE_URL` | Database connection string |
| `SHOP_CUSTOM_DOMAIN` | Optional custom shop domain |

## 📖 Additional Resources

- [Shopify App Documentation](https://shopify.dev/docs/apps)
- [React Router Documentation](https://reactrouter.com/)
- [Polaris Design System](https://polaris.shopify.com/)
- [Prisma Documentation](https://www.prisma.io/docs)

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
