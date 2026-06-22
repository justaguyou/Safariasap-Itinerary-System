# Users, Roles & Ownership — Setup

This adds a **super-admin** who has full access (sees every itinerary, invoice
and cost plus *who created each*, and can create/manage other users), and
**editor** users who only see the records they personally created and cannot
see the Users page.

There are 3 one-time setup steps.

---

## 1. Create the super-admin auth account

In **Supabase → Authentication → Users → Add user**, create:

- Email: `info@safariasap.com`
- A password (and tick *Auto Confirm User*)

(If this account already exists, skip this.)

## 2. Run the SQL

Open **Supabase → SQL Editor** and run, in order, any you haven't run yet:

1. `database models/schema.sql`
2. `database models/invoices_schema.sql`
3. `database models/costs_schema.sql`
4. `database models/users_roles.sql`  ← **new** (roles, ownership RLS, bootstrap)

`users_roles.sql` is safe to re-run. It promotes `info@safariasap.com` to
`super_admin`. To use a different admin email, change the email in the last
`INSERT … WHERE email = '…'` block before running.

## 3. Deploy the Edge Function

Creating a user with a password requires Supabase's secret `service_role` key,
which must **never** live in the browser. It lives in this Edge Function:

```bash
# from the project root (where the supabase/ folder is)
supabase login
supabase link --project-ref bccblasysmbybssmvswl
supabase functions deploy admin-users
```

Supabase auto-injects `SUPABASE_SERVICE_ROLE_KEY` into the function, so no extra
secret is normally required.

---

## How it works

- **On login**, the dashboard reads the user's row in `admin_profiles` to learn
  its role. `super_admin` → the **Users** menu and the **Created By** columns
  appear. `editor` → they don't.
- **Ownership** is enforced by Postgres Row-Level Security, not just the UI:
  - `created_by` defaults to the logged-in user on every new itinerary / invoice / cost.
  - An editor can `SELECT/UPDATE/DELETE` only rows where `created_by = auth.uid()`.
  - A super-admin can see and edit everything.
  - So even someone calling the API directly cannot read another editor's data.
- **Creating users**: Users page → **New User** → username, email, password,
  role. This calls the `admin-users` Edge Function, which verifies the caller is
  a super-admin, then creates the auth user (email pre-confirmed, usable
  immediately) and its `admin_profiles` row.
- **Managing users**: reset password, activate/deactivate, or delete from the
  Users table. A deactivated user is signed out and blocked on next load.

> Destinations, accommodations and the gallery remain shared reference content
> that all signed-in users can read/edit (unchanged).

## Notes

- Existing itineraries/invoices/costs created before this change have
  `created_by = NULL`; they are visible to the super-admin only. Re-save one to
  attribute it, or run an `UPDATE` to assign ownership.
- New users get the role **Editor** by default. You can also create another
  Super Admin from the New User dialog.
