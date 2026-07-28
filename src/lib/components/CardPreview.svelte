<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import type { PokemonCard } from '$lib/types';
	import { seriesColor, seriesLabel, rarityColor } from '$lib/cardStyle';
	import { eraLogo, setLogo } from '$lib/cardApi';
	import Card from './Card.svelte';

	let { card, onClose }: { card: PokemonCard; onClose: () => void } = $props();

	let holoOn = $state(true);

	const era = $derived(eraLogo(card.series));
	const logo = $derived(setLogo(card.series, card.setId));

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	// 61 sets and 3 eras have no logo on the CDN -> just drop the image
	function hide(e: Event) {
		(e.currentTarget as HTMLImageElement).style.display = 'none';
	}
</script>

<svelte:window onkeydown={onKey} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="backdrop" transition:fade={{ duration: 180 }} onclick={onClose} role="presentation">
	<div
		class="dialog cur-ball"
		transition:scale={{ duration: 220, start: 0.92 }}
		onclick={(e) => e.stopPropagation()}
		role="dialog"
		aria-modal="true"
		aria-label={card.name}
		tabindex="-1"
	>
		{#if logo || era}
			<div class="logos" style="--c:{seriesColor(card.series)}">
				{#if logo}
					<img class="setlogo" src={logo} alt={card.set ?? ''} onerror={hide} />
				{/if}
				{#if era}
					<img class="eralogo" src={era} alt={seriesLabel(card.series)} onerror={hide} />
				{/if}
			</div>
		{/if}

		<div class="stage">
			<Card {card} showHolo={holoOn} />
		</div>

		<div class="meta">
			<div class="title">{card.name}</div>

			<div class="badges">
				{#if card.set}
					<span
						class="badge"
						style="--c:{seriesColor(card.series)}"
						title={seriesLabel(card.series)}>{card.set}</span
					>
				{/if}
				{#if card.rarity}
					<span class="badge" style="--c:{rarityColor(card.rarity)}">{card.rarity}</span>
				{/if}
				{#if card.number}
					<span class="badge num">#{card.number}</span>
				{/if}
			</div>

			<button class="holo-btn" class:on={holoOn} onclick={() => (holoOn = !holoOn)}>✨ Holo</button>
		</div>

		<button class="close" onclick={onClose} aria-label="Close">×</button>
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
		padding: 1.5rem 2.5rem;
		border-radius: 16px;
		background: linear-gradient(150deg, #23242e, #16171d);
		border: 1px solid rgba(255, 255, 255, 0.09);
		box-shadow: 0 40px 90px rgba(0, 0, 0, 0.6);
	}
	/* set + era logo strip, tinted glow in the era colour */
	.logos {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.9rem;
		width: 100%;
		padding: 0.15rem 0 0.35rem;
		border-bottom: 1px solid color-mix(in srgb, var(--c) 28%, transparent);
	}
	.logos img {
		max-width: 100%;
		object-fit: contain;
		filter: drop-shadow(0 2px 8px color-mix(in srgb, var(--c) 55%, transparent));
	}
	.setlogo {
		max-height: 52px;
	}
	.eralogo {
		max-height: 26px;
		opacity: 0.55;
	}
	.stage {
		width: min(400px, 82vw);
	}
	.meta {
		text-align: center;
		color: #ece9f7;
	}
	.title {
		font-size: 1.15rem;
		font-weight: 700;
	}
	.badges {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.35rem;
		margin-top: 0.5rem;
	}
	/* --c is the era / rarity colour, used for text + a tinted pill */
	.badge {
		padding: 0.22rem 0.6rem;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--c);
		background: color-mix(in srgb, var(--c) 16%, transparent);
		border: 1px solid color-mix(in srgb, var(--c) 45%, transparent);
	}
	.badge.num {
		--c: #9aa3ad;
		font-weight: 500;
	}
	.holo-btn {
		margin-top: 0.9rem;
		padding: 0.5rem 1rem;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: #d8d2f0;
		cursor: pointer;
		font-size: 0.85rem;
	}
	.holo-btn:hover {
		border-color: var(--accent);
	}
	.holo-btn.on {
		background: rgba(var(--accent-rgb), 0.18);
		border-color: var(--accent);
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
		transition: background 0.2s;
	}
	.close:hover {
		background: rgba(255, 255, 255, 0.22);
	}
</style>
