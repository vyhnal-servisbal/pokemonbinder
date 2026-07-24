<script lang="ts">
	import { store } from '$lib/binderStore.svelte';
	import BinderPage from './BinderPage.svelte';

	const left = $derived(store.binder.sides[store.index]);
	const right = $derived(store.view === 'spread' ? store.binder.sides[store.index + 1] : undefined);
</script>

<div class="binder">
	<button
		class="nav"
		onclick={() => store.prev()}
		disabled={!store.canPrev}
		aria-label="Predchádzajúca strana">‹</button
	>

	<div class="spread" class:spread--single={store.view === 'single'}>
		{#if left}
			<div class="leaf"><BinderPage side={left} /></div>
		{/if}
		{#if right}
			<div class="leaf"><BinderPage side={right} /></div>
		{/if}
	</div>

	<button class="nav" onclick={() => store.next()} disabled={!store.canNext} aria-label="Ďalšia strana"
		>›</button
	>
</div>

<style>
	.binder {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.25rem;
		width: 100%;
	}
	.spread {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.75rem;
		flex: 1;
		min-width: 0;
		padding: 1.5rem;
		border-radius: 18px;
		background: linear-gradient(145deg, #2c2150, #1a1233);
		box-shadow: 0 30px 70px rgba(0, 0, 0, 0.55);
		position: relative;
	}
	.spread--single {
		grid-template-columns: 1fr;
		max-width: 560px;
		margin: 0 auto;
	}
	.spread:not(.spread--single)::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 5%;
		bottom: 5%;
		width: 16px;
		transform: translateX(-50%);
		background: repeating-linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0.25) 0 7px,
			transparent 7px 26px
		);
		border-radius: 8px;
		opacity: 0.5;
	}
	.leaf {
		min-width: 0;
	}
	.nav {
		flex: none;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		border: none;
		font-size: 1.9rem;
		line-height: 1;
		color: #fff;
		background: rgba(255, 255, 255, 0.08);
		cursor: pointer;
		transition: background 0.2s;
	}
	.nav:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
	}
	.nav:disabled {
		opacity: 0.25;
		cursor: default;
	}
</style>
