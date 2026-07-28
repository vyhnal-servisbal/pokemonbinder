<script lang="ts">
	import { onMount } from 'svelte';

	interface Ball {
		id: number;
		x: number;
		y: number;
		size: number;
		dx: number;
		fall: number;
		rot: number;
		dur: number;
	}

	// spawn one ball per this many px of pointer travel, and never keep more than MAX alive
	const STEP = 18;
	const MAX = 40;

	let balls = $state<Ball[]>([]);
	let nid = 0;

	onMount(() => {
		let lastX = 0;
		let lastY = 0;
		let primed = false;

		function move(e: PointerEvent) {
			if (!primed) {
				lastX = e.clientX;
				lastY = e.clientY;
				primed = true;
				return;
			}
			if (Math.hypot(e.clientX - lastX, e.clientY - lastY) < STEP) return;
			lastX = e.clientX;
			lastY = e.clientY;

			const b: Ball = {
				id: nid++,
				x: e.clientX,
				y: e.clientY,
				size: 14 + Math.random() * 8,
				dx: (Math.random() - 0.5) * 80,
				fall: 150 + Math.random() * 150,
				rot: 180 + Math.random() * 400,
				dur: 950 + Math.random() * 650
			};
			balls = [...balls, b].slice(-MAX);
			setTimeout(() => (balls = balls.filter((x) => x.id !== b.id)), b.dur);
		}

		window.addEventListener('pointermove', move, { passive: true });
		return () => window.removeEventListener('pointermove', move);
	});
</script>

<div class="trail" aria-hidden="true">
	{#each balls as b (b.id)}
		<span
			class="ball"
			style:left="{b.x - b.size / 2}px"
			style:top="{b.y - b.size / 2}px"
			style:width="{b.size}px"
			style:height="{b.size}px"
			style:animation-duration="{b.dur}ms"
			style:--dx="{b.dx}px"
			style:--fall="{b.fall}px"
			style:--rot="{b.rot}deg"
		>
			<svg viewBox="0 0 28 28">
				<circle cx="14" cy="14" r="11" fill="#fff" stroke="#111" stroke-width="2.5" />
				<path d="M3 14a11 11 0 0 1 22 0z" fill="#e0574f" />
				<path d="M3 14h22" stroke="#111" stroke-width="2.5" />
				<circle cx="14" cy="14" r="4" fill="#fff" stroke="#111" stroke-width="2.5" />
			</svg>
		</span>
	{/each}
</div>

<style>
	.trail {
		position: fixed;
		inset: 0;
		/* above the sticky topbar (40) so balls never vanish behind it */
		z-index: 45;
		pointer-events: none;
	}
	/* centred via left/top in the inline style, NOT a % margin
	   (a % margin resolves against the parent's width, not the ball's) */
	.ball {
		position: absolute;
		will-change: transform, opacity;
		/* duration comes from the inline style, so no var() inside the shorthand */
		animation-name: drop;
		animation-timing-function: cubic-bezier(0.35, 0, 0.7, 1);
		animation-fill-mode: forwards;
	}
	.ball svg {
		width: 100%;
		height: 100%;
		display: block;
		filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.45));
	}
	@keyframes drop {
		0% {
			transform: translate3d(0, 0, 0) rotate(0deg) scale(0.5);
			opacity: 0;
		}
		12% {
			transform: translate3d(calc(var(--dx) * 0.12), calc(var(--fall) * 0.04), 0)
				rotate(calc(var(--rot) * 0.12)) scale(1);
			opacity: 1;
		}
		100% {
			transform: translate3d(var(--dx), var(--fall), 0) rotate(var(--rot)) scale(0.75);
			opacity: 0;
		}
	}
	/* touch devices have no cursor to trail */
	@media (hover: none) {
		.trail {
			display: none;
		}
	}
</style>
