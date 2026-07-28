<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { store, MIN_PAGES } from '$lib/binderStore.svelte';
	import type { BinderSide, PlacedItem } from '$lib/types';

	let { onClose }: { onClose: () => void } = $props();

	let dragFrom = $state<number | null>(null);
	let over = $state<number | null>(null);
	let confirming = $state<number | null>(null);

	// pages shown as they sit in the binder: 1-2 together, 3-4 together, ...
	const spreads = $derived.by(() => {
		const out: { side: BinderSide; i: number }[][] = [];
		const s = store.binder.sides;
		for (let i = 0; i < s.length; i += 2) {
			out.push(s.slice(i, i + 2).map((side, k) => ({ side, i: i + k })));
		}
		return out;
	});

	const canDelete = $derived(store.binder.sides.length > MIN_PAGES);

	// binder cards hold the full ~900kB image; previews swap it for the small one
	function thumb(item: PlacedItem): string | undefined {
		const url = item.type === 'card' ? item.card?.image : item.imageUrl;
		return url?.replace('/high.png', '/low.webp');
	}

	// same geometry as a real page: each pocket is a third in both axes
	function pos(it: PlacedItem) {
		return `left:${(it.col * 100) / 3}%; top:${(it.row * 100) / 3}%; width:${(it.colSpan * 100) / 3}%; height:${(it.rowSpan * 100) / 3}%;`;
	}

	function isOpen(i: number) {
		return i === store.index || (store.view === 'spread' && i === store.index + 1);
	}

	function drop(to: number) {
		if (dragFrom !== null) store.swapPages(dragFrom, to);
		dragFrom = null;
		over = null;
	}

	function jump(i: number) {
		if (confirming !== null) return;
		store.goToPage(i);
		onClose();
	}

	function askDelete(e: MouseEvent, i: number) {
		e.stopPropagation();
		confirming = confirming === i ? null : i;
	}

	function doDelete(e: MouseEvent, i: number) {
		e.stopPropagation();
		store.deletePage(i);
		confirming = null;
	}

	function onKey(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		if (confirming !== null) confirming = null;
		else onClose();
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

		<div class="spreads">
			{#each spreads as spread (spread[0].side.id)}
				<div class="spread">
					{#each spread as p (p.side.id)}
						{@const cards = p.side.items.length}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="slot"
							class:current={isOpen(p.i)}
							class:dragging={dragFrom === p.i}
							class:over={over === p.i && dragFrom !== null && dragFrom !== p.i}
							draggable={confirming === null}
							role="button"
							tabindex="0"
							ondragstart={(e) => {
								dragFrom = p.i;
								if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
							}}
							ondragend={() => {
								dragFrom = null;
								over = null;
							}}
							ondragover={(e) => {
								e.preventDefault();
								over = p.i;
							}}
							ondragleave={() => {
								if (over === p.i) over = null;
							}}
							ondrop={(e) => {
								e.preventDefault();
								drop(p.i);
							}}
							onclick={() => jump(p.i)}
							onkeydown={(e) => e.key === 'Enter' && jump(p.i)}
						>
							<div class="mini">
								{#each [0, 1, 2] as r (r)}
									{#each [0, 1, 2] as c (c)}
										<span class="pocket" style="left:{(c * 100) / 3}%; top:{(r * 100) / 3}%"></span>
									{/each}
								{/each}

								{#each p.side.items as it (it.id)}
									{@const src = thumb(it)}
									<span class="cell" style={pos(it)}>
										{#if src}
											<img {src} alt="" loading="lazy" draggable="false" />
										{:else}
											<span class="blank"></span>
										{/if}
									</span>
								{/each}

								<!-- two steps on purpose, so a page never goes by accident -->
								{#if confirming === p.i}
									<div class="confirm" transition:fade={{ duration: 120 }}>
										<p>Delete page {p.i + 1}?</p>
										{#if cards}<small>{cards} item{cards > 1 ? 's' : ''} will be lost</small>{/if}
										<div class="cbtns">
											<button class="yes" onclick={(e) => doDelete(e, p.i)}>Delete</button>
											<button class="no" onclick={(e) => askDelete(e, p.i)}>Keep</button>
										</div>
									</div>
								{/if}
							</div>

							{#if canDelete}
								<button
									class="del"
									class:armed={confirming === p.i}
									onclick={(e) => askDelete(e, p.i)}
									title="Delete page"
									aria-label="Delete page {p.i + 1}">✕</button
								>
							{/if}

							<span class="num">{p.i + 1}</span>
						</div>
					{/each}

					{#if spread.length === 1}
						<div class="slot empty" aria-hidden="true"><div class="mini"></div><span class="num"
							>&nbsp;</span
						></div>
					{/if}
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
		width: min(820px, 100%);
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

	/* one .spread = one open binder (pages 1-2, 3-4, ...) */
	.spreads {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5rem 2rem;
		overflow-y: auto;
		padding: 0.15rem;
	}
	.spread {
		position: relative;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.55rem;
		padding: 0.4rem;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.06);
	}
	/* thin spine down the middle of each spread */
	.spread::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 12%;
		bottom: 12%;
		width: 1px;
		transform: translateX(-50%);
		background: rgba(255, 255, 255, 0.22);
		pointer-events: none;
	}

	.slot {
		position: relative;
		padding: 0.3rem;
		border-radius: 9px;
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
	/* filler so an odd last page keeps the spread the same width */
	.slot.empty {
		border-style: dashed;
		border-color: rgba(255, 255, 255, 0.07);
		background: none;
		cursor: default;
		pointer-events: none;
	}
	.slot.empty .mini {
		background: rgba(255, 255, 255, 0.015);
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

	.del {
		position: absolute;
		top: 0.05rem;
		right: 0.05rem;
		width: 20px;
		height: 20px;
		border: 0;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.62);
		color: #fff;
		font-size: 0.62rem;
		line-height: 1;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.15s;
	}
	.slot:hover .del,
	.del.armed {
		opacity: 1;
	}
	.del:hover,
	.del.armed {
		background: rgba(200, 50, 70, 0.95);
	}

	.confirm {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		padding: 0.4rem;
		text-align: center;
		background: rgba(10, 6, 14, 0.92);
	}
	.confirm p {
		margin: 0;
		font-size: 0.74rem;
		font-weight: 700;
	}
	.confirm small {
		font-size: 0.62rem;
		opacity: 0.65;
		line-height: 1.2;
	}
	.cbtns {
		display: flex;
		gap: 0.3rem;
		margin-top: 0.15rem;
	}
	.cbtns button {
		padding: 0.28rem 0.5rem;
		border-radius: 7px;
		border: 1px solid rgba(255, 255, 255, 0.16);
		font-size: 0.66rem;
		font-weight: 700;
		cursor: pointer;
	}
	.yes {
		background: rgba(200, 50, 70, 0.95);
		border-color: rgba(255, 120, 140, 0.6);
		color: #fff;
	}
	.no {
		background: rgba(255, 255, 255, 0.1);
		color: #ece9f7;
	}

	.num {
		display: block;
		margin-top: 0.28rem;
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
