<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { store } from '$lib/binderStore.svelte';
	import type { PlacedItem } from '$lib/types';

	let { onClose }: { onClose: () => void } = $props();

	let dragFrom = $state<number | null>(null);
	let over = $state<number | null>(null);

	// binder cards hold the full ~900kB image; previews swap it for the small one
	function thumb(item: PlacedItem): string | undefined {
		const url = item.type === 'card' ? item.card?.image : item.imageUrl;
		return url?.replace('/high.png', '/low.webp');
	}

	// same geometry as a real page: each pocket is a third in both axes
	function pos(it: PlacedItem) {
		return `left:${(it.col * 100) / 3}%; top:${(it.row * 100) / 3}%; width:${(it.colSpan * 100) / 3}%; height:${(it.rowSpan * 100) / 3}%;`;
	}

	function drop(to: number) {
		if (dragFrom !== null) store.swapPages(dragFrom, to);
		dragFrom = null;
		over = null;
	}

	function jump(i: number) {
		store.goToPage(i);
		onClose();
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={onKey} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="backdrop" transition:fade={{ duration: 160 }} onclick={onClose} role="presentation">
	<div
		class="dialog"
		transition:scale={{ duration: 200, start: 0.94 }}
		onclick={(e) => e.stopPropagation()}
		role="dialog"
		aria-modal="true"
		aria-label="Pages"
		tabindex="-1"
	>
		<div class="head">
			<h2>Pages</h2>
			<span class="hint">Drag a page onto another to swap them. Click one to jump there.</span>
		</div>

		<div class="grid">
			{#each store.binder.sides as side, i (side.id)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="slot"
					class:current={i === store.index || (store.view === 'spread' && i === store.index + 1)}
					class:dragging={dragFrom === i}
					class:over={over === i && dragFrom !== null && dragFrom !== i}
					draggable="true"
					role="button"
					tabindex="0"
					ondragstart={(e) => {
						dragFrom = i;
						if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
					}}
					ondragend={() => {
						dragFrom = null;
						over = null;
					}}
					ondragover={(e) => {
						e.preventDefault();
						over = i;
					}}
					ondragleave={() => {
						if (over === i) over = null;
					}}
					ondrop={(e) => {
						e.preventDefault();
						drop(i);
					}}
					onclick={() => jump(i)}
					onkeydown={(e) => e.key === 'Enter' && jump(i)}
				>
					<div class="mini">
						{#each [0, 1, 2] as r (r)}
							{#each [0, 1, 2] as c (c)}
								<span class="pocket" style="left:{(c * 100) / 3}%; top:{(r * 100) / 3}%"></span>
							{/each}
						{/each}

						{#each side.items as it (it.id)}
							{@const src = thumb(it)}
							<span class="cell" style={pos(it)}>
								{#if src}
									<img {src} alt="" loading="lazy" draggable="false" />
								{:else}
									<span class="blank"></span>
								{/if}
							</span>
						{/each}
					</div>
					<span class="num">{i + 1}</span>
				</div>
			{/each}
		</div>

		<button class="close" onclick={onClose} aria-label="Close">×</button>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 56;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: rgba(6, 4, 16, 0.72);
		backdrop-filter: blur(6px);
	}
	.dialog {
		position: relative;
		width: min(760px, 100%);
		max-height: 84vh;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		padding: 1.75rem;
		border-radius: 16px;
		background: linear-gradient(150deg, #23242e, #16171d);
		border: 1px solid rgba(255, 255, 255, 0.09);
		box-shadow: 0 40px 90px rgba(0, 0, 0, 0.6);
		color: #ece9f7;
	}
	.head {
		display: flex;
		align-items: baseline;
		gap: 0.9rem;
		flex-wrap: wrap;
	}
	h2 {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 700;
	}
	.hint {
		font-size: 0.8rem;
		opacity: 0.6;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
		gap: 0.7rem;
		overflow-y: auto;
		padding: 0.15rem;
	}
	.slot {
		position: relative;
		padding: 0.35rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.03);
		cursor: grab;
		transition:
			border-color 0.15s,
			background 0.15s,
			transform 0.15s;
	}
	.slot:hover {
		border-color: rgba(var(--accent-rgb), 0.55);
	}
	.slot:active {
		cursor: grabbing;
	}
	.slot.current {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.12);
	}
	.slot.dragging {
		opacity: 0.4;
	}
	.slot.over {
		border-color: #f0c85a;
		background: rgba(240, 200, 90, 0.16);
		transform: scale(1.04);
	}
	.mini {
		position: relative;
		aspect-ratio: 3 / 4;
		border-radius: 6px;
		background: linear-gradient(160deg, #0b0c11, #070809);
		overflow: hidden;
	}
	.pocket {
		position: absolute;
		width: 33.333%;
		height: 33.333%;
		border: 1px dashed rgba(255, 255, 255, 0.09);
	}
	.cell {
		position: absolute;
		padding: 4%;
	}
	.cell img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 2px;
	}
	.blank {
		display: block;
		width: 100%;
		height: 100%;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.18);
	}
	.num {
		display: block;
		margin-top: 0.3rem;
		text-align: center;
		font-size: 0.72rem;
		font-weight: 700;
		opacity: 0.65;
		font-variant-numeric: tabular-nums;
	}
	.slot.current .num {
		opacity: 1;
		color: #d1f6ef;
	}
	.close {
		position: absolute;
		top: 0.6rem;
		right: 0.6rem;
		width: 32px;
		height: 32px;
		border: 0;
		border-radius: 50%;
		font-size: 1.3rem;
		line-height: 1;
		color: #fff;
		background: rgba(255, 255, 255, 0.1);
		cursor: pointer;
	}
	.close:hover {
		background: rgba(255, 255, 255, 0.22);
	}
</style>
