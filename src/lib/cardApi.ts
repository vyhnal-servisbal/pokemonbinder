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

// setId -> set name, filled once from /sets. The list is needed for the filter
// dropdown anyway, so tagging every search result with its set costs no request.
let setNames: Record<string, string> = {};
let setsCache: CardSet[] | null = null;
let setsPromise: Promise<CardSet[]> | null = null;

// all sets for the filter dropdown, newest first
export async function listSets(): Promise<CardSet[]> {
	if (setsCache) return setsCache;
	if (!setsPromise) {
		setsPromise = (async () => {
			const res = await fetch(`${API}/sets`);
			if (!res.ok) return [];
			const data: { id: string; name: string }[] = await res.json();
			const list = data.map((s) => ({ id: s.id, name: s.name })).reverse();
			setNames = {};
			for (const s of list) setNames[s.id] = s.name;
			setsCache = list;
			return list;
		})();
	}
	return setsPromise;
}

// series id -> era logo url. One small request, prefetched with the set list.
let seriesLogos: Record<string, string> = {};
let seriesPromise: Promise<void> | null = null;

export function listSeries(): Promise<void> {
	if (!seriesPromise) {
		seriesPromise = (async () => {
			const res = await fetch(`${API}/series`);
			if (!res.ok) return;
			const data: { id: string; logo?: string }[] = await res.json();
			const map: Record<string, string> = {};
			for (const s of data) if (s.logo) map[s.id] = `${s.logo}.png`;
			seriesLogos = map;
		})();
	}
	return seriesPromise;
}

// both logos are plain CDN paths, so they resolve without any further request.
// Not every set/era has one (61 sets, 3 eras lack it) -> callers hide on error.
export function eraLogo(series?: string): string | undefined {
	return series ? seriesLogos[series] : undefined;
}

export function setLogo(series?: string, setId?: string): string | undefined {
	if (!series || !setId) return undefined;
	return `https://assets.tcgdex.net/en/${series}/${setId}/logo.png`;
}

// image url looks like https://assets.tcgdex.net/en/<series>/<setId>/<localId>
function parts(c: Brief): { setId: string; series: string } {
	if (c.image) {
		const seg = c.image.split('/');
		return { setId: seg[seg.length - 2] ?? '', series: seg[seg.length - 3] ?? '' };
	}
	const dash = c.id.lastIndexOf('-');
	return { setId: dash > 0 ? c.id.slice(0, dash) : c.id, series: '' };
}

// search results use a small low-res thumbnail (fast); full res is fetched on add via getCard
function toCard(c: Brief): PokemonCard {
	const { setId, series } = parts(c);
	return {
		id: c.id,
		name: c.name,
		number: c.localId,
		set: setNames[setId],
		setId,
		series,
		image: c.image ? `${c.image}/low.webp` : undefined
	};
}

async function cardsOfSet(setId: string): Promise<Brief[]> {
	const res = await fetch(`${API}/sets/${encodeURIComponent(setId)}`);
	if (!res.ok) return [];
	const set = await res.json();
	return (set.cards ?? []).filter((c: Brief) => c.image);
}

// search by name (global) and/or set. Cards without an image are skipped
// (TCGdex lacks images for some rare promos -> avoids broken tiles).
export async function searchCards(opts: { name?: string; setId?: string }): Promise<PokemonCard[]> {
	const name = (opts.name ?? '').trim();
	await listSets(); // so results can be tagged with their set name

	if (opts.setId) {
		let cards = await cardsOfSet(opts.setId);
		if (name) {
			const q = name.toLowerCase();
			cards = cards.filter((c) => c.name.toLowerCase().includes(q));
		}
		return cards.map(toCard);
	}

	if (!name) return [];
	const q = name.toLowerCase();

	const res = await fetch(`${API}/cards?name=${encodeURIComponent(name)}`);
	const byName: Brief[] = res.ok ? await res.json() : [];

	// typing a set name ("jungle", "base set") also pulls that set in
	const matchedSets =
		q.length >= 3
			? (setsCache ?? []).filter((s) => s.name.toLowerCase().includes(q)).slice(0, 2)
			: [];
	const bySet = (await Promise.all(matchedSets.map((s) => cardsOfSet(s.id)))).flat();

	const seen = new Set<string>();
	const out: PokemonCard[] = [];
	for (const c of [...byName, ...bySet]) {
		if (!c.image || seen.has(c.id)) continue;
		seen.add(c.id);
		out.push(toCard(c));
	}
	return out;
}

// full card (rarity + set) to enrich a card on add, so the holo effect works
export async function getCard(id: string): Promise<PokemonCard | null> {
	const res = await fetch(`${API}/cards/${encodeURIComponent(id)}`);
	if (!res.ok) return null;
	const c: Full = await res.json();
	const { setId, series } = parts(c);
	return {
		id: c.id,
		name: c.name,
		rarity: c.rarity,
		set: c.set ? c.set.name : undefined,
		setId,
		series,
		number: c.localId,
		image: c.image ? `${c.image}/high.png` : undefined
	};
}
