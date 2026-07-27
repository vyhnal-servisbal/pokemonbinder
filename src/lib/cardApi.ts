import type { PokemonCard } from './types';

// TCGdex: free, no API key, reliable. Name search + full set browsing.
const API = 'https://api.tcgdex.net/v2/en';

interface Brief {
	id: string;
	localId?: string;
	name: string;
	image?: string;
}
interface Full extends Brief {
	rarity?: string;
	set?: { name: string };
}

export interface CardSet {
	id: string;
	name: string;
}

// TCGdex zmenil formát obrázkov (6/2026): jediná dostupná verzia je {base}/normal/original.png
function fullImage(base?: string): string | undefined {
	return base ? `${base}/normal/original.png` : undefined;
}

// malý webp thumbnail cez weserv resizer (TCGdex už neponúka low/webp verzie)
export function thumb(url: string | undefined, w = 220): string | undefined {
	if (!url) return undefined;
	return `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}&w=${w}&output=webp&q=72`;
}

// card.image drží plné original.png; search grid ho zmenší cez thumb() pri zobrazení
function toCard(c: Brief): PokemonCard {
	return {
		id: c.id,
		name: c.name,
		number: c.localId,
		image: fullImage(c.image)
	};
}

// search by name (global) and/or set. Cards without an image are skipped
// (TCGdex lacks images for some rare promos -> avoids broken tiles).
export async function searchCards(opts: { name?: string; setId?: string }): Promise<PokemonCard[]> {
	const name = (opts.name ?? '').trim();

	if (opts.setId) {
		const res = await fetch(`${API}/sets/${encodeURIComponent(opts.setId)}`);
		if (!res.ok) return [];
		const set = await res.json();
		let cards: Brief[] = (set.cards ?? []).filter((c: Brief) => c.image);
		if (name) {
			const q = name.toLowerCase();
			cards = cards.filter((c) => c.name.toLowerCase().includes(q));
		}
		return cards.map(toCard);
	}

	if (!name) return [];
	const res = await fetch(`${API}/cards?name=${encodeURIComponent(name)}`);
	if (!res.ok) return [];
	const data: Brief[] = await res.json();
	return data.filter((c) => c.image).map(toCard);
}

// full card (rarity + set) to enrich a card on add, so the holo effect works
export async function getCard(id: string): Promise<PokemonCard | null> {
	const res = await fetch(`${API}/cards/${encodeURIComponent(id)}`);
	if (!res.ok) return null;
	const c: Full = await res.json();
	return {
		id: c.id,
		name: c.name,
		rarity: c.rarity,
		set: c.set ? c.set.name : undefined,
		number: c.localId,
		image: fullImage(c.image)
	};
}

// all sets for the filter dropdown, newest first
export async function listSets(): Promise<CardSet[]> {
	const res = await fetch(`${API}/sets`);
	if (!res.ok) return [];
	const data: { id: string; name: string }[] = await res.json();
	return data.map((s) => ({ id: s.id, name: s.name })).reverse();
}
