<script lang="ts">
	import { store } from '$lib/binderStore.svelte';
	import BinderPage from './BinderPage.svelte';

	const isSpread = $derived(store.view === 'spread');
	const left = $derived(store.binder.sides[store.index]);
	const right = $derived(isSpread ? store.binder.sides[store.index + 1] : undefined);
</script>

<div class="binder">
	<button
		class="nav"
		onclick={() => store.prev()}
		disabled={!store.canPrev}
		aria-label="Predchádzajúca strana">‹</button
	>

	{#key store.index}
		<div class="spread" class:single={!isSpread}>
			{#if left}<div class="half"><BinderPage side={left} /></div>{/if}
			{#if right}<div class="half"><BinderPage side={right} /></div>{/if}
		</div>
	{/key}

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
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: 1.75rem;
		flex: 1;
		min-width: 0;
		max-width: 900px;
		padding: 1.5rem;
		border-radius: 18px;
		background: linear-gradient(160deg, #20212a, #16171e);
		border: 1px solid rgba(255, 255, 255, 0.09);
		box-shadow: 0 30px 70px rgba(0, 0, 0, 0.65);
		/* subtle flash + fade whenever the page changes */
		animation: page-flash 0.22s ease-out;
	}
	.spread.single {
		max-width: 480px;
		margin: 0 auto;
	}
	.half {
		width: 50%;
		min-width: 0;
	}
	.spread.single .half {
		width: 100%;
	}
	/* binder rings down the middle of the open spread */
	.spread:not(.single)::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 5%;
		bottom: 5%;
		width: 16px;
		transform: translateX(-50%);
		z-index: 5;
		background: repeating-linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0.25) 0 7px,
			transparent 7px 26px
		);
		border-radius: 8px;
		opacity: 0.5;
		pointer-events: none;
	}

	@keyframes page-flash {
		0% {
			opacity: 0.5;
			filter: brightness(1.45);
		}
		100% {
			opacity: 1;
			filter: brightness(1);
		}
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
