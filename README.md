# Portal Kelas Ngaji @ Surau Eristana

## Deploy ke GitHub Pages
1. Muat naik semua fail dan folder ini ke repository `suraueristana.github.io` dalam folder `ngaji`.
2. Pastikan struktur: `/ngaji/index.html`, `/ngaji/styles.css`, `/ngaji/app.js`, `/ngaji/config.js`, `/ngaji/assets/logo.png`.
3. Jalankan `supabase-schema.sql` dalam Supabase SQL Editor.
4. Selepas backend sebenar disambungkan, ubah `DEMO_MODE` kepada `false` dan gantikan fungsi demo dalam `app.js` dengan panggilan Supabase.

## Akaun demo
- Pelajar: `101010101010`
- Asatizah: `01234567890` / `123456`
- Pentadbir: `ngaji_admin` / `123456`

## Keselamatan
Jangan simpan kata laluan sebenar dalam JavaScript. Akaun demo hanya untuk prototaip. Untuk produksi, gunakan Supabase Auth dan RLS.
