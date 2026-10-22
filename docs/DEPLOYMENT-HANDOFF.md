# Deployment handoff: Time To Show Up

Last checked: 2026-10-21 (America/Phoenix).
Goal: get the existing application online and working, including Google login, workspace onboarding, commitments, work sessions, and Daily meetings.

## Identity and current evidence

| Resource | Identifier | Evidence/status |
| --- | --- | --- |
| GitHub repository | elisayers/TimeToShowUp | Read access and repository cloned successfully |
| Inspected main commit | c20b3b69871191b7d7bace6c721e16245a974aa4 | Current inspected main and Vercel production commit |
| Vercel team | team_amag9ski2rQSdhoFwxpdAUVZ | Connector verified |
| Vercel project | prj_eH22w3e7r0M4TKqPzDuDxnPdqrBo | Name: timetoshowup |
| Production app | https://timetoshowup.vercel.app | Login page renders |
| Inspected production deployment | dpl_4TLejaofDiZ3HH899uqaMkXBSQjV | READY |
| Original Supabase project | gpuipamwhvbnwrykyznv | Earlier build notes report migrations applied; latest user screenshot shows Time To Follow Through paused |
| New Supabase project | rqfaswhxdzejfeeeqsnj | Earlier user screenshot shows TimeToShowUp; user reports no application tables |
| Intended Supabase organization | Jason Eli Sayers | Latest user screenshot shows both projects under this organization |
| Supabase connection available in this chat | organization oypjkvtfpmneeyjyhkys only | Rechecked after user reset: neither target is listed; direct get_project for BOTH returns no permission |

Do not equate similar names with the same project. Use immutable IDs. Do not change the production database target based only on a display name.

## Reproduction

1. Open the production app.
2. The Time to Show Up login page renders.
3. Clicking Sign in with Google navigated to the ORIGINAL project's /auth/v1/authorize endpoint with redirect_to=https://timetoshowup.vercel.app/auth/callback.
4. This cloud browser then displayed an upstream remote connection failure. This is not proof of a global outage. The original project being paused is consistent with the failure, but database/auth access is needed to confirm.
5. Vercel variable changes made by the user have not been verified in a fresh deployment.

The blank Vercel Storage integration page does not establish that an external Supabase database is absent.

## Configuration contract

| Variable | Vercel type |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Config |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Config |
| NEXT_PUBLIC_DAILY_DOMAIN | Config |
| DAILY_API_KEY | Secret |

URL and publishable key must belong to the same selected Supabase project.
Production is required; Preview should be configured deliberately before preview testing.
Never commit credentials, keys, .env.local, database exports, or authentication tokens.

## Database migration inventory

Apply existing migrations in order only after inspecting the target tables and migration history:

1. supabase/migrations/0001_initial_schema.sql
2. supabase/migrations/20261004000313_grant_permissions.sql
3. supabase/migrations/20261004001238_workspace_creator_read.sql
4. supabase/migrations/20261004002416_phase2_schema.sql
5. supabase/migrations/20261004004201_fix_period_function.sql
6. supabase/migrations/20261006055626_add_meeting_room_url.sql
7. supabase/migrations/20261007042014_allow_profile_read.sql

Expected application tables:
profiles, workspaces, workspace_members, meetings, accountability_periods, commitments, work_sessions.

Do not rerun migrations blindly. The initial migration is not idempotent. Inspect policies/functions and test membership authorization before calling the multi-user app ready.

## OAuth contract

Code:
- app/login/page.tsx uses window.location.origin + /auth/callback.
- app/auth/callback/route.ts exchanges the authorization code, then redirects to /dashboard.

For the selected Supabase project:
- Site URL: https://timetoshowup.vercel.app
- Allowed redirect: https://timetoshowup.vercel.app/auth/callback
- Add localhost/custom-domain/preview redirects only when they are actually used and verified.
- Google provider must be enabled and configured.
- Google Cloud OAuth redirect URI must be https://<SELECTED_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback.
- Do not copy the original project's Google callback if selecting the new database.
- Confirm Google audience/testing restrictions permit Eli and Shawn, and the intended multi-user audience.

## Next operator checklist

- [ ] Establish access to Jason Eli Sayers organization and BOTH target Supabase projects.
- [ ] Inspect original project's pause state and data; inspect new project's tables/history/auth settings.
- [ ] Select the existing original project or a deliberate migration to the new project based on evidence. Preserve existing data.
- [ ] Resume the original project if it is selected, or apply missing existing migrations to the selected new project.
- [ ] Reconcile Google OAuth callback, Supabase redirect configuration, and Vercel public URL/key as one operation.
- [ ] Verify Daily credentials/room creation without exposing the API key.
- [ ] Redeploy reviewed code with the verified configuration.
- [ ] Test Google login and callback, profile creation, workspace creation and partner joining.
- [ ] Test commitment creation/completion, timer persistence, history, meeting room creation/joining and notes.
- [ ] Verify one user cannot access or alter another workspace without membership.
- [ ] Update this handoff with observed results, final project ID, deployment ID/commit, and remaining blockers.
- [ ] Mark complete only after positive end-to-end evidence. A READY build alone is insufficient.

## Handoff rule

At the end of a session, record:
- exact resource IDs and organization, with observed versus assumed state;
- completed actions and verification;
- uncommitted or unpublished work and the branch containing it;
- concrete blocker and the single next action.

At the start of a session, read this file, inspect branch/deployment drift, and verify access before changing configuration. Project renames never authorize creating a replacement database.
