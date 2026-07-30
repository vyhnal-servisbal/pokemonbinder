// Unboxing minigame + Pokemon GO style dex. Everything is kept local
// (localStorage) and every sprite is the ~1.3kB one, so nothing here is heavy.

const LS_DEX = 'pb_dex';
const LS_BASE = 'pb_dexbase';
const LS_META = 'pb_dexmeta';

export const DEX_MAX = 1025; // national dex; ids above 10000 are alternate forms
// PokeAPI is at 1351 entries; keep real headroom so new forms never drop off
export const API_MAX = 2500;
export const PACK_SIZE = 5;

const SHINY_ODDS = 50;
const SHADOW_ODDS = 12;
const ALT_FORM_CHANCE = 0.18; // when a species has alternate forms

// baked in (71 + 23 ids) so class lookups cost nothing at runtime
const LEGENDARY = new Set([
	144, 145, 146, 150, 243, 244, 245, 249, 250, 377, 378, 379, 380, 381, 382, 383, 384, 480, 481,
	482, 483, 484, 485, 486, 487, 488, 638, 639, 640, 641, 642, 643, 644, 645, 646, 716, 717, 718,
	772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 800, 888, 889, 890, 891, 892, 894, 895, 896,
	897, 898, 905, 1001, 1002, 1003, 1004, 1007, 1008, 1014, 1015, 1016, 1017, 1024
]);
const MYTHICAL = new Set([
	151, 251, 385, 386, 489, 490, 491, 492, 493, 494, 647, 648, 649, 719, 720, 721, 801, 802, 807,
	808, 809, 893, 1025
]);

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

export const SIZES: Size[] = ['XXS', 'XS', 'M', 'XL', 'XXL'];
export const FORMS: { id: Form; label: string }[] = [
	{ id: 'normal', label: 'Normal' },
	{ id: 'shiny', label: 'Shiny' },
	{ id: 'shadow', label: 'Shadow' },
	{ id: 'shinyShadow', label: 'Shiny Shadow' }
];

// How an alternate form is classed + coloured. Order matters, first hit wins.
// Matched as a whole segment, not just a prefix, so urshifu-rapid-strike-gmax
// and tatsugiri-droopy-mega land in the right bucket too.
const seg = (w: string) => new RegExp(`(^|-)(${w})(-|$)`);
const FORM_KINDS: { test: RegExp; kind: string; label: string; color: string }[] = [
	{ test: seg('mega'), kind: 'mega', label: 'Mega', color: '#ff6b6b' },
	{ test: seg('gmax|eternamax'), kind: 'gmax', label: 'Gigantamax', color: '#ff7ad9' },
	{ test: seg('primal'), kind: 'primal', label: 'Primal', color: '#ff9f43' },
	{ test: seg('alola'), kind: 'alola', label: 'Alolan', color: '#4fd1c5' },
	{ test: seg('galar'), kind: 'galar', label: 'Galarian', color: '#8ab4f8' },
	{ test: seg('hisui'), kind: 'hisui', label: 'Hisuian', color: '#c39b6b' },
	{ test: seg('paldea'), kind: 'paldea', label: 'Paldean', color: '#a3d977' },
	{ test: seg('totem'), kind: 'totem', label: 'Totem', color: '#e0a458' },
	{ test: seg('terastal|stellar'), kind: 'terastal', label: 'Terastal', color: '#8fe3ff' },
	{ test: seg('origin'), kind: 'origin', label: 'Origin', color: '#b98cff' },
	{ test: seg('therian'), kind: 'therian', label: 'Therian', color: '#87c5a4' },
	{ test: seg('crowned'), kind: 'crowned', label: 'Crowned', color: '#ffcf5c' }
];

export interface AltForm {
	key: string; // 'mega-x', 'alola', ...
	spriteId: number;
	name: string; // full api name, used for the animated sprite
}

export interface Catch {
	id: number; // species dex id
	spriteId: number; // id used for the still sprite (form id when it is a form)
	name: string;
	form: string; // '' = base species
	shiny: boolean;
	shadow: boolean;
	size: Size;
	height: number;
	weight: number;
}

export interface Entry {
	count: number;
	forms: Form[];
	sizes: Size[];
	alts: string[]; // alternate form keys caught
	best: Catch;
}

export interface Base {
	height: number;
	weight: number;
	types: string[];
	stats: { name: string; value: number }[];
}

// the long standing type palette, so typing reads at a glance
const TYPE_COLOR: Record<string, string> = {
	normal: '#a8a77a',
	fire: '#ee8130',
	water: '#6390f0',
	electric: '#f7d02c',
	grass: '#7ac74c',
	ice: '#96d9d6',
	fighting: '#c22e28',
	poison: '#a33ea1',
	ground: '#e2bf65',
	flying: '#a98ff3',
	psychic: '#f95587',
	bug: '#a6b91a',
	rock: '#b6a136',
	ghost: '#735797',
	dragon: '#6f35fc',
	dark: '#705746',
	steel: '#b7b7ce',
	fairy: '#d685ad'
};

export function typeColor(t: string) {
	return TYPE_COLOR[t] ?? '#9aa3ad';
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

export function isLegendary(id: number) {
	return LEGENDARY.has(id);
}
export function isMythical(id: number) {
	return MYTHICAL.has(id);
}

export function formKind(key: string) {
	if (!key) return null;
	for (const f of FORM_KINDS) if (f.test.test(key)) return f;
	return { kind: 'variant', label: pretty(key), color: '#9aa3ad' };
}

export function formOf(c: { shiny: boolean; shadow: boolean }): Form {
	if (c.shiny && c.shadow) return 'shinyShadow';
	if (c.shiny) return 'shiny';
	if (c.shadow) return 'shadow';
	return 'normal';
}

// glow/border colour comes only from the finish, so it never fights the badges
export function finishOf(c: { shiny: boolean; shadow: boolean }) {
	const f = formOf(c);
	if (f === 'shinyShadow') return { tier: 'shinyShadow', label: 'SHINY SHADOW', color: '#ff8ae0' };
	if (f === 'shiny') return { tier: 'shiny', label: 'SHINY', color: '#f0c85a' };
	if (f === 'shadow') return { tier: 'shadow', label: 'SHADOW', color: '#b47ae0' };
	return { tier: 'common', label: '', color: '#8b93a3' };
}

// Species class + form folded into one tier. This drives the INNER glow only,
// so it never competes with the finish, which owns the border and outer glow.
const KIND_RANK: Record<string, number> = {
	gmax: 4,
	mega: 4,
	primal: 4,
	crowned: 3,
	origin: 3,
	terastal: 3,
	therian: 3,
	totem: 2,
	alola: 2,
	galar: 2,
	hisui: 2,
	paldea: 2,
	variant: 1
};

export function rarityGlow(c: { id: number; form: string }): { color: string; rank: number } | null {
	let best: { color: string; rank: number } | null = null;
	const take = (color: string, rank: number) => {
		if (!best || rank > best.rank) best = { color, rank };
	};
	if (MYTHICAL.has(c.id)) take('#ff9ec7', 6);
	if (LEGENDARY.has(c.id)) take('#ffd166', 5);
	const k = c.form ? formKind(c.form) : null;
	if (k) take(k.color, KIND_RANK[k.kind] ?? 1);
	return best;
}

// Pity thresholds, sized off a 200k pack simulation of the real odds:
// shiny lands every ~10 packs, mega ~15, gmax ~40, shiny shadow ~122.
// Each threshold is roughly 2.5x the average wait, so it only ever rescues
// a genuinely unlucky streak.
export const PITY_AT: Record<string, number> = {
	shiny: 25,
	mega: 35,
	gmax: 90,
	shinyShadow: 200
};
export const PITY_KINDS = ['shiny', 'mega', 'gmax', 'shinyShadow'] as const;
export type PityKind = (typeof PITY_KINDS)[number];

// what a duplicate is worth, and what the shop charges
export const SHOP: Record<string, { cost: number; label: string; desc: string; color: string }> = {
	shiny: {
		cost: 150,
		label: 'Shiny pack',
		desc: 'Guarantees a shiny you do not have yet',
		color: '#f0c85a'
	},
	mega: {
		cost: 120,
		label: 'Mega pack',
		desc: 'Guarantees a Mega form you are missing',
		color: '#ff6b6b'
	},
	gmax: {
		cost: 200,
		label: 'Gigantamax pack',
		desc: 'Guarantees a Gigantamax you are missing',
		color: '#ff7ad9'
	},
	shinyShadow: {
		cost: 400,
		label: 'Shiny Shadow pack',
		desc: 'Guarantees a shiny shadow you do not have yet',
		color: '#ff8ae0'
	}
};

const SCORE_KIND: Record<string, number> = {
	gmax: 30,
	mega: 25,
	primal: 30,
	terastal: 20,
	crowned: 15,
	origin: 15,
	therian: 12,
	totem: 10,
	alola: 8,
	galar: 8,
	hisui: 8,
	paldea: 8,
	variant: 5
};

// single number for a catch, used by the pack battle and for duplicate dust
export function rarityScore(c: Catch): number {
	let s = 1;
	if (c.shiny) s += 50;
	if (c.shadow) s += 10;
	if (c.shiny && c.shadow) s += 60;
	if (MYTHICAL.has(c.id)) s += 50;
	else if (LEGENDARY.has(c.id)) s += 30;
	const k = c.form ? formKind(c.form) : null;
	if (k) s += SCORE_KIND[k.kind] ?? 5;
	if (c.size === 'XXL' || c.size === 'XXS') s += 6;
	else if (c.size === 'XL' || c.size === 'XS') s += 2;
	return s;
}

// one roll drives both height and weight, the way GO derives its size tags
function rollSize(): { mult: number; size: Size } {
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
	names = $state<string[]>([]); // index 0 = species id 1
	alts = $state<Record<number, AltForm[]>>({}); // species id -> alternate forms
	dex = $state<Record<number, Entry>>({});
	base = $state<Record<number, Base>>({});
	pack = $state<Catch[]>([]);
	opened = $state<number[]>([]);
	opening = $state(false);
	specials = $state<number[]>([]); // pack indexes that pulled a shiny shadow
	pity = $state<Record<string, number>>({ shiny: 0, mega: 0, gmax: 0, shinyShadow: 0 });
	dust = $state(0); // earned from duplicates, spent in the shop

	// older saves had { shiny, shadow } booleans and '' for the normal size
	private migrate(raw: Record<string, unknown>): Record<number, Entry> {
		const out: Record<number, Entry> = {};
		for (const [k, v] of Object.entries(raw ?? {})) {
			const e = v as Partial<Entry> & { shiny?: boolean; shadow?: boolean };
			if (!e || typeof e !== 'object' || !e.best) continue;
			let forms = Array.isArray(e.forms) ? e.forms.slice() : [];
			if (!forms.length) {
				forms = ['normal'];
				if (e.shiny && e.shadow) forms.push('shinyShadow');
				if (e.shiny) forms.push('shiny');
				if (e.shadow) forms.push('shadow');
			}
			const sizes = (Array.isArray(e.sizes) ? e.sizes : []).map((s) =>
				(s as string) === '' ? 'M' : s
			) as Size[];
			out[Number(k)] = {
				count: e.count ?? 1,
				forms: [...new Set(forms)] as Form[],
				sizes: [...new Set(sizes.length ? sizes : (['M'] as Size[]))],
				alts: Array.isArray(e.alts) ? e.alts : [],
				best: e.best as Catch
			};
		}
		return out;
	}

	async init() {
		try {
			const d = JSON.parse(localStorage.getItem(LS_DEX) ?? '{}');
			if (d && typeof d === 'object') this.dex = this.migrate(d);
			const b = JSON.parse(localStorage.getItem(LS_BASE) ?? '{}');
			if (b && typeof b === 'object') this.base = b;
			const m = JSON.parse(localStorage.getItem(LS_META) ?? '{}');
			if (typeof m?.dust === 'number') this.dust = m.dust;
			if (m?.pity && typeof m.pity === 'object') this.pity = { ...this.pity, ...m.pity };
		} catch {
			/* ignore */
		}
		if (this.names.length) return;
		try {
			// one request covers both the 1025 species and all 326 alternate forms
			const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${API_MAX}`);
			const json = await res.json();
			const rows: { name: string; url: string }[] = json.results ?? [];

			const names: string[] = [];
			const byName: Record<string, number> = {};
			const rest: { id: number; name: string }[] = [];
			for (const r of rows) {
				const id = Number(r.url.replace(/\/$/, '').split('/').pop());
				if (id <= DEX_MAX) {
					names[id - 1] = r.name;
					byName[r.name] = id;
				} else rest.push({ id, name: r.name });
			}

			// species like deoxys are listed as 'deoxys-normal', so allow the bare
			// head as an alias when it is unambiguous
			const heads: Record<string, Set<number>> = {};
			for (const [n, id] of Object.entries(byName)) {
				const h = n.split('-')[0];
				(heads[h] ??= new Set()).add(id);
			}
			const alias: Record<string, number> = {};
			for (const [h, s] of Object.entries(heads)) {
				if (s.size === 1 && !(h in byName)) alias[h] = [...s][0];
			}

			const alts: Record<number, AltForm[]> = {};
			for (const f of rest) {
				const parts = f.name.split('-');
				for (let cut = parts.length - 1; cut > 0; cut--) {
					const head = parts.slice(0, cut).join('-');
					const sid = byName[head] ?? (cut === 1 ? alias[head] : undefined);
					if (!sid) continue;
					(alts[sid] ??= []).push({
						key: parts.slice(cut).join('-'),
						spriteId: f.id,
						name: f.name
					});
					break;
				}
			}
			this.names = names;
			this.alts = alts;
		} catch {
			/* ignore */
		}
	}

	private persist() {
		try {
			localStorage.setItem(LS_DEX, JSON.stringify(this.dex));
			localStorage.setItem(LS_BASE, JSON.stringify(this.base));
			localStorage.setItem(LS_META, JSON.stringify({ dust: this.dust, pity: this.pity }));
		} catch {
			/* ignore */
		}
	}

	get caughtCount() {
		return Object.keys(this.dex).length;
	}

	// ids matching a collection filter, used by the header chips + dex popup
	idsWhere(kind: string): number[] {
		const out: number[] = [];
		for (const [k, e] of Object.entries(this.dex)) {
			const id = Number(k);
			const forms = e.forms ?? [];
			const alts = e.alts ?? [];
			let hit = false;
			switch (kind) {
				case 'shiny':
					hit = forms.includes('shiny') || forms.includes('shinyShadow');
					break;
				case 'shadow':
					hit = forms.includes('shadow') || forms.includes('shinyShadow');
					break;
				case 'shinyShadow':
					hit = forms.includes('shinyShadow');
					break;
				case 'legendary':
					hit = LEGENDARY.has(id);
					break;
				case 'mythical':
					hit = MYTHICAL.has(id);
					break;
				default:
					hit = alts.some((a) => formKind(a)?.kind === kind);
			}
			if (hit) out.push(id);
		}
		return out.sort((a, b) => a - b);
	}

	countOf(kind: string) {
		return this.idsWhere(kind).length;
	}

	// how many species could ever land in a collection, so a chip can read "21 / 93"
	totalOf(kind: string): number {
		switch (kind) {
			case 'shiny':
			case 'shadow':
			case 'shinyShadow':
				return DEX_MAX; // any species can roll these
			case 'legendary':
				return LEGENDARY.size;
			case 'mythical':
				return MYTHICAL.size;
			default: {
				let n = 0;
				for (const list of Object.values(this.alts)) {
					if (list.some((a) => formKind(a.key)?.kind === kind)) n++;
				}
				return n;
			}
		}
	}

	// the caught alternate form of a given kind, so a filtered grid can show
	// that form's sprite instead of the plain species one
	caughtAltOfKind(id: number, kind: string): AltForm | null {
		const got = this.dex[id]?.alts ?? [];
		for (const a of this.alts[id] ?? []) {
			if (got.includes(a.key) && formKind(a.key)?.kind === kind) return a;
		}
		return null;
	}

	altByKey(id: number, key: string): AltForm | null {
		return (this.alts[id] ?? []).find((a) => a.key === key) ?? null;
	}

	// a species is complete once every finish, size and alternate form is seen
	isComplete(id: number) {
		const e = this.dex[id];
		if (!e) return false;
		const wanted = (this.alts[id] ?? []).length;
		return (
			(e.forms ?? []).length === FORMS.length &&
			(e.sizes ?? []).length === SIZES.length &&
			(e.alts ?? []).length === wanted
		);
	}

	statLabel(k: string) {
		return STAT_LABEL[k] ?? k;
	}

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

	// build a pack without touching the dex; the battle screen uses this too
	async buildPack(force?: { kind: string; missingOnly: boolean }): Promise<Catch[]> {
		// without the name list the roll would collapse to id 1, so refuse early
		if (!this.names.length) return [];
		const ids = Array.from(
			{ length: PACK_SIZE },
			() => 1 + Math.floor(Math.random() * Math.min(DEX_MAX, this.names.length))
		);
		// a guaranteed slot swaps in a species that can actually deliver it
		let forcedSlot = -1;
		let forcedAlt: AltForm | null = null;
		let forcedShiny = false;
		if (force) {
			forcedSlot = Math.floor(Math.random() * PACK_SIZE);
			if (force.kind === 'shiny' || force.kind === 'shinyShadow') {
				forcedShiny = true;
				const pool =
					force.kind === 'shinyShadow'
						? this.speciesMissingShinyShadow()
						: this.speciesMissingShiny();
				if (force.missingOnly && pool.length) ids[forcedSlot] = pool[Math.floor(Math.random() * pool.length)];
			} else {
				const pool = this.speciesWithKind(force.kind, force.missingOnly);
				const pick = pool.length
					? pool[Math.floor(Math.random() * pool.length)]
					: this.speciesWithKind(force.kind, false)[0];
				if (pick) {
					ids[forcedSlot] = pick.id;
					forcedAlt = pick.alt;
				}
			}
		}

		const bases = await Promise.all(ids.map((id) => this.loadBase(id)));
		return ids.map((id, k) => {
			const { mult, size } = rollSize();
			const pool = this.alts[id] ?? [];
			let alt: AltForm | null =
				pool.length && Math.random() < ALT_FORM_CHANCE
					? pool[Math.floor(Math.random() * pool.length)]
					: null;
			let shiny = Math.floor(Math.random() * SHINY_ODDS) === 0;
			let shadow = Math.floor(Math.random() * SHADOW_ODDS) === 0;
			if (k === forcedSlot) {
				if (forcedAlt) alt = forcedAlt;
				if (forcedShiny) shiny = true;
				if (force?.kind === 'shinyShadow') shadow = true;
			}
			return {
				id,
				spriteId: alt ? alt.spriteId : id,
				name: alt ? alt.name : this.names[id - 1],
				form: alt ? alt.key : '',
				shiny,
				shadow,
				size,
				height: +(bases[k].height * mult).toFixed(2),
				weight: +(bases[k].weight * mult * mult).toFixed(1)
			};
		});
	}

	// species that still owe you this kind of alternate form
	speciesWithKind(kind: string, missingOnly: boolean): { id: number; alt: AltForm }[] {
		const out: { id: number; alt: AltForm }[] = [];
		for (const [k, list] of Object.entries(this.alts)) {
			const id = Number(k);
			for (const a of list) {
				if (formKind(a.key)?.kind !== kind) continue;
				if (missingOnly && (this.dex[id]?.alts ?? []).includes(a.key)) continue;
				out.push({ id, alt: a });
			}
		}
		return out;
	}

	speciesMissingShinyShadow(): number[] {
		const out: number[] = [];
		for (let id = 1; id <= Math.min(DEX_MAX, this.names.length); id++) {
			if (!(this.dex[id]?.forms ?? []).includes('shinyShadow')) out.push(id);
		}
		return out;
	}

	speciesMissingShiny(): number[] {
		const out: number[] = [];
		for (let id = 1; id <= Math.min(DEX_MAX, this.names.length); id++) {
			const f = this.dex[id]?.forms ?? [];
			if (!f.some((x) => x.startsWith('shiny'))) out.push(id);
		}
		return out;
	}

	// which pity is due, rarest first so one pack never burns two of them
	private duePity(): PityKind | null {
		for (const k of ['shinyShadow', 'gmax', 'mega', 'shiny'] as PityKind[]) {
			if ((this.pity[k] ?? 0) >= PITY_AT[k]) return k;
		}
		return null;
	}

	async openPack() {
		if (this.opening || !this.names.length) return;
		this.opening = true;
		this.pack = [];
		this.opened = [];
		this.specials = [];

		const due = this.duePity();
		this.pack = await this.buildPack(due ? { kind: due, missingOnly: false } : undefined);
		this.bumpPity();
		this.opening = false;
	}

	// a shop pack always delivers something you are missing
	async openShopPack(kind: string) {
		const price = SHOP[kind]?.cost ?? 0;
		if (this.opening || this.dust < price || !this.names.length) return;
		this.opening = true;
		this.dust -= price;
		this.pack = [];
		this.opened = [];
		this.specials = [];
		this.pack = await this.buildPack({ kind, missingOnly: true });
		this.bumpPity();
		this.persist();
		this.opening = false;
	}

	// counters move on whole packs, and reset the moment the pack delivers
	private bumpPity() {
		const got = {
			shiny: this.pack.some((c) => c.shiny),
			shinyShadow: this.pack.some((c) => c.shiny && c.shadow),
			mega: this.pack.some((c) => formKind(c.form)?.kind === 'mega'),
			gmax: this.pack.some((c) => formKind(c.form)?.kind === 'gmax')
		};
		const next = { ...this.pity };
		for (const k of PITY_KINDS) next[k] = got[k] ? 0 : (next[k] ?? 0) + 1;
		this.pity = next;
	}

	flip(i: number) {
		if (this.opened.includes(i)) return;
		this.opened = [...this.opened, i];
		const c = this.pack[i];
		if (!c) return;
		this.record(c);
		this.persist();
		if (c.shiny && c.shadow) this.specials = [...this.specials, i];
	}

	flipAll() {
		for (let i = 0; i < this.pack.length; i++) this.flip(i);
	}

	get allFlipped() {
		return this.pack.length > 0 && this.opened.length === this.pack.length;
	}

	wasNew(i: number) {
		const c = this.pack[i];
		return !!c && this.dex[c.id]?.count === 1;
	}

	clearSpecials() {
		this.specials = [];
	}

	private record(c: Catch) {
		const form = formOf(c);
		const cur = this.dex[c.id];
		if (!cur) {
			this.dex = {
				...this.dex,
				[c.id]: {
					count: 1,
					forms: [form],
					sizes: [c.size],
					alts: c.form ? [c.form] : [],
					best: c
				}
			};
			return;
		}
		const forms = (cur.forms ?? []).includes(form) ? cur.forms : [...(cur.forms ?? []), form];
		const sizes = (cur.sizes ?? []).includes(c.size) ? cur.sizes : [...(cur.sizes ?? []), c.size];
		const alts =
			c.form && !(cur.alts ?? []).includes(c.form) ? [...(cur.alts ?? []), c.form] : (cur.alts ?? []);
		// a duplicate is not wasted: it pays dust, scaled by how good it was
		this.dust += Math.max(1, Math.round(rarityScore(c) / 6));
		const better =
			(c.shiny && !cur.best.shiny) ||
			(c.shiny === cur.best.shiny && c.shadow && !cur.best.shadow) ||
			(c.shiny === cur.best.shiny && c.shadow === cur.best.shadow && c.weight > cur.best.weight);
		// whole-object reassign so the counters repaint straight away
		this.dex = {
			...this.dex,
			[c.id]: { count: cur.count + 1, forms, sizes, alts, best: better ? c : cur.best }
		};
	}

	clearPack() {
		this.pack = [];
		this.opened = [];
		this.specials = [];
	}

	reset() {
		this.dex = {};
		this.dust = 0;
		this.pity = { shiny: 0, mega: 0, gmax: 0, shinyShadow: 0 };
		this.clearPack();
		this.persist();
	}
}

export const dex = new DexStore();
