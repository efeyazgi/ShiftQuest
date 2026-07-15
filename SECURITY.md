# Security Policy

## Supported version

ShiftQuest is an early public beta. Security fixes are applied to the latest commit on the `main` branch.

## Reporting a vulnerability

Please do not open a public issue for vulnerabilities involving authentication, Row Level Security, credential exposure or cross-user data access.

Use GitHub's private vulnerability reporting feature on the repository Security tab. Include:

- the affected route or component;
- reproduction steps;
- expected and actual behavior;
- potential impact;
- a minimal proof of concept, without real user data or API keys.

Do not test against accounts or data you do not own. Never include Supabase secret/service-role keys, Gemini keys, session cookies or access tokens in a report.

## Security boundaries

- Supabase publishable keys are public identifiers; authorization is enforced with RLS.
- Supabase secret/service-role keys must never be placed in client-visible environment variables.
- User-provided AI/TTS credentials are browser-local and are excluded from cloud saves and JSON exports.
- ShiftQuest is an educational application, not operational process-safety software.
