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
	const STEP = 26;
	const MAX = 40;

	let balls = $state<Ball[]>([]);
	let nid = 0;

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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
			const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
			if (dist < STEP) return;
			lastX = e.clientX;
			lastY = e.clientY;

			const b: Ball = {
				id: nid++,
				x: e.clientX,
				y: e.clientY,
				size: 9 + Math.random() * 6,
				dx: (Math.random() - 0.5) * 70,
				fall: 130 + Math.random() * 130,
				rot: 180 + Math.random() * 400,
				dur: 900 + Math.random() * 600
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
			style="left:{b.x - b.size / 2}px; top:{b.y - b.size / 2}px; width:{b.size}px; height:{b.size}px;
			       --dx:{b.dx}px; --fall:{b.fall}px; --rot:{b.rot}deg; --dur:{b.dur}ms"
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
		z-index: 3;
		pointer-events: none;
		overflow: hidden;
	}
	/* centred via left/top in the inline style, NOT a % margin
	   (a % margin resolves against the parent's width, not the ball's) */
	.ball {
		position: absolute;
		will-change: transform, opacity;
		animation: drop var(--dur) cubic-bezier(0.35, 0, 0.7, 1) forwards;
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
			transform: translate3d(calc(var(--dx) * 0.12), calc(var(--fall) * 0.04), 0) rotate(calc(var(--rot) * 0.12))
				scale(1);
			opacity: 1;
		}
		100% {
			transform: translate3d(var(--dx), var(--fall), 0) rotate(var(--rot)) scale(0.75);
			opacity: 0;
		}
	}
	/* no cursor on touch devices */
	@media (hover: none) {
		.trail {
			display: none;
		}
	}
</style>
