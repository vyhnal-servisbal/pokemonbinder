<script lang="ts">
	import { onMount } from 'svelte';

	let x = $state(-1000);
	let y = $state(-1000);
	let visible = $state(false);
	let raf = 0;
	let px = -1000;
	let py = -1000;

	onMount(() => {
		function move(e: PointerEvent) {
			px = e.clientX;
			py = e.clientY;
			visible = true;
			// coalesce many pointer events into one paint per frame -> no lag
			if (!raf) {
				raf = requestAnimationFrame(() => {
					raf = 0;
					x = px;
					y = py;
				});
			}
		}
		function leave() {
			visible = false;
		}
		window.addEventListener('pointermove', move, { passive: true });
		window.addEventListener('pointerleave', leave);
		return () => {
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerleave', leave);
			if (raf) cancelAnimationFrame(raf);
		};
	});
</script>

<div
	class="glow"
	class:on={visible}
	style="transform: translate3d({x}px, {y}px, 0)"
	aria-hidden="true"
></div>

<style>
	.glow {
		position: fixed;
		top: 0;
		left: 0;
		width: 460px;
		height: 460px;
		margin: -230px 0 0 -230px; /* center on the pointer */
		border-radius: 50%;
		pointer-events: none;
		z-index: 3;
		opacity: 0;
		background: radial-gradient(
			closest-side,
			rgba(var(--accent-rgb), 0.14),
			rgba(var(--accent-rgb), 0.06) 45%,
			transparent 70%
		);
		mix-blend-mode: screen;
		/* slight trail = the "fade" feel, GPU transform so it stays smooth */
		transition: opacity 0.25s ease;
		will-change: transform, opacity;
	}
	.glow.on {
		opacity: 1;
	}
	/* no cursor on touch devices */
	@media (hover: none) {
		.glow {
			display: none;
		}
	}
</style>
