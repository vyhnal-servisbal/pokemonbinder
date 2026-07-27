import type { PokemonCard } from './types';
import { env } from '$env/dynamic/public';

// pokemontcg.io: proper query API (name + set filtering), returns full card data.
const API = 'https://api.pokemontcg.io/v2';
const KEY = env.PUBLIC_POKEMONTCG_KEY;
const headers: Record<string, string> | undefined = KEY ? { 'X-Api-Key': KEY } : undefined;

interface ApiCard {
	id: string;
	name: string;
	number?: string;
	rarity?: string;
	set?: { id: string; name: string };
	images?: { small?: string; large?: string };
}

export interface CardSet {
	id: string;
	name: string;
	series?: string;
}

function toCard(c: ApiCard): PokemonCard {
	return {
		id: c.id,
		name: c.name,
		rarity: c.rarity,
		set: c.set ? c.set.name : undefined,
		number: c.number,
		image: (c.images && (c.images.large || c.images.small)) || undefined
	};
}

// search cards by name and/or set
export async function searchCards(opts: { name?: string; setId?: string }): Promise<PokemonCard[]> {
	const terms: string[] = [];
	const name = (opts.name ?? '').replace(/["\\:]/g, '').trim();
	if (name) terms.push(`name:*${name.split(/\s+/).join('*')}*`);
	if (opts.setId) terms.push(`set.id:${opts.setId}`);
	if (!terms.length) return [];

	const pageSize = opts.setId ? 250 : 80;
	const url = `${API}/cards?q=${encodeURIComponent(terms.join(' '))}&pageSize=${pageSize}`;
	const res = await fetch(url, { headers });
	if (!res.ok) return [];
	const json = await res.json();
	return ((json.data as ApiCard[]) ?? []).map(toCard);
}

// all sets, newest first (for the set filter dropdown)
export async function listSets(): Promise<CardSet[]> {
	const res = await fetch(`${API}/sets?orderBy=-releaseDate&pageSize=250`, { headers });
	if (!res.ok) return [];
	const json = await res.json();
	return ((json.data as CardSet[]) ?? []).map((s) => ({ id: s.id, name: s.name, series: s.series }));
}
