<script lang="ts">
	import type { PokemonCard } from '$lib/types';

	let {
		card,
		interactive = true,
		showHolo = true
	}: { card: PokemonCard; interactive?: boolean; showHolo?: boolean } = $props();

	let el = $state<HTMLDivElement>();
	let rx = $state(0); // rotateX (deg)
	let ry = $state(0); // rotateY (deg)
	let px = $state(50); // pointer x (%)
	let py = $state(50); // pointer y (%)
	let active = $state(false);
	let broken = $state(false);

	// holo shine only for foil-ish rarities (and when not disabled, e.g. plain-tilt preview)
	const isHolo = $derived(
		showHolo && /holo|rare|rainbow|galaxy|foil|secret|amazing/i.test(card.rarity ?? '')
	);

	function move(e: PointerEvent) {
		if (!interactive || !el) return;
		const r = el.getBoundingClientRect();
		const x = (e.clientX - r.left) / r.width;
		const y = (e.clientY - r.top) / r.height;
		px = x * 100;
		py = y * 100;
		ry = (x - 0.5) * 28;
		rx = (0.5 - y) * 28;
		active = true;
	}

	function leave() {
		active = false;
		rx = 0;
		ry = 0;
		px = 50;
		py = 50;
	}
</script>

<div
	class="card"
	class:holo={isHolo}
	class:active
	bind:this={el}
	onpointermove={move}
	onpointerleave={leave}
	style="--rx:{rx}deg; --ry:{ry}deg; --px:{px}%; --py:{py}%;"
	role="img"
	aria-label={card.name}
>
	<div class="card__inner">
		{#if card.image && !broken}
			<img
				class="card__art"
				src={card.image}
				alt={card.name}
				draggable="false"
				onerror={() => (broken = true)}
			/>
		{:else}
			<div class="card__placeholder">
				<span class="card__name">{card.name}</span>
				<span class="card__rarity">{card.rarity ?? ''}</span>
			</div>
		{/if}
		<div class="card__glare"></div>
		<div class="card__holo"></div>
	</div>
</div>

<style>
	.card {
		position: relative;
		aspect-ratio: 63 / 88;
		width: 100%;
		perspective: 900px;
		touch-action: none;
	}
	.card__inner {
		position: absolute;
		inset: 0;
		border-radius: 6% / 4%;
		overflow: hidden;
		transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
		transform-style: preserve-3d;
		transition: transform 0.4s ease;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.45);
		background: #1b1140;
	}
	.card.active .card__inner {
		transition: transform 0.08s ease-out;
	}
	.card__art {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		user-select: none;
		-webkit-user-drag: none;
	}
	.card__placeholder {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 1rem;
		text-align: center;
		color: #fff;
		background: radial-gradient(120% 120% at 50% 0%, #3a2a7a 0%, #201646 60%, #140d2e 100%);
	}
	.card__name {
		font-weight: 700;
		font-size: 1rem;
	}
	.card__rarity {
		font-size: 0.7rem;
		opacity: 0.65;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	/* glare follows the pointer */
	.card__glare {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			circle at var(--px, 50%) var(--py, 50%),
			rgba(255, 255, 255, 0.55),
			rgba(255, 255, 255, 0) 45%
		);
		mix-blend-mode: overlay;
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
	}
	.card.active .card__glare {
		opacity: 1;
	}

	/* rainbow foil, holo cards only */
	.card__holo {
		position: absolute;
		inset: 0;
		opacity: 0;
		pointer-events: none;
		background-image: repeating-linear-gradient(
			115deg,
			rgba(255, 0, 132, 0.5) 0%,
			rgba(255, 235, 0, 0.5) 12%,
			rgba(0, 255, 170, 0.5) 24%,
			rgba(0, 170, 255, 0.5) 36%,
			rgba(190, 0, 255, 0.5) 48%,
			rgba(255, 0, 132, 0.5) 60%
		);
		background-size: 300% 300%;
		background-position: var(--px, 50%) var(--py, 50%);
		mix-blend-mode: color-dodge;
		filter: brightness(0.9) contrast(1.4);
		transition: opacity 0.3s ease;
	}
	.card.holo.active .card__holo {
		opacity: 0.55;
	}
</style>
