# Kelas Ngaji Eristana V2

1. Run `sql/01-rebuild-ngaji-v2.sql` in Supabase SQL Editor.
2. In Supabase API settings add `ngaji` to Exposed schemas.
3. Replace the publishable key in `assets/js/config.js`.
4. Upload this folder contents to the root of the GitHub repository `ngaji`.
5. Enable GitHub Pages from `main` / root.
6. Keep `data/login-credentials.csv` private. Do not upload it to a public repository.

The SQL archives the previous ngaji tables to `ngaji_archive_20261109`, rebuilds only the `ngaji` schema, creates isolated `ngaji-public` and `ngaji-private` buckets, imports the supplied teacher/student workbook, and leaves existing `public.*` and `auth.users` untouched.
