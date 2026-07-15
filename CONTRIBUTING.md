# Contributing to ShiftQuest

Thanks for helping improve ShiftQuest.

## Development workflow

1. Fork the repository and create a focused feature branch.
2. Copy `.env.example` to `.env.local` and use your own Supabase project.
3. Make a small, reviewable change.
4. Run the required checks:

   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```

5. Open a pull request describing the user-facing outcome and verification performed.

## Project rules

- Never commit `.env.local`, API keys, session cookies or production user data.
- Every table exposed through the Supabase Data API must have explicit grants and RLS policies.
- Do not use user-editable `user_metadata` for authorization.
- Keep provider secrets out of the Zustand game store, Supabase saves and JSON exports.
- Preserve deterministic fallback behavior when optional AI is unavailable.
- New scenarios need stable IDs because saved progress references them.
- Keep Turkish guidance understandable and workplace English examples natural.

## Bug reports

Use the bug template and include browser, route, expected behavior and reproduction steps. Report security issues privately as described in `SECURITY.md`.
