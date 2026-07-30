<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale, fly } from 'svelte/transition';
	import { battle } from '$lib/battleStore.svelte';
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

	let nameInput = $state('');
	let copied = $state(false);
	let opening = $state(false);
	let roomParam = $state<string | null>(null);
	let chatInput = $state('');
	let nameEdit = $state('');
	let feed: HTMLDivElement | undefined = $state();

	// keep the feed pinned to the newest message
	$effect(() => {
		battle.messages.length;
		if (feed) feed.scrollTop = feed.scrollHeight;
	});

	async function sendChat() {
		const t = chatInput.trim();
		if (!t) return;
		chatInput = '';
		await battle.send(t);
	}

	async function saveName() {
		if (nameEdit.trim() && nameEdit.trim() !== battle.myName) await battle.setMyName(nameEdit);
	}

	function clock(iso: string) {
		return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
	}

	const inRoom = $derived(!!battle.room);
	// mirror the stored name into the editable box whenever the room says it changed
	$effect(() => {
		const n = battle.myName;
		if (n && n !== 'You' && !nameEdit) nameEdit = n;
	});
	const iOpened = $derived(!!battle.mine);
	const diff = $derived(Math.abs(battle.myScore - battle.theirScore));
	const iWon = $derived(battle.ready && battle.myScore > battle.theirScore);
	const draw = $derived(battle.ready && battle.myScore === battle.theirScore);

	onMount(() => {
		dex.init();
		battle.init();
		nameInput = battle.name;
		roomParam = new URLSearchParams(window.location.search).get('room');

		battle.tidy();
		battle.listOpen();

		// in the lobby keep the room list fresh; in a room cover a dropped socket
		const poll = setInterval(() => {
			if (!battle.room) battle.listOpen();
			else if (!battle.ready) battle.refresh();
		}, 3000);
		return () => {
			clearInterval(poll);
			battle.leave();
		};
	});

	async function create() {
		battle.setName(nameInput || 'Host');
		await battle.create();
	}

	async function joinRoom(id: string) {
		battle.setName(nameInput || 'Guest');
		await battle.join(id);
	}

	function ago(iso: string) {
		const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
		return m < 1 ? 'just now' : m === 1 ? '1 min ago' : `${m} min ago`;
	}

	async function openPack() {
		if (opening || iOpened) return;
		opening = true;
		const pack = await dex.buildPack();
		const score = pack.reduce((n, c) => n + rarityScore(c), 0);
		await battle.submit(pack, score);
		opening = false;
	}

	// the host is the only one that writes the tally
	$effect(() => {
		if (battle.ready && battle.role === 'host') battle.settle();
	});

	async function share() {
		const url = battle.link();
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => (copied = false), 1800);
		} catch {
			prompt('Copy this link:', url);
		}
	}

	function fallback(e: Event, c: Catch) {
		const img = e.currentTarget as HTMLImageElement;
		const a = spriteOf(c.spriteId ?? c.id, c.shiny);
		const b = spriteOf(c.id, c.shiny);
		if (img.src === b) return;
		img.src = img.src === a ? b : a;
	}
</script>

<svelte:head><title>Pack battle · Pokémon Binder</title></svelte:head>

<div class="page">
	<header class="topbar">
		<div class="inner">
			<a class="back" href="/game">‹ Unboxing</a>
			<h1>Pack battle</h1>
			{#if inRoom}
				<input
					class="myname"
					bind:value={nameEdit}
					onblur={saveName}
					onkeydown={(e) => e.key === 'Enter' && saveName()}
					placeholder="Your name"
					title="Your name in this battle and in the chat"
				/>
				<span class="tally">{battle.myWins} : {battle.theirWins}</span>
				<span class="round">Round {battle.room?.round ?? 1}</span>
				<button class="sharebtn" onclick={share}>{copied ? 'Link copied' : '🔗 Share link'}</button>
				<button class="sharebtn ghosty" onclick={() => { battle.leave(); battle.listOpen(); }}
					>Leave</button
				>
			{/if}
			<span class="note">Packs are scored, never added to your dex</span>
		</div>
	</header>

	<main class="wrap">
		{#if !battle.enabled}
			<p class="warn">
				Pack battle needs the cloud. Add the Supabase keys to <code>.env</code> and run
				<code>supabase.sql</code>.
			</p>
		{:else if !inRoom}
			<!-- lobby -->
			<div class="lobby" transition:fade={{ duration: 160 }}>
				<span class="ball big"></span>
				<h2>Pack battle</h2>
				<input class="nameinput" placeholder="Your name" bind:value={nameInput} />

				<button class="cta" onclick={create} disabled={battle.status === 'busy'}>
					{battle.status === 'busy' ? 'Creating…' : 'Open a room'}
				</button>

				<div class="rooms">
					<h3>Rooms waiting for a player</h3>
					{#if battle.openRooms.length}
						{#each battle.openRooms as r (r.id)}
							<button class="roomrow" onclick={() => joinRoom(r.id)} disabled={battle.status === 'busy'}>
								<span class="rname">{r.host_name || 'Someone'}</span>
								<span class="rago">{ago(r.created_at)}</span>
								<span class="rjoin">Join</span>
							</button>
						{/each}
					{:else}
						<p class="tip">
							Nothing open yet. Hit <b>Open a room</b> and it shows up on the other screen within a few
							seconds.
						</p>
					{/if}
				</div>

				{#if roomParam}
					<button class="ghost" onclick={() => joinRoom(roomParam!)}>Join the invited room</button>
				{/if}

				{#if battle.status === 'error'}
					<p class="warn">{battle.error}</p>
				{/if}
			</div>
		{:else}
			<!-- arena -->
			<div class="arenaArea">
				{#if !battle.theirName || battle.theirName === 'Waiting…'}
					<div class="waitbar">
						Waiting for your opponent. Your room shows up in their list within a few seconds.
					</div>
				{/if}

			<div class="arena">
				{#each [{ me: true }, { me: false }] as sideDef, si (si)}
					{@const me = sideDef.me}
					{@const pack = me ? battle.mine : battle.theirs}
					{@const score = me ? battle.myScore : battle.theirScore}
					{@const label = me ? battle.myName : battle.theirName}
					<section
						class="side"
						class:win={battle.ready && (me ? iWon : !iWon && !draw)}
						class:lose={battle.ready && (me ? !iWon && !draw : iWon)}
					>
						<div class="who">
							<b>{label}</b>
							{#if me}<i>you</i>{/if}
						</div>

						{#if pack}
							{#if battle.ready || me}
								<div class="total" transition:scale={{ duration: 240, start: 0.7 }}>{score}</div>
								<div class="hand">
									{#each pack as c, k (k)}
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
							{:else}
								<!-- hide their haul until you have opened yours -->
								<div class="sealed">
									{#each [0, 1, 2, 3, 4] as k (k)}<span class="sealedcard">?</span>{/each}
									<p>Opened their pack. Open yours to reveal.</p>
								</div>
							{/if}
						{:else if me}
							<button
								class="drawbtn"
								onclick={openPack}
								disabled={opening || !dex.names.length}
							>
								<span class="ball"></span>
								{opening ? 'Opening…' : dex.names.length ? 'Open your pack' : 'Loading…'}
							</button>
						{:else}
							<div class="waiting">Waiting for their pack…</div>
						{/if}
					</section>
				{/each}
			</div>

			{#if battle.ready}
				<div class="result" transition:fade={{ duration: 200 }}>
					<b class:won={iWon} class:tie={draw}>
						{draw ? 'Dead heat!' : iWon ? `You win by ${diff}` : `${battle.theirName} wins by ${diff}`}
					</b>
					<button class="again" onclick={() => battle.rematch()}>Rematch</button>
					<button class="ghost" onclick={share}>{copied ? 'Copied' : 'Share link'}</button>
				</div>
			{/if}
			</div>

			<!-- chat: no alt tabbing to message each other mid battle -->
			<section class="chat">
				<div class="feed" bind:this={feed}>
					{#if battle.messages.length}
						{#each battle.messages as m (m.id)}
							<p class="msg" class:own={m.author === battle.myName}>
								<b>{m.author || 'Someone'}</b>
								<span>{m.body}</span>
								<i>{clock(m.created_at)}</i>
							</p>
						{/each}
					{:else}
						<p class="empty">No messages yet. Say something.</p>
					{/if}
				</div>
				<form
					class="composer"
					onsubmit={(e) => {
						e.preventDefault();
						sendChat();
					}}
				>
					<input placeholder="Message…" bind:value={chatInput} maxlength="400" />
					<button type="submit" disabled={!chatInput.trim()}>Send</button>
				</form>
			</section>
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
		gap: 0.8rem;
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
	.tally {
		padding: 0.3rem 0.8rem;
		border-radius: 999px;
		border: 1px solid rgba(240, 200, 90, 0.5);
		background: rgba(240, 200, 90, 0.14);
		color: #f0c85a;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}
	.round {
		font-size: 0.76rem;
		opacity: 0.6;
	}
	.sharebtn {
		padding: 0.32rem 0.8rem;
		border-radius: 999px;
		border: 1px solid rgba(var(--accent-rgb), 0.5);
		background: rgba(var(--accent-rgb), 0.16);
		color: #d1f6ef;
		font-size: 0.78rem;
		font-weight: 700;
		cursor: pointer;
		white-space: nowrap;
	}
	.sharebtn:hover {
		background: rgba(var(--accent-rgb), 0.28);
	}
	.sharebtn.ghosty {
		border-color: rgba(255, 255, 255, 0.16);
		background: rgba(255, 255, 255, 0.06);
		color: #ece9f7;
	}
	.sharebtn.ghosty:hover {
		background: rgba(255, 255, 255, 0.14);
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
		padding: 0.9rem 1.6rem 1rem;
		display: grid;
		/* arena takes what it needs at the top, chat sits under it */
		grid-template-rows: minmax(0, 1fr) auto;
		gap: 0.8rem;
		min-height: 0;
	}
	.arenaArea {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		gap: 0.9rem;
		min-height: 0;
		overflow-y: auto;
	}

	/* ---- chat ---- */
	.chat {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		height: clamp(150px, 26dvh, 250px);
		padding: 0.7rem;
		border-radius: 14px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.03);
	}
	.feed {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.28rem;
		padding-right: 0.2rem;
	}
	.msg {
		margin: 0;
		display: flex;
		align-items: baseline;
		gap: 0.45rem;
		font-size: 0.84rem;
		line-height: 1.35;
	}
	.msg b {
		flex: none;
		font-size: 0.78rem;
		color: #9aa3ad;
	}
	.msg.own b {
		color: var(--accent);
	}
	.msg span {
		flex: 1;
		word-break: break-word;
	}
	.msg i {
		flex: none;
		font-style: normal;
		font-size: 0.66rem;
		opacity: 0.35;
		font-variant-numeric: tabular-nums;
	}
	.empty {
		margin: auto;
		font-size: 0.8rem;
		opacity: 0.4;
	}
	.composer {
		display: flex;
		gap: 0.4rem;
	}
	.composer input {
		flex: 1;
		min-width: 0;
		padding: 0.5rem 0.7rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(0, 0, 0, 0.28);
		color: #fff;
		font-size: 0.88rem;
	}
	.composer input:focus {
		outline: none;
		border-color: var(--accent);
	}
	.composer button {
		flex: none;
		padding: 0.5rem 1rem;
		border: 0;
		border-radius: 10px;
		background: var(--accent);
		color: var(--on-accent);
		font-weight: 700;
		cursor: pointer;
	}
	.composer button:disabled {
		opacity: 0.4;
		cursor: default;
	}
	.myname {
		width: 130px;
		padding: 0.3rem 0.6rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.18);
		background: rgba(0, 0, 0, 0.28);
		color: #ece9f7;
		font-size: 0.8rem;
		font-weight: 700;
		text-align: center;
	}
	.myname:focus {
		outline: none;
		border-color: var(--accent);
	}

	/* ---- lobby ---- */
	.lobby {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.8rem;
		padding: 2.2rem 2.6rem;
		border-radius: 20px;
		border: 1px solid rgba(var(--accent-rgb), 0.3);
		background:
			radial-gradient(120% 90% at 50% 0%, rgba(var(--accent-rgb), 0.14), transparent 65%),
			linear-gradient(160deg, #22232c, #14151b);
	}
	.lobby h2 {
		margin: 0;
		font-size: 1.2rem;
	}
	.nameinput {
		width: min(260px, 100%);
		padding: 0.6rem 0.8rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.16);
		background: rgba(0, 0, 0, 0.3);
		color: #fff;
		text-align: center;
		font-size: 0.95rem;
	}
	.nameinput:focus {
		outline: none;
		border-color: var(--accent);
	}
	.cta {
		padding: 0.7rem 1.8rem;
		border: 0;
		border-radius: 12px;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 1rem;
		font-weight: 800;
		cursor: pointer;
	}
	.cta:disabled {
		opacity: 0.5;
		cursor: default;
	}
	.tip {
		margin: 0;
		font-size: 0.76rem;
		opacity: 0.55;
	}
	.rooms {
		width: min(360px, 100%);
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding-top: 0.4rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}
	.rooms h3 {
		margin: 0.2rem 0 0.1rem;
		font-size: 0.78rem;
		font-weight: 700;
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
	.roomrow:hover:not(:disabled) {
		background: rgba(var(--accent-rgb), 0.2);
		border-color: var(--accent);
	}
	.rname {
		flex: 1;
		font-weight: 700;
		font-size: 0.9rem;
	}
	.rago {
		font-size: 0.68rem;
		opacity: 0.5;
	}
	.rjoin {
		padding: 0.16rem 0.6rem;
		border-radius: 999px;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 0.72rem;
		font-weight: 800;
	}
	.warn {
		margin: 0;
		font-size: 0.84rem;
		color: #ffcf8b;
		text-align: center;
		line-height: 1.5;
	}
	.warn code {
		background: rgba(255, 255, 255, 0.1);
		padding: 0.05rem 0.3rem;
		border-radius: 4px;
	}
	.waitbar {
		padding: 0.55rem 1rem;
		border-radius: 999px;
		border: 1px solid rgba(240, 200, 90, 0.45);
		background: rgba(240, 200, 90, 0.12);
		color: #f3d9a8;
		font-size: 0.82rem;
	}

	/* ---- arena ---- */
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
		gap: 0.6rem;
		padding: 1rem;
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.03);
		transition:
			border-color 0.25s,
			background 0.25s,
			opacity 0.25s;
	}
	.side.win {
		border-color: rgba(240, 200, 90, 0.75);
		background: rgba(240, 200, 90, 0.1);
		box-shadow: 0 0 34px rgba(240, 200, 90, 0.2);
	}
	.side.lose {
		opacity: 0.6;
	}
	.who {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
	}
	.who b {
		font-size: 1rem;
	}
	.who i {
		font-style: normal;
		font-size: 0.68rem;
		padding: 0.1rem 0.4rem;
		border-radius: 5px;
		background: rgba(var(--accent-rgb), 0.2);
		color: #d1f6ef;
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
	.sealed {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		justify-content: center;
		align-items: center;
	}
	.sealedcard {
		width: clamp(46px, 5vw, 62px);
		aspect-ratio: 3 / 4;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: repeating-linear-gradient(
			45deg,
			rgba(255, 255, 255, 0.05) 0 8px,
			transparent 8px 16px
		);
		font-weight: 900;
		opacity: 0.4;
	}
	.sealed p {
		width: 100%;
		margin: 0;
		text-align: center;
		font-size: 0.76rem;
		opacity: 0.6;
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
	.ball.big {
		width: 84px;
		height: 84px;
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
	.ball.big::after {
		width: 24px;
		height: 24px;
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
		color: #ff8f8f;
	}
	.result b.won {
		color: #f0c85a;
	}
	.result b.tie {
		color: #d1f6ef;
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
