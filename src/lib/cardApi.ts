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

function toCard(c: Brief): PokemonCard {
	return {
		id: c.id,
		name: c.name,
		number: c.localId,
		image: c.image ? `${c.image}/high.png` : undefined
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
	return data
		.filter((c) => c.image)
		.slice(0, 150)
		.map(toCard);
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
		image: c.image ? `${c.image}/high.png` : undefined
	};
}

// all sets for the filter dropdown, newest first
export async function listSets(): Promise<CardSet[]> {
	const res = await fetch(`${API}/sets`);
	if (!res.ok) return [];
	const data: { id: string; name: string }[] = await res.json();
	return data.map((s) => ({ id: s.id, name: s.name })).reverse();
}
