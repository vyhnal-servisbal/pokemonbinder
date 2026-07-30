<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { pexeso, PAIR_CHOICES, MISS_DELAY } from '$lib/pexesoStore.svelte';
	import { dex, spriteOf, pretty } from '$lib/dexStore.svelte';

	const CARD_AR = 3 / 4; // cards look like cards

	let nameEdit = $state('');
	let pairs = $state(12);
	let boardW = $state(0);
	let boardH = $state(0);

	const g = $derived(pexeso.game);
	const inGame = $derived(!!g);

	// Pick the column/row split whose shape is closest to the space we have.
	// Log ratio so "twice too wide" and "twice too tall" score the same.
	const grid = $derived.by(() => {
		const n = g?.cards.length ?? 0;
		if (!n) return { cols: 1, rows: 1 };
		const target = boardW && boardH ? boardW / boardH : 16 / 9;
		let best: { cols: number; rows: number; s: number } | null = null;
		for (let rows = 2; rows <= n / 2; rows++) {
			if (n % rows) continue;
			const cols = n / rows;
			if (cols < 2) continue;
			const s = Math.abs(Math.log((cols * CARD_AR) / rows / target));
			if (!best || s < best.s) best = { cols, rows, s };
		}
		return best ?? { cols: n, rows: 1 };
	});

	function faceUp(i: number) {
		return !!g && (g.flipped.includes(i) || g.matched.includes(i));
	}

	// both clients run this; the loser of the race writes the same thing
	$effect(() => {
		if (!g || g.flipped.length !== 2) return;
		const delay = pexeso.myTurn ? MISS_DELAY : MISS_DELAY + 1400;
		const t = setTimeout(() => pexeso.resolve(), delay);
		return () => clearTimeout(t);
	});

	$effect(() => {
		const n = pexeso.myName;
		if (n && n !== 'You' && !nameEdit) nameEdit = n;
	});

	onMount(() => {
		dex.init();
		pexeso.init();
		nameEdit = pexeso.name;
		pexeso.tidy();
		pexeso.listOpen();

		const poll = setInterval(() => {
			if (!pexeso.game) pexeso.listOpen();
			else pexeso.refresh();
		}, 3000);
		return () => {
			clearInterval(poll);
			pexeso.leave();
		};
	});

	function ago(iso: string) {
		const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
		return m < 1 ? 'just now' : `${m} min ago`;
	}
</script>

<svelte:head><title>Pexeso · Pokémon Binder</title></svelte:head>

<div class="page">
	<header class="topbar">
		<div class="inner">
			<a class="back" href="/">‹ Binder</a>
			<h1>Pexeso</h1>
			{#if inGame}
				<input
					class="myname"
					bind:value={nameEdit}
					onblur={() => pexeso.setMyName(nameEdit)}
					onkeydown={(e) => e.key === 'Enter' && pexeso.setMyName(nameEdit)}
					placeholder="Your name"
				/>
				<span class="sc" class:on={pexeso.myTurn}>
					{pexeso.myName} <b>{pexeso.myScore}</b>
				</span>
				<span class="sc" class:on={!pexeso.myTurn && pexeso.hasOpponent}>
					{pexeso.theirName} <b>{pexeso.theirScore}</b>
				</span>
				<button class="ghosty" onclick={() => { pexeso.leave(); pexeso.listOpen(); }}>Leave</button>
			{/if}
			<span class="note">
				{#if inGame && !pexeso.hasOpponent}
					Waiting for an opponent, your room is in their list
				{:else if inGame && !pexeso.done}
					{pexeso.myTurn ? 'Your turn' : `${pexeso.theirName}'s turn`}
				{/if}
			</span>
		</div>
	</header>

	<main class="wrap">
		{#if !pexeso.enabled}
			<p class="warn">Pexeso needs the cloud. Add the Supabase keys and run <code>supabase.sql</code>.</p>
		{:else if !inGame}
			<div class="lobby" transition:fade={{ duration: 160 }}>
				<h2>Pexeso</h2>
				<input class="nameinput" placeholder="Your name" bind:value={nameEdit} />

				<div class="sizes">
					{#each PAIR_CHOICES as p (p)}
						<button class:on={pairs === p} onclick={() => (pairs = p)}>{p} pairs</button>
					{/each}
				</div>

				<button
					class="cta"
					onclick={() => {
						pexeso.setName(nameEdit || 'Host');
						pexeso.create(pairs);
					}}
					disabled={pexeso.status === 'busy'}
				>
					{pexeso.status === 'busy' ? 'Creating…' : 'Open a room'}
				</button>

				<div class="rooms">
					<h3>Rooms waiting for a player</h3>
					{#if pexeso.openRooms.length}
						{#each pexeso.openRooms as r (r.id)}
							<button
								class="roomrow"
								onclick={() => {
									pexeso.setName(nameEdit || 'Guest');
									pexeso.join(r.id);
								}}
							>
								<span class="rname">{r.host_name || 'Someone'}</span>
								<span class="rpairs">{r.pairs} pairs</span>
								<span class="rago">{ago(r.created_at)}</span>
								<span class="rjoin">Join</span>
							</button>
						{/each}
					{:else}
						<p class="tip">Nothing open. Hit <b>Open a room</b> and it appears on her screen in a few seconds.</p>
					{/if}
				</div>

				{#if pexeso.status === 'error'}<p class="warn">{pexeso.error}</p>{/if}
			</div>
		{:else}
			<!-- the board sizes itself: aspect-ratio + max-width/height lets the
			     browser pick whichever dimension is the limit -->
			<div class="boardarea" bind:clientWidth={boardW} bind:clientHeight={boardH}>
				<div
					class="board"
					class:locked={!pexeso.myTurn || pexeso.done}
					style:--cols={grid.cols}
					style:--rows={grid.rows}
					style:--ar={CARD_AR}
				>
					{#each g?.cards ?? [] as id, i (i)}
						{@const up = faceUp(i)}
						{@const gone = g?.matched.includes(i)}
						<button
							class="card"
							class:up
							class:gone
							onclick={() => pexeso.flip(i)}
							disabled={!pexeso.myTurn || up || pexeso.done}
							aria-label={up ? pretty(dex.names[id - 1] ?? '') : 'Hidden card'}
						>
							<span class="inner">
								<span class="cardback"></span>
								<span class="front">
									<img src={spriteOf(id)} alt="" loading="lazy" draggable="false" />
									<i>{pretty(dex.names[id - 1] ?? '')}</i>
								</span>
							</span>
						</button>
					{/each}
				</div>
			</div>

			{#if pexeso.done}
				<div class="result" transition:scale={{ duration: 240, start: 0.85 }}>
					<b>
						{pexeso.myScore === pexeso.theirScore
							? 'Draw!'
							: pexeso.myScore > pexeso.theirScore
								? 'You win!'
								: `${pexeso.theirName} wins`}
					</b>
					<span>{pexeso.myScore} : {pexeso.theirScore}</span>
					<button class="again" onclick={() => pexeso.rematch()}>Rematch</button>
				</div>
			{/if}
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
		gap: 0.7rem;
		flex-wrap: wrap;
		max-width: 1600px;
		margin: 0 auto;
		padding: 0.5rem 1.4rem;
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
	.myname {
		width: 120px;
		padding: 0.28rem 0.6rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.18);
		background: rgba(0, 0, 0, 0.28);
		color: #ece9f7;
		font-size: 0.78rem;
		font-weight: 700;
		text-align: center;
	}
	.myname:focus {
		outline: none;
		border-color: var(--accent);
	}
	/* whoever is on the move gets the highlight */
	.sc {
		padding: 0.28rem 0.7rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		font-size: 0.78rem;
	}
	.sc b {
		font-variant-numeric: tabular-nums;
	}
	.sc.on {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.18);
		color: #d1f6ef;
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
	.note {
		margin-left: auto;
		font-size: 0.76rem;
		opacity: 0.55;
	}

	.wrap {
		width: 100%;
		max-width: 1900px;
		margin: 0 auto;
		padding: 0.5rem 0.9rem 0.7rem;
		min-height: 0;
		display: grid;
		grid-template-rows: minmax(0, 1fr) auto;
		gap: 0.6rem;
		place-items: center;
	}

	/* ---- board ---- */
	/* a sized container, so the board can be measured against it in cq units */
	.boardarea {
		container-type: size;
		width: 100%;
		height: 100%;
		min-height: 0;
		align-self: stretch;
		justify-self: stretch;
	}
	.board {
		/* aspect-ratio alone only caps the shape, it never makes the board grow.
		   Asking for the smaller of "all the width" and "the width that makes the
		   height exactly fill" is what actually fills the screen. */
		--r: calc(var(--cols) * var(--ar) / var(--rows));
		aspect-ratio: var(--r);
		width: min(100cqw, calc(100cqh * var(--r)));
		margin: auto;
		display: grid;
		grid-template-columns: repeat(var(--cols), 1fr);
		grid-template-rows: repeat(var(--rows), 1fr);
		gap: clamp(3px, 0.7vmin, 10px);
	}
	.board.locked {
		cursor: default;
	}
	.card {
		padding: 0;
		border: 0;
		background: none;
		perspective: 700px;
		cursor: pointer;
		min-width: 0;
		min-height: 0;
	}
	.card:disabled {
		cursor: default;
	}
	.inner {
		position: relative;
		display: block;
		width: 100%;
		height: 100%;
		transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
		transform-style: preserve-3d;
	}
	.card.up .inner {
		transform: rotateY(180deg);
	}
	.cardback,
	.front {
		position: absolute;
		inset: 0;
		border-radius: clamp(5px, 1vmin, 12px);
		backface-visibility: hidden;
		overflow: hidden;
	}
	.cardback {
		border: 1px solid rgba(var(--accent-rgb), 0.35);
		background:
			radial-gradient(circle at 50% 50%, rgba(var(--accent-rgb), 0.28) 0 18%, transparent 19%),
			repeating-linear-gradient(
				45deg,
				rgba(255, 255, 255, 0.05) 0 6px,
				transparent 6px 12px
			),
			linear-gradient(160deg, #23242e, #14151b);
	}
	.card:not(:disabled):hover .cardback {
		border-color: var(--accent);
	}
	.front {
		transform: rotateY(180deg);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2%;
		padding: 4%;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: linear-gradient(160deg, #2a2b36, #1a1b22);
	}
	.front img {
		width: 82%;
		height: auto;
		max-height: 72%;
		object-fit: contain;
		image-rendering: pixelated;
	}
	.front i {
		font-style: normal;
		font-size: clamp(0.42rem, 1.1vmin, 0.72rem);
		line-height: 1.1;
		text-align: center;
		opacity: 0.65;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}
	/* matched pairs stay up but step back */
	.card.gone .front {
		border-color: rgba(var(--accent-rgb), 0.5);
		background: rgba(var(--accent-rgb), 0.1);
		opacity: 0.55;
	}

	/* ---- lobby ---- */
	.lobby {
		align-self: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.7rem;
		padding: 2rem 2.4rem;
		border-radius: 20px;
		border: 1px solid rgba(var(--accent-rgb), 0.3);
		background:
			radial-gradient(120% 90% at 50% 0%, rgba(var(--accent-rgb), 0.14), transparent 65%),
			linear-gradient(160deg, #22232c, #14151b);
	}
	.lobby h2 {
		margin: 0;
		font-size: 1.25rem;
	}
	.nameinput {
		width: min(260px, 100%);
		padding: 0.55rem 0.8rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.16);
		background: rgba(0, 0, 0, 0.3);
		color: #fff;
		text-align: center;
	}
	.nameinput:focus {
		outline: none;
		border-color: var(--accent);
	}
	.sizes {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	.sizes button {
		padding: 0.35rem 0.7rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(255, 255, 255, 0.04);
		color: #d8d2f0;
		font-size: 0.78rem;
		cursor: pointer;
	}
	.sizes button.on {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.2);
		color: #d1f6ef;
	}
	.cta {
		padding: 0.65rem 1.6rem;
		border: 0;
		border-radius: 12px;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 0.98rem;
		font-weight: 800;
		cursor: pointer;
	}
	.rooms {
		width: min(400px, 100%);
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding-top: 0.4rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}
	.rooms h3 {
		margin: 0.2rem 0 0.1rem;
		font-size: 0.78rem;
		opacity: 0.6;
	}
	.roomrow {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.55rem 0.7rem;
		border-radius: 10px;
		border: 1px solid rgba(var(--accent-rgb), 0.3);
		background: rgba(var(--accent-rgb), 0.08);
		color: #ece9f7;
		cursor: pointer;
		text-align: left;
	}
	.roomrow:hover {
		background: rgba(var(--accent-rgb), 0.2);
		border-color: var(--accent);
	}
	.rname {
		flex: 1;
		font-weight: 700;
		font-size: 0.9rem;
	}
	.rpairs,
	.rago {
		font-size: 0.68rem;
		opacity: 0.55;
	}
	.rjoin {
		padding: 0.16rem 0.6rem;
		border-radius: 999px;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 0.72rem;
		font-weight: 800;
	}
	.tip {
		margin: 0;
		font-size: 0.76rem;
		opacity: 0.55;
		text-align: center;
	}
	.warn {
		margin: 0;
		font-size: 0.84rem;
		color: #ffcf8b;
		text-align: center;
	}
	.warn code {
		background: rgba(255, 255, 255, 0.1);
		padding: 0.05rem 0.3rem;
		border-radius: 4px;
	}

	.result {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	.result b {
		font-size: 1.15rem;
		color: #f0c85a;
	}
	.result span {
		font-variant-numeric: tabular-nums;
		opacity: 0.7;
	}
	.again {
		padding: 0.55rem 1.3rem;
		border: 0;
		border-radius: 12px;
		background: var(--accent);
		color: var(--on-accent);
		font-weight: 800;
		cursor: pointer;
	}
</style>
