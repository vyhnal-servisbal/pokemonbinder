<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { store } from '$lib/binderStore.svelte';

	interface Drop {
		id: number;
		x: number;
		size: number;
		dur: number;
		delay: number;
		rot: number;
	}

	// ArrowUp ArrowUp ArrowDown ArrowDown toggles poop mode
	const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown'];

	let poop = $state(false);
	let toast = $state<string | null>(null);
	let brainrot = $state(false);
	let nice = $state(false);
	let drops = $state<Drop[]>([]);
	let did = 0;

	const cardCount = $derived(
		store.binder.sides.reduce((n, s) => n + s.items.filter((i) => i.type === 'card').length, 0)
	);

	function say(msg: string) {
		toast = msg;
		setTimeout(() => (toast = null), 2400);
	}

	// fire the number gags only on the transition INTO the magic count
	let seen = -1;
	$effect(() => {
		const n = cardCount;
		if (n === seen) return;
		seen = n;
		if (n === 69) {
			nice = true;
			setTimeout(() => (nice = false), 2600);
		} else if (n === 67) {
			brainrot = true;
			setTimeout(() => (brainrot = false), 2400);
		}
	});

	onMount(() => {
		let hit = 0;
		function key(e: KeyboardEvent) {
			const target = e.target as HTMLElement | null;
			if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
			hit = e.key === CODE[hit] ? hit + 1 : e.key === CODE[0] ? 1 : 0;
			if (hit === CODE.length) {
				hit = 0;
				poop = !poop;
				say(poop ? '💩 POOP MODE ON 💩' : 'poop mode off');
			}
		}
		window.addEventListener('keydown', key);

		// keep the rain topped up only while the mode is on
		const timer = setInterval(() => {
			if (!poop) {
				if (drops.length) drops = [];
				return;
			}
			const d: Drop = {
				id: did++,
				x: Math.random() * 100,
				size: 16 + Math.random() * 22,
				dur: 4200 + Math.random() * 3200,
				delay: Math.random() * 300,
				rot: (Math.random() - 0.5) * 720
			};
			drops = [...drops, d].slice(-45);
			setTimeout(() => (drops = drops.filter((x) => x.id !== d.id)), d.dur + d.delay);
		}, 260);

		return () => {
			window.removeEventListener('keydown', key);
			clearInterval(timer);
		};
	});
</script>

{#if poop}
	<div class="rain" aria-hidden="true">
		{#each drops as d (d.id)}
			<span
				class="drop"
				style:left="{d.x}vw"
				style:font-size="{d.size}px"
				style:animation-duration="{d.dur}ms"
				style:animation-delay="{d.delay}ms"
				style:--rot="{d.rot}deg">💩</span
			>
		{/each}
	</div>
{/if}

{#if toast}
	<div class="toast" transition:fade={{ duration: 180 }}>{toast}</div>
{/if}

{#if nice}
	<div class="nice" transition:scale={{ duration: 260, start: 0.6 }} aria-hidden="true">nice</div>
{/if}

{#if brainrot}
	<div class="rot" transition:fade={{ duration: 120 }} aria-hidden="true">
		<span class="six">6</span><span class="seven">7</span>
	</div>
{/if}

<style>
	.rain {
		position: fixed;
		inset: 0;
		z-index: 46;
		pointer-events: none;
		overflow: hidden;
	}
	.drop {
		position: absolute;
		top: -8vh;
		line-height: 1;
		animation-name: fall;
		animation-timing-function: linear;
		animation-fill-mode: forwards;
		will-change: transform;
	}
	@keyframes fall {
		to {
			transform: translateY(115vh) rotate(var(--rot));
		}
	}

	.toast {
		position: fixed;
		left: 50%;
		bottom: 2.2rem;
		transform: translateX(-50%);
		z-index: 70;
		padding: 0.7rem 1.3rem;
		border-radius: 999px;
		background: rgba(20, 14, 8, 0.92);
		border: 1px solid rgba(200, 140, 60, 0.55);
		color: #f3d9a8;
		font-weight: 700;
		font-size: 0.95rem;
		pointer-events: none;
	}

	/* 69 cards */
	.nice {
		position: fixed;
		left: 50%;
		top: 42%;
		transform: translate(-50%, -50%);
		z-index: 70;
		font-size: clamp(3rem, 14vw, 9rem);
		font-weight: 900;
		letter-spacing: -0.03em;
		color: #79e2d5;
		text-shadow: 0 0 40px rgba(121, 226, 213, 0.65);
		pointer-events: none;
	}

	/* 67 */
	.rot {
		position: fixed;
		inset: 0;
		z-index: 70;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		pointer-events: none;
		background: rgba(0, 0, 0, 0.35);
		animation: shake 0.11s linear infinite;
	}
	.rot span {
		font-size: clamp(5rem, 26vw, 20rem);
		font-weight: 900;
		line-height: 0.85;
		/* chromatic aberration, the cursed look */
		text-shadow:
			5px 0 0 rgba(255, 0, 80, 0.9),
			-5px 0 0 rgba(0, 230, 255, 0.9);
	}
	.six {
		color: #fff;
		animation: wob 0.18s ease-in-out infinite alternate;
	}
	.seven {
		color: #fff;
		animation: wob 0.18s ease-in-out infinite alternate-reverse;
	}
	@keyframes wob {
		0% {
			transform: rotate(-9deg) scale(0.92);
		}
		100% {
			transform: rotate(9deg) scale(1.12);
		}
	}
	@keyframes shake {
		0% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(-7px, 4px);
		}
		50% {
			transform: translate(6px, -5px);
		}
		75% {
			transform: translate(-4px, -3px);
		}
		100% {
			transform: translate(5px, 3px);
		}
	}
</style>
