# Recorded Decisions

Status: Locked architectural and product boundary decisions for Time to Show Up (TTSU).

## 1. Multi-User Foundation
TTSU is a normal multi-user web application. There is no Eli/Shawn allowlist, and they will use standard user paths. The architecture will not assume a two-user limit and will support standard relationship concepts (invitations, shared spaces).

## 2. Authentication Boundary
Google sign-in is the initial authentication method. This allows any standard Google account (Workspace or personal Gmail) to sign up. 
**Decision:** Signing in with Google creates zero dependency on Google Calendar, Google Meet, or Google Workspace administration. 

## 3. Internal Scheduling
TTSU owns its meeting and scheduling state internally. 
**Decision:** Google Calendar synchronization is explicitly excluded from the first usable release. The internal database is the canonical source of truth for when a review meeting occurs.

## 4. In-App Video Selection
Users must not leave the TTSU application for the primary accountability call.
**Decision:** Daily.co is selected as the video provider because it allows flawless embedded video within the app, operates independent of Google Workspace, and provides a scalable path to future transcription/AI features. Google Meet is rejected due to its iframe blocking.

## 5. Legacy Prototype Decoupling
The earlier ShowUp prototype is reference material only. 
**Decision:** TTSU is a ground-up build and inherits NONE of the legacy prototype's architecture, source code, database design, Google Workspace constraints, hardcoded UX assumptions, or calendar/meet dependencies. 

## 6. Next.js Version
**Decision:** Next.js 16 (with React 19) is explicitly selected for this new application rather than Next.js 14. It offers current stable support, standard integration with Vercel and Shadcn, and robust support for React 19 Server Components and actions which pair seamlessly with Supabase SSR for data fetching and mutations.

## 7. Official Product Name
**Decision:** The product is officially named **Time to Show Up (TTSU)**, matching the canonical domain `timetoshowup.com` and Daily.co workspace `timetoshowup.daily.co`.
