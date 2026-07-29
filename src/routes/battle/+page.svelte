<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale, fly } from 'svelte/transition';
	import {
		dex,
		spriteOf,
		aniOf,
		pretty,
		finishOf,
		formKind,
		rarityScore,
		isLegendary,
		isMythical,
		type Catch
	} from '$lib/dexStore.svelte';

	interface Side {
		name: string;
		pack: Catch[];
		score: number;
	}

	let players = $state<[string, string]>(['Player 1', 'Player 2']);
	let sides = $state<[Side | null, Side | null]>([null, null]);
	let turn = $state(0); // whose pack is next
	let busy = $state(false);
	let wins = $state<[number, number]>([0, 0]);

	const done = $derived(!!sides[0] && !!sides[1]);
	const winner = $derived.by(() => {
		if (!done) return -1;
		const a = sides[0]!.score;
		const b = sides[1]!.score;
		return a === b ? 2 : a > b ? 0 : 1; // 2 = draw
	});

	// scored but never recorded: this is a duel, not a way to farm the dex
	async function draw() {
		if (busy || done) return;
		busy = true;
		const pack = await dex.buildPack();
		const score = pack.reduce((n, c) => n + rarityScore(c), 0);
		const side: Side = { name: players[turn], pack, score };
		sides = turn === 0 ? [side, sides[1]] : [sides[0], side];
		if (turn === 0) turn = 1;
		busy = false;
	}

	$effect(() => {
		if (winner === 0) untrackedWin(0);
		else if (winner === 1) untrackedWin(1);
	});
	let counted = $state(false);
	function untrackedWin(i: number) {
		if (counted) return;
		counted = true;
		wins = i === 0 ? [wins[0] + 1, wins[1]] : [wins[0], wins[1] + 1];
	}

	function rematch() {
		sides = [null, null];
		turn = 0;
		counted = false;
	}

	function fallback(e: Event, c: Catch) {
		const img = e.currentTarget as HTMLImageElement;
		const a = spriteOf(c.spriteId ?? c.id, c.shiny);
		const b = spriteOf(c.id, c.shiny);
		if (img.src === b) return;
		img.src = img.src === a ? b : a;
	}

	onMount(() => dex.init());
</script>

<svelte:head><title>Pack battle · Pokémon Binder</title></svelte:head>

<div class="page">
	<header class="topbar">
		<div class="inner">
			<a class="back" href="/game">‹ Unboxing</a>
			<h1>Pack battle</h1>
			<span class="score">{wins[0]} : {wins[1]}</span>
			<span class="note">Packs are scored, not collected</span>
		</div>
	</header>

	<main class="wrap">
		<div class="arena">
			{#each [0, 1] as i (i)}
				{@const side = sides[i]}
				<section class="side" class:win={done && winner === i} class:lose={done && winner === (1 - i)}>
					<input
						class="pname"
						bind:value={players[i]}
						aria-label="Player name"
						spellcheck="false"
					/>

					{#if side}
						<div class="total" transition:scale={{ duration: 240, start: 0.7 }}>
							{side.score}
						</div>
						<div class="hand">
							{#each side.pack as c, k (k)}
								{@const fin = finishOf(c)}
								{@const fk = formKind(c.form)}
								<div
									class="mini {fin.tier}"
									style:--rc={fin.color}
									in:fly={{ y: 14, duration: 220, delay: k * 70 }}
								>
									<img
										src={aniOf(c.name, c.shiny)}
										alt={c.name}
										onerror={(e) => fallback(e, c)}
										draggable="false"
									/>
									<b>{pretty(c.name)}</b>
									<span class="mtags">
										{#if fin.label}<span style:--t={fin.color}>{fin.label}</span>{/if}
										{#if fk}<span style:--t={fk.color}>{fk.label}</span>{/if}
										{#if isLegendary(c.id)}<span style:--t="#ffd166">LEG</span>{/if}
										{#if isMythical(c.id)}<span style:--t="#ff9ec7">MYTH</span>{/if}
									</span>
									<i class="pts">+{rarityScore(c)}</i>
								</div>
							{/each}
						</div>
					{:else if turn === i}
						<button class="drawbtn" onclick={draw} disabled={busy}>
							<span class="ball"></span>
							{busy ? 'Opening...' : `${players[i]}, open your pack`}
						</button>
					{:else}
						<div class="waiting">Waiting…</div>
					{/if}
				</section>
			{/each}
		</div>

		{#if done}
			<div class="result" transition:fade={{ duration: 200 }}>
				<b>
					{winner === 2
						? 'Dead heat!'
						: `${players[winner === 1 ? 1 : 0]} wins by ${Math.abs(sides[0]!.score - sides[1]!.score)}`}
				</b>
				<button class="again" onclick={rematch}>Rematch</button>
				<button class="ghost" onclick={() => { wins = [0, 0]; rematch(); }}>Reset score</button>
			</div>
		{/if}
	</main>
</div>

<style>
	.page {
		height: 100dvh;
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		overflow: hidden;
	}
	.topbar {
		background: rgba(14, 15, 20, 0.82);
		backdrop-filter: blur(14px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.09);
	}
	.inner {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		max-width: 1500px;
		margin: 0 auto;
		padding: 0.55rem 1.6rem;
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
	.score {
		padding: 0.3rem 0.8rem;
		border-radius: 999px;
		border: 1px solid rgba(var(--accent-rgb), 0.45);
		background: rgba(var(--accent-rgb), 0.14);
		color: #d1f6ef;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}
	.note {
		margin-left: auto;
		font-size: 0.74rem;
		opacity: 0.5;
	}

	.wrap {
		max-width: 1500px;
		width: 100%;
		margin: 0 auto;
		padding: 1rem 1.6rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		min-height: 0;
		overflow-y: auto;
	}
	.arena {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		width: 100%;
	}
	@media (max-width: 820px) {
		.arena {
			grid-template-columns: 1fr;
		}
	}
	.side {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.7rem;
		padding: 1rem;
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.03);
		transition:
			border-color 0.25s,
			background 0.25s;
	}
	.side.win {
		border-color: rgba(240, 200, 90, 0.75);
		background: rgba(240, 200, 90, 0.1);
		box-shadow: 0 0 34px rgba(240, 200, 90, 0.22);
	}
	.side.lose {
		opacity: 0.6;
	}
	.pname {
		width: min(220px, 100%);
		text-align: center;
		padding: 0.3rem 0.5rem;
		border-radius: 9px;
		border: 1px solid transparent;
		background: none;
		color: #ece9f7;
		font-size: 1rem;
		font-weight: 800;
	}
	.pname:hover,
	.pname:focus {
		border-color: rgba(255, 255, 255, 0.18);
		background: rgba(0, 0, 0, 0.25);
		outline: none;
	}
	.total {
		font-size: clamp(2rem, 6vh, 3.2rem);
		font-weight: 900;
		line-height: 1;
		color: var(--accent);
		font-variant-numeric: tabular-nums;
	}
	.side.win .total {
		color: #f0c85a;
	}
	.hand {
		display: flex;
		gap: 0.45rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	.mini {
		width: clamp(84px, 9vw, 118px);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		padding: 0.45rem 0.3rem;
		border-radius: 10px;
		border: 1px solid color-mix(in srgb, var(--rc) 50%, transparent);
		background: linear-gradient(160deg, #22232c, #14151b);
		text-align: center;
	}
	.mini.common {
		border-color: rgba(255, 255, 255, 0.12);
	}
	.mini img {
		width: 52px;
		height: 52px;
		object-fit: contain;
		image-rendering: pixelated;
	}
	.mini.shadow img,
	.mini.shinyShadow img {
		filter: brightness(0.74) saturate(0.6);
	}
	.mini b {
		font-size: 0.66rem;
		line-height: 1.15;
	}
	.mtags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem;
		justify-content: center;
	}
	.mtags span {
		padding: 0.05rem 0.3rem;
		border-radius: 4px;
		font-size: 0.5rem;
		font-weight: 800;
		color: var(--t);
		background: color-mix(in srgb, var(--t) 22%, transparent);
	}
	.pts {
		font-style: normal;
		font-size: 0.68rem;
		font-weight: 800;
		color: var(--accent);
		font-variant-numeric: tabular-nums;
	}
	.drawbtn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
		padding: 1.6rem 2rem;
		border-radius: 16px;
		border: 1px solid rgba(var(--accent-rgb), 0.35);
		background: rgba(var(--accent-rgb), 0.08);
		color: #d1f6ef;
		font-size: 0.95rem;
		font-weight: 700;
		cursor: pointer;
	}
	.drawbtn:hover:not(:disabled) {
		background: rgba(var(--accent-rgb), 0.18);
	}
	.ball {
		width: 62px;
		height: 62px;
		border-radius: 50%;
		background: linear-gradient(#e0574f 0 46%, #111 46% 54%, #fff 54% 100%), #fff;
		box-shadow: inset 0 0 0 3px #111;
		position: relative;
		animation: bob 2.6s ease-in-out infinite;
	}
	.ball::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		background: #fff;
		box-shadow: inset 0 0 0 3px #111;
	}
	@keyframes bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-6px);
		}
	}
	.waiting {
		padding: 2.4rem 0;
		opacity: 0.4;
		font-size: 0.9rem;
	}
	.result {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	.result b {
		font-size: 1.1rem;
		color: #f0c85a;
	}
	.again {
		padding: 0.6rem 1.4rem;
		border: 0;
		border-radius: 12px;
		background: var(--accent);
		color: var(--on-accent);
		font-weight: 800;
		cursor: pointer;
	}
	.ghost {
		padding: 0.6rem 1rem;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.16);
		background: rgba(255, 255, 255, 0.06);
		color: #ece9f7;
		cursor: pointer;
	}
</style>
