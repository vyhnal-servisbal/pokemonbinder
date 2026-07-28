// Core data model. A binder is an ordered list of "sides" (each side = a 3x3 grid).
// Spread view shows side[i] + side[i+1]; a physical sheet later becomes two sides.
export interface PokemonCard {
	id: string;
	name: string;
	rarity?: string;
	set?: string;
	setId?: string; // TCGdex set id (sv07, base1...), used to build the set logo url
	series?: string; // TCGdex era id (sv, swsh, xy...), drives the set badge colour
	number?: string;
	image?: string; // full image url (ready to render)
}

export type ItemType = 'card' | 'image';

// A placed item can span more than one pocket (colSpan/rowSpan = 2),
// which is how a custom image printed across 2 sleeves is modelled.
export interface PlacedItem {
	id: string;
	row: number; // 0..2
	col: number; // 0..2
	rowSpan: number; // 1 or 2
	colSpan: number; // 1 or 2
	type: ItemType;
	card?: PokemonCard;
	imageUrl?: string;
	crop?: { x: number; y: number; scale: number };
}

export interface BinderSide {
	id: string;
	items: PlacedItem[];
}

export interface Binder {
	id: string;
	name: string;
	sides: BinderSide[];
	inside?: string; // custom binder fill color
	outline?: string; // custom binder border color
}
