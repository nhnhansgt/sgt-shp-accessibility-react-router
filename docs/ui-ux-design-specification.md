# Shopify Accessibility Admin App - UI/UX Design Specification

Document detailing component inventory, layout recommendations, custom components, UX flows, and accessibility guidelines for implementing the Shopify Accessibility Admin App using Polaris Web Components.

---

## Table of Contents

1. [Component Inventory](#component-inventory)
2. [Layout Recommendations](#layout-recommendations)
3. [Custom Component Specifications](#custom-component-specifications)
4. [UX Flow Diagrams](#ux-flow-diagrams)
5. [Accessibility Checklist](#accessibility-checklist)
6. [Shared Components](#shared-components)

---

## Component Inventory

### Polaris Web Components Available

Based on the existing implementation in `app._index.tsx`, the following Polaris web components are available:

| Component | Tag | Usage |
|-----------|-----|-------|
| Page | `<s-page>` | Main page container with heading |
| Button | `<s-button>` | Primary/secondary actions |
| Section | `<s-section>` | Content sections with heading |
| Stack | `<s-stack>` | Layout spacing (direction: inline/block) |
| Box | `<s-box>` | Container with padding/border/background |
| Link | `<s-link>` | Navigation links |
| Heading | `<s-heading>` | Section headings |
| Paragraph | `<s-paragraph>` | Text content |
| UnorderedList | `<s-unordered-list>` | Bullet lists |
| ListItem | `<s-list-item>` | List items |

### Additional Polaris Components Needed

The following Polaris components will be needed (available as React components or web equivalents):

| Component | Purpose | Screen |
|-----------|---------|--------|
| Card | Plan cards, feature boxes | Plans, Setup, Support |
| TextField | Input fields | Setup (language) |
| Select | Dropdown selections | Widgets (font, position) |
| ColorPicker | Color selection | Widgets |
| Slider | Size/offset adjustments | Widgets |
| RadioButtonGroup | Position selection | Widgets |
| Grid | Icon selection grid | Widgets |
| Badge | Sale banners, status | All screens |
| Modal | Help modal, confirmations | Setup |
| Spinner | Loading states | All screens |
| Banner | Status/announcement banners | All screens |

---

## Screen-by-Screen Component Analysis

### 1. Plans Screen (`/app/plans`)

#### Component Inventory

| Component | Props/Configuration | Purpose |
|-----------|---------------------|---------|
| `<s-page>` | heading: "Choose your plan" | Page container |
| `Banner` | status: "info", dismissible | Year End Sale banner (conditional) |
| `Card` | subdued: false, sectioned: true | Plan card container |
| `Badge` | status: "success" | "Best value" badge for annual |
| `<s-heading>` | level: 2 | Plan price |
| `<s-paragraph>` | | Feature list |
| `<s-unordered-list>` | | Feature items |
| `<s-button>` | variant: primary/tertiary, loading | "Start free trial" buttons |

#### Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Page: Choose your plan                          │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐    │
│  │  Banner: Year End Sale (conditional)    │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌──────────────────┐  ┌──────────────────┐    │
│  │  Monthly Plan    │  │  Annual Plan      │    │
│  │  [Card]          │  │  [Card + Badge]   │    │
│  │                  │  │                  │    │
│  │  $6.99/month     │  │  $5.60/month     │    │
│  │  • Features      │  │  • 20% discount  │    │
│  │  • 14-day trial  │  │  • 14-day trial  │    │
│  │                  │  │                  │    │
│  │  [Start trial]   │  │  [Start trial]   │    │
│  └──────────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────┘
```

#### State Requirements

```typescript
interface PlansScreenState {
  paid: 'monthly' | 'annual' | null;  // Current plan status
  isLoading: boolean;
  requestingMonthly: boolean;
  requestingAnnual: boolean;
  isYearEndSale: boolean;  // Controls banner visibility
  saleDays: number;         // Trial days during sale (90)
}
```

---

### 2. Setup / Quick Start Screen (`/app/setup`)

#### Component Inventory

| Component | Props/Configuration | Purpose |
|-----------|---------------------|---------|
| `<s-page>` | heading: "Quick Start" | Page container |
| `Banner` | status: "success"/"warning" | Status banner |
| `Card` | sectioned: true | Welcome card |
| `<s-heading>` | level: 2 | Welcome title |
| `<s-paragraph>` | | Introduction text |
| `<s-unordered-list>` | | 5-step guide |
| `<s-list-item>` | | Guide steps with links |
| `<s-link>` | href: destination URLs | Navigation links |
| `<s-button>` | variant: primary | Help actions |
| `Modal` | open: boolean, size: "small" | Welcome modal (first visit) |

#### Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Page: Quick Start                               │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐    │
│  │  Banner: Status (Green/Yellow)          │    │
│  │  "Accessibility is enabled"              │    │
│  │  [Open Theme Editor]                    │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  Card: Welcome to Accessibility App     │    │
│  │                                         │    │
│  │  Getting Started:                       │    │
│  │  1. [Customize your widget]             │    │
│  │  2. [Create your statement]             │    │
│  │  3. [Visit Help Center]                 │    │
│  │  4. [Website] [Facebook]                │    │
│  │  5. [Manage your plan]                  │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  Card: Support                          │    │
│  │  [Chat with us] [Email] [Knowledge Base]│    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

#### Modal Structure (First Visit)

```
┌──────────────────────────┐
│  [Logo]                  │
│  ─────────────────       │
│                          │
│  [Auto-sliding content]  │
│  Feature 1/5             │
│                          │
│  [○ ○ ● ○ ○]            │
│                          │
│           [Close]        │
└──────────────────────────┘
```

---

### 3. Widgets Screen (`/app/widgets`)

#### Component Inventory

| Component | Props/Configuration | Purpose |
|-----------|---------------------|---------|
| `<s-page>` | heading: "Customize Your Widget" | Page container |
| `Layout` | | Two-column layout (settings + preview) |
| `Card` | sectioned: true, title | Setting sections |
| `<s-heading>` | level: 3 | Section titles |
| `Grid` | columns: 5, gap: "base" | Icon selection grid |
| `RadioButtonGroup` | | Position selection |
| `Slider` | min: 24, max: 50, step: 1 | Size/offset controls |
| `ColorPicker` | | Icon/background colors |
| `Select` | options: font list | Font selection |
| `<s-box>` | | Live preview container |
| `<s-button>` | variant: primary, loading | Save button |

#### Layout Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  Page: Customize Your Widget                                      │
├───────────────────────────┬──────────────────────────────────────┤
│  Settings Column          │  Preview Column                      │
│                           │                                      │
│  ┌─────────────────────┐ │  ┌────────────────────────────────┐ │
│  │ Card: Widget Icon   │ │  │                                │ │
│  │ ┌───┬───┬───┬───┐  │ │  │     [Live Widget Preview]     │ │
│  │ │ ○ │ ♿ │ 👁 │ ⭐ │  │ │  │           ↓                   │ │
│  │ ├───┼───┼───┼───┤  │ │  │      [Accessibility]           │ │
│  │ │ ⚙ │ 🌐 │ 🎨 │ 💬 │  │ │  │                                │ │
│  │ └───┴───┴───┴───┘  │ │  │  Reflects all settings in        │ │
│  └─────────────────────┘ │  │  real-time                       │ │
│                           │  └────────────────────────────────┘ │
│  ┌─────────────────────┐ │                                      │
│  │ Card: Position      │ │  ┌────────────────────────────────┐ │
│  │ ○ Top Left          │ │  │    Panel Preview                │ │
│  │ ○ Top Right         │ │  │    ─────────────                │ │
│  │ ● Bottom Right      │ │  │    Font size [━━━●──]           │ │
│  │ ○ Bottom Left       │ │  │    Contrast  [━━●───]           │ │
│  └─────────────────────┘ │  └────────────────────────────────┘ │
│                           │                                      │
│  ┌─────────────────────┐ │                                      │
│  │ Card: Size          │ │                                      │
│  │ Size:   [━━━━●━━━]  │ │                                      │
│  │ Offset X: [━●━━━━━]  │ │                                      │
│  │ Offset Y: [━━●━━━━]  │ │                                      │
│  └─────────────────────┘ │                                      │
│                           │                                      │
│  ┌─────────────────────┐ │                                      │
│  │ Card: Colors        │ │                                      │
│  │ Icon:     [●] Picker│ │                                      │
│  │ Bg Color: [●] Picker│ │                                      │
│  │ Panel Bg:  [●] Picker│ │                                      │
│  └─────────────────────┘ │                                      │
│                           │                                      │
│  ┌─────────────────────┐ │                                      │
│  │ Card: Font          │ │                                      │
│  │ [Lobster ▼]         │ │                                      │
│  └─────────────────────┘ │                                      │
│                           │                                      │
│           [Save]          │                                      │
└───────────────────────────┴──────────────────────────────────────┘
```

#### Icon Grid Detail

```
Icon Selection (10+ options):
┌───┬───┬───┬───┬───┐
│ ○ │ ♿ │ 👁 │ ⭐ │ ⚙ │
│ circle │wheel│ eye │star│gear│
├───┼───┼───┼───┼───┤
│ 🌐 │ 🎨 │ 💬 │ 🦯 │ 📻 │
│universal│art │chat│blind│radio│
└───┴───┴───┴───┴───┘

Selected state: Ring border (2px, brand color)
```

---

### 4. Statement Screen (`/app/statement`)

#### Component Inventory

| Component | Props/Configuration | Purpose |
|-----------|---------------------|---------|
| `<s-page>` | heading: "Accessibility Statement" | Page container |
| `Card` | sectioned: true | Editor container |
| `RichTextEditor` | Draft.js-based | Content editing |
| `<s-toolbar>` | | Formatting toolbar |
| `<s-button>` | variant: primary/tertiary | Save/Reset actions |
| `<s-box>` | padding: "base" | Toolbar container |

#### Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Page: Accessibility Statement                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  Rich Text Editor                       │    │
│  │  ┌───────────────────────────────────┐  │    │
│  │  │ B  I  U  •  1.  ≡  ⋮  🖼  🔗     │  │    │
│  │  └───────────────────────────────────┘  │    │
│  │                                         │    │
│  │  ┌───────────────────────────────────┐  │    │
│  │  │  Accessibility Statement           │  │    │
│  │  │                                   │  │    │
│  │  │  Our commitment to accessibility... │    │
│  │  │                                   │  │    │
│  │  │  • Font size adjustment           │  │    │
│  │  │  • Screen reader support          │  │    │
│  │  │                                   │  │    │
│  │  │                                   │  │    │
│  │  └───────────────────────────────────┘  │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  [Save]                    [Reset to default]    │
│                                                  │
│  Privacy Policy | Terms of Service              │
└─────────────────────────────────────────────────┘
```

#### Rich Text Editor Components

| Component | Purpose |
|-----------|---------|
| Bold button | Toggle bold formatting |
| Italic button | Toggle italic formatting |
| Underline button | Toggle underline formatting |
| Unordered list | Insert bullet list |
| Ordered list | Insert numbered list |
| Text align | Alignment options (left/center/right) |
| Link | Insert/edit hyperlink |
| Image | Insert image URL |

---

### 5. Support Screen (`/app/support`)

#### Component Inventory

| Component | Props/Configuration | Purpose |
|-----------|---------------------|---------|
| `<s-page>` | heading: "Guides & Support" | Page container |
| `Card` | sectioned: true | Video container |
| `<iframe>` | src: YouTube embed | Video player |
| `Card` | sectioned: true | Support options |
| `<s-heading>` | level: 2 | Section titles |
| `<s-paragraph>` | | Response time note |
| `<s-button>` | variant: primary/tertiary | Action buttons |
| `<s-stack>` | direction: "inline" | Button layout |

#### Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Page: Guides & Support                         │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  Card: How to use Accessibility app     │    │
│  │  ┌───────────────────────────────────┐  │    │
│  │  │                                   │  │    │
│  │  │      [YouTube Video Player]       │  │    │
│  │  │      https://youtu.be/e0WOkdanoJo │  │    │
│  │  │                                   │  │    │
│  │  └───────────────────────────────────┘  │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  Card: Have questions?                  │    │
│  │                                         │    │
│  │  We respond within 12 - 24 hours        │    │
│  │                                         │    │
│  │  [Chat with us] [Email] [Knowledge Base]│    │
│  │                                         │    │
│  │  [Technical Support Illustration]       │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  Privacy Policy | Terms of Service              │
└─────────────────────────────────────────────────┘
```

---

## Layout Recommendations

### Primary Layout Pattern

All screens should use a consistent **single-column centered layout** with a maximum width of `1024px` for the main content area. The Widgets screen is an exception, using a two-column layout.

### Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 768px | Single column, stacked cards |
| Tablet | 768px - 1024px | Single column, wider containers |
| Desktop | > 1024px | Full layout (including two-column for Widgets) |

### Spacing System

Use Polaris spacing tokens:

```typescript
// Polaris spacing scale
const spacing = {
  'extra-tight': '4px',
  'tight': '8px',
  'base': '16px',
  'loose': '24px',
  'extra-loose': '32px'
};

// Apply via gap prop
<s-stack gap="base">...</s-stack>
```

### Card Layout Standards

```typescript
interface CardProps {
  // Content
  children: ReactNode;
  title?: string;

  // Visual
  subdued?: boolean;      // Gray background
  sectioned?: boolean;    // Add internal padding

  // Actions
  actions?: ReactNode;    // Header actions
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode[];
}
```

---

## Custom Component Specifications

### 1. Year End Sale Banner

**Purpose:** Display promotional banner during sale periods

```typescript
interface SaleBannerProps {
  visible: boolean;
  saleDays: number;  // Extended trial days
  onDismiss?: () => void;
}

// Visual: Top banner with brand background, white text
// Content: "🎉 Year End Sale! Get {saleDays} days free trial instead of 14!"
// Action: Dismissible X button
```

**Implementation:**

```tsx
<Banner
  status="info"
  onDismiss={onDismiss}
  open={visible}
>
  <s-stack direction="inline" gap="base">
    <span>🎉</span>
    <s-text>
      Year End Sale! Get <strong>{saleDays} days</strong> free trial instead of 14!
    </s-text>
  </s-stack>
</Banner>
```

---

### 2. Status Banner (Setup Screen)

**Purpose:** Show whether accessibility is enabled/disabled with link to Theme Editor

```typescript
interface StatusBannerProps {
  isEnabled: boolean;
  themeEditorUrl: string;
}

// Visual: Green = enabled, Yellow = disabled
// Action: "Open Theme Editor" link
```

**States:**

```typescript
// Enabled
<Banner status="success" open>
  <s-stack direction="inline" gap="base">
    <s-icon source={CheckIcon} />
    <s-text>Accessibility is enabled on your storefront</s-text>
    <s-button url={themeEditorUrl} variant="plain">
      Open Theme Editor
    </s-button>
  </s-stack>
</Banner>

// Disabled
<Banner status="warning" open>
  <s-stack direction="inline" gap="base">
    <s-icon source={AlertIcon} />
    <s-text>Accessibility is currently disabled</s-text>
    <s-button url={themeEditorUrl} variant="plain">
      Enable in Theme Editor
    </s-button>
  </s-stack>
</Banner>
```

---

### 3. Icon Selector Grid

**Purpose:** Select accessibility widget icon

```typescript
interface IconSelectorProps {
  icons: IconOption[];
  selected: string;
  onChange: (iconId: string) => void;
}

interface IconOption {
  id: string;           // 'icon-circle', 'icon-wheelchair', etc.
  label: string;        // 'Circle', 'Wheelchair', etc.
  svg: string;          // SVG path or component
}
```

**Implementation:**

```tsx
<s-grid columns="5" gap="base">
  {icons.map((icon) => (
    <s-box
      key={icon.id}
      padding="base"
      borderWidth="selected === icon.id ? '2px' : '1px'"
      borderColor={selected === icon.id ? 'brand' : 'subdued'}
      borderRadius="base"
      cursor="pointer"
      onClick={() => onChange(icon.id)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px'
      }}
    >
      <img
        src={`/icons/${icon.id}.svg`}
        alt={icon.label}
        width="32"
        height="32"
      />
      <s-text variant="bodySm">{icon.label}</s-text>
    </s-box>
  ))}
</s-grid>
```

**Icon Options:**

| ID | Label | SVG Preview |
|----|-------|-------------|
| `icon-circle` | Circle | ⭕ |
| `icon-wheelchair` | Wheelchair | ♿ |
| `icon-eye` | Eye | 👁 |
| `icon-star` | Star | ⭐ |
| `icon-gear` | Gear | ⚙ |
| `icon-universal` | Universal | 🌐 |
| `icon-palette` | Palette | 🎨 |
| `icon-chat` | Chat | 💬 |
| `icon-blind` | Blind | 🦯 |
| `icon-hearing` | Hearing | 📻 |

---

### 4. Widget Preview Component

**Purpose:** Real-time preview of accessibility widget

```typescript
interface WidgetPreviewProps {
  config: WidgetConfig;
}

interface WidgetConfig {
  icon: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size: number;           // 24-50
  color: string;          // hex
  backgroundColor: string; // hex
  offsetX: number;        // 0-100
  offsetY: number;        // 0-100
  font: string;           // font ID
  themeBgColor: string;   // panel bg color
}
```

**Implementation:**

```tsx
<s-box
  padding="loose"
  background="subdued"
  borderRadius="base"
  position="relative"
  minHeight="400px"
>
  <s-box
    position="absolute"
    style={{
      [previewPositionStyle(config.position)]:
        `${config.offsetX}px ${config.offsetY}px`
    }}
  >
    <AccessibilityButton
      icon={config.icon}
      size={config.size}
      color={config.color}
      backgroundColor={config.backgroundColor}
      onClick={() => setShowPanel(!showPanel)}
    />
  </s-box>

  {showPanel && (
    <AccessibilityPanel
      font={config.font}
      themeBgColor={config.themeBgColor}
      onClose={() => setShowPanel(false)}
    />
  )}
</s-box>
```

**Position Mapping:**

```typescript
function previewPositionStyle(position: string): string {
  const styles = {
    'top-left': 'topLeft',
    'top-right': 'topRight',
    'bottom-left': 'bottomLeft',
    'bottom-right': 'bottomRight'
  };
  return styles[position] || 'bottomRight';
}
```

---

### 5. Rich Text Editor (Draft.js Integration)

**Purpose:** Edit accessibility statement content

```typescript
interface RichTextEditorProps {
  value: string;          // HTML content
  onChange: (html: string) => void;
  onSave: () => void;
  onReset: () => void;
  placeholder?: string;
}
```

**Toolbar Components:**

```tsx
<s-box padding="base" borderWidth="base" borderTopLeftRadius="base" borderTopRightRadius="base">
  <s-stack direction="inline" gap="extra-tight">
    <ToolbarButton format="bold" icon="Bold" />
    <ToolbarButton format="italic" icon="Italic" />
    <ToolbarButton format="underline" icon="Underline" />
    <s-divider orientation="vertical" />
    <ToolbarButton format="unordered-list" icon="List" />
    <ToolbarButton format="ordered-list" icon="NumberedList" />
    <s-divider orientation="vertical" />
    <ToolbarButton format="align-left" icon="AlignLeft" />
    <ToolbarButton format="align-center" icon="AlignCenter" />
    <ToolbarButton format="align-right" icon="AlignRight" />
    <s-divider orientation="vertical" />
    <ToolbarButton format="link" icon="Link" />
    <ToolbarButton format="image" icon="Image" />
  </s-stack>
</s-box>
```

---

### 6. Plan Card Component

**Purpose:** Display billing plan with features

```typescript
interface PlanCardProps {
  name: string;
  price: number;
  period: 'monthly' | 'annual';
  features: string[];
  trialDays: number;
  isPopular?: boolean;
  currentPlan?: string | null;
  onSelect: () => void;
  isLoading?: boolean;
}
```

**Implementation:**

```tsx
<Card sectioned subdued={isPopular ? false : true}>
  {isPopular && (
    <Badge status="success">Best Value</Badge>
  )}

  <s-stack direction="block" gap="base">
    <s-heading level={2}>
      {name}
    </s-heading>

    <s-stack direction="inline" gap="tight" alignment="baseline">
      <s-text variant="headingLg">
        ${price}
      </s-text>
      <s-text variant="subdued">
        /{period === 'annual' ? 'month (billed annually)' : 'month'}
      </s-text>
    </s-stack>

    <s-paragraph>
      {trialDays}-day free trial
    </s-paragraph>

    <s-unordered-list>
      {features.map(feature => (
        <s-list-item key={feature}>{feature}</s-list-item>
      ))}
    </s-unordered-list>

    <s-button
      variant={isPopular ? 'primary' : 'secondary'}
      onClick={onSelect}
      loading={isLoading}
      disabled={currentPlan === period}
    >
      {getButtonText(currentPlan, period)}
    </s-button>
  </s-stack>
</Card>
```

**Button Text Logic:**

```typescript
function getButtonText(current: string | null, period: string): string {
  if (!current) return 'Start free trial';
  if (current === period) return 'Current plan';
  if (current === 'monthly' && period === 'annual') return 'Upgrade';
  return 'Downgrade';
}
```

---

### 7. Help Modal (Setup Screen)

**Purpose:** Onboarding modal for first-time users

```typescript
interface HelpModalProps {
  open: boolean;
  onClose: () => void;
  autoSlideInterval?: number; // milliseconds
}

interface Slide {
  title: string;
  description: string;
  icon?: string;
}
```

**Implementation:**

```tsx
<Modal open={open} onClose={onClose} size="small">
  <s-box padding="loose" textAlign="center">
    <img src="/logo.svg" alt="Logo" width="64" />

    <s-stack direction="block" gap="base">
      <s-heading level={3}>{slides[currentSlide].title}</s-heading>
      <s-paragraph>{slides[currentSlide].description}</s-paragraph>

      {slides[currentSlide].icon && (
        <s-box padding="base">
          <img src={slides[currentSlide].icon} alt="" width="128" />
        </s-box>
      )}

      {/* Dots indicator */}
      <s-stack direction="inline" gap="tight">
        {slides.map((_, index) => (
          <s-box
            key={index}
            width="8px"
            height="8px"
            borderRadius="full"
            background={index === currentSlide ? 'brand' : 'subdued'}
          />
        ))}
      </s-stack>

      <s-button variant="primary" onClick={onClose}>
        Get Started
      </s-button>
    </s-stack>
  </s-box>
</Modal>
```

**Slide Content:**

| Slide | Title | Description |
|-------|-------|-------------|
| 1 | Welcome | "Make your store accessible to everyone" |
| 2 | Customize | "Personalize your widget to match your brand" |
| 3 | Statement | "Create a WCAG compliant accessibility statement" |
| 4 | Support | "We're here to help 24/7" |
| 5 | Ready | "Start your 14-day free trial today!" |

---

## UX Flow Diagrams

### Installation & Onboarding Flow

```
┌──────────────┐
│ User clicks  │
│ "Get App"    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Shopify OAuth│
│ Redirect     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ App Installed│
│ Check billing│
└──────┬───────┘
       │
       ▼
   ┌─────┐
   │ Has │
   │Plan?│
   └──┬──┘
      │
   ┌──┴──┐
   │     │
  NO    YES
   │     │
   ▼     ▼
┌──────┐ ┌──────────┐
│Plans │ │  Setup   │
│Page  │ │ + Modal  │
└───┬──┘ └────┬─────┘
    │          │
    │    ┌─────┴─────┐
    │    │ User     │
    │    │ selects  │
    │    ▼          │
    │  ┌────────┐   │
    │  │Widgets │   │
    │  │/Stmt/  │   │
    │  │Support │   │
    │  └───┬────┘   │
    │      │        │
    └──────┴────────┘
           │
           ▼
      ┌─────────┐
      │ Settings│
      │  saved  │
      └─────────┘
```

### Widget Customization Flow

```
┌──────────────┐
│ User opens   │
│ Widgets Page │
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ View Settings &     │
│ Live Preview        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ User adjusts:       │
│ • Icon selection    │
│ • Position          │
│ • Size/Offset       │
│ • Colors            │
│ • Font              │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Preview updates     │
│ in real-time        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ User clicks "Save"  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Show loading state  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Success toast       │
│ "Widget saved"      │
└─────────────────────┘
```

### Plan Selection Flow

```
┌──────────────┐
│ User opens   │
│ Plans Page   │
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ View available      │
│ plans               │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ User clicks plan    │
│ button              │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Show loading on     │
│ selected button      │
└──────┬──────────────┘
       │
       ▼
   ┌───────┐
   │Has    │
   │confirm│
   │URL?   │
   └───┬───┘
       │
   ┌───┴────┐
   │        │
  YES      NO
   │        │
   ▼        ▼
┌────────┐ ┌──────────┐
│Redirect││Success   │
│to Shopify│toast,   │
│Billing ││redirect │
│        ││to Setup  │
└───┬────┘ └──────────┘
    │
    ▼
┌─────────────────┐
│ User completes  │
│ Shopify billing │
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ Redirect back   │
│ to app (Setup)  │
└─────────────────┘
```

### Navigation Flow (Paid User)

```
                    ┌──────────┐
                    │   App    │
                    │  Entry   │
                    └────┬─────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
            ▼            ▼            ▼
       ┌─────────┐ ┌─────────┐ ┌─────────┐
       │  Setup  │ │ Widgets │ │Statement│
       │(Home)   │ │         │ │         │
       └────┬────┘ └────┬────┘ └────┬────┘
            │           │            │
            └───────────┼────────────┘
                        │
            ┌───────────┼────────────┐
            │           │            │
            ▼           ▼            ▼
       ┌─────────┐ ┌─────────┐ ┌─────────┐
       │ Plans   │ │Support  │ │ Any     │
       │         │ │         │ │ Screen  │
       └─────────┘ └─────────┘ └─────────┘
            │           │            │
            └───────────┴────────────┘
                        │
            All screens can navigate to each other
            via sidebar NavigationMenu
```

---

## Accessibility Checklist

### WCAG 2.1 AA Compliance Requirements

#### Perceivability

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Text Alternatives | Alt text for all images | ✅ Required |
| Color Only | Never use color alone to convey information | ✅ Required |
| Contrast Ratio | Minimum 4.5:1 for normal text, 3:1 for large text | ✅ Required |
| Resize Text | Support up to 200% zoom without horizontal scroll | ✅ Required |
| Images | Alternative text or decorative | ✅ Required |

#### Operability

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Keyboard Accessible | All functionality available via keyboard | ✅ Required |
| No Keyboard Trap | Clear focus indicators, logical tab order | ✅ Required |
| Timing | Users can disable/auto-adjust time limits | ✅ Required |
| Navigation | Consistent navigation, skip links | ✅ Required |
| Labels | Form inputs have visible labels | ✅ Required |

#### Understandability

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Language | Declare page language (`lang="en"`) | ✅ Required |
| Predictable | Consistent layout/behavior | ✅ Required |
| Input Assistance | Error suggestions, clear labels | ✅ Required |
| Error Identification | Clear error messages | ✅ Required |

#### Robustness

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Compatible | Works with assistive technologies | ✅ Required |
| Valid HTML | Semantic markup | ✅ Required |

---

### Screen-Specific Accessibility Requirements

#### Plans Screen

```typescript
// Plan cards must be keyboard accessible
<PlanCard
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onSelect();
    }
  }}
  role="button"
  aria-label={`${name} plan, $${price}/${period}`}
/>

// Plan buttons require aria labels
<s-button
  aria-label={`Select ${name} plan - ${trialDays} day free trial`}
  onClick={onSelect}
>
  {getButtonText(currentPlan, period)}
</s-button>
```

#### Widgets Screen

```typescript
// Icon selector requires proper labeling
<s-box
  role="button"
  tabIndex={0}
  aria-label={`Select ${icon.label} icon`}
  aria-pressed={selected === icon.id}
  onClick={() => onChange(icon.id)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onChange(icon.id);
    }
  }}
>

// Sliders require aria labels
<input
  type="range"
  min="24"
  max="50"
  value={size}
  onChange={(e) => setSize(e.target.value)}
  aria-label="Widget size"
  aria-valuemin="24"
  aria-valuemax="50"
  aria-valuenow={size}
/>

// Color pickers require labels
<input
  type="color"
  value={color}
  onChange={(e) => setColor(e.target.value)}
  aria-label="Icon color"
/>
```

#### Statement Screen

```typescript
// Rich text editor must be accessible
<RichTextEditor
  aria-label="Accessibility statement editor"
  placeholder="Enter your accessibility statement..."
  editorRole="textbox"
  aria-multiline="true"
/>

// Toolbar buttons require aria labels
<ToolbarButton
  format="bold"
  icon="Bold"
  aria-label="Format text as bold (Ctrl+B)"
/>
```

---

### Keyboard Navigation Support

All interactive elements must support:

| Key | Action |
|-----|--------|
| `Tab` | Move focus to next element |
| `Shift + Tab` | Move focus to previous element |
| `Enter` | Activate focused element |
| `Space` | Activate buttons/toggles |
| `Escape` | Close modals/dropdowns |
| `Arrow Keys` | Navigate within grids/lists |

```typescript
// Example: Icon grid keyboard navigation
const handleKeyDown = (e: KeyboardEvent, index: number) => {
  switch (e.key) {
    case 'ArrowRight':
      if (index < icons.length - 1) {
        // Move to next icon
      }
      break;
    case 'ArrowLeft':
      if (index > 0) {
        // Move to previous icon
      }
      break;
    case 'Home':
      // Move to first icon
      break;
    case 'End':
      // Move to last icon
      break;
  }
};
```

---

### Focus Management

#### Initial Focus

```typescript
// Focus first focusable element on mount
useEffect(() => {
  const firstFocusable = dialogRef?.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  firstFocusable?.focus();
}, [open]);
```

#### Focus Trap (Modals)

```typescript
// Trap focus within modal
const handleTabKey = (e: KeyboardEvent) => {
  const focusable = modalRef?.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
};
```

---

### Screen Reader Support

#### ARIA Labels

```typescript
// Page structure
<s-page aria-label="Accessibility widget settings">

// Live regions for updates
<s-box role="status" aria-live="polite">
  {saveStatus && 'Widget saved successfully'}
</s-box>

// Icon selector
<s-box
  role="radiogroup"
  aria-label="Widget icon selection"
>
  {icons.map(icon => (
    <s-box
      role="radio"
      aria-checked={selected === icon.id}
      aria-label={icon.label}
    />
  ))}
</s-box>
```

---

### Error Handling & Validation

```typescript
// Form error messages
<TextField
  label="Widget size"
  type="number"
  min="24"
  max="50"
  value={size}
  onChange={setSize}
  error={size < 24 || size > 50 ? 'Size must be between 24 and 50' : undefined}
  aria-describedby={size < 24 || size > 50 ? 'size-error' : undefined}
/>

{s-size < 24 || size > 50 && (
  <s-text id="size-error" variant="error" role="alert">
    Size must be between 24 and 50 pixels
  </s-text>
)}
```

---

## Shared Components

### Navigation Menu (App Bridge)

```typescript
// Navigation configuration based on billing status
const navigationItems = paid ? [
  {
    label: 'Quick Start',
    destination: '/app/setup',
  },
  {
    label: 'Customize Your Widget',
    destination: '/app/widgets',
  },
  {
    label: 'Statement',
    destination: '/app/statement',
  },
  {
    label: 'Subscription & Plans',
    destination: '/app/plans',
  },
  {
    label: 'Guides & Support',
    destination: '/app/support',
  },
] : [];
```

### Loading States

```typescript
// Page-level loading
{s-isLoading && (
  <s-stack alignment="center" padding="loose">
    <Spinner size="large" />
    <s-text>Loading...</s-text>
  </s-stack>
)}

// Button-level loading
<s-button
  onClick={handleSave}
  {...(isSaving ? { loading: true } : {})}
>
  Save
</s-button>
```

### Toast Notifications

```typescript
// Success toast
shopify.toast.show('Widget settings saved');

// Error toast
shopify.toast.show('Failed to save. Please try again.', {
  duration: 5000,
  isError: true,
});
```

---

## Responsive Design

### Mobile Layout (< 768px)

- Single column for all screens
- Icon grid: 3 columns instead of 5
- Two-column layouts stack vertically
- Touch targets minimum 44x44px

### Tablet Layout (768px - 1024px)

- Icon grid: 4 columns
- Cards use maximum width
- Simplified widget preview

### Desktop Layout (> 1024px)

- Full layout with all columns
- Widget preview visible alongside settings
- Maximum content width: 1024px (centered)

---

## Design Tokens

### Colors

```typescript
const colors = {
  brand: '#008060',          // Shopify green
  brandHover: '#006e52',
  brandDark: '#005c45',

  critical: '#d82c0d',       // Error
  warning: '#ffc453',        // Warning
  success: '#008060',        // Success
  info: '#007ace',           // Info

  // Neutrals
  text: '#202223',
  textSubdued: '#6d7175',
  border: '#c9cccf',
  bg: '#f6f6f7',
  bgSubdued: '#e1e3e5',

  // Widget defaults
  widgetIcon: '#ffffff',
  widgetBg: '#FA6E0A',
};
```

### Typography

```typescript
const typography = {
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '32px',
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    base: '1.5',
    loose: '1.75',
  },
};
```

### Spacing

```typescript
const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
};
```

---

## Implementation Notes

1. **Polaris Web Components**: The project uses Polaris web components (`<s-page>`, `<s-button>`, etc.) not React components. Custom components should follow this pattern.

2. **State Management**: Use React Router's `useFetcher` for form submissions and data mutations. Use `useLoaderData` for server state.

3. **Server Validation**: All form submissions should be validated on the server side. Client validation is for UX only.

4. **Loading States**: Always provide visual feedback during async operations. Use Polaris `<Spinner>` and button `loading` prop.

5. **Error Handling**: Display user-friendly error messages using Polaris `Banner` components.

6. **Internationalization**: Support English and Japanese. Use `multipleLanguageSelector()` hook for language switching.

---

## Document Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-03 | Initial UI/UX specification created |
