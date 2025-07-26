# AstraCore Internal Web App

This repository contains the initial scaffold and high‑level design for **AstraCore**, an internal web application for your company.  The project is built with **Next.js 14**, **TypeScript** and **Tailwind CSS** on the frontend and **Supabase** as the backend.  Deployment is intended for **Netlify** using the custom domain `astracore.pro`.

## Why Next.js and Supabase?

* **Next.js** is a popular React framework that makes it easy to build production‑ready applications with built‑in routing, server‑side rendering and API routes.
* **Supabase** is an open‑source Firebase alternative built on top of PostgreSQL.  It bundles database, authentication, real‑time subscriptions and file storage.  Supabase makes it easy to manage tables and relationships, write SQL queries, and enforce row‑level security policies.
* Supabase’s features include row‑level security, real‑time data streams, an authentication system supporting email, password and social providers, and edge functions.  These capabilities are ideal for an internal application with multiple user roles.

## Project Structure

```
astracore/
├── app/                 # Next.js App Router pages
│   ├── globals.css      # Tailwind CSS base styles
│   ├── layout.tsx       # Root layout component
│   ├── page.tsx         # Home page
│   ├── login/page.tsx   # Login form (client component)
│   └── dashboard/page.tsx # Protected dashboard
├── lib/
│   └── supabaseClient.ts # Supabase client for client‑side usage
├── .env.example         # Environment variables template
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── package.json
└── README.md
```

### Authentication

The scaffold includes a simple email/password login page that calls `supabase.auth.signInWithPassword`.  After authenticating, the user is redirected to `/dashboard`.  The dashboard is implemented as a server component that uses `@supabase/auth-helpers-nextjs` to access the current session via cookies; unauthenticated users are redirected back to `/login`.

### Environment Variables

Next.js stores secrets in a `.env.local` file.  To expose variables to the browser they must be prefixed with `NEXT_PUBLIC_`.  Netlify lets you set environment variables in the **Build & Deploy → Environment variables** section of your site settings.  Copy `.env.example` to `.env.local` and supply your Supabase project URL and anonymous key.

### Deployment to Netlify

Netlify integrates directly with GitHub and automatically builds Next.js applications.  Once you push this repository to GitHub, log into Netlify and create a new site from the repository.  Set your environment variables in the Netlify UI, and configure the custom domain `astracore.pro` through Netlify’s DNS settings.

### High‑Level Application Design

Although this scaffold only includes a login and dashboard, the final application should implement the following modules:

1. **User Authentication and Authorization** – restrict access to the app; create roles such as admin, manager and employee.  Supabase’s auth system creates an `auth.users` table automatically and supports email/password, magic links and OAuth.  Use row‑level security to ensure users only see records they are permitted to view.
2. **Project and Task Management** – create projects, assign tasks to users, track statuses (e.g., To Do, In Progress, Done), priorities and due dates.  Use relational tables (`projects`, `tasks`, `task_assignments`) and enable real‑time subscriptions so updates broadcast instantly.
3. **Employee Directory** – maintain a list of employees with roles and contact details.
4. **Time Tracking** – allow employees to log billable hours against projects or tasks.
5. **Client CRM** – store information about clients and link them to projects.
6. **Document Storage** – use Supabase Storage to upload contracts, proposals or reference documents.
7. **Notifications** – leverage Supabase’s real‑time capabilities to push notifications when tasks are updated or comments are added.
8. **Admin Settings** – manage users, roles and environment variables.

Each module can be represented as pages under `app/` with server components fetching data using Supabase queries.  Use Tailwind CSS to build a responsive interface that works across desktop and mobile.  This repository serves as a starting point—features can be added incrementally as separate routes and components.

---

> **Note**: The code in this scaffold is intended to be a starting point.  It does not include every feature described above.  Expand upon it to build the complete internal application.
