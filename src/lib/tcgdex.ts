import type { PokemonCard } from './types';

// TCGdex: free, no API key, multilingual. Swap 'en' for 'de'/'fr'/... later.
const API = 'https://api.tcgdex.net/v2/en';

interface TcgdexBrief {
	id: string;
	localId: string;
	name: string;
	image?: string;
}

interface TcgdexCard extends TcgdexBrief {
	rarity?: string;
	set?: { name: string };
}

function toCard(c: TcgdexCard | TcgdexBrief): PokemonCard {
	const full = c as TcgdexCard;
	return {
		id: c.id,
		name: c.name,
		rarity: full.rarity,
		set: full.set ? full.set.name : undefined,
		number: c.localId,
		image: c.image ? `${c.image}/high.png` : undefined
	};
}

export async function searchCards(query: string): Promise<PokemonCard[]> {
	const res = await fetch(`${API}/cards?name=${encodeURIComponent(query)}`);
	if (!res.ok) return [];
	const data: TcgdexBrief[] = await res.json();
	return data.slice(0, 60).map(toCard);
}

export async function getCard(id: string): Promise<PokemonCard | null> {
	const res = await fetch(`${API}/cards/${encodeURIComponent(id)}`);
	if (!res.ok) return null;
	return toCard(await res.json());
}
