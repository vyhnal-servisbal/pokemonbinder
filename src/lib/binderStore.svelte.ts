import type { Binder, BinderSide, PlacedItem, PokemonCard } from './types';
import { demoBinder } from './mockData';
import { getCard } from './cardApi';
import { fun } from './funStore.svelte';

let seq = 0;
const newId = () => `it_${Date.now().toString(36)}_${seq++}`;
const newSideId = () => `sd_${Date.now().toString(36)}_${seq++}`;

// 2 = a new binder opens as a full spread (default view is double 3x3)
export const MIN_PAGES = 2;

// a fresh, empty binder with MIN_PAGES blank pages
export function makeEmptyBinder(name: string): Binder {
	const sides: Binder['sides'] = [];
	for (let i = 0; i < MIN_PAGES; i++) sides.push({ id: newSideId(), items: [] });
	return { id: `b_${Date.now().toString(36)}_${seq++}`, name, sides };
}

function occupiedCells(side: BinderSide): Set<string> {
	const s = new Set<string>();
	for (const it of side.items) {
		for (let r = it.row; r < it.row + it.rowSpan; r++) {
			for (let c = it.col; c < it.col + it.colSpan; c++) s.add(`${r}-${c}`);
		}
	}
	return s;
}

// Central reactive state for the whole app (Svelte 5 class-with-runes pattern).
class BinderStore {
	binder = $state<Binder>(structuredClone(demoBinder));
	view = $state<'single' | 'spread'>('spread');
	index = $state(0);
	preview = $state<PokemonCard | null>(null);
	holoOn = $state(true);

	// drag state is plain (not reactive) - only read on drop
	dragItemId: string | null = null;
	dragFromSideId: string | null = null;
	searchDrag = $state<PokemonCard | null>(null);

	constructor() {
		this.ensureMinPages();
	}

	get pageCount() {
		return this.binder.sides.length;
	}

	// keep the binder at >= MIN_PAGES sides (empty pages padded in)
	ensureMinPages() {
		while (this.binder.sides.length < MIN_PAGES) {
			this.binder.sides.push({ id: newSideId(), items: [] });
		}
	}

	// change how many pages the binder has (floor MIN_PAGES); only trims trailing empty pages
	setPageCount(n: number) {
		const target = Math.max(MIN_PAGES, Math.floor(n) || MIN_PAGES);
		const sides = this.binder.sides;
		while (sides.length < target) sides.push({ id: newSideId(), items: [] });
		while (sides.length > target && sides[sides.length - 1].items.length === 0) sides.pop();
		if (this.index + this.step > this.binder.sides.length) {
			this.index = Math.max(0, this.binder.sides.length - this.step);
		}
	}

	get step() {
		return this.view === 'spread' ? 2 : 1;
	}
	get canPrev() {
		return this.index > 0;
	}
	get canNext() {
		return this.index + this.step < this.binder.sides.length;
	}
	prev() {
		if (this.canPrev) this.index = Math.max(0, this.index - this.step);
	}
	next() {
		if (this.canNext) this.index = this.index + this.step;
	}

	// right arrow: navigate, or append a new page when already at the end
	nextOrAdd() {
		if (this.canNext) {
			this.index = this.index + this.step;
		} else {
			this.addPage();
			this.goToEnd();
		}
	}

	addPage() {
		this.binder.sides.push({ id: newSideId(), items: [] });
	}

	// is the last page empty (and above the floor)? -> there is something to trim
	get lastEmpty() {
		const s = this.binder.sides;
		return s.length > MIN_PAGES && s[s.length - 1].items.length === 0;
	}

	// remove trailing empty pages (never touches pages with cards, never below MIN_PAGES)
	trimEmptyPages() {
		const s = this.binder.sides;
		while (s.length > MIN_PAGES && s[s.length - 1].items.length === 0) s.pop();
		if (this.index + this.step > s.length) {
			this.index = Math.max(0, s.length - this.step);
		}
	}

	// swap two whole pages; contents travel with them
	swapPages(a: number, b: number) {
		const s = this.binder.sides;
		if (a === b || !s[a] || !s[b]) return;
		[s[a], s[b]] = [s[b], s[a]];
	}

	// drop a whole page (and whatever is on it); never below the floor
	deletePage(i: number) {
		const s = this.binder.sides;
		if (s.length <= MIN_PAGES || !s[i]) return;
		s.splice(i, 1);
		if (this.index + this.step > s.length) {
			this.index = Math.max(0, s.length - this.step);
		}
	}

	// jump to a page; in spread view land on the left half of its spread
	goToPage(i: number) {
		const n = this.binder.sides.length;
		if (i < 0 || i >= n) return;
		this.index = this.view === 'spread' ? i - (i % 2) : i;
	}

	goToEnd() {
		const n = this.binder.sides.length;
		const last = this.view === 'spread' ? (n % 2 === 0 ? n - 2 : n - 1) : n - 1;
		this.index = Math.max(0, last);
	}

	visibleSides(): BinderSide[] {
		const out: BinderSide[] = [];
		const a = this.binder.sides[this.index];
		if (a) out.push(a);
		if (this.view === 'spread') {
			const b = this.binder.sides[this.index + 1];
			if (b) out.push(b);
		}
		return out;
	}

	firstEmptyCell(side: BinderSide): { row: number; col: number } | null {
		const occ = occupiedCells(side);
		for (let r = 0; r < 3; r++) {
			for (let c = 0; c < 3; c++) if (!occ.has(`${r}-${c}`)) return { row: r, col: c };
		}
		return null;
	}

	// add into the first empty pocket of the currently visible side(s)
	addCard(card: PokemonCard): boolean {
		for (const side of this.visibleSides()) {
			const cell = this.firstEmptyCell(side);
			if (cell) {
				side.items.push({
					id: newId(),
					row: cell.row,
					col: cell.col,
					rowSpan: 1,
					colSpan: 1,
					type: 'card',
					card
				});
				fun.binderAction();
				return true;
			}
		}
		return false;
	}

	// add an uploaded image (data URL) into the first empty pocket
	addImage(url: string): boolean {
		for (const side of this.visibleSides()) {
			const cell = this.firstEmptyCell(side);
			if (cell) {
				side.items.push({
					id: newId(),
					row: cell.row,
					col: cell.col,
					rowSpan: 1,
					colSpan: 1,
					type: 'image',
					imageUrl: url
				});
				fun.binderAction();
				return true;
			}
		}
		return false;
	}

	removeItem(sideId: string, itemId: string) {
		const side = this.binder.sides.find((s) => s.id === sideId);
		if (!side) return;
		const was = side.items.find((it) => it.id === itemId);
		side.items = side.items.filter((it) => it.id !== itemId);
		if (was?.type === 'card') fun.cardRemoved();
		else if (was) fun.binderAction();
	}

	openPreview(card: PokemonCard) {
		this.preview = card;
	}
	closePreview() {
		this.preview = null;
	}

	startDrag(itemId: string, sideId: string) {
		this.dragItemId = itemId;
		this.dragFromSideId = sideId;
	}
	clearDrag() {
		this.dragItemId = null;
		this.dragFromSideId = null;
	}

	// dragging a card from the search panel into a specific pocket
	startSearchDrag(card: PokemonCard) {
		const image = card.image ? card.image.replace('/low.webp', '/high.png') : undefined;
		this.searchDrag = { ...card, image };
	}
	endSearchDrag() {
		this.searchDrag = null;
	}
	async dropSearchCard(sideId: string, row: number, col: number) {
		const card = this.searchDrag;
		this.searchDrag = null;
		if (!card) return;
		const side = this.binder.sides.find((s) => s.id === sideId);
		if (!side || this.itemAt(side, row, col)) return; // only into an empty pocket
		const item: PlacedItem = {
			id: newId(),
			row,
			col,
			rowSpan: 1,
			colSpan: 1,
			type: 'card',
			card
		};
		side.items.push(item);
		fun.binderAction();
		// enrich with full-res image + rarity (holo) in the background
		const full = await getCard(card.id);
		if (full) {
			const placed = side.items.find((x) => x.id === item.id);
			if (placed && placed.card) {
				if (full.rarity) placed.card.rarity = full.rarity;
				if (full.image) placed.card.image = full.image;
			}
		}
	}

	private itemAt(side: BinderSide, row: number, col: number): PlacedItem | undefined {
		return side.items.find(
			(it) =>
				row >= it.row && row < it.row + it.rowSpan && col >= it.col && col < it.col + it.colSpan
		);
	}

	// is region [row..row+rowSpan-1, col..col+colSpan-1] inside the page and free (ignoring excludeId)?
	private regionFree(
		side: BinderSide,
		excludeId: string,
		row: number,
		col: number,
		rowSpan: number,
		colSpan: number
	): boolean {
		if (row < 0 || col < 0 || row + rowSpan > 3 || col + colSpan > 3) return false;
		const occ = new Set<string>();
		for (const it of side.items) {
			if (it.id === excludeId) continue;
			for (let r = it.row; r < it.row + it.rowSpan; r++) {
				for (let c = it.col; c < it.col + it.colSpan; c++) occ.add(`${r}-${c}`);
			}
		}
		for (let r = row; r < row + rowSpan; r++) {
			for (let c = col; c < col + colSpan; c++) if (occ.has(`${r}-${c}`)) return false;
		}
		return true;
	}

	// resize a placed item across pockets (e.g. an image printed over 2 sleeves); no-op if blocked
	setSpan(sideId: string, itemId: string, rowSpan: number, colSpan: number): boolean {
		const side = this.binder.sides.find((s) => s.id === sideId);
		if (!side) return false;
		const item = side.items.find((it) => it.id === itemId);
		if (!item) return false;
		if (!this.regionFree(side, item.id, item.row, item.col, rowSpan, colSpan)) return false;
		item.rowSpan = rowSpan;
		item.colSpan = colSpan;
		return true;
	}

	// drop the dragged item onto (row,col) of targetSide: swap if occupied, move if empty
	dropOn(targetSideId: string, row: number, col: number) {
		const fromId = this.dragItemId;
		const fromSideId = this.dragFromSideId;
		this.clearDrag();
		if (!fromId || !fromSideId) return;

		const fromSide = this.binder.sides.find((s) => s.id === fromSideId);
		const toSide = this.binder.sides.find((s) => s.id === targetSideId);
		if (!fromSide || !toSide) return;

		const src = fromSide.items.find((it) => it.id === fromId);
		if (!src) return;

		// spanned source
		if (src.rowSpan > 1 || src.colSpan > 1) {
			const hit = this.itemAt(toSide, row, col);
			// swap with another item of the same footprint (e.g. two images spanning 2 pockets)
			if (
				hit &&
				hit.id !== src.id &&
				hit.rowSpan === src.rowSpan &&
				hit.colSpan === src.colSpan
			) {
				const sr = src.row;
				const sc = src.col;
				src.row = hit.row;
				src.col = hit.col;
				hit.row = sr;
				hit.col = sc;
				if (fromSide !== toSide) {
					fromSide.items = fromSide.items.filter((it) => it.id !== src.id);
					toSide.items = toSide.items.filter((it) => it.id !== hit.id);
					fromSide.items.push(hit);
					toSide.items.push(src);
				}
				return;
			}
			// otherwise move into a free region, snapped inside the page
			const r = Math.max(0, Math.min(row, 3 - src.rowSpan));
			const c = Math.max(0, Math.min(col, 3 - src.colSpan));
			if (!this.regionFree(toSide, src.id, r, c, src.rowSpan, src.colSpan)) return;
			if (fromSide !== toSide) {
				fromSide.items = fromSide.items.filter((it) => it.id !== src.id);
				toSide.items.push(src);
			}
			src.row = r;
			src.col = c;
			return;
		}

		const target = this.itemAt(toSide, row, col);
		if (target && target.id === src.id) return;
		// dropping a 1x1 onto a spanned item is not a clean swap: ignore
		if (target && (target.rowSpan > 1 || target.colSpan > 1)) return;

		if (fromSide === toSide) {
			if (target) {
				const tr = target.row;
				const tc = target.col;
				target.row = src.row;
				target.col = src.col;
				src.row = tr;
				src.col = tc;
			} else {
				src.row = row;
				src.col = col;
			}
			return;
		}

		// cross-side move (no slide animation across pages, acceptable for now)
		fromSide.items = fromSide.items.filter((it) => it.id !== src.id);
		if (target) {
			toSide.items = toSide.items.filter((it) => it.id !== target.id);
			const sr = src.row;
			const sc = src.col;
			src.row = target.row;
			src.col = target.col;
			target.row = sr;
			target.col = sc;
			fromSide.items.push(target);
		} else {
			src.row = row;
			src.col = col;
		}
		toSide.items.push(src);
	}
}

export const store = new BinderStore();
