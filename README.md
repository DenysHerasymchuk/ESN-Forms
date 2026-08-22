[![ESN Forms banner](public/pictures/esn-forms-banner.jpeg)](https://esngeel.org)

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres%20%2B%20Edge%20Functions-3ECF8E?logo=supabase&logoColor=white" />
  <img alt="oxlint" src="https://img.shields.io/badge/Lint-oxlint-000000" />
</p>

<h1 align="center">ESN Geel Forms</h1>

ESN Forms is ESN Geel's own form-building platform — any member can create, publish, and manage registration forms for their events, without relying on a separate Google Form each time.

Sign in, build a form from a range of field types (short answer, email, dropdowns, checkboxes, acknowledgements, and more), publish it for a shareable public link, and track responses in the built-in submissions view. Admins can oversee every member's forms and manage account roles from a dedicated admin area.

**Live at [esn-forms.vercel.app](https://esn-forms.vercel.app).**

## Setup

```
git clone <this repo>
cd ESN-Forms
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase project's values (Project Settings → API in the [Supabase dashboard](https://supabase.com/dashboard)):

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your project's anon/publishable key>
```

The app won't start without these — `src/lib/supabaseClient.ts` throws immediately if either is missing.

## Development

```
npm run dev
```

## Production build

```
npm run build
```

Outputs a static site to `dist/`, ready to be served by any static host. This repo deploys to Vercel (see `vercel.json` for the SPA rewrite and security headers).

## Backend

The Supabase project backing this app lives under `supabase/`:

- **`supabase/migrations/`** — the full schema, RLS policies, and Postgres functions/triggers (form lifecycle, submission validation, roles), applied in order. Apply them to a linked project with:
  ```
  npx supabase link --project-ref <your-project-ref>
  npx supabase db push
  ```
- **`supabase/functions/`** — Edge Functions for things a plain RLS policy can't do safely from the client: `submit-form` (the sole public write path into `submissions`, verifies a Cloudflare Turnstile token before accepting), and the admin-only account/form management functions (`create-user`, `update-user`, `delete-user`, `delete-form`) — there's no public self-signup, and force-deleting a form or account with existing responses needs the service-role key. Deploy with:
  ```
  npx supabase functions deploy submit-form --use-api
  npx supabase functions deploy create-user --use-api
  npx supabase functions deploy update-user --use-api
  npx supabase functions deploy delete-user --use-api
  npx supabase functions deploy delete-form --use-api
  ```

Accounts are admin-only. Use the "Add user" button in the admin Users page (`/dashboard/admin/users`) once you have at least one admin account — bootstrapping the very first admin requires either running `create-user` once against an existing account and then promoting it via SQL, or inserting directly into `auth.users`/`profiles` through the Supabase dashboard.

## File structure

```
ESN-Forms/
├── index.html                          Vite entry HTML (fonts, favicon, root div)
├── vercel.json                         SPA rewrite + security headers
├── public/                             Static assets (favicon, ESN logo, banner)
├── supabase/
│   ├── migrations/                     Schema, RLS, functions/triggers (applied in order)
│   └── functions/
│       ├── submit-form/                Public submission endpoint (Turnstile-verified, service-role write)
│       ├── create-user/                Admin-only account creation
│       ├── update-user/                Admin-only account editing (email/password)
│       ├── delete-user/                Admin-only account deletion
│       ├── delete-form/                Admin-only force-delete (a form + its responses)
│       └── _shared/                    cors.ts, requireAdmin.ts (shared admin-auth check)
└── src/
    ├── main.tsx                        React root
    ├── App.tsx                         Route table (public, authenticated, admin-only)
    ├── index.css                       Tailwind entry + design tokens (color, type, motion)
    ├── auth/                           Auth context/provider, useAuth hook, route guard
    ├── lib/
    │   ├── supabaseClient.ts           Configured Supabase client
    │   ├── formsApi.ts                 Owner-facing forms/submissions API
    │   ├── adminApi.ts                 Admin-only users/forms API
    │   ├── formField.ts                Shared field schema + validator (frontend + submit-form)
    │   ├── database.types.ts           Hand-written types matching the live schema
    │   └── errors.ts                   Error-message normalization helper
    ├── components/
    │   ├── ui/                         Shared primitives (Button, TextField, Modal, DataTable, …)
    │   ├── layout/                     Page shells (AppShell, CenteredCardShell, BrandedFormShell)
    │   ├── forms/                      Dynamic form renderer (schema-driven, used by public forms)
    │   ├── builder/                    Form-builder field list/config editors
    │   ├── dashboard/                  Shared forms table (Dashboard/Archive/admin views)
    │   └── BrandStrip.tsx, Footer.tsx, SocialLinks.tsx
    └── pages/
        ├── LoginPage.tsx, NotFoundPage.tsx
        ├── PublicFormPage.tsx          The public /forms/:slug page
        ├── DashboardPage.tsx, ArchivePage.tsx, FormBuilderPage.tsx
        └── AdminUsersPage.tsx, AdminFormsPage.tsx
```

## License

[MIT](LICENSE)
