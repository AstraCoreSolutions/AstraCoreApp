# AstraCoreApp

Interní webová aplikace pro společnost **AstraCore Solutions**, která slouží ke komplexní evidenci a správě zakázek, financí, klientů, zaměstnanců, skladu, nářadí, flotily a dokumentů. Projekt je napsán v **Reactu** s **TypeScriptem** a využívá **Tailwind CSS** pro styling a **Supabase** jako backendovou službu pro databázi, autentizaci a ukládání souborů.

## Funkcionality

Tato první verze je pouze kostrou aplikace – obsahuje přihlašování pomocí Supabase, základní směrování pomocí React Routeru a podstránky pro jednotlivé moduly. Každá stránka v adresáři `src/pages` je placeholderem, který popisuje očekávanou funkcionalitu konkrétního modulu.

### Moduly

- **Dashboard** – přehled aktivních zakázek, nákladů, ziskovosti a rychlé akce.
- **Finance** – evidence nákladů, příjmů a faktur vázaných na zakázky.
- **Zakázky** – seznam zakázek s detaily, stavebním deníkem a dokumentací.
- **Klienti** – správa klientů, jejich historie a značení VIP/rizikových.
- **Zaměstnanci** – interní i externí pracovníci, docházka a přidělení zdrojů.
- **Sklad** – materiál a vybavení, výdejky, příjemky a převody mezi sklady.
- **Nářadí** – inventář nářadí a zaříení včetně servisních záznamů.
- **Flotila** – vozidla a stroje se záznamy o STK, pojištění a tankování.
- **Dokumenty** – úložiště dokumentů s možností přiřazení k modulům.
- **Kalendář** – termíny zakázek, revizí a dovolených v různých režimech.
- **Nastavení** – konfigurace sazeb, kategorií, firemních údajů a exportů.

## Jak aplikaci spustit

1. Zkopírujte soubor `.env.example` do `.env` a doplňte údaje `VITE_SUPABASE_URL` a `VITE_SUPABASE_ANON_KEY` pro váš projekt v Supabase.
2. Nainstalujte závislosti:

   ```bash
   npm install
   ```
3. Spusťte vývojový server:

   ```bash
   npm run dev
   ```

   Aplikace bude dostupná na adrese [http://localhost:5173](http://localhost:5173).

## Další kroky

Tato základní struktura slouží jako výchozí bod pro vývoj plnohodnotné interní aplikace. Další práce zahrnuje:

- Implementaci autentizačních rolí (admin, stavbyvedoucí, technik, čtenář, účetní) a řízení oprávnění.
- Napojení jednotlivých modulů na databázové tabulky v Supabase (např. finance, zakázky, sklad, atd.).
- Vytvoření formulářů, tabulek a přehledů pro všechny moduly.
- Implementaci notifikací, kalendáře a nastavení.
- Responzivní design a testování na mobilních zaříeních.

Příspěvky a nápady na vylepšení jsou vítány.
