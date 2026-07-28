import { fun } from './funStore.svelte';

interface Buddy {
	name: string; // pokemon name = sprite id
	label: string;
	fx: string; // particle emoji
	color: string; // glow color
	shiny?: boolean;
}

const LS = 'pb_buddies';

// effect + glow by primary type, so any Pokémon gets a fitting reaction
const TYPE_FX: Record<string, { fx: string; color: string }> = {
	fire: { fx: '🔥', color: '#f0803c' },
	water: { fx: '💧', color: '#5aa9e6' },
	grass: { fx: '🍃', color: '#7fc97f' },
	electric: { fx: '⚡', color: '#f5d94e' },
	psychic: { fx: '🔮', color: '#e77fb3' },
	fairy: { fx: '💕', color: '#f5a9d0' },
	ice: { fx: '❄️', color: '#a9e3f0' },
	dark: { fx: '🌙', color: '#8a7fb0' },
	dragon: { fx: '🐉', color: '#8b7ff0' },
	ghost: { fx: '👻', color: '#9a8fc8' },
	poison: { fx: '☠️', color: '#b56ad0' },
	bug: { fx: '🐛', color: '#a8c84a' },
	rock: { fx: '🪨', color: '#c8b070' },
	ground: { fx: '🏜️', color: '#e0c068' },
	steel: { fx: '⚙️', color: '#a8b0c0' },
	fighting: { fx: '👊', color: '#e0805a' },
	flying: { fx: '🌪️', color: '#a8c8f0' },
	normal: { fx: '✨', color: '#d8b48a' }
};
const NAME_FX: Record<string, string> = { snorlax: '💤' };

// a new buddy rolls shiny at these odds (the real games use 1/4096, which nobody
// would ever see here) and evolves after this many pokes
const SHINY_ODDS = 50;
const POKES_TO_EVOLVE = 10;

// walk the PokeAPI evolution chain and pick what this species turns into.
// Branching lines (eevee has 8) pick at random, which is half the fun.
async function nextEvolution(name: string): Promise<string | null> {
	try {
		const s = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${name}`);
		if (!s.ok) return null;
		const chainUrl = (await s.json())?.evolution_chain?.url;
		if (!chainUrl) return null;
		const c = await fetch(chainUrl);
		if (!c.ok) return null;
		const root = (await c.json())?.chain;

		const find = (n: any): any => {
			if (n?.species?.name === name) return n;
			for (const e of n?.evolves_to ?? []) {
				const hit = find(e);
				if (hit) return hit;
			}
			return null;
		};
		const node = find(root);
		const options = node?.evolves_to ?? [];
		if (!options.length) return null;
		return options[Math.floor(Math.random() * options.length)].species.name;
	} catch {
		return null;
	}
}

class BuddyStore {
	list = $state<Buddy[]>([]);
	all = $state<string[]>([]); // all pokemon names, for the picker
	lastShiny = $state<string | null>(null); // just rolled shiny -> celebrate
	evolving = $state<string | null>(null); // mid evolution -> play the flash

	private pokes: Record<string, number> = {};

	async init() {
		try {
			const saved = JSON.parse(localStorage.getItem(LS) ?? '[]');
			if (Array.isArray(saved)) this.list = saved;
		} catch {
			/* ignore */
		}
		if (!this.list.length) {
			this.list = [{ name: 'eevee', label: 'Eevee', fx: '✨', color: '#d8b48a' }];
		}
		if (!this.all.length) {
			try {
				const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1400');
				const json = await res.json();
				this.all = (json.results ?? []).map((p: { name: string }) => p.name);
			} catch {
				/* ignore */
			}
		}
	}

	private persist() {
		try {
			localStorage.setItem(LS, JSON.stringify(this.list));
		} catch {
			/* ignore */
		}
	}

	has(name: string) {
		return this.list.some((b) => b.name === name);
	}

	// look up the primary type so the buddy gets a fitting particle + glow
	private async traits(name: string) {
		let fx = NAME_FX[name] ?? '✨';
		let color = '#d8b48a';
		try {
			const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
			if (res.ok) {
				const p = await res.json();
				const t: string | undefined = p.types?.[0]?.type?.name;
				if (t && TYPE_FX[t]) {
					if (!NAME_FX[name]) fx = TYPE_FX[t].fx;
					color = TYPE_FX[t].color;
				}
			}
		} catch {
			/* ignore */
		}
		return { fx, color, label: name.charAt(0).toUpperCase() + name.slice(1) };
	}

	async add(name: string) {
		if (this.has(name)) return;
		const { fx, color, label } = await this.traits(name);
		const shiny = Math.floor(Math.random() * SHINY_ODDS) === 0;
		this.list = [...this.list, { name, label, fx, color, shiny }];
		this.persist();
		if (shiny) {
			fun.unlock('shiny');
			this.lastShiny = name;
			setTimeout(() => {
				if (this.lastShiny === name) this.lastShiny = null;
			}, 4500);
		}
	}

	// count a poke; every POKES_TO_EVOLVE it tries to evolve the buddy
	poke(name: string) {
		this.pokes[name] = (this.pokes[name] ?? 0) + 1;
		if (this.pokes[name] < POKES_TO_EVOLVE) return;
		this.pokes[name] = 0;
		this.evolve(name);
	}

	async evolve(name: string) {
		if (this.evolving) return;
		const next = await nextEvolution(name);
		if (!next || this.has(next)) return;

		this.evolving = name; // sprite goes white + pulses while this is set
		const [{ fx, color, label }] = await Promise.all([
			this.traits(next),
			new Promise((r) => setTimeout(r, 1500))
		]);
		const was = this.list.find((b) => b.name === name);
		this.list = this.list.map((b) =>
			b.name === name ? { name: next, label, fx, color, shiny: was?.shiny } : b
		);
		this.evolving = null;
		this.persist();
		fun.unlock('evolve');
	}

	remove(name: string) {
		this.list = this.list.filter((b) => b.name !== name);
		this.persist();
	}

	toggleShiny(name: string) {
		this.list = this.list.map((b) => (b.name === name ? { ...b, shiny: !b.shiny } : b));
		this.persist();
	}
}

export const buddies = new BuddyStore();
export type { Buddy };
