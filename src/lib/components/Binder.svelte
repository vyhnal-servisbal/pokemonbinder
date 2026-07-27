<script lang="ts">
	import { store } from '$lib/binderStore.svelte';
	import BinderPage from './BinderPage.svelte';

	const isSpread = $derived(store.view === 'spread');
	const left = $derived(store.binder.sides[store.index]);
	const right = $derived(isSpread ? store.binder.sides[store.index + 1] : undefined);

	const counter = $derived.by(() => {
		const n = store.binder.sides.length;
		if (isSpread) {
			const a = store.index + 1;
			const b = Math.min(store.index + 2, n);
			return a === b ? `Strana ${a} / ${n}` : `Strany ${a}–${b} / ${n}`;
		}
		return `Strana ${store.index + 1} / ${n}`;
	});
</script>

<div class="binder-wrap">
	<div class="binder">
		<button
			class="nav"
			onclick={() => store.prev()}
			disabled={!store.canPrev}
			aria-label="Predchádzajúca strana">‹</button
		>

		{#key store.index}
			<div class="spread" class:paired={!!right}>
				{#if left}<div class="half"><BinderPage side={left} /></div>{/if}
				{#if right}<div class="half"><BinderPage side={right} /></div>{/if}
			</div>
		{/key}

		<button class="nav" onclick={() => store.nextOrAdd()} aria-label="Ďalšia strana (na konci pridá stranu)"
			>›</button
		>
	</div>

	<div class="pager">
		<span class="count">{counter}</span>
		<button class="trim" onclick={() => store.trimEmptyPages()} disabled={!store.lastEmpty}>
			🧹 Odobrať prázdne strany
		</button>
	</div>
</div>

<style>
	.binder-wrap {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}
	.binder {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		width: 100%;
	}
	.spread {
		position: relative;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		gap: 1.75rem;
		flex: 0 1 auto;
		min-width: 0;
		max-width: 100%;
		padding: 1.5rem;
		border-radius: 24px;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 20%),
			linear-gradient(160deg, #2c2f3a, #1e2029);
		border: 1px solid rgba(255, 255, 255, 0.14);
		box-shadow:
			0 45px 100px rgba(0, 0, 0, 0.8),
			inset 0 1px 0 rgba(255, 255, 255, 0.12);
		/* subtle flash + fade whenever the page changes */
		animation: page-flash 0.22s ease-out;
	}
	/* fixed page width so a single page matches each page of a spread (no size jump) */
	.half {
		flex: 0 1 410px;
		min-width: 0;
	}
	/* binder rings only when two pages are shown */
	.spread.paired::before {
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

	/* tall, elongated side buttons */
	.nav {
		flex: none;
		align-self: stretch;
		width: 56px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 16px;
		font-size: 2rem;
		line-height: 1;
		color: #fff;
		background: rgba(255, 255, 255, 0.04);
		cursor: pointer;
		transition:
			background 0.2s,
			border-color 0.2s;
	}
	.nav:hover:not(:disabled) {
		background: rgba(var(--accent-rgb), 0.16);
		border-color: var(--accent);
	}
	.nav:disabled {
		opacity: 0.25;
		cursor: default;
	}

	.pager {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.count {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.65);
		font-variant-numeric: tabular-nums;
	}
	.trim {
		padding: 0.45rem 0.9rem;
		border-radius: 12px;
		border: 1px solid rgba(var(--accent-rgb), 0.35);
		background: rgba(var(--accent-rgb), 0.12);
		color: #d1f6ef;
		cursor: pointer;
		font-size: 0.78rem;
		transition:
			background 0.2s,
			border-color 0.2s;
	}
	.trim:hover:not(:disabled) {
		background: rgba(var(--accent-rgb), 0.22);
		border-color: var(--accent);
	}
	.trim:disabled {
		opacity: 0.35;
		cursor: default;
		border-color: rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: #d8d2f0;
	}
</style>
