# AcademiX - Academic Management System

A comprehensive student batch management system designed for academic institutions, providing robust user authentication, administrative tools, and automated batch creation with advanced login capabilities.

## 🚀 Features

### Core Functionality
- **OTP-Based Authentication** - Secure SMS-based login system
- **Role-Based Access Control** - Admin, Faculty, and Student dashboards
- **Automated Batch Creation** - Smart grouping with business rules
- **Faculty Assignment** - Auto-assignment with workload balancing
- **Registration Workflow** - Pending approval system for new users
- **Research Document Management** - Upload and approval workflow
- **Attendance Tracking** - Weekly attendance by faculty
- **Notification System** - Role-based notifications

### User Roles & Capabilities

#### 👨‍💼 Admin
- Approve/reject new user registrations
- Create batches automatically from pending students
- Assign faculty to batches
- Send notifications to users
- View system statistics and analytics
- Manage all users and system settings

#### 👨‍🏫 Faculty
- View assigned batches and students
- Record attendance for assigned students
- Grade student assignments and assessments
- Upload and manage research documents
- Receive notifications about assignments

#### 👨‍🎓 Students  
- View batch information and faculty details
- Submit research documents for approval
- Check attendance records and grades
- Receive notifications about academic updates
- Track academic progress

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Wouter** for lightweight routing
- **TanStack React Query** for server state management
- **Radix UI** components with shadcn/ui
- **Tailwind CSS** for styling
- **React Hook Form** with Zod validation

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** (Neon serverless)
- **Express Sessions** for authentication
- **WebSocket** support for real-time features

### Database
- **PostgreSQL** with comprehensive schema
- **Drizzle ORM** for migrations and queries
- **Connection pooling** for performance
- **Foreign key relationships** with proper constraints

## 📊 Database Schema

### Core Tables

#### Users Table
```sql
- id (UUID, Primary Key)
- name (Text, Not Null)
- email (Text, Unique, Not Null)
- phone (Text, Unique, Not Null)  
- role (Enum: admin, faculty, student)
- isActive (Boolean, Default: true)
- createdAt, updatedAt (Timestamps)
```

#### Students Table
```sql
- userId (UUID, Foreign Key to Users)
- enrollmentId (Text, Unique)
- course (Enum: B.Tech, MCA, MBA, M.Tech, BCA, BBA)
- year (Integer)
- batchId (UUID, Foreign Key to Batches)
```

#### Faculty Table
```sql
- userId (UUID, Foreign Key to Users)
- designation (Text)
- department (Text)
```

#### Batches Table
```sql
- id (UUID, Primary Key)
- name (Text) // Format: "CS-2025-A"
- year (Integer)
- isActive (Boolean)
```

#### Faculty Assignments
```sql
- id (UUID, Primary Key)
- facultyId (UUID, Foreign Key)
- batchId (UUID, Foreign Key)
- year (Integer)
- assignedAt (Timestamp)
```

### Key Relationships
- **Users → Students/Faculty** (One-to-One based on role)
- **Batches → Students** (One-to-Many, max 5 students per batch)
- **Faculty → Batches** (Many-to-Many, max 2 batches per faculty per year)
- **Students → Research Documents** (One-to-Many)
- **Batches → Attendance Records** (One-to-Many)

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### Environment Variables
```bash
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=your_host
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=your_database
```

### Installation Steps

1. **Clone Repository**
```bash
git clone <repository-url>
cd academix
```

2. **Install Dependencies**
```bash
npm install
```

3. **Setup Database**
```bash
# Push schema to database
npm run db:push

# Generate database types
npm run db:generate
```

4. **Start Development Server**
```bash
npm run dev
```

Server will start on `http://localhost:5000`

## 🧪 Test Users & Login

### Admin Account
- **Phone:** +919414966535
- **Email:** admin@college.edu
- **Role:** admin

### Faculty Members
- **Prof. Rajesh Sharma** - +919414966536 (sharma@college.edu)
- **Prof. Priya Gupta** - +919414966537 (gupta@college.edu)  
- **Prof. Vikram Singh** - +919414966538 (singh@college.edu)

### Students
- **Rahul Kumar** - +919414966539 (rahul@college.edu)
- **Priya Sharma** - +919414966540 (priya.s@college.edu)
- **Amit Verma** - +919414966541 (amit@college.edu)
- **Sneha Patel** - +919414966542 (sneha@college.edu)
- **Rohit Gupta** - +919414966543 (rohit@college.edu)

### Login Instructions
1. Select "Existing User" on login page
2. Enter any phone number from above
3. Use fixed OTP: **263457** (for all users during testing)
4. System redirects to role-appropriate dashboard

## 🤖 Automation Features

### Registration Workflow
1. **User Registration** - New users apply with role selection
2. **Admin Review** - Applications appear in admin dashboard  
3. **Approval Process** - One-click approve/reject buttons
4. **Auto-Activation** - Approved users can login immediately

### Batch Creation Automation
1. **Smart Grouping** - Groups students by course preference
2. **Business Rules** - Max 5 students, max 2 B.Tech per batch
3. **Auto-Naming** - Format: "CourseCode-Year-Letter" (CS-2025-A)
4. **Faculty Assignment** - Auto-assigns with workload balancing
5. **Notifications** - SMS alerts to students and faculty

### Business Rules Enforcement
- **Batch Size**: Maximum 5 students per batch
- **Course Mix**: Maximum 2 B.Tech students per batch
- **Faculty Load**: Maximum 2 batches per faculty per year
- **Academic Year**: Automatic rollover and year management
- **Status Tracking**: Comprehensive pending/active status system

## 🏗️ Architecture Overview

### Frontend Architecture
```
client/src/
├── components/       # Reusable UI components
├── pages/           # Route-based page components  
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and configs
├── types/           # TypeScript type definitions
└── App.tsx          # Main application component
```

### Backend Architecture
```
server/
├── routes.ts        # API endpoint definitions
├── storage.ts       # Database interface and implementation
├── services/        # Business logic services
├── middleware/      # Authentication and validation
└── index.ts         # Express server setup
```

### Shared Schema
```
shared/
└── schema.ts        # Database schema and Zod validations
```

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - New user registration
- `POST /api/auth/send-otp` - Send OTP for login
- `POST /api/auth/verify-otp` - Verify OTP and login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user

### Admin Operations
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/pending-users` - Pending registrations
- `POST /api/admin/pending-users/:id/approve` - Approve user
- `POST /api/admin/pending-users/:id/reject` - Reject user
- `POST /api/admin/batches/create` - Create new batches
- `GET /api/admin/pending-students/:year` - Pending students

### Faculty Operations
- `GET /api/faculty/batches` - Assigned batches
- `POST /api/faculty/attendance` - Record attendance
- `GET /api/faculty/students/:batchId` - Batch students

### Student Operations
- `GET /api/student/batch` - Student's batch info
- `POST /api/student/documents` - Upload research document
- `GET /api/student/attendance` - View attendance records

## 🎨 UI/UX Features

### Design System
- **Color Scheme**: Purple gradient theme (#5a008a, #9c55cc)
- **Typography**: Professional font hierarchy
- **Components**: Consistent Radix UI components
- **Responsive**: Mobile-first responsive design
- **Accessibility**: ARIA labels and keyboard navigation

### Key UI Components
- **Dashboard Cards** - Statistics and quick actions
- **Data Tables** - Sortable and filterable lists
- **Forms** - Validated forms with error handling
- **Modals** - Confirmation dialogs and detail views
- **Toast Notifications** - Success/error feedback
- **Loading States** - Skeleton loaders and spinners

## 🚀 Deployment

### Replit Deployment
1. Connect repository to Replit
2. Configure environment variables
3. Run `npm run dev` 
4. Deploy using Replit's deployment system

### Manual Deployment
1. Build production bundle: `npm run build`
2. Configure production database
3. Set environment variables
4. Start server: `npm start`

## 🧪 Testing

### Development Testing
- **Fixed OTP**: 263457 for all users during development
- **Test Database**: Seeded with sample users and data
- **Real Scenarios**: Complete workflows from registration to batch creation

### Production Considerations
- Replace fixed OTP with SMS service integration
- Configure production database with proper security
- Set up monitoring and logging systems
- Implement backup and recovery procedures

## 📋 Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Database
npm run db:push      # Push schema changes to database
npm run db:generate  # Generate TypeScript types
npm run db:studio    # Open Drizzle Studio (database GUI)

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 🔧 Configuration Files

### Key Files
- `vite.config.ts` - Vite build configuration
- `tailwind.config.ts` - Tailwind CSS configuration  
- `drizzle.config.ts` - Database ORM configuration
- `tsconfig.json` - TypeScript compiler options
- `package.json` - Dependencies and scripts

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Use Drizzle ORM for all database operations
3. Implement proper error handling
4. Write comprehensive API documentation
5. Test all user workflows thoroughly

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Implement proper state management
- Use consistent naming conventions
- Add proper comments for complex logic

## 📄 License

This project is developed for educational purposes and internal use within academic institutions.

## 📞 Support

For technical support or questions about the system:
- Check existing documentation in `replit.md`
- Review API endpoints and error codes
- Test with provided sample user accounts
- Follow the automated workflows for common tasks

---

**AcademiX** - Streamlining academic management with modern technology and intelligent automation.