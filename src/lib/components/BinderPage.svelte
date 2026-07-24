<script lang="ts">
	import type { BinderSide, PlacedItem } from '$lib/types';
	import { store } from '$lib/binderStore.svelte';
	import Card from './Card.svelte';

	let { side }: { side: BinderSide } = $props();

	let hoverKey = $state<string | null>(null);

	const empties = $derived.by(() => {
		const occ = new Set<string>();
		for (const it of side.items) {
			for (let r = it.row; r < it.row + it.rowSpan; r++) {
				for (let c = it.col; c < it.col + it.colSpan; c++) occ.add(`${r}-${c}`);
			}
		}
		const cells: { row: number; col: number }[] = [];
		for (let r = 0; r < 3; r++) {
			for (let c = 0; c < 3; c++) if (!occ.has(`${r}-${c}`)) cells.push({ row: r, col: c });
		}
		return cells;
	});

	// geometry: each pocket is a third of the page in both axes (page is 3:4, so cells ~ card shape)
	function pos(row: number, col: number, rowSpan = 1, colSpan = 1) {
		return `left:${(col * 100) / 3}%; top:${(row * 100) / 3}%; width:${(colSpan * 100) / 3}%; height:${(rowSpan * 100) / 3}%;`;
	}

	function onDragStart(e: DragEvent, item: PlacedItem) {
		store.startDrag(item.id, side.id);
		if (e.dataTransfer) {
			e.dataTransfer.setData('text/plain', item.id);
			e.dataTransfer.effectAllowed = 'move';
		}
	}

	function drop(row: number, col: number) {
		hoverKey = null;
		store.dropOn(side.id, row, col);
	}

	function toggleWide(e: MouseEvent, item: PlacedItem) {
		e.stopPropagation();
		store.setSpan(side.id, item.id, item.rowSpan, item.colSpan === 1 ? 2 : 1);
	}
	function toggleTall(e: MouseEvent, item: PlacedItem) {
		e.stopPropagation();
		store.setSpan(side.id, item.id, item.rowSpan === 1 ? 2 : 1, item.colSpan);
	}
	function remove(e: MouseEvent, item: PlacedItem) {
		e.stopPropagation();
		store.removeItem(side.id, item.id);
	}
</script>

<div class="page">
	{#each empties as cell (cell.row + '-' + cell.col)}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="cell empty"
			class:hover={hoverKey === cell.row + '-' + cell.col}
			style={pos(cell.row, cell.col)}
			ondragover={(e) => {
				e.preventDefault();
				hoverKey = cell.row + '-' + cell.col;
			}}
			ondragleave={() => (hoverKey = null)}
			ondrop={(e) => {
				e.preventDefault();
				drop(cell.row, cell.col);
			}}
		></div>
	{/each}

	{#each side.items as item (item.id)}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="cell item grabbable"
			class:dragged={store.dragItemId === item.id}
			style={pos(item.row, item.col, item.rowSpan, item.colSpan)}
			draggable={true}
			ondragstart={(e) => onDragStart(e, item)}
			ondragend={() => store.clearDrag()}
			ondragover={(e) => {
				e.preventDefault();
				hoverKey = item.row + '-' + item.col;
			}}
			ondragleave={() => (hoverKey = null)}
			ondrop={(e) => {
				e.preventDefault();
				drop(item.row, item.col);
			}}
		>
			{#if item.type === 'card' && item.card}
				<button class="tap" onclick={() => item.card && store.openPreview(item.card)} aria-label={item.card.name}>
					<Card card={item.card} />
				</button>
			{:else if item.type === 'image' && item.imageUrl}
				<img class="img" src={item.imageUrl} alt="" draggable="false" />
			{/if}

			<div class="tools">
				{#if item.type === 'image'}
					<button title="Šírka cez 2 vrecká" onclick={(e) => toggleWide(e, item)}>↔</button>
					<button title="Výška cez 2 vrecká" onclick={(e) => toggleTall(e, item)}>↕</button>
				{/if}
				<button class="del" title="Odobrať" onclick={(e) => remove(e, item)}>✕</button>
			</div>
		</div>
	{/each}
</div>

<style>
	.page {
		position: relative;
		aspect-ratio: 3 / 4;
		background: linear-gradient(160deg, #241a3f 0%, #170f30 100%);
		border-radius: 12px;
		box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.5);
	}
	.cell {
		position: absolute;
		padding: 0.5rem;
		transition:
			left 0.28s cubic-bezier(0.22, 1, 0.36, 1),
			top 0.28s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.empty::after {
		content: '';
		position: absolute;
		inset: 0.5rem;
		border: 1px dashed rgba(255, 255, 255, 0.12);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.02);
		transition:
			border-color 0.15s,
			background 0.15s;
	}
	.empty.hover::after {
		border-color: rgba(120, 220, 255, 0.85);
		background: rgba(120, 220, 255, 0.12);
	}
	.grabbable {
		cursor: grab;
	}
	.grabbable:active {
		cursor: grabbing;
	}
	.dragged {
		opacity: 0.35;
	}
	.tap {
		display: block;
		width: 100%;
		height: 100%;
		padding: 0;
		margin: 0;
		border: 0;
		background: none;
		cursor: pointer;
	}
	.img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 6px;
	}
	.tools {
		position: absolute;
		top: 0.7rem;
		right: 0.7rem;
		display: flex;
		gap: 0.25rem;
		z-index: 3;
		opacity: 0;
		transition: opacity 0.15s ease;
	}
	.cell.item:hover .tools {
		opacity: 1;
	}
	.tools button {
		width: 24px;
		height: 24px;
		border: 0;
		border-radius: 6px;
		font-size: 0.85rem;
		line-height: 1;
		color: #fff;
		background: rgba(20, 12, 40, 0.85);
		cursor: pointer;
	}
	.tools button:hover {
		background: rgba(60, 40, 110, 0.95);
	}
	.tools .del:hover {
		background: rgba(180, 40, 60, 0.95);
	}
</style>
