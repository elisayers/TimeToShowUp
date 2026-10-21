# ShowUp Reference Summary

Status: Historical Reference Only.

ShowUp was a previous attempt at a persistent peer-accountability system. It serves as reference material for product lessons, but its architecture and technical implementation are strictly NOT carried over to TTFT.

## Key Product Lessons & Failures
1. **Integration Overreach:** ShowUp attempted to tightly integrate with Google Workspace, Calendar, Meet, Docs, Drive, and AI transcription services from the start. This created a heavy, brittle architecture.
2. **Fake UI vs Real Data:** Much of the user interface was hardcoded with demo data rather than being driven by the underlying database schema.
3. **Workspace Isolation:** The UI never fully adopted the multi-workspace model, leaving the app trapped as a two-person hardcoded tool.
4. **Meeting Experience:** Relying on external Google Meet links failed to provide a seamless, in-app reconciliation experience.
5. **Account Friction:** Requiring a specific Google Workspace account introduced unnecessary signup and permission friction.

## Strict Boundaries for TTFT
TTFT inherits **nothing** technical from ShowUp. Specifically prohibited:
- Inheriting ShowUp's architecture, code, or database design.
- Inheriting the Google Workspace configuration or Gmail account rules.
- Inheriting Google Calendar or Google Meet implementations.
- Inheriting two-user assumptions or hardcoded UI states.
- Inheriting legacy agent instructions (AGENTS.md, TEMPEST.md).
