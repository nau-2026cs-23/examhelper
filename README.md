# Exam Reminder System

A full-stack intelligent exam schedule reminder system for university students.

## Overview

This application helps students manage their exam schedules, track tasks, and receive timely reminders.

## Project Structure

```
.
├── backend/
│   ├── config/
│   │   └── constants.ts      # JWT_CONFIG, AUTH_ERRORS constants
│   ├── db/
│   │   ├── index.ts          # Database connection (postgres.js + drizzle)
│   │   ├── schema.ts         # Drizzle ORM schema + Zod validation
│   │   └── migrations/       # SQL migration files
│   ├── middleware/
│   │   └── auth.ts           # JWT authentication middleware
│   ├── repositories/
│   │   ├── users.ts          # User + notification settings repository
│   │   ├── exams.ts          # Exam repository
│   │   └── tasks.ts          # Task repository
│   ├── routes/
│   │   ├── auth.ts           # POST /api/auth/login, /register
│   │   ├── exams.ts          # CRUD /api/exams
│   │   ├── tasks.ts          # CRUD /api/tasks
│   │   ├── profile.ts        # GET/PUT /api/profile, /notifications
│   │   └── admin.ts          # /api/admin/* (stats, users, system, announcements)
│   └── server.ts             # Express app entry point
├── frontend/
│   └── src/
│       ├── config/
│       │   └── constants.ts  # API_BASE_URL
│       ├── hooks/
│       │   └── useAuth.tsx   # Auth hook
│       ├── lib/
│       │   ├── api.ts        # API service (all endpoints)
│       │   └── utils.ts      # cn() utility
│       └── pages/
│           ├── Index.tsx     # Main entry (routes)
│           ├── LoginPage.tsx
│           ├── RegisterPage.tsx
│           ├── DashboardPage.tsx  # Main app (dashboard, exams, calendar, tasks, notifications, profile)
│           └── AdminPage.tsx      # Admin panel (stats, users, system, announcements)
├── shared/
│   └── types/
│       └── api.ts            # Shared TypeScript types (frontend + backend)
├── package.json              # Root package.json (backend deps)
└── tsconfig.json             # Root TypeScript config
```

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, shadcn/ui, React Router v6 (HashRouter), Sonner toasts
- **Backend**: Express.js, TypeScript, Drizzle ORM, postgres.js
- **Database**: PostgreSQL
- **Auth**: JWT (jsonwebtoken), bcryptjs
- **Validation**: Zod + drizzle-zod

## Key Features

1. **Authentication**: Register/Login with JWT, role-based (user/admin)
2. **Exam Management**: CRUD exams with type, date, time, location, review progress (0-100%)
3. **Calendar View**: Monthly calendar with color-coded exam type dots, click to view details
4. **Task Management**: CRUD tasks with priority, due date, linked to exams, toggle complete
5. **Notification Settings**: Configure channels (system/email/browser) and reminder intervals
6. **Profile Management**: Update name and password
7. **Admin Panel**: User management (enable/disable/reset password), system status, announcements, stats
8. **Bilingual Support**: Full Chinese/English language switching via `frontend/src/lib/i18n.tsx`, persisted in localStorage. Default language is Chinese (zh). Toggle button appears in sidebar, header, and auth pages.

## API Routes

- `GET /api/announcements` - Public: fetch active announcements (shown in user dashboard)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET/PUT /api/profile` - Get/update profile
- `GET/PUT /api/profile/notifications` - Notification settings
- `GET/POST /api/exams` - List/create exams
- `PUT/DELETE /api/exams/:id` - Update/delete exam
- `GET/POST /api/tasks` - List/create tasks
- `PUT/DELETE /api/tasks/:id` - Update/delete task
- `GET /api/admin/stats` - Admin statistics
- `GET /api/admin/users` - User list (paginated)
- `PUT /api/admin/users/:id/status` - Enable/disable user
- `PUT /api/admin/users/:id/reset-password` - Reset user password
- `GET /api/admin/system-status` - System health
- `GET/POST/PUT/DELETE /api/admin/announcements` - Announcements CRUD

## Default Admin Account

- Email: `admin@examreminder.com`
- Password: `password`

## Code Generation Guidelines

- All shared types in `shared/types/api.ts`, import with `@shared/types/api` in frontend
- Backend uses repository pattern: routes → repositories → drizzle
- Frontend API calls go through `frontend/src/lib/api.ts` apiService
- HashRouter is used - navigate with `useNavigate`, never `window.location.href` without `#`
- No authentication bypass - all protected routes check JWT token
