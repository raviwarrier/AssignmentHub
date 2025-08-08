# Overview

Student Hub is a file sharing and presentation platform designed for educational environments. The application allows students to upload, organize, and share various types of files including images (JPG, PNG), documents (PDF, DOCX), and presentations (PPTX). Files are organized by team numbers and can be tagged and searched for easy discovery. The platform features a clean, modern interface built with React and shadcn/ui components.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with a custom design system using CSS variables for theming
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **File Uploads**: React Dropzone for drag-and-drop file upload functionality

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript throughout for consistent type safety
- **API Pattern**: RESTful API with /api prefix for clear separation
- **File Storage**: Local filesystem storage with multer for handling multipart uploads
- **Request Logging**: Custom middleware for API request/response logging
- **Error Handling**: Centralized error handling middleware

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon Database serverless PostgreSQL for cloud hosting
- **Fallback Storage**: In-memory storage implementation for development/testing

## File Management
- **Upload Directory**: Local `uploads/` directory for file storage
- **File Validation**: Size limits (50MB) and type restrictions (JPG, PNG, PDF, DOCX, PPTX)
- **Metadata Storage**: File information stored in database with references to filesystem
- **Unique Naming**: Timestamp-based file naming to prevent conflicts

## Authentication & Authorization
- **Admin Functions**: Password-protected admin operations for file deletion
- **Session Management**: Express sessions with PostgreSQL session store
- **Security**: Environment-based configuration for sensitive operations

## Development & Deployment
- **Development**: Vite dev server with HMR and Express API server
- **Build Process**: Vite for frontend bundling, esbuild for backend compilation
- **Environment**: Replit-optimized with cartographer plugin for development
- **Type Checking**: TypeScript compiler for build-time type validation

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Environment Variables**: DATABASE_URL for database connection configuration

## UI Component Libraries
- **Radix UI**: Comprehensive set of low-level UI primitives for accessibility
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library with customizable design system

## File Handling
- **Multer**: Node.js middleware for handling multipart/form-data uploads
- **React Dropzone**: Frontend drag-and-drop file upload interface

## Development Tools
- **Replit Integration**: Development environment optimization with runtime error overlay
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer
- **ESBuild**: Fast JavaScript bundler for production builds

## Styling & Design
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Google Fonts**: Inter font family for modern typography
- **Class Variance Authority**: Type-safe utility for component variant management