<script lang="ts">
	import { buddies, type Buddy } from '$lib/buddyStore.svelte';

	interface Particle {
		id: number;
		fx: string;
		x: number;
		y: number;
		dx: number;
		dur: number;
	}

	let particles = $state<Particle[]>([]);
	let pid = 0;

	// pyramid rows: 1, 2, 3, ... (widest at the bottom)
	const rows = $derived.by(() => {
		const out: Buddy[][] = [];
		let i = 0;
		let size = 1;
		while (i < buddies.list.length) {
			out.push(buddies.list.slice(i, i + size));
			i += size;
			size++;
		}
		return out;
	});

	function poke(b: Buddy, e: MouseEvent) {
		buddies.poke(b.name); // every 10th poke triggers an evolution
		const btn = e.currentTarget as HTMLElement;
		const r = btn.getBoundingClientRect();
		const cx = r.left + r.width / 2;
		const cy = r.top + r.height / 2;
		const batch: Particle[] = Array.from({ length: 7 }, () => ({
			id: pid++,
			fx: b.fx,
			x: cx,
			y: cy,
			dx: (Math.random() - 0.5) * 60,
			dur: 850 + Math.random() * 650
		}));
		particles = [...particles, ...batch];
		btn.animate(
			[
				{ transform: 'translateY(0) scale(1)' },
				{ transform: 'translateY(-14px) scale(1.08)', offset: 0.3 },
				{ transform: 'translateY(0) scale(0.96)', offset: 0.6 },
				{ transform: 'translateY(0) scale(1)' }
			],
			{ duration: 500, easing: 'ease-out' }
		);
		const ids = new Set(batch.map((p) => p.id));
		setTimeout(() => (particles = particles.filter((p) => !ids.has(p.id))), 1700);
	}

	function onErr(e: Event, b: Buddy) {
		const img = e.currentTarget as HTMLImageElement;
		if (!img.dataset.fb) {
			img.dataset.fb = '1';
			img.src = `https://play.pokemonshowdown.com/sprites/gen5${b.shiny ? '-shiny' : ''}/${b.name}.png`;
		}
	}
</script>

<div class="pyramid">
	{#each rows as row, ri (ri)}
		<div class="prow">
			{#each row as b (b.name)}
				<button
					class="sprite-btn"
					class:evolving={buddies.evolving === b.name}
					class:justshiny={buddies.lastShiny === b.name}
					style="--glow:{b.color}"
					onclick={(e) => poke(b, e)}
					title={b.label}
					aria-label={b.label}
				>
					<span class="glow"></span>
					<img
						class="sprite"
						src="https://play.pokemonshowdown.com/sprites/{b.shiny ? 'ani-shiny' : 'ani'}/{b.name}.gif"
						alt={b.label}
						draggable="false"
						onerror={(e) => onErr(e, b)}
					/>
				</button>
			{/each}
		</div>
	{/each}
</div>

<div class="fx-overlay" aria-hidden="true">
	{#each particles as p (p.id)}
		<span class="particle" style="left:{p.x}px; top:{p.y}px; --dx:{p.dx}px; --dur:{p.dur}ms;"
			>{p.fx}</span
		>
	{/each}
</div>

<style>
	.pyramid {
		position: fixed;
		right: 1rem;
		bottom: 1rem;
		z-index: 30;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.15rem;
	}
	.prow {
		display: flex;
		gap: 0.15rem;
	}
	.sprite-btn {
		position: relative;
		width: 64px;
		height: 64px;
		border: 0;
		background: none;
		padding: 0;
		cursor: pointer;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}
	.glow {
		position: absolute;
		inset: 18%;
		border-radius: 50%;
		background: radial-gradient(closest-side, var(--glow), transparent 72%);
		opacity: 0.25;
		filter: blur(8px);
		pointer-events: none;
	}
	.sprite {
		max-width: 100%;
		max-height: 100%;
		image-rendering: pixelated;
		filter: drop-shadow(0 4px 5px rgba(0, 0, 0, 0.5));
		animation: bob 3.2s ease-in-out infinite;
	}
	@keyframes bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-4px);
		}
	}
	/* classic evolution look: sprite burns out to a white silhouette and pulses */
	.evolving .sprite {
		animation: evolve 0.5s ease-in-out infinite alternate;
	}
	@keyframes evolve {
		0% {
			filter: brightness(1);
			transform: scale(1);
		}
		100% {
			filter: brightness(0) invert(1) drop-shadow(0 0 10px #fff);
			transform: scale(1.22);
		}
	}
	/* rolled shiny on add -> golden ring pulse */
	.justshiny::after {
		content: '';
		position: absolute;
		inset: -6%;
		border-radius: 50%;
		border: 2px solid rgba(240, 200, 90, 0.9);
		box-shadow: 0 0 18px rgba(240, 200, 90, 0.75);
		animation: shinyring 1.1s ease-out infinite;
		pointer-events: none;
	}
	@keyframes shinyring {
		0% {
			transform: scale(0.7);
			opacity: 0;
		}
		35% {
			opacity: 1;
		}
		100% {
			transform: scale(1.35);
			opacity: 0;
		}
	}
	.fx-overlay {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 31;
	}
	.particle {
		position: absolute;
		font-size: 1.1rem;
		transform: translate(-50%, -50%);
		animation: float var(--dur) ease-out forwards;
	}
	@keyframes float {
		0% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.6);
		}
		18% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate(calc(-50% + var(--dx)), calc(-50% - 90px)) scale(1.15);
		}
	}
</style>
