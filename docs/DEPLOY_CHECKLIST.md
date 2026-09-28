# Before showing this to real students
- [ ] Ran `supabase/migrations/20260928000000_linguatrack_schema.sql` — no `using (true)` policies remain
- [ ] Signed out and confirmed the app shows the login page and the API returns no rows without a session
- [ ] "Allow new users to sign up" is off in Supabase
- [ ] Only the anon key is in Vercel env vars
- [ ] Took one test as a Kid, Teen and Adult and checked the result saved (Students → profile → history)
- [ ] Turned Wi-Fi off, finished a test, turned it back on, and saw the result sync exactly once
- [ ] Finished an initial test for a Child and an Adult student and checked Results shows "Start teaching at Unit N" and that it survives a reload (history shows the placed unit)
- [ ] Rated a unit with stars on a profile, reloaded, and the rating persisted; then started a progress test
- [ ] Opened Books → interactive kids book, and a Unit link from a kids result
