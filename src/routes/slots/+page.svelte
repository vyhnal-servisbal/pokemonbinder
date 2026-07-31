<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { dex, spriteOf, pretty, DEX_MAX } from '$lib/dexStore.svelte';

	// Weights tuned on a 2M spin simulation: something lands on ~47% of spins,
	// a triple every ~37, and the jackpot every ~576 so it is actually reachable.
	const FINISHES: [Finish, number][] = [
		['normal', 0.56],
		['shiny', 0.18],
		['shadow', 0.14],
		['shinyShadow', 0.12]
	];
	const POOL = 6; // fewer symbols means triples actually happen
	const STRIP = 22; // how many symbols blur past before the reel stops
	const LS_BEST = 'pb_slots_best';

	type Finish = 'normal' | 'shiny' | 'shadow' | 'shinyShadow';
	interface Sym {
		id: number;
		fin: Finish;
	}

	const FIN_COLOR: Record<Finish, string> = {
		normal: '#8b93a3',
		shiny: '#f0c85a',
		shadow: '#b47ae0',
		shinyShadow: '#ff8ae0'
	};

	let pool = $state<number[]>([]);
	let strips = $state<Sym[][]>([[], [], []]);
	let stops = $state([0, 0, 0]);
	let spinning = $state([false, false, false]);
	let anim = $state([false, false, false]);
	let result = $state<Sym[] | null>(null);
	let win = $state<{ kind: string; label: string; color: string; tier: number } | null>(null);
	let spins = $state(0);
	let best = $state('');
	let leverDown = $state(false);
	let confetti = $state<{ id: number; x: number; d: number; r: number; c: string }[]>([]);
	let cid = 0;

	const busy = $derived(spinning.some(Boolean));

	function rollFinish(): Finish {
		const r = Math.random();
		let acc = 0;
		for (const [k, w] of FINISHES) {
			acc += w;
			if (r < acc) return k;
		}
		return 'normal';
	}
	const rollSym = (): Sym => ({ id: pool[Math.floor(Math.random() * pool.length)], fin: rollFinish() });

	function newPool() {
		const s = new Set<number>();
		while (s.size < POOL) s.add(1 + Math.floor(Math.random() * DEX_MAX));
		pool = [...s];
		strips = [0, 1, 2].map(() => Array.from({ length: 3 }, rollSym));
		stops = [0, 0, 0];
		result = null;
		win = null;
	}

	function judge(s: Sym[]) {
		const same = s[0].id === s[1].id && s[1].id === s[2].id;
		const allSS = s.every((x) => x.fin === 'shinyShadow');
		const allShiny = s.every((x) => x.fin === 'shiny' || x.fin === 'shinyShadow');
		const allShadow = s.every((x) => x.fin === 'shadow' || x.fin === 'shinyShadow');
		const pair = !same && (s[0].id === s[1].id || s[1].id === s[2].id || s[0].id === s[2].id);

		if (allSS) return { kind: 'jackpot', label: 'JACKPOT', color: '#ff8ae0', tier: 3 };
		if (same && allShiny)
			return { kind: 'tripleShiny', label: 'SHINY TRIPLE', color: '#f0c85a', tier: 3 };
		if (same) return { kind: 'triple', label: 'TRIPLE', color: '#79e2d5', tier: 2 };
		if (allShiny) return { kind: 'shinyLine', label: 'ALL SHINY', color: '#f0c85a', tier: 2 };
		if (allShadow) return { kind: 'shadowLine', label: 'ALL SHADOW', color: '#b47ae0', tier: 1 };
		if (pair) return { kind: 'pair', label: 'so close', color: '#8b93a3', tier: 0 };
		return null;
	}

	function burst(n: number, color: string) {
		const made = Array.from({ length: n }, () => ({
			id: cid++,
			x: Math.random() * 100,
			d: 900 + Math.random() * 900,
			r: (Math.random() - 0.5) * 720,
			c: Math.random() < 0.5 ? color : '#fff'
		}));
		confetti = [...confetti, ...made];
		const ids = new Set(made.map((m) => m.id));
		setTimeout(() => (confetti = confetti.filter((c) => !ids.has(c.id))), 2200);
	}

	async function spin() {
		if (busy || !pool.length) return;
		result = null;
		win = null;
		spins++;

		const final = [rollSym(), rollSym(), rollSym()];

		for (let r = 0; r < 3; r++) {
			// a fresh strip that ends on the symbol this reel will land on
			const s = [strips[r][stops[r]] ?? rollSym(), ...Array.from({ length: STRIP }, rollSym), final[r]];
			strips[r] = s;
			stops[r] = 0;
			anim[r] = false;
			spinning[r] = true;
		}
		strips = [...strips];
		await new Promise(requestAnimationFrame);
		await new Promise(requestAnimationFrame);

		for (let r = 0; r < 3; r++) {
			anim[r] = true;
			stops[r] = strips[r].length - 1;
		}
		anim = [...anim];
		stops = [...stops];

		// reels land left to right, so the last one always carries the tension
		for (let r = 0; r < 3; r++) {
			setTimeout(
				() => {
					spinning[r] = false;
					spinning = [...spinning];
					if (r === 2) settle(final);
				},
				1500 + r * 620
			);
		}
	}

	function settle(final: Sym[]) {
		result = final;
		const w = judge(final);
		win = w;
		if (!w || w.tier === 0) return;
		if (w.tier >= 2) burst(w.tier === 3 ? 90 : 34, w.color);
		if (w.tier === 3) {
			setTimeout(() => burst(70, w.color), 320);
			setTimeout(() => burst(70, '#f0c85a'), 700);
			if (w.kind === 'jackpot' || best !== 'JACKPOT') {
				best = w.label;
				try {
					localStorage.setItem(LS_BEST, best);
				} catch {
					/* ignore */
				}
			}
		}
	}

	function pull() {
		if (busy) return;
		leverDown = true;
		setTimeout(() => (leverDown = false), 420);
		spin();
	}

	onMount(() => {
		dex.init();
		newPool();
		try {
			best = localStorage.getItem(LS_BEST) ?? '';
		} catch {
			/* ignore */
		}
		function key(e: KeyboardEvent) {
			const t = e.target as HTMLElement | null;
			if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
			if (e.code !== 'Space') return;
			e.preventDefault();
			pull();
		}
		window.addEventListener('keydown', key);
		return () => window.removeEventListener('keydown', key);
	});
</script>

<svelte:head><title>Slots · Pokémon Binder</title></svelte:head>

<div class="page" class:jackpot={win?.kind === 'jackpot'}>
	<header class="topbar">
		<div class="inner">
			<div class="hleft">
				<a class="back" href="/">‹ Binder</a>
				<h1>Slots</h1>
			</div>
			<div class="hright">
				<span class="stat"><b>{spins}</b> spins</span>
				{#if best}<span class="stat gold">best <b>{best}</b></span>{/if}
				<button class="ghosty" onclick={newPool} disabled={busy}>↻ New reels</button>
			</div>
		</div>
	</header>

	<main class="wrap">
		<div class="machine" class:won={!!win && win.tier > 0} style:--wc={win?.color ?? '#79e2d5'}>
			<div class="reels">
				{#each [0, 1, 2] as r (r)}
					<div class="reel" class:spin={spinning[r]}>
						<div
							class="strip"
							class:animate={anim[r]}
							style:transform="translateY(calc(var(--cell) * {-stops[r]}))"
							style:transition-duration="{1500 + r * 620}ms"
						>
							{#each strips[r] as s, k (k)}
								<div class="cell" style:--fc={FIN_COLOR[s.fin]} class:fx={s.fin !== 'normal'}>
									<img
										src={spriteOf(s.id, s.fin === 'shiny' || s.fin === 'shinyShadow')}
										alt=""
										class:dark={s.fin === 'shadow' || s.fin === 'shinyShadow'}
										draggable="false"
									/>
								</div>
							{/each}
						</div>
					</div>
				{/each}
				<div class="payline"></div>
			</div>

			<!-- the lever: pull it, or hit the button, or tap space -->
			<button class="lever" class:down={leverDown} onclick={pull} disabled={busy} aria-label="Pull">
				<span class="rod"></span>
				<span class="knob"></span>
			</button>
		</div>

		{#if win && win.tier > 0}
			<div class="banner tier{win.tier}" style:--wc={win.color} transition:scale={{ duration: 260, start: 0.6 }}>
				{win.label}
			</div>
		{:else if win}
			<div class="tease" transition:fade={{ duration: 160 }}>{win.label}…</div>
		{:else if result}
			<div class="tease" transition:fade={{ duration: 160 }}>no luck</div>
		{/if}

		{#if result}
			<p class="names">
				{result.map((s) => pretty(dex.names[s.id - 1] ?? '')).join(' · ')}
			</p>
		{/if}

		<button class="spinbtn" onclick={pull} disabled={busy}>
			{busy ? 'Spinning…' : 'SPIN'}
			<kbd>space</kbd>
		</button>
	</main>
</div>

{#if confetti.length}
	<div class="confetti" aria-hidden="true">
		{#each confetti as c (c.id)}
			<span
				style:left="{c.x}vw"
				style:animation-duration="{c.d}ms"
				style:--r="{c.r}deg"
				style:background={c.c}
			></span>
		{/each}
	</div>
{/if}

<style>
	.page {
		height: 100dvh;
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		overflow: hidden;
	}
	/* the whole screen reacts when the big one lands */
	.page.jackpot {
		animation: quake 0.42s ease-in-out 4;
	}
	@keyframes quake {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(-6px, 3px);
		}
		50% {
			transform: translate(5px, -4px);
		}
		75% {
			transform: translate(-3px, -2px);
		}
	}

	.topbar {
		background: rgba(14, 15, 20, 0.82);
		backdrop-filter: blur(14px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.09);
	}
	.inner {
		display: flex;
		align-items: center;
		gap: 0.5rem 1rem;
		flex-wrap: wrap;
		max-width: 1400px;
		margin: 0 auto;
		padding: 0.45rem 1rem;
	}
	.hleft,
	.hright {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.hright {
		margin-left: auto;
	}
	.back {
		color: #d1f6ef;
		text-decoration: none;
		font-size: 0.9rem;
		padding: 0.35rem 0.75rem;
		border-radius: 10px;
		border: 1px solid rgba(var(--accent-rgb), 0.35);
		background: rgba(var(--accent-rgb), 0.12);
	}
	h1 {
		margin: 0;
		font-size: 1.05rem;
	}
	.stat {
		padding: 0.28rem 0.7rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(255, 255, 255, 0.04);
		font-size: 0.78rem;
	}
	.stat b {
		font-variant-numeric: tabular-nums;
	}
	.stat.gold {
		border-color: rgba(240, 200, 90, 0.5);
		color: #f0c85a;
	}
	.ghosty {
		padding: 0.3rem 0.75rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.16);
		background: rgba(255, 255, 255, 0.06);
		color: #ece9f7;
		font-size: 0.78rem;
		cursor: pointer;
	}

	.wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		min-height: 0;
		padding: 1rem;
	}

	/* ---- machine ---- */
	.machine {
		--cell: clamp(88px, 17vh, 158px);
		position: relative;
		display: flex;
		align-items: center;
		gap: 1.2rem;
		padding: 1.4rem 1.6rem;
		border-radius: 24px;
		border: 2px solid rgba(var(--accent-rgb), 0.35);
		background:
			radial-gradient(120% 90% at 50% 0%, rgba(var(--accent-rgb), 0.14), transparent 60%),
			linear-gradient(160deg, #26272f, #14151b);
		box-shadow:
			0 30px 70px rgba(0, 0, 0, 0.55),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
		transition:
			border-color 0.3s,
			box-shadow 0.3s;
	}
	.machine.won {
		border-color: var(--wc);
		box-shadow:
			0 30px 70px rgba(0, 0, 0, 0.55),
			0 0 60px color-mix(in srgb, var(--wc) 45%, transparent);
	}
	.reels {
		position: relative;
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem;
		border-radius: 16px;
		background: #0b0c11;
		box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.9);
	}
	.reel {
		width: var(--cell);
		height: var(--cell);
		overflow: hidden;
		border-radius: 10px;
		background: linear-gradient(180deg, #1a1b22, #101116);
	}
	/* a touch of motion blur only while it is actually moving */
	.reel.spin img {
		filter: blur(1.5px);
	}
	.strip {
		display: flex;
		flex-direction: column;
		/* off by default, otherwise the silent jump back to the top of a fresh
		   strip would animate too and the reel would visibly rewind */
		transition-property: none;
	}
	.strip.animate {
		transition-property: transform;
		transition-timing-function: cubic-bezier(0.16, 0.9, 0.25, 1);
	}
	.cell {
		width: var(--cell);
		height: var(--cell);
		flex: none;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.cell.fx {
		background: radial-gradient(closest-side, color-mix(in srgb, var(--fc) 26%, transparent), transparent 72%);
	}
	.cell img {
		width: 78%;
		height: 78%;
		object-fit: contain;
		image-rendering: pixelated;
	}
	.cell img.dark {
		filter: brightness(0.7) saturate(0.55) drop-shadow(0 0 8px rgba(170, 110, 220, 0.9));
	}
	.payline {
		position: absolute;
		left: 0.2rem;
		right: 0.2rem;
		top: 50%;
		height: 2px;
		transform: translateY(-50%);
		background: linear-gradient(90deg, transparent, rgba(var(--accent-rgb), 0.7), transparent);
		pointer-events: none;
	}

	/* ---- lever ---- */
	.lever {
		position: relative;
		width: 26px;
		height: calc(var(--cell) * 1.15);
		border: 0;
		background: none;
		padding: 0;
		cursor: pointer;
	}
	.lever:disabled {
		cursor: default;
	}
	.rod {
		position: absolute;
		left: 50%;
		bottom: 0;
		width: 8px;
		height: 100%;
		transform: translateX(-50%);
		border-radius: 6px;
		background: linear-gradient(90deg, #6c7280, #aab2c0, #6c7280);
		transform-origin: bottom center;
		transition: transform 0.2s cubic-bezier(0.3, 1.4, 0.5, 1);
	}
	.knob {
		position: absolute;
		left: 50%;
		top: 0;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		transform: translate(-50%, -30%);
		background: radial-gradient(circle at 35% 30%, #ff8f88, #d2413a 60%, #8e2621);
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
		transition: transform 0.2s cubic-bezier(0.3, 1.4, 0.5, 1);
	}
	.lever.down .rod {
		transform: translateX(-50%) scaleY(0.45);
	}
	.lever.down .knob {
		transform: translate(-50%, calc(var(--cell) * 0.6));
	}

	/* ---- banners ---- */
	.banner {
		font-weight: 900;
		letter-spacing: 0.14em;
		color: var(--wc);
		text-shadow: 0 0 26px color-mix(in srgb, var(--wc) 70%, transparent);
	}
	.banner.tier1 {
		font-size: clamp(1rem, 3vh, 1.4rem);
	}
	.banner.tier2 {
		font-size: clamp(1.4rem, 4.5vh, 2.2rem);
		animation: pulse 0.8s ease-in-out infinite;
	}
	/* the jackpot goes properly over the top */
	.banner.tier3 {
		font-size: clamp(2.2rem, 9vh, 5rem);
		background: linear-gradient(90deg, #ff8ae0, #f0c85a, #79e2d5, #ff8ae0);
		background-size: 300% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 0 22px rgba(255, 138, 224, 0.8));
		animation:
			pulse 0.55s ease-in-out infinite,
			slide 1.6s linear infinite;
	}
	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.09);
		}
	}
	@keyframes slide {
		to {
			background-position: 300% 0;
		}
	}
	.tease {
		font-size: 0.9rem;
		opacity: 0.45;
	}
	.names {
		margin: 0;
		font-size: 0.8rem;
		opacity: 0.6;
	}

	.spinbtn {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.8rem 2.4rem;
		border: 0;
		border-radius: 14px;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 1.05rem;
		font-weight: 900;
		letter-spacing: 0.08em;
		cursor: pointer;
		box-shadow: 0 12px 30px rgba(var(--accent-rgb), 0.32);
	}
	.spinbtn:disabled {
		opacity: 0.5;
		cursor: default;
		box-shadow: none;
	}
	kbd {
		padding: 0.05rem 0.4rem;
		border-radius: 5px;
		background: rgba(0, 0, 0, 0.25);
		font-family: inherit;
		font-size: 0.66rem;
		font-weight: 700;
	}

	/* ---- confetti ---- */
	.confetti {
		position: fixed;
		inset: 0;
		z-index: 80;
		pointer-events: none;
		overflow: hidden;
	}
	.confetti span {
		position: absolute;
		top: -6vh;
		width: 9px;
		height: 14px;
		border-radius: 2px;
		animation-name: drop;
		animation-timing-function: cubic-bezier(0.3, 0.6, 0.5, 1);
		animation-fill-mode: forwards;
	}
	@keyframes drop {
		to {
			transform: translateY(112vh) rotate(var(--r));
			opacity: 0;
		}
	}
</style>
