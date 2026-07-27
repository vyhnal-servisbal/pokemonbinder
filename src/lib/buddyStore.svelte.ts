interface Buddy {
	name: string; // pokemon name = sprite id
	label: string;
	fx: string; // particle emoji
	color: string; // glow color
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

class BuddyStore {
	list = $state<Buddy[]>([]);
	all = $state<string[]>([]); // all pokemon names, for the picker

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

	async add(name: string) {
		if (this.has(name)) return;
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
		const label = name.charAt(0).toUpperCase() + name.slice(1);
		this.list = [...this.list, { name, label, fx, color }];
		this.persist();
	}

	remove(name: string) {
		this.list = this.list.filter((b) => b.name !== name);
		this.persist();
	}
}

export const buddies = new BuddyStore();
export type { Buddy };
