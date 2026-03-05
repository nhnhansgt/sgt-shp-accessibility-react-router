# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Shopify app template built with React Router (forked from the Remix app template). It uses Polaris web components for the UI, Prisma for session storage, and the Shopify Admin GraphQL API for data operations.

## Quick Start

```bash
npm install
npm run dev            # Start dev server at http://localhost:3000
```

**Node.js:** >=20.19 <22 || >=22.12

## Development Commands

### Start Development Server

```bash
npm run dev
# or
shopify app dev
```

### Build for Production

```bash
npm run build
```

### Production Server

```bash
npm run start            # Start production server (requires build first)
```

### Database Setup

```bash
npm run setup
# Runs: prisma generate && prisma migrate deploy
```

### Code Formatting

```bash
npm run format            # Format code with Prettier
npm run format:check      # Check formatting without modifying
```

### Linting

```bash
npm run lint            # Run ESLint với cache
```

### Type Checking

```bash
npm run typecheck
# Runs: react-router typegen && tsc --noEmit
```

### Prisma Commands

```bash
npm run prisma <command>
# Examples:
npm run prisma generate        # Generate Prisma Client
npm run prisma migrate dev     # Create and apply migrations
npm run prisma migrate reset   # Reset database
npm run prisma studio          # Open Prisma Studio
```

### Shopify CLI Commands

```bash
npm run generate           # Generate extensions/resources
npm run deploy            # Deploy app
npm run env               # Manage environment variables
npm run config:link       # Link to existing app config
npm run config:use        # Switch app configurations
```

### Docker

```bash
npm run docker-start      # Start app in Docker container
```

### GraphQL Code Generation

```bash
npm run graphql-codegen   # Generate TypeScript types from GraphQL schema
```

## Environment Setup

**Node.js version:** >=20.19 <22 || >=22.12 (See `package.json` engines)

## Current Routes

Routes use React Router's file-based naming:

- `app/routes/app.tsx` - Layout wrapper cho toàn bộ app
- `app/routes/app._index.tsx` - Dashboard chính (`/app`)
- `app/routes/app.statement.tsx` - Accessibility Statement editor (`/app/statement`)
- `app/routes/app.widgets.tsx` - Widget customization screen (`/app/widgets`)
- `app/routes/app.plans.tsx` - Trang quản lý Plans (`/app/plans`)
- `app/routes/app.setup.tsx` - Quick Start guide (`/app/setup`)
- `app/routes/app.additional.tsx` - Trang demo thêm (`/app/additional`)
- `app/routes/webhooks.app.uninstalled.tsx` → Webhook handler
- `app/routes/auth.$.tsx` → Auth route (catch-all)

## Architecture

### Directory Structure

- **app/routes** - File-based routing using React Router's flat routes
- **app/shopify.server.ts** - Shopify app configuration and authentication
- **app/db.server.ts** - Prisma client instance
- **prisma/schema.prisma** - Database schema (MySQL cho local development)
- **extensions/** - Shopify app extensions (UI extensions, Functions, etc.)

### Authentication Flow

**Server-side:**

```typescript
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  // Use admin.graphql() for API calls
};
```

**Webhook authentication:**

```typescript
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);
  // Handle webhook
};
```

### GraphQL API Usage

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

### Session Management

Uses Prisma with `@shopify/shopify-app-session-storage-prisma`. Session data is stored in the `Session` model defined in `prisma/schema.prisma`.

## Shopify Dev MCP Integration

This project includes MCP server configurations in `.mcp.json`:

### Shopify Dev MCP
- GraphQL schema introspection
- Documentation search from shopify.dev
- Component validation for Polaris components

### Prisma MCP
- Prisma Studio integration
- Database migrations and schema management

## Important Patterns

### Polaris Web Components Aliases

The project uses shorthand aliases for Polaris components:

| Alias | Component |
|-------|-----------|
| `<s-page>` | `<Page>` |
| `<s-section>` | `<Section>` |
| `<s-box>` | `<Box>` |
| `<s-stack>` | `<Stack>` |
| `<s-text>` | `<Text>` |
| `<s-heading>` | `<Heading>` |
| `<s-button>` | `<Button>` |
| `<s-link>` | `<Link>` |
| `<s-divider>` | `<Divider>` |
| `<s-unordered-list>` | `<UnorderedList>` |
| `<s-list-item>` | `<ListItem>` |

### Embedded App Navigation

For embedded apps (default), use these navigation methods:

- `Link` from `react-router` or `@shopify/polaris` - NOT `<a>` tags
- `redirect` returned from `authenticate.admin` - NOT `redirect` from react-router
- `useSubmit` from `react-router` for form submissions

### Error Boundaries

All routes in `/app` should include:

```typescript
import { boundary } from "@shopify/shopify-app-react-router/server";

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
```

### Webhook Handlers

Webhooks are defined in `shopify.app.toml` and handled in `app/routes/webhooks.*.tsx`:

```typescript
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);
  // Process webhook - check if session exists before using
  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }
  return new Response();
};
```

## Environment Variables

Key environment variables (managed by Shopify CLI):

- `SHOPIFY_API_KEY` - API key from app settings
- `SHOPIFY_API_SECRET` - API secret
- `SHOPIFY_APP_URL` - App URL
- `SCOPES` - Comma-separated list of required scopes
- `SHOP_CUSTOM_DOMAIN` - Optional custom shop domain

## Database

**Default:** MySQL via Prisma

**Connection:** Configure via `DATABASE_URL` in `.env`

**Local Development:**
```bash
# Start MySQL with Docker Compose
docker-compose up -d db

# Database credentials from docker-compose.yml:
# - Database: docker
# - User: docker
# - Password: docker
# - Port: 3306
```

**Environment Variables:**
```bash
DATABASE_URL="mysql://docker:docker@localhost:3306/docker"
```

**To switch databases:**
1. Update `datasource db` provider in `prisma/schema.prisma`
2. Update `DATABASE_URL` in `.env`
3. Run `npm run setup`

## TypeScript Configuration

- Strict mode enabled
- Path aliases configured via `vite-tsconfig-paths`
- Types generated from GraphQL schema in `app/types/`

## ESLint Configuration

Extends:

- React and React Hooks recommended rules
- TypeScript recommended rules
- Import rules with TypeScript resolver
- Accessibility rules (jsx-a11y)

Special rules:

- `shopify` global allowed
- `variant` prop allowed for Polaris components

## Docker Support

The project includes a `Dockerfile` for containerized deployment. Use `npm run docker-start` to run the app in a Docker container.

## Git Workflow

- **Default branch:** `main`
- **Feature commits:** Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`)
- **Before commit:** Run `npm run typecheck && npm run lint`
