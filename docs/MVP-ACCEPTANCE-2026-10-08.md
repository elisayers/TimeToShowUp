# Oct 8 Usable MVP Reconciliation

Action: `action-003-usable-mvp-20261008`  
Goal: `goal-003-usable-mvp-20261008`  
Gate: BUILD  
Status: Automated repair verification passed. Human acceptance is still required.

## Initial capability state

| Capability | Initial state | Evidence |
| --- | --- | --- |
| Login | Partial | Google OAuth, callback exchange, Supabase SSR cookies, and protected-route refresh middleware existed. No Eli/Shawn sign-in or shared-workspace evidence was available. Dashboard selected the first membership without an explicit workspace choice. |
| Video | Partial | Meeting scheduling created a Daily room and the meeting page embedded Daily Prebuilt. Joining was available in-app, but the sequence was not explained and no two-user camera/audio evidence existed. |
| Transcript | Failed | The Daily room was not configured for stored transcription. No start/stop lifecycle, transcript lookup, state, or transcript display existed. Daily reported zero stored transcripts. |
| Said/Did | Partial | Commitments and completion statuses existed, but Did was only a generic status. Outcomes were not explicitly preserved per user and meeting. |
| Timer | Partial | The timer inserted persistent work-session rows, but it offered every member's commitments and the server did not verify task ownership. Save failures were silently discarded by the UI. |

## Repairs made

- Login/workspace: added an explicit workspace selector when a user belongs to multiple workspaces; migrated the Next.js 16 session boundary from deprecated `middleware.ts` to `proxy.ts`; surfaced OAuth-start errors.
- Video: retained the existing embedded Daily Prebuilt implementation; added a visible join sequence; enabled Daily prejoin UI on new rooms and the existing TTFT room.
- Transcript: enabled Daily stored transcription and live captions; added server-side start/stop calls tied to meeting status; added provider transcript lookup, visible states, refresh, signed WebVTT retrieval, and readable transcript rendering.
- Said/Did: added a versioned structured envelope inside the existing meeting `notes` column. Each outcome stores meeting-row context plus user, period, and commitment IDs, the immutable Said snapshot, Did text, status, and update time. Legacy plain notes remain readable. Each user can write only their own Did.
- Timer: filtered selection to the current user's active commitments; added server-side membership, ownership, duration, and workspace checks; saved accurate start/end timestamps; retained elapsed time on a failed save so the user can retry; surfaced save status.
- History: renders structured Said/Did records separately while retaining shared notes.
- Tests: added focused tests for legacy-note compatibility, multi-user Said/Did preservation, Daily room parsing, transcript state mapping, and WebVTT conversion.

No database migration was introduced. Existing records and the current uncommitted implementation were preserved.

## Automated verification

| Check | Result |
| --- | --- |
| `npm test` | PASS, 6 tests |
| `npm run lint` | PASS, no warnings or errors |
| `npm run build` | PASS, Next.js 16.3.8 production build and TypeScript |
| Local unauthenticated route smoke | PASS: `/` redirects to `/dashboard`; protected dashboard/meeting routes redirect to `/login`; `/login` returns 200 with Google sign-in copy |
| Supabase public auth settings | PASS: endpoint returned 200; Google provider enabled; signup enabled |
| Daily API configuration | PASS: the existing TTFT room accepted and returned `enable_prejoin_ui`, `enable_live_captions_ui`, `enable_transcription_storage`, and `max_participants: 4` |
| Browser automation | BLOCKED: Chrome denied the automation session access to localhost and the Daily dashboard. No workaround was attempted. |

## Acceptance status after repair

| Criterion | Status | Remaining evidence required |
| --- | --- | --- |
| 1. Eli and Shawn login, correct shared workspace, persistent sessions | READY FOR HUMAN ACCEPTANCE | Both people must sign in, confirm the same workspace, refresh, close/reopen, and remain signed in. |
| 2. Same embedded meeting with working two-user video/audio | READY FOR HUMAN ACCEPTANCE | Eli and Shawn must join from separate devices/browsers and confirm mutual video and audio. |
| 3. Correct meeting transcript with visible state | READY FOR HUMAN ACCEPTANCE | Start transcription after joining, speak, complete the review, refresh transcript status, and confirm the saved text. This also confirms the Daily account's paid transcription entitlement. |
| 4. Said and Did distinct and associated correctly | AUTOMATED STRUCTURE VERIFIED; HUMAN FLOW PENDING | Each person must save Did for their own Said, refresh/reopen, and confirm both records remain correct. |
| 5. Task timer saved to correct user/task and survives refresh | AUTOMATED OWNERSHIP PATH VERIFIED; HUMAN FLOW PENDING | Run a real timer against each user's own task, stop it, refresh, and confirm the activity entry. |

The MVP is not marked complete and the gate is not advanced.

## Remaining non-blocking defects

- Transcript status refresh is manual; no webhook or timed polling updates the page automatically.
- Meeting notes use read-modify-write updates. Simultaneous saves in the same instant could produce a last-write-wins conflict.
- Daily rooms remain provider-level `public`; the room URL is protected by the application UI but is not backed by per-user Daily meeting tokens.
- No authenticated automated test identities are available, so Supabase mutation and refresh persistence are not exercised by CI.
- The History page still defaults to the first workspace rather than sharing the Dashboard workspace query selection.

## Next action

Eli and Shawn perform one joint acceptance session from separate browsers/devices:

1. Sign in with each Google account and confirm the same workspace and member list.
2. Create one real commitment each.
3. Start and stop a short timer on each person's own commitment, then refresh and confirm both entries.
4. Schedule one review, open Join Review on both devices, and join through the embedded Daily panel.
5. Confirm mutual audio/video. After joining, click **Start Meeting + Transcript** and speak a short identifiable sentence each.
6. Each person records Did for their own Said and saves it.
7. Click **Complete Review**, refresh transcript status until available, and confirm the transcript, Said/Did, and timer entries after refresh/reopen.
8. Record any remaining defects separately; advance the gate only when all five rows have sufficient evidence.
