# Time to Show Up (TTSU)

Status: Active Development. Ground-up build for Project 003.

## Purpose

Help people turn what they say they will do into visible follow-through. TTSU should make it easy to name a commitment, break it into workable steps, make time for the work, record what actually happened, and review the difference together.

## Core loop

Declare → Break Down → Schedule Work → Do and Track Work → Complete or Reconsider → Review Together → Declare Again.

## Audience & User Model

TTSU is a standard multi-user web application. 
- **Open Sign-in:** Any user with a Google account can sign in and create a TTSU account.
- **No Allowlist:** There is no hardcoded Eli/Shawn allowlist. Eli and Shawn are simply the first acceptance testers utilizing the standard user flows.
- **No Workspace Constraints:** There is no dependency on Google Workspace, no requirement to use a Workspace account instead of a personal Gmail, and no special organizer/admin identity inherited from legacy implementations.
- **Proper Isolation:** Proper per-user data ownership, normal user profiles, and relationship capabilities (invitations, shared meetings, accountability partners) exist from the start.

## Product areas

### Today
- Show the current accountability period and the next review point.
- Show personal commitments, optional subtasks, planned work, and actual work.
- Let a person record focused time, completion, and useful unplanned work.
- Make the distinction between declared work and actual work obvious.

### Meetings & Scheduling
- **Internal Scheduling:** TTSU owns its core meeting and accountability scheduling state internally. It does not assume Google Calendar is the canonical source of state. External sync may be added later.
- **In-App Video:** Host the live video meeting inside the TTSU application. Joining a meeting must not send members to a separate video site or require them to open an external tab.
- Provide a place for shared notes and a post-meeting review.

### History
- Show accountability periods in order, with commitments, work performed, time, and outcomes.
- Preserve what was originally declared even when plans change.
- Connect a review period to its relevant meetings and notes.

## Workflow Scenarios

1. **Begin a round**: After a review, each person names what they intend to accomplish before the next check-in.
2. **Work and adjust**: The person can start and stop focused work, mark subtasks complete, and record unplanned work without rewriting the original declaration.
3. **See one another's progress**: Accountability partners can view a shared context while remaining responsible for their own commitments.
4. **Meet and review**: Members join the video call inside TTSU. Afterward, members review notes, compare commitments with actual work, identify blockers, and set the next round.
5. **Look back**: History lets each person inspect a past accountability period.
