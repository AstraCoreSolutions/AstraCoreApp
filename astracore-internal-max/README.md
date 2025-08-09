# AstraCore Internal - MAX Build

Tato verze obsahuje kompletní moduly:
- Finance (faktury, zálohovky, dobropisy, PDF export, platby, číselné řady)
- Zakázky (deníky, náklady, poddodavatelé, ziskovost)
- Klienti a dodavatelé
- Zaměstnanci
- Sklady (položky, pohyby, inventury)
- Flotila (vozidla, servisy)
- Dokumenty (Supabase Storage, náhledy, verzování)
- Kalendář (drag&drop, iCal export)
- Notifikace in-app
- Nastavení (DPH sazby 0/12/21, měna, prefixy)
- Role & práva (admin, manager, user)
- Audit log

Technologie: React + TypeScript + Tailwind CSS (Vite), Supabase (Postgres + Auth + RLS), Netlify functions.

Viz README_DEPLOY.md pro nasazení na GitHub/Supabase/Netlify.
