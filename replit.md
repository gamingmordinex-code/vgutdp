# Overview

This is an Academic Management System built with React (frontend) and Express.js (backend). The system manages student batches, faculty assignments, attendance tracking, marks assessment, and research document submissions. It supports three user roles: admin, faculty, and student, each with role-specific dashboards and functionality.

The application uses a full-stack TypeScript architecture with modern web technologies including React Query for state management, Radix UI components with Tailwind CSS for styling, and Drizzle ORM for database operations.

## Recent Updates (January 2025)
- ✅ Complete registration workflow with new/existing user selection
- ✅ Pending user approval system for admin dashboard
- ✅ Fixed responsive layout for all screen sizes
- ✅ OTP-based authentication with fixed OTP (263457) for testing
- ✅ Auto batch creation and faculty assignment system
- ✅ Real PostgreSQL database with comprehensive schema

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for build tooling
- **Routing**: Wouter for lightweight client-side routing with role-based route protection
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with CSS variables for theming support
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Session Management**: Express sessions with in-memory storage for authentication state
- **API Design**: RESTful API endpoints with role-based access control middleware
- **Authentication**: OTP-based authentication system via SMS/email (placeholder implementations)
- **File Structure**: Modular organization with separate routes, services, and middleware layers

## Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Database**: Neon PostgreSQL serverless database with connection pooling
- **Schema Management**: Centralized schema definitions in shared directory with Zod validation
- **Migrations**: Drizzle Kit for database schema migrations and management

## Authentication & Authorization
- **Authentication Method**: OTP (One-Time Password) system instead of traditional passwords
- **Session Storage**: Express sessions with secure cookie configuration
- **Role-Based Access**: Middleware functions for protecting routes based on user roles (admin, faculty, student)
- **Security**: CSRF protection through session-based authentication and secure cookie settings

## Business Logic Features
- **Batch Management**: Automated batch creation from pending students with configurable ratios (2 B.Tech + 3 other courses)
- **Faculty Assignment**: Automatic faculty assignment to batches with workload balancing (max 2 batches per faculty per year)
- **Attendance Tracking**: Weekly attendance recording by faculty with present/absent status tracking
- **Marks Assessment**: Grade recording system for student performance evaluation
- **Document Management**: Research document upload and approval workflow with status tracking
- **Notification System**: Role-based notification distribution (all users, specific roles, or individual recipients)

## Key Design Patterns
- **Repository Pattern**: Storage layer abstraction for database operations with interface-based design
- **Service Layer**: Business logic separation from route handlers for better maintainability
- **Middleware Chain**: Authentication and authorization through Express middleware pipeline
- **Type Safety**: End-to-end TypeScript with shared types between frontend and backend
- **Validation**: Zod schemas for runtime type validation on both client and server sides

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support for real-time connections
- **Connection Pooling**: @neondatabase/serverless package for efficient database connection management

## UI & Styling
- **Radix UI**: Headless component primitives for accessible and customizable UI components
- **Tailwind CSS**: Utility-first CSS framework with custom design system configuration
- **Lucide React**: Icon library for consistent iconography across the application

## Development Tools
- **Vite**: Fast build tool and development server with React plugin and TypeScript support
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Integration**: Development environment integration with runtime error overlay and cartographer plugins

## Communication Services
- **OTP Delivery**: Placeholder implementations for SMS (Twilio) and email (Nodemailer/SendGrid) services
- **Future Integration**: Ready for production OTP service integration with environment variable configuration

## State Management
- **TanStack React Query**: Server state management with caching, background updates, and optimistic updates
- **Form State**: React Hook Form for efficient form state management with minimal re-renders

## Authentication Dependencies
- **Session Management**: express-session with connect-pg-simple for PostgreSQL session storage
- **Security**: Built-in session security with httpOnly cookies and CSRF protection

# Database Architecture & Setup

## Database Schema Overview
The system uses PostgreSQL with Drizzle ORM for type-safe database operations. The schema includes:

### Core Tables:
1. **Users Table** - Central user management with roles (admin, faculty, student)
2. **Students Table** - Student-specific data with enrollment IDs and course information
3. **Faculty Table** - Faculty designations and department assignments
4. **Batches Table** - Year-wise batch management with automatic naming
5. **Faculty Assignments** - Links faculty to batches with workload balancing
6. **Research Documents** - Document submission and approval workflow
7. **Notifications** - Role-based notification system
8. **Attendance** - Weekly attendance tracking by faculty
9. **Marks** - Student assessment and grading system

### Key Relationships:
- Users → Students/Faculty (One-to-One based on role)
- Batches → Students (One-to-Many, max 5 students per batch)
- Faculty → Batches (Many-to-Many through assignments, max 2 batches per faculty per year)
- Students → Research Documents (One-to-Many)
- Batches → Attendance Records (One-to-Many)

### Auto-Creation Logic:
- **Batch Creation**: Automatically creates batches when admin approves students
- **Batch Composition**: 2 B.Tech students + 3 from other courses per batch
- **Faculty Assignment**: Auto-assigns faculty to new batches with workload balancing
- **Naming Convention**: Course-Year-BatchLetter (e.g., "CS-2025-A", "Mixed-2025-B")

## Test Users & Login Information

### Admin Account:
- **Name**: Admin
- **Phone**: +919414966535
- **Email**: admin@college.edu
- **Role**: admin

### Faculty Members:
- **Prof. Rajesh Sharma** - +919414966536 (sharma@college.edu)
- **Prof. Priya Gupta** - +919414966537 (gupta@college.edu)  
- **Prof. Vikram Singh** - +919414966538 (singh@college.edu)

### Students:
- **Rahul Kumar** - +919414966539 (rahul@college.edu)
- **Priya Sharma** - +919414966540 (priya.s@college.edu)
- **Amit Verma** - +919414966541 (amit@college.edu)
- **Sneha Patel** - +919414966542 (sneha@college.edu)
- **Rohit Gupta** - +919414966543 (rohit@college.edu)

### Login Instructions:
1. Select "Existing User" on login page
2. Enter any phone number from above
3. Use fixed OTP: **263457** (for all users)
4. System redirects to role-appropriate dashboard

## Automation Features

### Registration Workflow:
1. **New User Registration**: Users apply with role selection (student/faculty)
2. **Admin Review**: Applications appear in admin dashboard for approval
3. **Approval Process**: Admin can approve/reject with one-click buttons
4. **Auto-Activation**: Approved users become active and can login immediately

### Batch Management:
1. **Auto-Creation**: Admin clicks "Create New Batch" to process pending students
2. **Smart Grouping**: System groups students by course preference (2 B.Tech max per batch)
3. **Faculty Assignment**: Automatically assigns available faculty with workload balancing
4. **Notification**: SMS notifications sent to students and faculty about assignments

### Business Rules Enforcement:
- Maximum 5 students per batch
- Maximum 2 B.Tech students per batch  
- Maximum 2 batches per faculty per academic year
- Automatic rollover to next academic year
- Pending status tracking for all workflows

## Technical Implementation

### Database Connection:
- **Provider**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle with TypeScript support
- **Connection**: WebSocket-based with connection pooling
- **Migrations**: Automated through `npm run db:push`

### Schema Management:
- **Central Schema**: All table definitions in `shared/schema.ts`
- **Type Safety**: Zod validation schemas auto-generated from Drizzle
- **Relations**: Explicit foreign key relationships with cascade rules
- **Enums**: PostgreSQL native enums for roles, courses, and statuses

### API Architecture:
- **Routes**: RESTful endpoints in `server/routes.ts`
- **Storage Layer**: Interface-based storage with database implementation
- **Validation**: Runtime validation using Zod schemas
- **Error Handling**: Comprehensive error responses with proper HTTP codes