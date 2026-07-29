<script lang="ts">
	// Print-only layout: each side becomes one physical A4 sheet at real pocket size
	// (63x88 mm), so a spanning image prints across 2 pockets and lines up when cut.
	import { store } from '$lib/binderStore.svelte';
</script>

<div class="print-only">
	{#each store.binder.sides as side (side.id)}
		<div class="sheet">
			{#each side.items as item (item.id)}
				<div
					class="cell"
					style="grid-row: {item.row + 1} / span {item.rowSpan}; grid-column: {item.col +
						1} / span {item.colSpan};"
				>
					{#if item.type === 'card' && item.card?.image}
						<img src={item.card.image} alt={item.card.name} />
					{:else if item.type === 'image' && item.imageUrl}
						<img src={item.imageUrl} alt="" class:flip={item.flip} />
					{/if}
				</div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.sheet {
		display: grid;
		grid-template-columns: repeat(3, 63mm);
		grid-template-rows: repeat(3, 88mm);
		gap: 2mm;
		page-break-after: always;
	}
	.cell {
		overflow: hidden;
		border-radius: 2mm;
	}
	.cell img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	/* keep a mirrored image mirrored on paper too */
	.cell img.flip {
		transform: scaleX(-1);
	}
</style>
