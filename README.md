# Church Management App

A modern, full-stack church management system built with Next.js and Supabase. Streamline church operations, manage volunteers, track newcomers, and coordinate events all in one place.

## 🎯 Features

### ✅ Implemented

- **🔐 Authentication System**
  - Google OAuth integration via Supabase Auth
  - Email/password authentication
  - Protected routes with role-based access control
  - Secure session management

- **👥 Newcomer Management**
  - Digital registration form for visitors
  - Admin dashboard with Kanban board view
  - Follow-up assignment system
  - Team member assignment and tracking
  - Contact status tracking (contacted/not contacted)
  - Real-time updates

- **👨‍💼 Admin Dashboard**
  - Secure admin area (`/admin/newcomers`)
  - Drag-and-drop Kanban board for newcomer status management
  - Assign team members to follow up with newcomers
  - View and manage all newcomer data
  - Role-based access (admin/member)

- **📊 Team Member Dashboard**
  - Personal dashboard for team members (`/dashboard`)
  - View assigned follow-ups
  - Mark newcomers as contacted
  - Add contact notes
  - Track follow-up progress

- **🛡️ Row Level Security (RLS)**
  - Secure database policies
  - Users can only access their own data
  - Admins have full access
  - Prevents infinite recursion in policies

### 🚧 Planned Features

- **📅 Rota Management System**
  - Automated email/SMS notifications (14 days and 2 days before shifts)
  - Status tracking (Pending, Confirmed, Declined)
  - Volunteer shift assignments

- **📆 Live Church Calendar**
  - Unified view of all church events
  - Event management and updates
  - Public event calendar

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: TypeScript
- **Drag & Drop**: [@hello-pangea/dnd](https://github.com/hello-pangea/dnd)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/powerofjehovah2025-afk/church-app.git
   cd church-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   You can find these values in your Supabase project settings under API.

4. **Set up Supabase**
   
   - Run the SQL migrations in `supabase/migrations/` in your Supabase SQL Editor:
     - `add_followup_tracking_fields.sql` - Adds follow-up tracking columns
     - `fix_profiles_rls_recursion.sql` - Sets up secure RLS policies
   
   - Configure authentication:
     - Enable Google OAuth in Supabase Dashboard → Authentication → Providers
     - Add your OAuth credentials
     - Set up redirect URLs (see `SUPABASE_SITE_URL_SETUP.md`)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
church-app/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard pages
│   │   └── newcomers/     # Newcomer management
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Login page
│   │   ├── sign-up/       # Sign up page
│   │   └── callback/      # OAuth callback handler
│   ├── dashboard/         # Team member dashboard
│   ├── newcomer/          # Newcomer registration form
│   └── ...
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   │   ├── newcomers-kanban.tsx
│   │   └── assign-followup-dialog.tsx
│   ├── dashboard/        # Dashboard components
│   │   └── my-followups.tsx
│   └── ui/               # Shadcn UI components
├── lib/                  # Utility functions
│   └── supabase/         # Supabase client configuration
├── supabase/
│   └── migrations/         # Database migration files
├── types/                 # TypeScript type definitions
│   └── database.types.ts  # Supabase database types
└── ...
```

## 🗄️ Database Schema

### Tables

- **`profiles`**
  - User profiles with roles (admin/member)
  - Linked to Supabase Auth users
  - Secure RLS policies

- **`newcomers`**
  - Visitor registration data
  - Follow-up assignment tracking
  - Contact status and notes
  - Status workflow (New, Contacted, Follow-up, etc.)

- **`events`** (planned)
  - Church service and meeting dates

- **`rota_shifts`** (planned)
  - Volunteer assignments

## 🔐 Authentication Flow

1. **Sign Up/Login**
   - Users can sign up with email/password or Google OAuth
   - Profile is automatically created in the `profiles` table

2. **Role-Based Redirect**
   - **Admin users** → Redirected to `/admin/newcomers`
   - **Team members** → Redirected to `/dashboard`

3. **Protected Routes**
   - Unauthenticated users are redirected to `/login`
   - Middleware handles route protection

## 🎨 Development Guidelines

- **Use TypeScript** for all files to ensure type safety
- **Use Shadcn UI** components from `/components/ui`
- **Keep pages** inside the `app/` directory (Next.js App Router)
- **Database logic** goes in `/lib/supabase`
- **Follow the PRD** (`PRD.md`) for feature specifications
- **Component organization**: Put reusable components in `/components`

## 📝 Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Optional (for full functionality):

- **`RESEND_API_KEY`** – [Resend](https://resend.com) API key for sending follow-up assignment and reminder emails. If unset, in-app notifications only; no emails are sent.
- **`RESEND_FROM_EMAIL`** – From address for emails (e.g. `Church <notifications@yourdomain.com>`). Defaults to Resend’s onboarding address when not set.
- **`CRON_SECRET`** – Secret for protecting cron endpoints (`/api/cron/followup-reminders`, `/api/cron/generate-services`). In production, set this and send `Authorization: Bearer <CRON_SECRET>` when calling these endpoints.

## 🧪 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📚 Documentation

- **PRD.md** - Product Requirements Document
- **SUPABASE_REALTIME_SETUP.md** - Real-time subscriptions setup
- **SUPABASE_SITE_URL_SETUP.md** - Site URL and redirect configuration

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🔗 Links

- **Repository**: [https://github.com/powerofjehovah2025-afk/church-app](https://github.com/powerofjehovah2025-afk/church-app)
- **Supabase**: [https://supabase.com](https://supabase.com)
- **Next.js Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)

---

Built with ❤️ for church management
