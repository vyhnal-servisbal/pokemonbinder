<script lang="ts">
	interface Buddy {
		name: string; // sprite filename
		id: number; // PokeAPI id (fallback sprite)
		label: string;
		fx: string; // particle emoji
		color: string; // glow color
	}

	const roster: Buddy[] = [
		{ name: 'eevee', id: 133, label: 'Eevee', fx: '✨', color: '#d8b48a' },
		{ name: 'vaporeon', id: 134, label: 'Vaporeon', fx: '💧', color: '#5aa9e6' },
		{ name: 'jolteon', id: 135, label: 'Jolteon', fx: '⚡', color: '#f5d94e' },
		{ name: 'flareon', id: 136, label: 'Flareon', fx: '🔥', color: '#f0803c' },
		{ name: 'espeon', id: 196, label: 'Espeon', fx: '🔮', color: '#e77fb3' },
		{ name: 'umbreon', id: 197, label: 'Umbreon', fx: '🌙', color: '#f5d94e' },
		{ name: 'leafeon', id: 470, label: 'Leafeon', fx: '🍃', color: '#8bd05a' },
		{ name: 'glaceon', id: 471, label: 'Glaceon', fx: '❄️', color: '#a9e3f0' },
		{ name: 'sylveon', id: 700, label: 'Sylveon', fx: '💕', color: '#f5a9d0' },
		{ name: 'doublade', id: 680, label: 'Doublade', fx: '⚔️', color: '#8fa3c8' },
		{ name: 'bulbasaur', id: 1, label: 'Bulbasaur', fx: '🌿', color: '#7fc97f' },
		{ name: 'ivysaur', id: 2, label: 'Ivysaur', fx: '🌸', color: '#f0a9c8' },
		{ name: 'venusaur', id: 3, label: 'Venusaur', fx: '🌺', color: '#e86fa0' },
		{ name: 'snorlax', id: 143, label: 'Snorlax', fx: '💤', color: '#8fb0c8' }
	];

	interface Particle {
		id: number;
		fx: string;
		x: number;
		dx: number;
		dur: number;
		delay: number;
	}

	let index = $state(0);
	let stage = $state<'ani' | 'png' | 'broken'>('ani');
	let btnEl = $state<HTMLButtonElement>();
	let particles = $state<Particle[]>([]);
	let pid = 0;

	const current = $derived(roster[index]);
	const spriteUrl = $derived(
		stage === 'ani'
			? `https://play.pokemonshowdown.com/sprites/ani/${current.name}.gif`
			: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${current.id}.png`
	);

	function onImgError() {
		stage = stage === 'ani' ? 'png' : 'broken';
	}

	function poke() {
		const fx = current.fx;
		const batch: Particle[] = Array.from({ length: 8 }, () => ({
			id: pid++,
			fx,
			x: 15 + Math.random() * 70,
			dx: (Math.random() - 0.5) * 70,
			dur: 900 + Math.random() * 800,
			delay: Math.random() * 220
		}));
		particles = [...particles, ...batch];

		btnEl?.animate(
			[
				{ transform: 'translateY(0) scale(1)' },
				{ transform: 'translateY(-16px) scale(1.07)', offset: 0.3 },
				{ transform: 'translateY(0) scale(0.96)', offset: 0.6 },
				{ transform: 'translateY(0) scale(1)' }
			],
			{ duration: 520, easing: 'ease-out' }
		);

		const ids = new Set(batch.map((b) => b.id));
		setTimeout(() => (particles = particles.filter((p) => !ids.has(p.id))), 2100);
		setTimeout(() => {
			index = (index + 1) % roster.length;
			stage = 'ani';
		}, 1050);
	}
</script>

<div class="buddy" style="--glow: {current.color}">
	<div class="glow"></div>

	<div class="fx">
		{#each particles as p (p.id)}
			<span
				class="particle"
				style="left:{p.x}%; --dx:{p.dx}px; --dur:{p.dur}ms; animation-delay:{p.delay}ms;"
				>{p.fx}</span
			>
		{/each}
	</div>

	<button
		bind:this={btnEl}
		class="sprite-btn"
		onclick={poke}
		title="{current.label} — klikni ma!"
		aria-label={current.label}
	>
		{#if stage === 'broken'}
			<span class="fallback">{current.fx}</span>
		{:else}
			<img
				class="sprite"
				src={spriteUrl}
				alt={current.label}
				draggable="false"
				onerror={onImgError}
			/>
		{/if}
	</button>
</div>

<style>
	.buddy {
		position: fixed;
		right: 1.1rem;
		bottom: 1.1rem;
		z-index: 30;
		width: 128px;
		height: 128px;
		pointer-events: none;
	}
	.glow {
		position: absolute;
		inset: 14%;
		border-radius: 50%;
		background: radial-gradient(closest-side, var(--glow), transparent 72%);
		opacity: 0.28;
		filter: blur(10px);
		pointer-events: none;
	}
	.fx {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: visible;
	}
	.particle {
		position: absolute;
		bottom: 55%;
		font-size: 1.15rem;
		will-change: transform, opacity;
		animation: float var(--dur) ease-out forwards;
	}
	@keyframes float {
		0% {
			opacity: 0;
			transform: translate(0, 0) scale(0.6);
		}
		18% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate(var(--dx), -95px) scale(1.15);
		}
	}
	.sprite-btn {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		border: 0;
		background: none;
		padding: 0;
		cursor: pointer;
		pointer-events: auto;
	}
	.sprite {
		max-width: 100%;
		max-height: 100%;
		image-rendering: pixelated;
		filter: drop-shadow(0 6px 6px rgba(0, 0, 0, 0.5));
		animation: bob 3.2s ease-in-out infinite;
	}
	@keyframes bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-5px);
		}
	}
	.fallback {
		font-size: 3rem;
		filter: drop-shadow(0 6px 6px rgba(0, 0, 0, 0.5));
	}
	@media (max-width: 600px) {
		.buddy {
			width: 96px;
			height: 96px;
		}
	}
</style>
