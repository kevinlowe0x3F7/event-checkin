# Project Structure

## Directory Organization

```
event-checkin/
├── src/                        # Application source code
│   ├── app/                    # Next.js App Router (routes & pages)
│   │   ├── layout.tsx          # Root layout with metadata & fonts
│   │   └── page.tsx            # Homepage component
│   ├── server/                 # Server-side code
│   │   └── db/                 # Database layer
│   │       ├── index.ts        # Drizzle client initialization
│   │       └── schema.ts       # Database schema definitions
│   ├── styles/                 # Global styles
│   │   └── globals.css         # Tailwind imports & global CSS
│   └── env.js                  # Environment variable validation
│
├── public/                     # Static assets (favicon, images)
├── .spec-workflow/             # Spec workflow steering & specs
│   ├── templates/              # Document templates
│   └── steering/               # Project steering documents
│
├── drizzle.config.ts           # Drizzle ORM configuration
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript compiler options
├── eslint.config.js            # ESLint rules & plugins
├── prettier.config.js          # Prettier formatting config
├── postcss.config.js           # PostCSS/Tailwind setup
├── package.json                # Dependencies & scripts
└── pnpm-lock.yaml              # Locked dependency versions
```

## Planned Structure (From README)

```
src/app/
├── events/
│   ├── page.tsx                # Event list (Server Component)
│   ├── new/
│   │   └── page.tsx            # Create event form (Server Action)
│   └── [id]/
│       ├── page.tsx            # Event details
│       ├── register/
│       │   └── page.tsx        # Registration form
│       ├── checkin/
│       │   └── page.tsx        # Check-in dashboard (Client Component)
│       └── ticket/
│           └── [attendeeId]/
│               └── page.tsx    # QR ticket display
│
├── api/
│   ├── checkin/
│   │   └── route.ts            # POST: Check-in attendee
│   └── events/
│       └── [id]/
│           └── attendees/
│               └── route.ts    # GET: List attendees
│
src/server/db/
├── schema.ts                   # All database tables (events, attendees)
└── index.ts                    # Database client
```

## Naming Conventions

### Files
- **Pages/Routes**: `page.tsx` for routes, `layout.tsx` for layouts (Next.js convention)
- **Components**: `PascalCase.tsx` (e.g., `EventCard.tsx`, `QRScanner.tsx`)
- **API Routes**: `route.ts` in named directories (Next.js App Router convention)
- **Server Actions**: Colocated with components or in `actions.ts` files
- **Database**: `schema.ts` for schema, `index.ts` for client initialization
- **Utilities**: `camelCase.ts` (e.g., `dateUtils.ts`, `qrGenerator.ts`)
- **Config Files**: `kebab-case.js/ts` (e.g., `next.config.js`, `drizzle.config.ts`)

### Code
- **React Components**: `PascalCase` function declarations (e.g., `EventList`, `CheckInDashboard`)
- **Functions/Methods**: `camelCase` (e.g., `createEvent`, `checkInAttendee`)
- **Types/Interfaces**: `PascalCase` (e.g., `Event`, `Attendee`, `CheckInResponse`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_ATTENDEES`, `QR_CODE_SIZE`)
- **Variables**: `camelCase` (e.g., `eventId`, `attendeeList`, `isCheckedIn`)
- **Database Tables**: Created via `pgTableCreator` with prefix `event-checkin_`

## Import Patterns

### Import Order
1. External dependencies (React, Next.js, third-party libraries)
2. Internal absolute imports using `~/` alias (e.g., `~/server/db`, `~/env`)
3. Relative imports (e.g., `./components`, `../utils`)
4. Style imports (e.g., `~/styles/globals.css`)

### Path Aliases
- `~/*` maps to `./src/*` (configured in [tsconfig.json:29-31](tsconfig.json#L29-L31))
- Examples:
  - `~/server/db` → `src/server/db`
  - `~/env` → `src/env.js`
  - `~/styles/globals.css` → `src/styles/globals.css`

### Module Organization
```typescript
// Example component file structure:
import { type ReactNode } from "react";           // External
import { db } from "~/server/db";                 // Internal absolute
import { EventCard } from "./EventCard";          // Relative
import "~/styles/component.css";                  // Styles
```

## Code Structure Patterns

### Next.js Component Organization
```typescript
// 1. Imports
import { type Metadata } from "next";
import { db } from "~/server/db";

// 2. Type definitions
interface EventPageProps {
  params: { id: string };
}

// 3. Metadata (for pages)
export const metadata: Metadata = {
  title: "Events",
  description: "Event management"
};

// 4. Server Components (data fetching at top level)
export default async function EventPage({ params }: EventPageProps) {
  const event = await db.query.events.findFirst({ /* ... */ });

  return (
    // JSX
  );
}

// 5. Helper functions (below main component)
function formatEventDate(date: Date): string {
  // ...
}
```

### Server Actions Organization
```typescript
"use server";

// 1. Imports
import { revalidatePath } from "next/cache";
import { db } from "~/server/db";
import { events } from "~/server/db/schema";

// 2. Action functions
export async function createEvent(formData: FormData) {
  // Input validation
  // Core logic
  // Database operations
  // Revalidation/redirect
}
```

### Database Schema Organization
```typescript
// schema.ts structure:
// 1. Imports
import { pgTableCreator, index } from "drizzle-orm/pg-core";

// 2. Table creator
export const createTable = pgTableCreator((name) => `event-checkin_${name}`);

// 3. Table definitions (grouped by domain)
export const events = createTable("event", /* ... */);
export const attendees = createTable("attendee", /* ... */);

// 4. Indexes and relations
```

## Code Organization Principles

1. **File-based Routing**: Follow Next.js App Router conventions for automatic route creation
2. **Server-First**: Default to Server Components; mark Client Components with `"use client"`
3. **Colocation**: Keep related files close (components, actions, types in same directory)
4. **Single Responsibility**: Each file has one primary export/purpose
5. **Type Safety**: Define explicit TypeScript types for props, API responses, database entities

## Module Boundaries

### Clear Separation of Concerns

- **App Router (`src/app/`)**: UI components, pages, layouts, route handlers
  - Server Components for data fetching and static rendering
  - Client Components for interactivity (marked with `"use client"`)
  - Server Actions for mutations (colocated or separate `actions.ts` files)

- **Server Logic (`src/server/`)**: Backend-only code (database, business logic)
  - Never imported by Client Components
  - Database access layer isolated
  - Server-only utilities

- **Database Layer (`src/server/db/`)**: Data persistence
  - Schema definitions are source of truth
  - Single database client instance (with HMR caching)
  - Migrations managed via Drizzle Kit

- **Shared Types**: TypeScript types can be shared across client/server boundaries
  - Infer types from Drizzle schema: `typeof events.$inferSelect`
  - Define explicit API response types

### Dependency Direction
```
Client Components → Server Components → Server Actions → Database Layer
     ↓                                                         ↑
  (cannot import server code directly)              (can use in Server Components)
```

## Code Size Guidelines

- **File Size**: Prefer <300 lines per file; split larger components into sub-components
- **Function/Method Size**: Keep functions focused, aim for <50 lines
- **Component Complexity**: Break down complex components into smaller, reusable pieces
- **Nesting Depth**: Limit to 3-4 levels; extract nested logic into helper functions
- **Server Components**: Keep data fetching separate from presentation when possible

## TypeScript Configuration

### Strict Type Safety
- Strict mode enabled ([tsconfig.json:14](tsconfig.json#L14))
- `noUncheckedIndexedAccess: true` prevents undefined array access
- Type-checked imports preferred with inline syntax
- ESLint enforces type imports: `import { type Foo } from "..."`

### ESLint Rules (Key Patterns)
- Inline type imports: `import { type Metadata } from "next"`
- Unused vars starting with `_` are allowed (useful for unused function params)
- Drizzle safety: Enforce `where` clause on delete/update operations
- TypeScript stylistic and recommended rules enabled

### Prettier Formatting
- Tailwind class sorting via `prettier-plugin-tailwindcss`
- Automatic formatting on save (recommended)
- Consistent code style across team

## Documentation Standards

- **Public Components**: Add JSDoc comments for exported components with props descriptions
- **Complex Logic**: Inline comments explaining business rules (especially QR validation, check-in logic)
- **README Files**: Each major feature directory should have a README explaining its purpose
- **Database Schema**: Comment fields with business context (e.g., check-in timestamp significance)
- **API Routes**: Document request/response formats with TypeScript types

### Example Documentation
```typescript
/**
 * Checks in an attendee using their unique QR code.
 * Prevents duplicate check-ins by validating checkedInAt timestamp.
 *
 * @param attendeeId - Unique identifier from QR code
 * @returns Check-in success status and attendee details
 * @throws Error if attendee not found or already checked in
 */
export async function checkInAttendee(attendeeId: string) {
  // ...
}
```

## Environment & Configuration

- **Environment Variables**: Validated via `@t3-oss/env-nextjs` in [src/env.js](src/env.js)
  - Server vars: `DATABASE_URL`, `NODE_ENV`
  - Client vars: Prefix with `NEXT_PUBLIC_`
  - Build fails if required vars missing or invalid

- **Configuration Files**:
  - [next.config.js](next.config.js): Next.js settings (minimal by default)
  - [drizzle.config.ts](drizzle.config.ts): Database connection and schema path
  - [tsconfig.json](tsconfig.json): TypeScript compiler options and path aliases
  - [eslint.config.js](eslint.config.js): Linting rules with Drizzle plugin
  - [prettier.config.js](prettier.config.js): Code formatting with Tailwind plugin

## Development Workflow

1. **Start Development**: `pnpm dev` (Turbopack for fast HMR)
2. **Type Check**: `pnpm typecheck` (runs `tsc --noEmit`)
3. **Lint**: `pnpm lint` or `pnpm lint:fix`
4. **Format**: `pnpm format:check` or `pnpm format:write`
5. **Database**:
   - Schema changes: Edit `schema.ts` → `pnpm db:generate` → `pnpm db:migrate`
   - Quick push: `pnpm db:push` (development only)
   - Visual editor: `pnpm db:studio`
6. **Build**: `pnpm build` (validates types, lints, and builds for production)
