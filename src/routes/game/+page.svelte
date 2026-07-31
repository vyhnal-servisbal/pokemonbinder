<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import DexModal from '$lib/components/DexModal.svelte';
	import {
		dex,
		DEX_MAX,
		spriteOf,
		aniOf,
		pretty,
		finishOf,
		formKind,
		rarityGlow,
		typeColor,
		isLegendary,
		isMythical,
		PITY_AT,
		PITY_KINDS,
		SHOP,
		type Catch
	} from '$lib/dexStore.svelte';
	import { haulLine } from '$lib/haul';

	let showDex = $state(false);
	let dexFilter = $state('');
	let spaceMode = $state(false);

	// header chips double as shortcuts into the dex
	// only the headline stats live up here; every other collection is one click
	// away inside the Pokedex, which already lists them all with counts
	const CHIPS = [
		{ id: 'shiny', label: 'shiny', color: '#f0c85a' },
		{ id: 'shadow', label: 'shadow', color: '#b47ae0' },
		{ id: 'shinyShadow', label: 'shiny shadow', color: '#ff8ae0' },
		{ id: 'legendary', label: 'legendary', color: '#ffd166' },
		{ id: 'mythical', label: 'mythical', color: '#ff9ec7' }
	];

	function openDex(filter = '') {
		dexFilter = filter;
		showDex = true;
	}

	// 11 forms have no sprite anywhere, so step down:
	// animated form -> static form -> plain species.
	// Compared against the url, not a flag on the element: Svelte reuses these
	// <img> nodes between packs and a flag would survive into the next one.
	function fallback(e: Event, c: Catch) {
		const img = e.currentTarget as HTMLImageElement;
		const a = spriteOf(c.spriteId ?? c.id, c.shiny);
		const b = spriteOf(c.id, c.shiny);
		if (img.src === b) return;
		img.src = img.src === a ? b : a;
	}

	// object-fit blows every canvas up to fill the box, which is why a 47px
	// Fletchling ended up as big as a 115px Onix. The sprite canvas is actually a
	// decent proxy for how big the Pokemon is, so scale relative to the largest
	// canvas instead of filling. Floor keeps the tiny ones readable.
	const SPRITE_REF = 130; // roughly the biggest canvas Showdown ships
	const SPRITE_MIN = 0.42;
	const SIZE_FACTOR: Record<string, number> = { XXS: 0.8, XS: 0.9, M: 1, XL: 1.1, XXL: 1.22 };
	let scales = $state<Record<number, number>>({});

	function measure(e: Event, i: number, c: Catch) {
		const img = e.currentTarget as HTMLImageElement;
		const side = Math.max(img.naturalWidth || 96, img.naturalHeight || 96);
		const rel = Math.min(1, Math.max(SPRITE_MIN, side / SPRITE_REF));
		scales = { ...scales, [i]: rel * (SIZE_FACTOR[c.size] ?? 1) };
	}

	// a fresh pack starts from unmeasured
	$effect(() => {
		dex.pack;
		untrack(() => {
			scales = {};
			haul = '';
		});
	});

	// one line per finished pack, picked from what was actually in it
	let haul = $state('');
	$effect(() => {
		if (!dex.allFlipped) return;
		untrack(() => {
			if (haul) return;
			const p = dex.pack;
			haul = haulLine({
				shinyShadow: p.some((c) => c.shiny && c.shadow),
				shiny: p.some((c) => c.shiny),
				shadow: p.some((c) => c.shadow),
				legendary: p.some((c) => isLegendary(c.id)),
				mythical: p.some((c) => isMythical(c.id)),
				mega: p.some((c) => formKind(c.form)?.kind === 'mega'),
				gmax: p.some((c) => formKind(c.form)?.kind === 'gmax'),
				xxl: p.some((c) => c.size === 'XXL'),
				xxs: p.some((c) => c.size === 'XXS'),
				xl: p.some((c) => c.size === 'XL'),
				xs: p.some((c) => c.size === 'XS'),
				newCount: p.filter((_, i) => dex.wasNew(i)).length
			});
		});
	});

	// space does the next sensible thing, so a whole session needs no clicking:
	// open a pack, reveal the lot, then straight on to the next pack
	function advance() {
		if (!dex.pack.length) {
			dex.openPack();
			return;
		}
		if (!dex.allFlipped) {
			dex.flipAll();
			return;
		}
		dex.openPack();
	}

	onMount(() => {
		dex.init();
		function key(e: KeyboardEvent) {
			const t = e.target as HTMLElement | null;
			if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
			if (showDex) return;
			// S toggles the mode from anywhere, so the switch never needs a trip
			// to the corner of the screen
			if (e.code === 'KeyS') {
				spaceMode = !spaceMode;
				return;
			}
			if (e.code !== 'Space' || !spaceMode) return;
			e.preventDefault(); // stop the page scrolling
			advance();
		}
		window.addEventListener('keydown', key);
		return () => window.removeEventListener('keydown', key);
	});
</script>

<svelte:head><title>Unboxing · Pokémon Binder</title></svelte:head>

<div class="page">
	<header class="topbar">
		<div class="inner">
		<div class="hleft">
			<a class="back" href="/">‹ Binder</a>
			<h1>Unboxing</h1>
		</div>

		<div class="chips">
			<button class="chip main" onclick={() => openDex()}>
				<b>{dex.caughtCount}</b><span class="of">/ {DEX_MAX}</span> caught
			</button>
			{#each CHIPS as c (c.id)}
				{@const n = dex.countOf(c.id)}
				{@const t = dex.totalOf(c.id)}
				{#if t > 0}
					<button class="chip" style:--c={c.color} onclick={() => openDex(c.id)}>
						<b>{n}</b><span class="of">/ {t}</span>
						{c.label}
					</button>
				{/if}
			{/each}
		</div>

		<button class="dexbtn" onclick={() => openDex()}>📕 Pokédex</button>

		<div class="hright">
			<button
				class="spacebtn"
				class:on={spaceMode}
				onclick={() => (spaceMode = !spaceMode)}
				title="Press S anywhere to toggle. Space then opens a pack and reveals it."
				aria-pressed={spaceMode}
			>
				<span class="knob"></span>
				<span class="sptxt">Space mode <kbd>S</kbd></span>
			</button>
			<a class="back battle" href="/battle">⚔ Battle</a>
		</div>
	</div>
</header>

<main class="wrap">
	{#if !dex.pack.length}
		<button class="pack" onclick={() => dex.openPack()} disabled={dex.opening}>
			<span class="ball"></span>
			<span class="lbl">{dex.opening ? 'Opening...' : 'Tap to open a pack'}</span>
			<span class="hint">5 Pokémon · shiny, shadow, size and alternate forms are rolled</span>
		</button>

		<div class="pity">
			{#each PITY_KINDS as k (k)}
				{@const n = dex.pity[k] ?? 0}
				{@const max = PITY_AT[k]}
				<div class="pbar" class:close={n >= max - 3} title="Guaranteed after {max} packs without one">
					<span class="plabel">{k === 'shinyShadow' ? 'shiny shadow' : k}</span>
					<span class="ptrack"><i style:width="{Math.min(100, (n / max) * 100)}%"></i></span>
					<span class="pnum">{n} / {max}</span>
				</div>
			{/each}
		</div>

		<div class="shop">
			<span class="dust"><b>{dex.dust}</b> dust</span>
			{#each Object.entries(SHOP) as [k, item] (k)}
				<button
					class="buy"
					style:--c={item.color}
					disabled={dex.dust < item.cost || dex.opening}
					title={item.desc}
					onclick={() => dex.openShopPack(k)}
				>
					{item.label} <i>{item.cost}</i>
				</button>
			{/each}
		</div>
	{:else}
		<p class="prompt" class:haul={dex.allFlipped}>
			{dex.allFlipped ? haul : 'Tap the cards to reveal them.'}
		</p>

		<div class="cards">
			{#each dex.pack as c, i (i)}
				{@const shown = dex.opened.includes(i)}
				{@const fin = finishOf(c)}
				{@const fk = formKind(c.form)}
				{@const glow = rarityGlow(c)}
				{@const types = dex.base[c.id]?.types ?? []}
				{@const wow = dex.specials.includes(i)}
				<div class="cardwrap" class:wow>
					{#if wow}
						<span class="wow-text">SHINY SHADOW</span>
						<span class="wow-halo"></span>
						<span class="wow-ring"></span>
						<span class="wow-ring two"></span>
					{/if}
					<button
							class="card {shown ? fin.tier : 'hidden'}"
						class:shown
						style:--rc={fin.color}
						style:--gl={glow?.color ?? 'transparent'}
						class:rare={!!glow}
						onclick={() => dex.flip(i)}
						aria-label={shown ? pretty(c.name) : 'Reveal card'}
					>
						{#if shown}
							{#if fin.tier === 'shiny' || fin.tier === 'shinyShadow'}
								<span class="sheen"></span>
							{/if}

							<!-- corners: size on the left, new entry on the right -->
							{#if c.size !== 'M'}
								<span class="corner left">{c.size}</span>
							{/if}
							{#if dex.wasNew(i)}
								<span class="corner right">NEW</span>
							{/if}

							<span class="face" in:scale={{ duration: 280, start: 0.55 }}>
								<span class="artbox">
									<img
										src={aniOf(c.name, c.shiny)}
										alt={c.name}
										style:transform="scale({scales[i] ?? 1})"
										onload={(e) => measure(e, i, c)}
										onerror={(e) => fallback(e, c)}
										draggable="false"
									/>
								</span>
								<span class="info">
								<b class="nm">{pretty(c.name)}</b>

								{#if types.length}
									<span class="types">
										{#each types as t (t)}
											<span class="type" style:--t={typeColor(t)}>{t}</span>
										{/each}
									</span>
								{/if}

								{#if fin.label || fk || isLegendary(c.id) || isMythical(c.id)}
									<span class="tags">
										{#if fin.label}<span class="tag" style:--t={fin.color}>{fin.label}</span>{/if}
										{#if fk}<span class="tag" style:--t={fk.color}>{fk.label}</span>{/if}
										{#if isLegendary(c.id)}<span class="tag" style:--t="#ffd166">LEGENDARY</span>{/if}
										{#if isMythical(c.id)}<span class="tag" style:--t="#ff9ec7">MYTHICAL</span>{/if}
									</span>
								{/if}
								</span>

								<small>{c.height} m · {c.weight} kg</small>
							</span>
						{:else}
							<span class="cardback"><span class="q">?</span></span>
						{/if}
	</button>
				</div>
			{/each}
		</div>

		{#if dex.allFlipped}
			<div class="after" transition:fade={{ duration: 160 }}>
				<button class="again" onclick={() => dex.openPack()}>Open another</button>
				<button class="ghost" onclick={() => dex.clearPack()}>Done</button>
			</div>
		{/if}
	{/if}
</main>
</div>

{#if showDex}
	<DexModal filter={dexFilter} onClose={() => (showDex = false)} />
{/if}

<style>
	.topbar {
		position: sticky;
		top: 0;
		z-index: 20;
		background: rgba(14, 15, 20, 0.82);
		backdrop-filter: blur(14px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.09);
	}
	/* groups wrap as blocks, so the bar never breaks into a stack of singles */
	.inner {
		display: flex;
		align-items: center;
		gap: 0.5rem 1rem;
		flex-wrap: wrap;
		max-width: 1900px;
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
	.back:hover {
		background: rgba(var(--accent-rgb), 0.24);
	}
	.back.battle {
		border-color: rgba(240, 200, 90, 0.45);
		background: rgba(240, 200, 90, 0.12);
		color: #f0c85a;
	}
	.back.battle:hover {
		background: rgba(240, 200, 90, 0.24);
	}
	h1 {
		margin: 0;
		font-size: 1.05rem;
	}
	.chips {
		margin-left: auto;
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.chip {
		display: inline-flex;
		align-items: baseline;
		gap: 0.3rem;
		padding: 0.3rem 0.7rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--c, #ffffff) 40%, transparent);
		background: color-mix(in srgb, var(--c, #ffffff) 12%, transparent);
		color: var(--c, #ece9f7);
		font-size: 0.74rem;
		cursor: pointer;
		white-space: nowrap;
	}
	.chip:hover {
		background: color-mix(in srgb, var(--c, #ffffff) 24%, transparent);
	}
	.chip b {
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}
	.chip .of {
		opacity: 0.6;
	}
	.chip.main {
		--c: #79e2d5;
	}
	/* the way into the dex, deliberately the loudest thing in the bar */
	.dexbtn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 1.1rem;
		border: 0;
		border-radius: 999px;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 0.86rem;
		font-weight: 800;
		cursor: pointer;
		white-space: nowrap;
		box-shadow: 0 6px 18px rgba(var(--accent-rgb), 0.3);
	}
	.dexbtn:hover {
		background: #8fe9dd;
		box-shadow: 0 8px 22px rgba(var(--accent-rgb), 0.45);
	}

	/* the page owns the viewport: header takes what it needs, main gets the rest.
	   No guessing the header height, so no stray scrollbar when the chips wrap. */
	.page {
		height: 100dvh;
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		overflow: hidden;
	}
	.wrap {
		width: 100%;
		max-width: 1500px;
		margin: 0 auto;
		padding: 1rem 1.6rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		min-height: 0;
		overflow-y: auto; /* only scrolls if a pack really cannot fit */
	}

	/* compact spacebar switch, lives in the header next to the title */
	.spacebtn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.38rem 0.85rem 0.38rem 0.4rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.18);
		background: rgba(255, 255, 255, 0.05);
		color: #d8d2f0;
		font-size: 0.82rem;
		cursor: pointer;
		white-space: nowrap;
	}
	.sptxt {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	kbd {
		padding: 0.05rem 0.35rem;
		border-radius: 5px;
		border: 1px solid rgba(255, 255, 255, 0.25);
		background: rgba(0, 0, 0, 0.35);
		font-family: inherit;
		font-size: 0.68rem;
		font-weight: 800;
		line-height: 1.4;
	}
	.spacebtn.on kbd {
		border-color: rgba(var(--accent-rgb), 0.6);
	}
	.spacebtn.on {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.16);
		color: #d1f6ef;
	}
	.knob {
		position: relative;
		width: 34px;
		height: 19px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.18);
		transition: background 0.18s;
		flex: none;
	}
	.knob::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 15px;
		height: 15px;
		border-radius: 50%;
		background: #fff;
		transition: transform 0.18s;
	}
	.spacebtn.on .knob {
		background: var(--accent);
	}
	.spacebtn.on .knob::after {
		transform: translateX(15px);
	}

	/* ---- the pack ---- */
	.pack {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
		padding: 2.4rem 3.4rem;
		border-radius: 22px;
		border: 1px solid rgba(var(--accent-rgb), 0.35);
		background:
			radial-gradient(120% 90% at 50% 0%, rgba(var(--accent-rgb), 0.16), transparent 65%),
			linear-gradient(160deg, #22232c, #14151b);
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
		cursor: pointer;
		transition:
			transform 0.18s ease,
			box-shadow 0.18s ease;
	}
	.pack:hover:not(:disabled) {
		transform: translateY(-4px);
		box-shadow: 0 32px 70px rgba(0, 0, 0, 0.6);
	}
	.pack:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.ball {
		width: 104px;
		height: 104px;
		border-radius: 50%;
		background: linear-gradient(#e0574f 0 46%, #111 46% 54%, #fff 54% 100%), #fff;
		box-shadow:
			inset 0 0 0 3px #111,
			0 10px 26px rgba(0, 0, 0, 0.5);
		position: relative;
		animation: bob 2.6s ease-in-out infinite;
	}
	.ball::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		width: 30px;
		height: 30px;
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
			transform: translateY(-7px);
		}
	}
	.lbl {
		font-size: 1.1rem;
		font-weight: 800;
		color: #d1f6ef;
	}
	.hint {
		font-size: 0.75rem;
		opacity: 0.5;
	}
	/* ---- pity + shop ---- */
	.pity {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	.pbar {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.28rem 0.6rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.03);
		font-size: 0.68rem;
	}
	/* nearly there -> nudge it so you notice */
	.pbar.close {
		border-color: rgba(240, 200, 90, 0.6);
		background: rgba(240, 200, 90, 0.12);
		color: #f0c85a;
	}
	.plabel {
		text-transform: capitalize;
		opacity: 0.7;
	}
	.ptrack {
		display: block;
		width: 56px;
		height: 5px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.1);
		overflow: hidden;
	}
	.ptrack i {
		display: block;
		height: 100%;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--accent), #f0c85a);
		transition: width 0.3s ease;
	}
	.pnum {
		font-variant-numeric: tabular-nums;
		opacity: 0.6;
	}
	.shop {
		display: flex;
		gap: 0.45rem;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
	}
	.dust {
		padding: 0.32rem 0.75rem;
		border-radius: 999px;
		border: 1px solid rgba(var(--accent-rgb), 0.45);
		background: rgba(var(--accent-rgb), 0.14);
		color: #d1f6ef;
		font-size: 0.76rem;
	}
	.dust b {
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}
	.buy {
		padding: 0.32rem 0.8rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--c) 45%, transparent);
		background: color-mix(in srgb, var(--c) 14%, transparent);
		color: var(--c);
		font-size: 0.76rem;
		font-weight: 700;
		cursor: pointer;
		white-space: nowrap;
	}
	.buy i {
		font-style: normal;
		opacity: 0.7;
		font-variant-numeric: tabular-nums;
	}
	.buy:hover:not(:disabled) {
		background: color-mix(in srgb, var(--c) 26%, transparent);
	}
	.buy:disabled {
		opacity: 0.35;
		cursor: default;
	}
	.prompt {
		margin: 0;
		font-size: 0.9rem;
		opacity: 0.7;
		text-align: center;
	}
	.prompt.haul {
		font-size: clamp(0.95rem, 2vh, 1.15rem);
		font-weight: 700;
		opacity: 1;
		color: #d1f6ef;
	}

	/* ---- cards, sized off the window height so a pack always fits ---- */
	.cards {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	.card {
		position: relative;
		width: clamp(160px, min(20.5vw, 35dvh), 262px);
		aspect-ratio: 7 / 10;
		padding: 0;
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: linear-gradient(160deg, #22232c, #14151b);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		cursor: pointer;
		transition:
			transform 0.18s ease,
			box-shadow 0.25s ease,
			border-color 0.25s ease;
	}
	.card.hidden:hover {
		transform: translateY(-6px) rotate(-1deg);
		border-color: rgba(var(--accent-rgb), 0.6);
	}
	.card.shown {
		cursor: default;
		border-color: color-mix(in srgb, var(--rc) 70%, transparent);
		box-shadow: 0 0 28px color-mix(in srgb, var(--rc) 40%, transparent);
	}
	.card.shown.common {
		box-shadow: none;
		border-color: rgba(255, 255, 255, 0.14);
	}
	/* rarity gets an INNER glow, a channel the finish never touches, so a shiny
	   legendary shows a gold rim outside and a gold bloom inside without clashing */
	.card.shown.rare::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		z-index: 1;
		box-shadow:
			inset 0 0 26px color-mix(in srgb, var(--gl) 30%, transparent),
			inset 0 0 6px color-mix(in srgb, var(--gl) 22%, transparent);
	}
	.card.shown.shiny,
	.card.shown.shinyShadow {
		animation: pulse 1.6s ease-in-out infinite;
	}
	@keyframes pulse {
		0%,
		100% {
			box-shadow: 0 0 22px color-mix(in srgb, var(--rc) 35%, transparent);
		}
		50% {
			box-shadow: 0 0 46px color-mix(in srgb, var(--rc) 72%, transparent);
		}
	}
	/* card back; deliberately NOT .back, that class is the header link */
	.cardback {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: repeating-linear-gradient(
			45deg,
			rgba(255, 255, 255, 0.05) 0 10px,
			transparent 10px 20px
		);
	}
	.q {
		font-size: 2.6rem;
		font-weight: 900;
		opacity: 0.3;
	}
	/* three clear bands: sprite, then name + badges, then the measurements */
	.face {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
		height: 100%;
		padding: 0.7rem 0.6rem 0.6rem;
		text-align: center;
		z-index: 2;
	}
	/* the sprite gets its own flexible band, so it fills the card instead of
	   leaving a hole in the middle */
	.artbox {
		flex: 1;
		min-height: 0;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.face img {
		width: clamp(104px, 12.5vw, 162px);
		height: clamp(104px, 12.5vw, 162px);
		object-fit: contain;
		image-rendering: pixelated;
		transform-origin: center bottom;
		transition: transform 0.2s ease;
	}
	.info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		width: 100%;
	}
	.card.shadow .face img,
	.card.shinyShadow .face img {
		filter: brightness(0.74) saturate(0.6) drop-shadow(0 0 9px rgba(170, 110, 220, 0.95));
	}
	.nm {
		font-size: clamp(0.95rem, 1.7vh, 1.15rem);
		font-weight: 800;
		line-height: 1.2;
		text-wrap: balance;
	}
	/* measurements sit in their own band under a hairline */
	.face small {
		width: 100%;
		padding-top: 0.45rem;
		border-top: 1px solid rgba(255, 255, 255, 0.12);
		font-size: clamp(0.72rem, 1.3vh, 0.86rem);
		font-variant-numeric: tabular-nums;
		opacity: 0.8;
	}
	.types {
		display: flex;
		flex-wrap: wrap;
		gap: 0.22rem;
		justify-content: center;
	}
	.type {
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		font-size: clamp(0.58rem, 1.05vh, 0.68rem);
		font-weight: 700;
		text-transform: capitalize;
		color: var(--t);
		background: color-mix(in srgb, var(--t) 22%, transparent);
	}
	/* hairline between the typing and the rarity badges */
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		justify-content: center;
		width: 100%;
		padding-top: 0.4rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}
	/* every badge uses its own colour, so classes never fight the finish glow */
	.tag {
		padding: 0.16rem 0.5rem;
		border-radius: 6px;
		font-size: clamp(0.62rem, 1.15vh, 0.72rem);
		font-weight: 800;
		letter-spacing: 0.03em;
		line-height: 1.25;
		color: var(--t);
		background: color-mix(in srgb, var(--t) 20%, transparent);
		border: 1px solid color-mix(in srgb, var(--t) 45%, transparent);
	}

	/* foil sweep: a glossy band crosses the card, like tilting a real holo card */
	.sheen {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		border-radius: inherit;
	}
	.sheen::before {
		content: '';
		position: absolute;
		top: -60%;
		bottom: -60%;
		width: 45%;
		left: -60%;
		background: linear-gradient(
			100deg,
			transparent,
			color-mix(in srgb, var(--rc) 35%, transparent) 42%,
			rgba(255, 255, 255, 0.55) 50%,
			color-mix(in srgb, var(--rc) 35%, transparent) 58%,
			transparent
		);
		filter: blur(2px);
		transform: rotate(12deg);
		animation: sweep 3.4s ease-in-out infinite;
	}
	/* faint holo wash underneath, so the card reads as foil even between sweeps */
	.sheen::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--rc) 14%, transparent),
			transparent 40%,
			color-mix(in srgb, var(--rc) 10%, transparent) 70%,
			transparent
		);
	}
	@keyframes sweep {
		0% {
			left: -60%;
		}
		55%,
		100% {
			left: 130%;
		}
	}

	/* corner tags */
	.corner {
		position: absolute;
		top: 0.5rem;
		z-index: 3;
		padding: 0.16rem 0.5rem;
		border-radius: 7px;
		font-size: clamp(0.6rem, 1.1vh, 0.7rem);
		font-weight: 800;
		letter-spacing: 0.04em;
		line-height: 1.2;
	}
	.corner.left {
		left: 0.5rem;
		color: #79e2d5;
		background: rgba(121, 226, 213, 0.18);
		border: 1px solid rgba(121, 226, 213, 0.5);
	}
	.corner.right {
		right: 0.5rem;
		color: #7fe0a4;
		background: rgba(127, 224, 164, 0.18);
		border: 1px solid rgba(127, 224, 164, 0.5);
	}

	.after {
		display: flex;
		gap: 0.6rem;
	}
	.again {
		padding: 0.7rem 1.6rem;
		border: 0;
		border-radius: 12px;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 0.95rem;
		font-weight: 800;
		cursor: pointer;
		box-shadow: 0 12px 30px rgba(var(--accent-rgb), 0.28);
	}
	.ghost {
		padding: 0.7rem 1.2rem;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.16);
		background: rgba(255, 255, 255, 0.06);
		color: #ece9f7;
		font-size: 0.9rem;
		cursor: pointer;
	}

	/* ---- shiny shadow: happens AROUND the card it came from ---- */
	.cardwrap {
		position: relative;
		display: flex;
		/* the effect must escape the card's own overflow:hidden, hence the wrapper */
	}
	.cardwrap.wow {
		z-index: 5;
	}
	.cardwrap.wow .card {
		animation: wowcard 2.4s ease-out;
	}
	@keyframes wowcard {
		0% {
			transform: scale(1);
		}
		12% {
			transform: scale(1.09) rotate(-1.2deg);
		}
		26% {
			transform: scale(1.03) rotate(0.6deg);
		}
		100% {
			transform: scale(1);
		}
	}
	.wow-text {
		position: absolute;
		left: 50%;
		top: -1.9rem;
		transform: translateX(-50%);
		z-index: 3;
		white-space: nowrap;
		font-size: clamp(0.8rem, 1.9vh, 1.05rem);
		font-weight: 900;
		letter-spacing: 0.14em;
		background: linear-gradient(90deg, #ff8ae0, #f0c85a, #ff8ae0);
		background-size: 200% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 0 10px rgba(255, 138, 224, 0.75));
		animation:
			wowtext 2.6s ease-out forwards,
			wowshimmer 1.6s linear infinite;
		pointer-events: none;
	}
	@keyframes wowtext {
		0% {
			opacity: 0;
			transform: translate(-50%, 10px) scale(0.7);
		}
		18% {
			opacity: 1;
			transform: translate(-50%, 0) scale(1.06);
		}
		30% {
			transform: translate(-50%, 0) scale(1);
		}
		80% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
	@keyframes wowshimmer {
		to {
			background-position: 200% 0;
		}
	}
	.wow-halo {
		position: absolute;
		inset: -26%;
		border-radius: 50%;
		background: radial-gradient(
			closest-side,
			rgba(255, 138, 224, 0.4),
			rgba(240, 200, 90, 0.18) 55%,
			transparent 72%
		);
		animation: wowhalo 2.4s ease-out forwards;
		pointer-events: none;
	}
	@keyframes wowhalo {
		0% {
			opacity: 0;
			transform: scale(0.4);
		}
		20% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: scale(1.2);
		}
	}
	.wow-ring {
		position: absolute;
		inset: 0;
		border-radius: 18px;
		border: 2px solid rgba(255, 138, 224, 0.95);
		box-shadow: 0 0 26px rgba(255, 138, 224, 0.75);
		animation: wowring 1.5s ease-out forwards;
		pointer-events: none;
	}
	.wow-ring.two {
		animation-delay: 0.35s;
		border-color: rgba(240, 200, 90, 0.9);
		box-shadow: 0 0 22px rgba(240, 200, 90, 0.6);
	}
	@keyframes wowring {
		0% {
			opacity: 0;
			transform: scale(0.86);
		}
		25% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: scale(1.35);
		}
	}

	@media (max-width: 700px) {
		.inner,
		.wrap {
			padding-left: 1rem;
			padding-right: 1rem;
		}
	}
</style>
