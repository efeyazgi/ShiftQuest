# Privacy Notice

Last updated: 15 July 2026

ShiftQuest is an open-source educational beta. This notice describes the data handled by the reference deployment.

## Data processed

- Account e-mail address and authentication records, handled by Supabase Auth.
- Player profile choices such as display name, English level, career route, voice preference and daily goal.
- Game progress such as XP, coins, answers, mission history, review schedule and Word Vault mastery.
- A local synchronization marker used to reconcile the browser cache with the cloud save.

## Browser-only data

Gemini or OpenAI-compatible API keys are stored only in the browser entry `shiftquest-runtime-providers-v1`. They are not written to Supabase, game-save JSON, repository files or analytics. Signing out clears these provider settings on that device.

## External providers

When a user enables an external AI or TTS provider, relevant lesson text is sent through a same-origin ShiftQuest API route to the selected provider. That provider's own privacy terms apply. The deterministic game fallback remains available without an AI key.

## Retention and control

Users can export or reset game progress from Settings. Deleting an Auth account removes its `game_saves` row through a cascading database relationship. Account deletion currently requires contacting the repository owner.

## Analytics

The reference project does not include advertising trackers or third-party behavioral analytics.

This document is a project transparency notice and not legal advice. Operators of forks or independent deployments are responsible for adapting it to their jurisdiction and actual data flows.
