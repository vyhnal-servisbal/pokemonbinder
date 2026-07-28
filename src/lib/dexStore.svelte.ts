// Unboxing minigame + Pokemon GO style dex. Everything is kept local
// (localStorage) and every sprite is the ~1.3kB one, so nothing here is heavy.

const LS_DEX = 'pb_dex';
const LS_BASE = 'pb_dexbase';

export const DEX_MAX = 1025; // up to gen 9, excluding alternate forms
export const PACK_SIZE = 5;

const SHINY_ODDS = 50;
const SHADOW_ODDS = 12;

export const GENS: { label: string; from: number; to: number }[] = [
	{ label: 'All', from: 1, to: DEX_MAX },
	{ label: 'I', from: 1, to: 151 },
	{ label: 'II', from: 152, to: 251 },
	{ label: 'III', from: 252, to: 386 },
	{ label: 'IV', from: 387, to: 493 },
	{ label: 'V', from: 494, to: 649 },
	{ label: 'VI', from: 650, to: 721 },
	{ label: 'VII', from: 722, to: 809 },
	{ label: 'VIII', from: 810, to: 905 },
	{ label: 'IX', from: 906, to: DEX_MAX }
];

export type Size = 'XXS' | 'XS' | '' | 'XL' | 'XXL';

export interface Catch {
	id: number;
	name: string;
	shiny: boolean;
	shadow: boolean;
	size: Size;
	height: number; // m
	weight: number; // kg
}

export interface Entry {
	count: number;
	shiny: boolean;
	shadow: boolean;
	sizes: Size[]; // which size tags have been seen
	best: Catch;
}

interface Base {
	height: number;
	weight: number;
}

export function spriteOf(id: number, shiny = false) {
	const dir = shiny ? 'sprites/pokemon/shiny' : 'sprites/pokemon';
	return `https://raw.githubusercontent.com/PokeAPI/sprites/master/${dir}/${id}.png`;
}

export function aniOf(name: string, shiny = false) {
	return `https://play.pokemonshowdown.com/sprites/${shiny ? 'ani-shiny' : 'ani'}/${name}.gif`;
}

export function pretty(name: string) {
	return name
		.split('-')
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join(' ');
}

// one roll drives both height and weight, the way GO derives its size tags
function rollSize(): { mult: number; size: Size } {
	// average of three uniforms -> clusters around 1, extremes stay rare
	const r = (Math.random() + Math.random() + Math.random()) / 3;
	const mult = 0.6 + r * 0.85;
	let size: Size = '';
	if (mult < 0.72) size = 'XXS';
	else if (mult < 0.86) size = 'XS';
	else if (mult > 1.3) size = 'XXL';
	else if (mult > 1.16) size = 'XL';
	return { mult, size };
}

class DexStore {
	names = $state<string[]>([]); // index 0 = id 1
	dex = $state<Record<number, Entry>>({});
	pack = $state<Catch[]>([]);
	revealed = $state(0);
	opening = $state(false);

	private base: Record<number, Base> = {};

	async init() {
		try {
			const d = JSON.parse(localStorage.getItem(LS_DEX) ?? '{}');
			if (d && typeof d === 'object') this.dex = d;
			const b = JSON.parse(localStorage.getItem(LS_BASE) ?? '{}');
			if (b && typeof b === 'object') this.base = b;
		} catch {
			/* ignore */
		}
		if (this.names.length) return;
		try {
			const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${DEX_MAX}`);
			const json = await res.json();
			this.names = (json.results ?? []).map((p: { name: string }) => p.name);
		} catch {
			/* ignore */
		}
	}

	private persist() {
		try {
			localStorage.setItem(LS_DEX, JSON.stringify(this.dex));
			localStorage.setItem(LS_BASE, JSON.stringify(this.base));
		} catch {
			/* ignore */
		}
	}

	get caughtCount() {
		return Object.keys(this.dex).length;
	}
	get shinyCount() {
		return Object.values(this.dex).filter((e) => e.shiny).length;
	}
	get shadowCount() {
		return Object.values(this.dex).filter((e) => e.shadow).length;
	}

	// base height/weight per species, fetched once then cached on disk
	private async baseOf(id: number): Promise<Base> {
		if (this.base[id]) return this.base[id];
		try {
			const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
			if (res.ok) {
				const p = await res.json();
				this.base[id] = { height: (p.height ?? 10) / 10, weight: (p.weight ?? 100) / 10 };
			}
		} catch {
			/* ignore */
		}
		return this.base[id] ?? { height: 1, weight: 10 };
	}

	async openPack() {
		if (this.opening || !this.names.length) return;
		this.opening = true;
		this.pack = [];
		this.revealed = 0;

		const ids = Array.from(
			{ length: PACK_SIZE },
			() => 1 + Math.floor(Math.random() * Math.min(DEX_MAX, this.names.length))
		);
		const bases = await Promise.all(ids.map((id) => this.baseOf(id)));

		this.pack = ids.map((id, k) => {
			const { mult, size } = rollSize();
			return {
				id,
				name: this.names[id - 1],
				shiny: Math.floor(Math.random() * SHINY_ODDS) === 0,
				shadow: Math.floor(Math.random() * SHADOW_ODDS) === 0,
				size,
				height: +(bases[k].height * mult).toFixed(2),
				weight: +(bases[k].weight * mult * mult).toFixed(1)
			};
		});

		for (const c of this.pack) this.record(c);
		this.persist();
		this.opening = false;
	}

	private record(c: Catch) {
		const cur = this.dex[c.id];
		if (!cur) {
			this.dex[c.id] = {
				count: 1,
				shiny: c.shiny,
				shadow: c.shadow,
				sizes: c.size ? [c.size] : [],
				best: c
			};
			return;
		}
		cur.count++;
		if (c.shiny) cur.shiny = true;
		if (c.shadow) cur.shadow = true;
		if (c.size && !cur.sizes.includes(c.size)) cur.sizes.push(c.size);
		// showcase the most interesting catch: shiny beats shadow beats heavier
		const better =
			(c.shiny && !cur.best.shiny) ||
			(c.shiny === cur.best.shiny && c.shadow && !cur.best.shadow) ||
			(c.shiny === cur.best.shiny && c.shadow === cur.best.shadow && c.weight > cur.best.weight);
		if (better) cur.best = c;
	}

	revealNext() {
		if (this.revealed < this.pack.length) this.revealed++;
	}
	revealAll() {
		this.revealed = this.pack.length;
	}
	clearPack() {
		this.pack = [];
		this.revealed = 0;
	}

	reset() {
		this.dex = {};
		this.pack = [];
		this.revealed = 0;
		this.persist();
	}
}

export const dex = new DexStore();
