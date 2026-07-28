// Unboxing minigame + Pokemon GO style dex. Everything is kept local
// (localStorage) and every sprite is the ~1.3kB one, so nothing here is heavy.

const LS_DEX = 'pb_dex';
const LS_BASE = 'pb_dexbase';

export const DEX_MAX = 1025; // up to gen 9, excluding alternate forms
export const PACK_SIZE = 5;

const SHINY_ODDS = 50;
const SHADOW_ODDS = 12;

export const GENS: { label: string; name: string; from: number; to: number }[] = [
	{ label: 'I', name: 'Kanto', from: 1, to: 151 },
	{ label: 'II', name: 'Johto', from: 152, to: 251 },
	{ label: 'III', name: 'Hoenn', from: 252, to: 386 },
	{ label: 'IV', name: 'Sinnoh', from: 387, to: 493 },
	{ label: 'V', name: 'Unova', from: 494, to: 649 },
	{ label: 'VI', name: 'Kalos', from: 650, to: 721 },
	{ label: 'VII', name: 'Alola', from: 722, to: 809 },
	{ label: 'VIII', name: 'Galar', from: 810, to: 905 },
	{ label: 'IX', name: 'Paldea', from: 906, to: DEX_MAX }
];

export type Size = 'XXS' | 'XS' | 'M' | 'XL' | 'XXL';
export type Form = 'normal' | 'shiny' | 'shadow' | 'shinyShadow';

// every collectible state of one species, so a dex entry can be "completed"
export const SIZES: Size[] = ['XXS', 'XS', 'M', 'XL', 'XXL'];
export const FORMS: { id: Form; label: string }[] = [
	{ id: 'normal', label: 'Normal' },
	{ id: 'shiny', label: 'Shiny' },
	{ id: 'shadow', label: 'Shadow' },
	{ id: 'shinyShadow', label: 'Shiny Shadow' }
];

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
	forms: Form[];
	sizes: Size[];
	best: Catch;
}

export interface Base {
	height: number;
	weight: number;
	types: string[];
	stats: { name: string; value: number }[];
}

const STAT_LABEL: Record<string, string> = {
	hp: 'HP',
	attack: 'Attack',
	defense: 'Defense',
	'special-attack': 'Sp. Atk',
	'special-defense': 'Sp. Def',
	speed: 'Speed'
};

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

export function formOf(c: { shiny: boolean; shadow: boolean }): Form {
	if (c.shiny && c.shadow) return 'shinyShadow';
	if (c.shiny) return 'shiny';
	if (c.shadow) return 'shadow';
	return 'normal';
}

// rarity drives the colour of the reveal
export function rarityOf(c: Catch): { tier: string; label: string; color: string } {
	const f = formOf(c);
	if (f === 'shinyShadow') return { tier: 'shinyShadow', label: 'SHINY SHADOW', color: '#ff8ae0' };
	if (f === 'shiny') return { tier: 'shiny', label: 'SHINY', color: '#f0c85a' };
	if (f === 'shadow') return { tier: 'shadow', label: 'SHADOW', color: '#b47ae0' };
	if (c.size === 'XXL' || c.size === 'XXS') return { tier: 'size', label: c.size, color: '#79e2d5' };
	return { tier: 'common', label: '', color: '#8b93a3' };
}

// one roll drives both height and weight, the way GO derives its size tags
function rollSize(): { mult: number; size: Size } {
	// average of three uniforms -> clusters around 1, extremes stay rare
	const r = (Math.random() + Math.random() + Math.random()) / 3;
	const mult = 0.6 + r * 0.85;
	let size: Size = 'M';
	if (mult < 0.72) size = 'XXS';
	else if (mult < 0.86) size = 'XS';
	else if (mult > 1.3) size = 'XXL';
	else if (mult > 1.16) size = 'XL';
	return { mult, size };
}

class DexStore {
	names = $state<string[]>([]); // index 0 = id 1
	dex = $state<Record<number, Entry>>({});
	base = $state<Record<number, Base>>({});
	pack = $state<Catch[]>([]);
	opened = $state<number[]>([]); // indexes of the pack already flipped
	opening = $state(false);

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
		return Object.values(this.dex).filter((e) => e.forms.some((f) => f.startsWith('shiny'))).length;
	}
	get shadowCount() {
		return Object.values(this.dex).filter((e) => e.forms.includes('shadow')).length;
	}

	// a species is "complete" once every form and size has been seen
	isComplete(id: number) {
		const e = this.dex[id];
		return !!e && e.forms.length === FORMS.length && e.sizes.length === SIZES.length;
	}

	statLabel(k: string) {
		return STAT_LABEL[k] ?? k;
	}

	// types/stats/size come from one endpoint, cached on disk so a species
	// is fetched at most once ever
	async loadBase(id: number): Promise<Base> {
		if (this.base[id]) return this.base[id];
		let b: Base = { height: 1, weight: 10, types: [], stats: [] };
		try {
			const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
			if (res.ok) {
				const p = await res.json();
				b = {
					height: (p.height ?? 10) / 10,
					weight: (p.weight ?? 100) / 10,
					types: (p.types ?? []).map((t: { type: { name: string } }) => t.type.name),
					stats: (p.stats ?? []).map((s: { stat: { name: string }; base_stat: number }) => ({
						name: s.stat.name,
						value: s.base_stat
					}))
				};
			}
		} catch {
			/* ignore */
		}
		this.base[id] = b;
		this.persist();
		return b;
	}

	async openPack() {
		if (this.opening || !this.names.length) return;
		this.opening = true;
		this.pack = [];
		this.opened = [];

		const ids = Array.from(
			{ length: PACK_SIZE },
			() => 1 + Math.floor(Math.random() * Math.min(DEX_MAX, this.names.length))
		);
		const bases = await Promise.all(ids.map((id) => this.loadBase(id)));

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
		this.opening = false;
	}

	// recorded on flip, so the dex only counts what you actually looked at
	flip(i: number) {
		if (this.opened.includes(i)) return;
		this.opened = [...this.opened, i];
		const c = this.pack[i];
		if (c) this.record(c);
		this.persist();
	}

	get allFlipped() {
		return this.pack.length > 0 && this.opened.length === this.pack.length;
	}

	// was this the first ever catch of the species?
	wasNew(i: number) {
		const c = this.pack[i];
		return !!c && this.dex[c.id]?.count === 1;
	}

	private record(c: Catch) {
		const form = formOf(c);
		const cur = this.dex[c.id];
		if (!cur) {
			this.dex[c.id] = { count: 1, forms: [form], sizes: [c.size], best: c };
			return;
		}
		cur.count++;
		if (!cur.forms.includes(form)) cur.forms.push(form);
		if (!cur.sizes.includes(c.size)) cur.sizes.push(c.size);
		// showcase the most interesting catch: shiny beats shadow beats heavier
		const better =
			(c.shiny && !cur.best.shiny) ||
			(c.shiny === cur.best.shiny && c.shadow && !cur.best.shadow) ||
			(c.shiny === cur.best.shiny && c.shadow === cur.best.shadow && c.weight > cur.best.weight);
		if (better) cur.best = c;
	}

	clearPack() {
		this.pack = [];
		this.opened = [];
	}

	reset() {
		this.dex = {};
		this.clearPack();
		this.persist();
	}
}

export const dex = new DexStore();
