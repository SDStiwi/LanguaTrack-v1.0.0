# Changelog

## 1.0.0 — first release

- New visual identity ("notebook + learning track": green hero with dotted route line, level stamps, dotted grid background) and a phone-first pass: six-tab bottom bar, always-reachable account/sign-out buttons, 44px tap targets, safe-area support, no iOS input zoom, swipeable filter chips.
- Top-level pages now use the URL hash (back button and deep links work); secondary pages load on demand; README rewritten with design decisions; coursebooks separated from the MIT license.

- Password change: handles Supabase's "recent sign-in" requirement (emailed code), confirms the update really happened, and reset links always open the new-password screen.

- New logo (speech bubble + rising progress line), favicon, sharing metadata and a refreshed, more polished interface (focus states, softer shadows, branded sign-in).
- Insights now shows the text of custom questions (and "(deleted custom question)" for removed ones) instead of a raw id.

- Teacher-editable question bank (Questions page, `custom_questions` table): add, pause and delete your own multiple-choice questions per book unit; they are mixed into that teacher's new tests.
- Entire database setup consolidated into one re-runnable file: `supabase/migrations/20260928000000_linguatrack_schema.sql`.
- Deployment: `vercel.json` (security headers), Vercel steps in the README.

## 0.6.0

- Password reset by email ("Forgot password?") and an Account page to change the password.
- Edit a student's name and age group; archive/restore students (new migration `20260928000100_archive_students.sql`).
- Print-ready student progress report (Print report on the profile; save as PDF from the print dialog).
- CSV export of the student list (formula-safe) with tests.

## 0.5.0 — Supabase release

- Replaced Firebase Authentication + Cloud Firestore with Supabase Auth + Postgres.
- Added `supabase/migrations/20260928000000_init.sql`: tables, indexes, Row Level Security, `question_stats` view and the transactional, idempotent `submit_assessment` RPC.
- Replaced the Firebase compatibility adapter with the native `@supabase/supabase-js` client (`src/lib/supabase.js`).
- Replaced the Firebase seeder with `scripts/seed-supabase.mjs` (idempotent, two teacher accounts).
- Removed `firebase`, `firebase-admin`, `firebase/` config and `firebase.json`.
- Preserved assessment engine, offline queue, demo mode and all 75 regression tests.

## 0.4.0 — Firebase portfolio release

- Replaced the Supabase persistence/authentication path with Firebase Authentication + Cloud Firestore.
- Added real email/password sign-in and Firebase sign-out.
- Added teacher-owned Firestore data model and Security Rules.
- Added Firestore compound indexes.
- Added server-side Firebase demo seeder for two teacher accounts and realistic sample data.
- Added adult A1+ → A2 Bridge coursebook integration.
- Preserved local demo mode when Firebase environment variables are absent.
- Preserved assessment engine, offline queue and existing regression tests.
