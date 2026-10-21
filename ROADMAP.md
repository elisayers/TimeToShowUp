# Time to Show Up (TTSU) Implementation Roadmap

Status: Active for Project 003 MVP/Pilot.

## Phase 1: Foundation & Identity (Multi-User)
- Initialize Next.js project with Tailwind CSS and Supabase.
- Setup standard Supabase Google OAuth (open to any Google account).
- Implement foundational multi-user database schema: Profiles, Workspaces/Partnerships, and Memberships using PostgreSQL RLS.
- Create standard onboarding/workspace creation flow.

## Phase 2: Core Loop (Data & UI)
- Implement schema for Commitments (Tasks) and Time Entries.
- Build the Dashboard view displaying the current accountability period.
- Add ability to declare new commitments.
- Implement the persistent focus timer and manual time entry.
- Build the shared context view where partners can see each other's commitments and logged time.

## Phase 3: Internal Scheduling & In-App Meetings
- Build the internal Meeting schema (scheduled time, status, notes) without Google Calendar dependencies.
- Integrate Daily.co for embedded video calls.
- Implement the "Join Review" interface that surfaces the active Daily.co video room alongside a shared notepad and current commitment statuses.
- Support basic scheduling of the next meeting completely within the TTSU UI.

## Phase 4: History & Polish
- Build the History view to browse past periods and their outcomes.
- Finalize UI/UX polish (loading states, error handling).
- Deploy to Vercel for acceptance testing by Eli and Shawn (using standard user paths).

---

## Acceptance Criteria for the First Usable Release
1. Any user (including Eli and Shawn) can sign in securely with a standard Google account.
2. Users can create a shared accountability space and invite a partner.
3. They can declare personal commitments for the current period.
4. They can view, but not edit, each other's work.
5. They can record focused time or unplanned work against their own profiles.
6. **Critical:** They can schedule a meeting internally and join it via a Daily.co embedded video call without leaving the TTSU application or relying on external calendars.
7. During or after the meeting, they can compare what was declared with what actually happened, and save a shared note.
8. Past records remain available and immutable once a period is closed.
