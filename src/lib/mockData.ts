import type { Binder, PokemonCard } from './types';

// TCGdex image base + '/high.png'. If a URL 404s, Card falls back to a placeholder.
const img = (path: string) => `https://assets.tcgdex.net/en/${path}/high.png`;

const cards: PokemonCard[] = [
	{ id: 'base1-4', name: 'Charizard', rarity: 'Rare Holo', set: 'Base', image: img('base/base1/4') },
	{ id: 'base1-2', name: 'Blastoise', rarity: 'Rare Holo', set: 'Base', image: img('base/base1/2') },
	{ id: 'base1-15', name: 'Venusaur', rarity: 'Rare Holo', set: 'Base', image: img('base/base1/15') },
	{ id: 'base1-58', name: 'Pikachu', rarity: 'Common', set: 'Base', image: img('base/base1/58') },
	{ id: 'base1-16', name: 'Zapdos', rarity: 'Rare Holo', set: 'Base', image: img('base/base1/16') },
	{ id: 'base1-10', name: 'Mewtwo', rarity: 'Rare Holo', set: 'Base', image: img('base/base1/10') }
];

let n = 0;
const uid = () => `it_${n++}`;

export const demoBinder: Binder = {
	id: 'demo',
	name: 'Náš prvý binder',
	sides: [
		{
			id: 's1',
			items: [
				{ id: uid(), row: 0, col: 0, rowSpan: 1, colSpan: 1, type: 'card', card: cards[0] },
				{ id: uid(), row: 0, col: 1, rowSpan: 1, colSpan: 1, type: 'card', card: cards[1] },
				{ id: uid(), row: 0, col: 2, rowSpan: 1, colSpan: 1, type: 'card', card: cards[2] },
				{ id: uid(), row: 1, col: 0, rowSpan: 1, colSpan: 1, type: 'card', card: cards[3] },
				// custom image printed across two pockets (row 2, cols 1-2)
				{
					id: uid(),
					row: 2,
					col: 1,
					rowSpan: 1,
					colSpan: 2,
					type: 'image',
					imageUrl: 'https://images.unsplash.com/photo-1542779283-429940ce8336?w=800&q=80'
				}
			]
		},
		{
			id: 's2',
			items: [
				{ id: uid(), row: 0, col: 0, rowSpan: 1, colSpan: 1, type: 'card', card: cards[4] },
				{ id: uid(), row: 1, col: 1, rowSpan: 1, colSpan: 1, type: 'card', card: cards[5] }
			]
		},
		{
			id: 's3',
			items: [
				// a single card blown up to a 2x2 hero slot
				{ id: uid(), row: 0, col: 0, rowSpan: 2, colSpan: 2, type: 'card', card: cards[0] }
			]
		}
	]
};
