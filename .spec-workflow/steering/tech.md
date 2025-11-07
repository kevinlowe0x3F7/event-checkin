# Technology Stack

## Project Type
Full-stack web application built with Next.js, providing server-side rendering and API routes for event management and QR code-based check-in functionality.

## Core Technologies

### Primary Language(s)
- **Language**: TypeScript 5.8.2
- **Runtime**: Node.js (via Next.js)
- **Package Manager**: pnpm 10.20.0
- **Module System**: ESM (ES Modules)

### Key Dependencies/Libraries

**Frontend Framework:**
- **Next.js 15.2.3**: React-based framework providing SSR, routing, and API routes with App Router architecture
- **React 19.0.0**: UI component library for building interactive interfaces
- **React DOM 19.0.0**: DOM-specific rendering methods

**Styling:**
- **Tailwind CSS 4.0.15**: Utility-first CSS framework for rapid UI development
- **@tailwindcss/postcss 4.0.15**: PostCSS integration for Tailwind
- **Geist Font**: Modern sans-serif font from Vercel

**Database & ORM:**
- **Drizzle ORM 0.41.0**: TypeScript-first ORM for type-safe database operations
- **postgres 3.4.4**: PostgreSQL client library for Node.js
- **drizzle-kit 0.30.5**: CLI tools for schema migrations and studio

**Validation & Environment:**
- **Zod 3.24.2**: TypeScript-first schema validation library
- **@t3-oss/env-nextjs 0.12.0**: Type-safe environment variable management

### Application Architecture
**Pattern**: Server-first architecture with Next.js App Router
- **Server Components**: Default for data fetching and static content rendering
- **Server Actions**: For form submissions and mutations (planned for event creation/registration)
- **Client Components**: For interactive features (QR scanner, check-in dashboard)
- **API Routes**: RESTful endpoints for check-in operations and attendee management
- **File-based Routing**: Next.js App Router convention in `src/app/`

### Data Storage
- **Primary Storage**: PostgreSQL (cloud-hosted, accessed via DATABASE_URL)
- **ORM Layer**: Drizzle ORM with type-safe schema definitions
- **Schema Prefix**: `event-checkin_*` for multi-tenant database support
- **Data Formats**: JSON for API responses, structured relational data in PostgreSQL
- **Migrations**: Drizzle Kit for schema generation and migration management

### External Integrations
- **Authentication**: Clerk (planned integration per README)
- **QR Code Generation**: To be implemented for ticket generation
- **QR Code Scanning**: Client-side camera API or dedicated library for check-in
- **Protocols**: HTTP/REST for API communication

### Monitoring & Dashboard Technologies
- **Dashboard Type**: Web-based responsive interface (planned check-in dashboard)
- **Real-time Communication**: Initially manual refresh, with potential WebSocket upgrade for live check-in updates
- **State Management**: React state and Server Components for data flow
- **Visualization**: Native HTML/CSS for attendee lists and check-in status

## Development Environment

### Build & Development Tools
- **Build System**: Next.js built-in build pipeline (Turbopack in dev mode)
- **Package Management**: pnpm with lockfile for reproducible builds
- **Development Workflow**:
  - `pnpm dev --turbo`: Hot module replacement with Turbopack
  - `pnpm build`: Production build
  - `pnpm preview`: Local production preview

### Code Quality Tools
- **Static Analysis**:
  - ESLint 9.23.0 with Next.js config
  - TypeScript compiler in strict mode
  - eslint-plugin-drizzle for ORM best practices
  - typescript-eslint 8.27.0 for TypeScript-specific linting
- **Formatting**:
  - Prettier 3.5.3 with caching
  - prettier-plugin-tailwindcss 0.6.11 for class sorting
- **Type Checking**:
  - `tsc --noEmit` for standalone type checks
  - Strict mode enabled with `noUncheckedIndexedAccess`
- **Testing Framework**: Not yet configured (future consideration)

### Version Control & Collaboration
- **VCS**: Git
- **Branching Strategy**: Main branch for development (standard GitHub Flow)
- **Current Branch**: main
- **Code Review Process**: To be established based on team preferences

### Database Development
- **Schema Management**: Drizzle Kit CLI tools
  - `pnpm db:generate`: Generate migration files from schema
  - `pnpm db:migrate`: Run migrations
  - `pnpm db:push`: Direct schema push for development
  - `pnpm db:studio`: Visual database browser

## Deployment & Distribution
- **Target Platform**: Cloud-based web hosting (Vercel recommended for Next.js)
- **Distribution Method**: SaaS - users access via web browser
- **Installation Requirements**:
  - Modern web browser (Chrome, Firefox, Safari, Edge)
  - Mobile device camera for QR scanning (check-in staff)
- **Environment Variables**:
  - `DATABASE_URL`: PostgreSQL connection string
  - Validated at build time via @t3-oss/env-nextjs

## Technical Requirements & Constraints

### Performance Requirements
- **Page Load Time**: <2 seconds for initial page load
- **API Response Time**: <500ms for check-in operations
- **Mobile Performance**: Optimized for 3G/4G network conditions
- **QR Scan Speed**: <2 seconds from scan to validation

### Compatibility Requirements
- **Browser Support**: Modern evergreen browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
- **Mobile Support**: iOS Safari, Android Chrome
- **Node.js Version**: Compatible with Next.js 15 requirements
- **TypeScript**: ES2022 target with DOM APIs
- **Database**: PostgreSQL 12+ (Drizzle ORM compatibility)

### Security & Compliance
- **Authentication**: Clerk integration for user authentication and session management
- **Environment Validation**: Type-safe environment variables prevent configuration errors
- **SQL Injection Prevention**: Drizzle ORM parameterized queries
- **Input Validation**: Zod schemas for runtime type safety
- **Unique Check-in**: QR code validation to prevent duplicate entries
- **Data Protection**: HTTPS-only in production

### Scalability & Reliability
- **Expected Load**:
  - Initial: Single events with <500 attendees
  - Growth: Multiple concurrent events with 1000+ attendees each
- **Availability Requirements**: 99.5% uptime during active events
- **Database Scaling**: Connection pooling via postgres library
- **Horizontal Scaling**: Stateless Next.js allows multi-instance deployment

## Technical Decisions & Rationale

### Decision Log

1. **Next.js App Router over Pages Router**: Modern paradigm with Server Components for better performance and developer experience. Enables server-first architecture with progressive enhancement.

2. **Drizzle ORM over Prisma**: TypeScript-first ORM with better performance, smaller bundle size, and more flexible SQL generation. Better suited for projects requiring direct SQL control.

3. **Tailwind CSS over CSS-in-JS**: Utility-first approach enables rapid UI development with consistent design system. Better performance than runtime CSS-in-JS solutions.

4. **pnpm over npm/yarn**: Faster installs, better disk space efficiency with content-addressable storage, and strict dependency resolution prevents phantom dependencies.

5. **@t3-oss/env-nextjs for Environment Management**: Type-safe environment variables catch configuration errors at build time rather than runtime. Validates schema before deployment.

6. **PostgreSQL Database**: Proven reliability for relational data, strong ACID guarantees for check-in transactions, excellent support for concurrent operations.

7. **T3 Stack Foundation**: Scaffolded with create-t3-app for opinionated, type-safe full-stack architecture with modern best practices.

## Known Limitations

- **No Real-time Updates (Day 1)**: Check-in dashboard requires manual refresh. WebSocket integration planned for future iterations to enable live attendance updates across multiple check-in stations.

- **No Testing Infrastructure**: Unit and integration testing frameworks not yet configured. Should be added before production deployment.

- **Single-tenant Architecture**: Current schema supports one organization. Multi-tenancy with org isolation would require additional schema changes.

- **No Offline Support**: Check-in requires active internet connection. Progressive Web App (PWA) features could enable offline queue for check-ins.

- **No CDN for Assets**: Static assets served from Next.js server. CDN integration would improve global performance.
