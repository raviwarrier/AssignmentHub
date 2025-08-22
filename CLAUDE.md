# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Development server:**
```bash
npm run dev
```
- Starts development server using tsx to run `server/index.ts`
- API runs on the port specified by `PORT` environment variable (defaults to 5000)
- Vite dev server integrated for frontend with HMR
- Uses custom environment file: `AssignmentHub.env`

**Build for production:**
```bash
npm run build
```
- Builds frontend with Vite and bundles backend with esbuild
- Output: `dist/public/` (frontend) and `dist/index.js` (backend)

**Start production server:**
```bash
npm start
```
- Runs the built application from `dist/index.js`

**Type checking:**
```bash
npm run check
```
- Runs TypeScript compiler for type validation without emitting files

**Database operations:**
```bash
npm run db:push
```
- Pushes database schema changes to PostgreSQL using Drizzle Kit

## Architecture Overview

### Full-Stack TypeScript Application
- **Frontend:** React 18 + TypeScript with Vite build tool
- **Backend:** Express.js + TypeScript with esbuild compilation
- **Database:** PostgreSQL with Drizzle ORM for type-safe database operations
- **File Storage:** Local filesystem with multer for multipart uploads

### Key Directory Structure
```
client/src/          - React frontend source code
├── components/      - React components (shadcn/ui + custom)
├── pages/          - Route components
├── lib/            - Utilities and configuration
└── hooks/          - Custom React hooks

server/             - Express backend source code
├── index.ts        - Application entry point with middleware setup
├── routes.ts       - API route definitions and authentication
├── storage.ts      - Data access layer with storage interface
├── db.ts           - Database connection and Drizzle setup
└── vite.ts         - Vite integration for development

shared/             - Shared TypeScript definitions
└── schema.ts       - Database schema and validation schemas
```

### Authentication System
- **Session-based authentication** using express-session with MemoryStore
- **Passport.js integration** for authentication middleware
- **Team registration system:** Teams self-register with team numbers (1-9) and custom passwords
- **Password security:** bcrypt hashing with 12 salt rounds, strong validation requirements
- **Admin access:** Separate admin login via environment `ADMIN_PASSWORD`
- **Session management:** 24-hour cookie expiry, HTTP-only cookies
- **Environment variables:** 
  - `ADMIN_PASSWORD` for admin access
  - `SESSION_SECRET` for session signing (optional - auto-generated if not provided)
  - `DATABASE_URL` for PostgreSQL connection

### File Management System
- **Upload restrictions:** 50MB file size limit, specific file types (JPG, PNG, PDF, DOCX, PPTX)
- **Multer configuration:** Custom disk storage with timestamp-based unique filenames
- **Permission system:** Students can only see their own files and files from "open view" assignments
- **Storage location:** Files stored in `uploads/` directory with auto-generated unique names
- **Database tracking:** File metadata stored in PostgreSQL with filesystem references
- **File operations:** Upload, delete, visibility toggle, metadata editing via API endpoints

### Assignment Permission Model
- **Assignment settings** control visibility of files across teams
- **Admin controls:** Instructors can toggle "open view" for each assignment
- **Default assignments:** Pre-configured with 9 marketing assignments
- **Permission filtering:** Applied at API level based on user role and assignment settings

### UI Framework Stack
- **shadcn/ui components** built on Radix UI primitives
- **Tailwind CSS** for styling with custom theme variables
- **Theme system** with light/dark mode support
- **React Query** for server state management and caching
- **Wouter** for client-side routing

## Environment Configuration

Required environment variables:
```bash
DATABASE_URL=          # PostgreSQL connection string
SESSION_SECRET=        # Secret for session signing (optional - will generate if not provided)
ADMIN_PASSWORD=        # Admin login password
```

## Database Schema

### Core Tables
- `files` - File metadata with team ownership and assignment categorization
- `users` - Team-based user accounts with admin flags
- `assignment_settings` - Controls file visibility across teams per assignment

### Schema Management
- Use Drizzle ORM for all database operations
- Schema definitions in `shared/schema.ts` with Zod validation
- Migrations managed via `drizzle-kit push` command

## Development Notes

- **File uploads** handled via multer with disk storage and database metadata insertion
- **API prefix:** All backend routes use `/api` prefix for clear separation
- **Type safety:** Shared types between frontend/backend via `@shared` alias in `vite.config.ts`
- **Error handling:** Centralized middleware with structured error responses and status codes
- **Request logging:** Custom middleware logs API calls with response times and JSON responses
- **Storage abstraction:** Interface-based storage with PostgreSQL/memory fallback
- **Development tools:** Replit-specific plugins for enhanced development experience
- **Authentication middleware:** `requireAuth` and `requireAdmin` helper functions for route protection

## Testing & Production

- **No test framework configured** - testing should be added as needed
- **Production deployment:** Builds to `dist/` with static file serving
- **File system security:** Vite configured with restricted file access in server mode
- **Session management:** In-memory store for development, should use persistent store for production

## Common Tasks

**Adding new assignment:**
1. Update the assignments array in `server/storage.ts` MemStorage constructor (lines 49-59)
2. Update the corresponding array in DBStorage class (lines 454-464)
3. The assignment will be automatically available in admin settings

**File permission debugging:**
- Check assignment settings via admin panel
- Verify team ownership in database
- Review permission filtering logic in `server/routes.ts` (check file access control)
- Assignment visibility controlled by `assignment_settings` table

**Database connection issues:**
- Verify `DATABASE_URL` environment variable in `AssignmentHub.env`
- Check network connectivity to PostgreSQL instance
- Application automatically falls back to in-memory storage if database connection fails
- Storage abstraction in `server/storage.ts` handles the fallback gracefully

**Environment file:**
- Uses `AssignmentHub.env` (not `.env`) loaded via dotenv config path
- Copy from `AssignmentHub.env.example` to get started