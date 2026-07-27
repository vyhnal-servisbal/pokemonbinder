<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import type { PokemonCard } from '$lib/types';
	import Card from './Card.svelte';

	let { card, onClose }: { card: PokemonCard; onClose: () => void } = $props();

	let holoOn = $state(true);

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	const sub = $derived(
		[card.set, card.number ? `#${card.number}` : '', card.rarity].filter(Boolean).join(' · ')
	);
</script>

<svelte:window onkeydown={onKey} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="backdrop" transition:fade={{ duration: 180 }} onclick={onClose} role="presentation">
	<div
		class="dialog"
		transition:scale={{ duration: 220, start: 0.92 }}
		onclick={(e) => e.stopPropagation()}
		role="dialog"
		aria-modal="true"
		aria-label={card.name}
		tabindex="-1"
	>
		<div class="stage">
			<Card {card} showHolo={holoOn} />
		</div>

		<div class="meta">
			<div class="title">{card.name}</div>
			{#if sub}<div class="sub">{sub}</div>{/if}
			<label class="toggle">
				<input type="checkbox" bind:checked={holoOn} />
				<span>Holo efekt</span>
			</label>
		</div>

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
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		border-radius: 16px;
		background: linear-gradient(150deg, #23242e, #16171d);
		border: 1px solid rgba(255, 255, 255, 0.09);
		box-shadow: 0 40px 90px rgba(0, 0, 0, 0.6);
	}
	.stage {
		width: min(340px, 74vw);
	}
	.meta {
		text-align: center;
		color: #ece9f7;
	}
	.title {
		font-size: 1.15rem;
		font-weight: 700;
	}
	.sub {
		font-size: 0.8rem;
		opacity: 0.6;
		margin-top: 0.15rem;
	}
	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		margin-top: 0.9rem;
		font-size: 0.85rem;
		cursor: pointer;
		user-select: none;
	}
	.toggle input {
		width: 1rem;
		height: 1rem;
		accent-color: var(--accent);
		cursor: pointer;
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
		transition: background 0.2s;
	}
	.close:hover {
		background: rgba(255, 255, 255, 0.22);
	}
</style>
