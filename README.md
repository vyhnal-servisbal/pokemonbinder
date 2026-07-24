# Pokémon Binder

Editor na zberateľské bindre (SvelteKit + TypeScript). Skeleton, dáta zatiaľ mock.

## Spustenie

```bash
npm install
npm run dev
```

Otvor `http://localhost:5173`.

## Stack

- **SvelteKit** (Svelte 5, runes) + Vite + TypeScript
- **TCGdex** na dáta kariet (`src/lib/tcgdex.ts`) - zadarmo, bez API kľúča
- **Supabase** pripravené (`src/lib/supabase.ts`) - dáta, auth, storage obrázkov
- Hosting: **Cloudflare Pages** (na deploy vymeniť `adapter-auto` za `adapter-cloudflare`)

## Čo už funguje

- Holo karta s náklonom podľa myši (`Card.svelte`)
- Reaktívny stav appky (`binderStore.svelte.ts`)
- Binder s prepínačom single / double 3x3 a listovaním (`Binder.svelte`)
- Náhľad karty s prepínačom holo (`CardPreview.svelte`)
- Hľadanie a pridávanie kariet z TCGdexu (`AddPanel.svelte`)
- Drag and drop kariet medzi vreckami (presun aj swap)
- Upload vlastného obrázka + roztiahnutie cez 2 vrecká (↔ / ↕) + tlač/PDF v reálnych rozmeroch

## Roadmap

1. [x] Skeleton: 3x3, holo karta, view módy, mock dáta
2. [x] Reálne dáta z TCGdex (hľadanie kariet + pridanie do vrecka)
3. [ ] StPageFlip: realistické otáčanie strán
4. [~] Drag and drop kariet (hotové pre 1x1; drag roztiahnutých položiek ostáva)
5. [x] Upload vlastného obrázka + roztiahnutie cez vrecká + export do PDF (63x88 mm)
6. [ ] Supabase: auth + ukladanie binderov + storage obrázkov (zdieľané s GF)
7. [ ] Deploy na Cloudflare Pages

Native HTML5 drag-and-drop (nie `svelte-dnd-action`) - grid chce swap/presun do prázdneho,
nie list shift. Tlač ide cez `window.print()` + `@media print` (`PrintSheet.svelte`), bez závislostí.
