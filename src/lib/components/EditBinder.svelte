<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { store, MIN_PAGES } from '$lib/binderStore.svelte';

	let { onClose }: { onClose: () => void } = $props();

	let pages = $state(store.pageCount);

	function apply() {
		store.setPageCount(pages);
		pages = store.pageCount; // reflect clamping / trim
	}

	function bump(delta: number) {
		pages = Math.max(MIN_PAGES, pages + delta);
		apply();
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
		aria-label="Upraviť binder"
		tabindex="-1"
	>
		<h2>Upraviť binder</h2>

		<label class="field">
			<span>Názov</span>
			<input type="text" bind:value={store.binder.name} />
		</label>

		<label class="field">
			<span>Počet strán (min {MIN_PAGES})</span>
			<div class="pages">
				<button type="button" onclick={() => bump(-1)}>-</button>
				<input type="number" min={MIN_PAGES} bind:value={pages} onchange={apply} />
				<button type="button" onclick={() => bump(1)}>+</button>
			</div>
		</label>

		<label class="field">
			<span>Farba binderu</span>
			<div class="colors">
				<input
					type="color"
					value={store.binder.inside ?? '#0e0f14'}
					oninput={(e) => (store.binder.inside = e.currentTarget.value)}
					aria-label="Farba binderu"
				/>
				<button
					type="button"
					class="creset"
					onclick={() => (store.binder.inside = undefined)}>Reset na pôvodnú</button
				>
			</div>
		</label>

		<p class="note">
			Strany navyše sa pridajú prázdne. Uberať sa dajú len prázdne strany z konca, karty sa nezmažú.
		</p>

		<button class="close" onclick={onClose} aria-label="Zavrieť">×</button>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: rgba(6, 4, 16, 0.72);
		backdrop-filter: blur(6px);
	}
	.dialog {
		position: relative;
		width: min(360px, 100%);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.75rem;
		border-radius: 16px;
		background: linear-gradient(150deg, #23242e, #16171d);
		box-shadow: 0 40px 90px rgba(0, 0, 0, 0.6);
		color: #ece9f7;
	}
	h2 {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 700;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		font-size: 0.85rem;
	}
	.field span {
		opacity: 0.7;
	}
	.field input[type='text'] {
		padding: 0.6rem 0.7rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: rgba(0, 0, 0, 0.25);
		color: #fff;
		font-size: 0.9rem;
	}
	.field input:focus {
		outline: none;
		border-color: var(--accent);
	}
	.pages {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.pages input {
		flex: 1;
		text-align: center;
		padding: 0.6rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: rgba(0, 0, 0, 0.25);
		color: #fff;
		font-size: 1rem;
	}
	.pages button {
		width: 40px;
		height: 40px;
		border: 0;
		border-radius: 10px;
		font-size: 1.3rem;
		color: #fff;
		background: rgba(255, 255, 255, 0.08);
		cursor: pointer;
	}
	.pages button:hover {
		background: rgba(var(--accent-rgb), 0.3);
	}
	.colors {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		flex-wrap: wrap;
	}
	.colors input[type='color'] {
		width: 44px;
		height: 32px;
		padding: 0;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 8px;
		background: none;
		cursor: pointer;
	}
	.creset {
		padding: 0.4rem 0.7rem;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(255, 255, 255, 0.06);
		color: #d8d2f0;
		cursor: pointer;
		font-size: 0.75rem;
	}
	.creset:hover {
		background: rgba(255, 255, 255, 0.12);
	}
	.note {
		margin: 0;
		font-size: 0.72rem;
		opacity: 0.5;
		line-height: 1.4;
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
		color: #fff;
		background: rgba(255, 255, 255, 0.1);
		cursor: pointer;
	}
	.close:hover {
		background: rgba(255, 255, 255, 0.22);
	}
</style>
