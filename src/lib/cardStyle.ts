// Colours for set eras and card rarities. Both derive from data we already have,
// so nothing here costs an extra request.

// TCGdex series ("era") -> label + colour. Series id comes from the image url:
// https://assets.tcgdex.net/en/<series>/<setId>/<localId>
const SERIES: Record<string, { label: string; color: string }> = {
	base: { label: 'Base', color: '#e0574f' },
	gym: { label: 'Gym', color: '#c07a3e' },
	neo: { label: 'Neo', color: '#3fb8a8' },
	lc: { label: 'Legendary Collection', color: '#cfa94a' },
	ecard: { label: 'E-Card', color: '#8b6fc4' },
	ex: { label: 'EX', color: '#f0862e' },
	pop: { label: 'POP', color: '#8fc63d' },
	tk: { label: 'Trainer Kits', color: '#6f8ba8' },
	dp: { label: 'Diamond & Pearl', color: '#4a7fd4' },
	pl: { label: 'Platinum', color: '#9a8fd0' },
	hgss: { label: 'HeartGold & SoulSilver', color: '#e0b23c' },
	col: { label: 'Call of Legends', color: '#c9b477' },
	bw: { label: 'Black & White', color: '#b0b7c3' },
	mc: { label: "McDonald's", color: '#e8a33d' },
	xy: { label: 'XY', color: '#43b56a' },
	sm: { label: 'Sun & Moon', color: '#f2c53d' },
	swsh: { label: 'Sword & Shield', color: '#e572a8' },
	sv: { label: 'Scarlet & Violet', color: '#9b6ef3' },
	tcgp: { label: 'TCG Pocket', color: '#37c2e0' },
	me: { label: 'Mega Evolution', color: '#d94f7a' },
	misc: { label: 'Miscellaneous', color: '#7c8794' }
};

const FALLBACK = '#7c8794';

export function seriesColor(series?: string): string {
	return (series && SERIES[series]?.color) || FALLBACK;
}

export function seriesLabel(series?: string): string {
	return (series && SERIES[series]?.label) || '';
}

// Rarity -> colour. Matched by keyword (most specific first) so the ~40 TCGdex
// rarity strings, and any new ones, land in a sensible tier.
const RARITY_TIERS: { test: RegExp; color: string }[] = [
	{ test: /illustration/i, color: '#ef6fa8' },
	{ test: /shiny/i, color: '#45cfe0' },
	{ test: /crown|hyper|secret/i, color: '#e5c145' },
	{ test: /ultra|full art|vmax|vstar|holo rare v|\bv\b/i, color: '#f0902e' },
	{ test: /holo|double rare|legend|prime|lv\.x|radiant|amazing|ace spec|classic|black white/i, color: '#a672e8' },
	{ test: /star/i, color: '#e5c145' },
	{ test: /diamond/i, color: '#8fa3b8' },
	{ test: /promo/i, color: '#78909c' },
	{ test: /uncommon/i, color: '#5fbf7a' },
	{ test: /rare/i, color: '#5b8fe0' },
	{ test: /common/i, color: '#9aa3ad' }
];

export function rarityColor(rarity?: string): string {
	if (!rarity) return FALLBACK;
	for (const t of RARITY_TIERS) if (t.test.test(rarity)) return t.color;
	return FALLBACK;
}
