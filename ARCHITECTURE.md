# Architecture & Stack Decisions

## 1. Multi-User Foundation & Authentication
- **Scope:** TTSU is a standard multi-user web application. It is NOT architected as a private Eli/Shawn-only app, though they will be the first acceptance testers using normal paths.
- **Authentication:** Standard Google Sign-in via Supabase Auth. Any Google account (Workspace or personal Gmail) can create a TTSU account.
- **Constraints Removed:** Signing in with Google creates **zero** dependency on Google Calendar, Google Meet, Google Workspace administration, or a specific organizer identity.
- **Data Isolation:** Standard Row-Level Security (RLS) ensures proper per-user and per-workspace/group data ownership.

## 2. Scheduling Architecture
- **Internal State First:** TTSU owns its core meeting and scheduling state internally (e.g., storing the scheduled time and status in the TTSU database).
- **No External Sync Required:** Google Calendar synchronization is explicitly NOT required for the first usable release. The internal model does not treat external calendars as the canonical source of truth.

## 3. Video Architecture (In-App Requirement)
The primary video-call experience must occur inside TTSU without forcing the user to leave the application or open a new tab.

**Alternative Comparison:**
- **Daily.co (Selected):** Excellent React/web SDK designed exactly for embedding. It handles 1-to-1 video flawlessly with a generous free tier (low initial cost). It requires no Google Workspace configuration, provides a clean path to future transcription/AI analysis, and is multi-user scalable.
- **Stream Video (Rejected):** A strong alternative with a good React SDK and AI paths, but Daily.co edges it out for sheer simplicity of the embedded iframe/prebuilt UI for an immediate usable release.
- **Google Meet (Rejected):** Actively blocks iframe embedding. Requires external tabs and relies heavily on Google Workspace/Calendar configurations, violating core requirements.
- **Zoom SDK (Rejected):** Far too heavy and operationally complex for this use case.

## 4. Technical Stack Validation
- **Framework: Next.js (App Router)**
  - *Why:* Fastest path to a reliable, usable release. Excellent React support natively pairs with Daily.co's React SDK. Strong developer tooling and Vercel AI SDK integration for future Gemini agent analysis.
  - *Rejected:* Single Page Apps (Vite/React) + separate Node backend (increases operational complexity with two deployments).
- **Database & Auth: Supabase (PostgreSQL + Auth)**
  - *Why:* PostgreSQL provides the robust relational model needed for normal multi-user architecture (users, partnerships, tasks, timers). Built-in Auth handles Google OAuth effortlessly without Workspace constraints. Low initial cost and complexity.
  - *Rejected:* Firebase (NoSQL makes relational queries for tasks/meetings harder), Clerk + PlanetScale (great, but Supabase offers DB+Auth under one roof, lowering operational overhead).
- **Styling: Tailwind CSS + shadcn/ui**
  - *Why:* Unmatched developer speed for clean, modern interfaces.
- **Hosting: Vercel**
  - *Why:* Zero-configuration Next.js deployment. Lowest operational complexity.

## 5. Core Data Concepts
1. **User (Profile):** A standard authenticated user identity.
2. **Partnership / Workspace:** A relational mapping allowing two (or more) users to share accountability contexts and meetings.
3. **Period / Round:** An internal timeblock bounded by scheduled review meetings.
4. **Commitment / Task:** What a user declares they will do.
5. **Work Session:** Actual time logged against a commitment or as unplanned work.
6. **Meeting:** An internally scheduled sync event that hosts the Daily.co video call room and shared notes.
