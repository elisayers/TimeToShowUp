# Time To Show Up — Supabase Replacement & Deployment Handoff

Date: 2026-10-21  
Repository: `https://github.com/elisayers/TimeToShowUp` (`main` @ `c20b3b69871191b7d7bace6c721e16245a974aa4`)  
Production URL: `https://timetoshowup.vercel.app`

---

## 1. Supabase Organization & Project Inventory

| Role | Project Name | Project Ref / ID | Organization | Region | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| **Active Replacement (New)** | `Time To Show Up` | `nlpulegrrxfoofmftxqx` | `Jason Eli Sayers` (`zifmniabyrssbvbsdmmi`) | `us-east-1` | `ACTIVE_HEALTHY` | Linked locally; all 7 migrations applied and verified; Auth & Google OAuth configured. |
| **Previous Incomplete Project (#2)** | `TimeToShowUp` | `rqfaswhxdzejfeeeqsnj` | `Jason Eli Sayers` (`zifmniabyrssbvbsdmmi`) | `us-east-1` | `ACTIVE_HEALTHY` | Preserved (not deleted). Created 2026-10-16T03:25:15Z with 0 migrations and Google OAuth disabled. |
| **Original Prototype Project (#1)** | `Time To Follow Through` | `gpuipamwhvbnwrykyznv` | `Jason Eli Sayers` (`zifmniabyrssbvbsdmmi`) | `us-east-1` | `INACTIVE` | Preserved (not deleted). Currently baked into the stale Vercel build prior to redeploy. |

> **Why Display Name `Time To Show Up` Was Used:**  
> Supabase Management API rejected creating a second project with the exact string `"TimeToShowUp"` (`Project with name "TimeToShowUp" already exists in your organization`) because `rqfaswhxdzejfeeeqsnj` already held that string. Per instructions (*"Do not delete existing projects merely to free a name"*), both prior projects were preserved and `"Time To Show Up"` (`nlpulegrrxfoofmftxqx`) was created in the `Jason Eli Sayers` organization (`zifmniabyrssbvbsdmmi`).

---

## 2. Database Migration & Security Verification (`nlpulegrrxfoofmftxqx`)

All seven migrations in `supabase/migrations/` were pushed in order via `npx supabase db push`:

1. `0001_initial_schema.sql`
2. `20261004000313_grant_permissions.sql`
3. `20261004001238_workspace_creator_read.sql`
4. `20261004002416_phase2_schema.sql`
5. `20261004004201_fix_period_function.sql`
6. `20261006055626_add_meeting_room_url.sql`
7. `20261007042014_allow_profile_read.sql`

### Live Database Verification Results
- **Tables (7/7 with `rowsecurity = true`):** `accountability_periods`, `commitments`, `meetings`, `profiles`, `work_sessions`, `workspace_members`, `workspaces`
- **Functions (3/3 `SECURITY DEFINER`):** `handle_new_user`, `is_workspace_member`, `is_period_workspace_member`
- **Triggers (1/1):** `on_auth_user_created` on `auth.users`
- **Role Table Grants:** 49 privilege grants verified for `authenticated` across all 7 tables
- **RLS Policies:** 20 policies active across all 7 tables
- **Live Transactional Isolation Test (`pg_temp.verify_rls`):**
  - Inserting two test users into `auth.users` triggered `profiles_created = 2`.
  - User 1 (`authenticated`) created a workspace, membership, period, commitment, work session, and meeting.
  - User 2 (`authenticated`, non-member) queried those records and received `0` rows across `workspaces`, `accountability_periods`, `commitments`, `work_sessions`, and `meetings`.
- **Live Two-Partner E2E Workflow Test (`pg_temp.verify_e2e_workflow` + Daily API):**
  - `profiles_created: 2` (automatic trigger on `auth.users`)
  - `workspace_onboarded: true` (owner created workspace and added partner membership)
  - `period_created: true`
  - `commitments_created: true` (both partners declared commitments)
  - `shared_commitments_visible_to_partner: 2`
  - `partner_cross_edit_blocked_by_rls: true` (partner blocked from modifying owner's commitment)
  - `work_session_logged: true`
  - `daily_meeting_scheduled: true` (verified live Daily.co room creation `https://timetoshowup.daily.co/ttsu-verify-mvj6akos` and transcript endpoint readiness `state: "not_started"`)

---

## 3. Authentication & OAuth Configuration (`nlpulegrrxfoofmftxqx`)

Configured via Supabase Management API (`PATCH /v1/projects/nlpulegrrxfoofmftxqx/config/auth`):

- **Site URL (`site_url`):** `https://timetoshowup.vercel.app`
- **Allowed Redirect URLs (`uri_allow_list`):**
  - `https://timetoshowup.vercel.app/auth/callback`
  - `https://timetoshowup.com/auth/callback`
  - `http://localhost:3000/auth/callback`
- **Google Provider (`external_google_enabled`):** `true`
- **Google OAuth Client ID (`external_google_client_id`):** `800992584122-h7h2opu98p4flt995ejhav07is0f3h1k.apps.googleusercontent.com` (reused from Google Cloud project `time-to-follow-through`)
- **Supabase OAuth Callback URI (for Google Cloud Console):**
  - `https://nlpulegrrxfoofmftxqx.supabase.co/auth/v1/callback`

---

## 4. Vercel Environment Configuration Names

| Variable Name | Visibility / Type | Target Value (Non-Secret Reference) |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Config (Plaintext) | `https://nlpulegrrxfoofmftxqx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Config (Plaintext) | `sb_publishable_1e2yCUyUbI4v9mC6_UWc-A_HNmEmU3J` |
| `DAILY_API_KEY` | Secret (Encrypted) | *(Preserved existing Daily.co API secret)* |
| `NEXT_PUBLIC_DAILY_DOMAIN` | Config (Plaintext) | `https://timetoshowup.daily.co` |

---

## 5. Audit: Why the Second Project (`rqfaswhxdzejfeeeqsnj`) Was Created Without Completed Migration & Deployment Handoff

1. **Timeline:**
   - **2026-10-03T21:38:52Z:** Original project `gpuipamwhvbnwrykyznv` (`Time To Follow Through`) was created and migrated during initial local development. It later went `INACTIVE`.
   - **2026-10-16T03:25:15Z:** A second project `rqfaswhxdzejfeeeqsnj` (`TimeToShowUp`) was created under organization `zifmniabyrssbvbsdmmi` (`Jason Eli Sayers`) after the product rename decision (`Time To Follow Through` → `Time to Show Up`).
2. **Where It Stopped:**
   - On `rqfaswhxdzejfeeeqsnj`, only the Auth `site_url` (`https://timetoshowup.vercel.app`) and `uri_allow_list` (`https://timetoshowup.vercel.app/**`) were set via the dashboard/API.
   - The local repository (`supabase/.temp/project-ref` and `.env.local`) was never re-linked from `gpuipamwhvbnwrykyznv` to `rqfaswhxdzejfeeeqsnj`.
   - Consequently, `npx supabase db push` was never executed against `rqfaswhxdzejfeeeqsnj` (leaving `public` and `supabase_migrations` with 0 tables).
   - Google OAuth (`external_google_enabled`) was left `false` on `rqfaswhxdzejfeeeqsnj`, and its callback URI (`https://rqfaswhxdzejfeeeqsnj.supabase.co/auth/v1/callback`) was never registered in Google Cloud Console.
   - Finally, when `https://timetoshowup.vercel.app` was deployed, Vercel was given the older `.env.local` values pointing to `gpuipamwhvbnwrykyznv` instead of a migrated active project, and no `docs/DEPLOYMENT-HANDOFF.md` was written to record the state.
