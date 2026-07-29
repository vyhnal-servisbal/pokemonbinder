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
		isLegendary,
		isMythical,
		type Catch
	} from '$lib/dexStore.svelte';

	let showDex = $state(false);
	let dexFilter = $state('');
	let spaceMode = $state(false);

	// header chips double as shortcuts into the dex
	const CHIPS = [
		{ id: 'shiny', label: 'shiny', color: '#f0c85a' },
		{ id: 'shadow', label: 'shadow', color: '#b47ae0' },
		{ id: 'shinyShadow', label: 'shiny shadow', color: '#ff8ae0' },
		{ id: 'mega', label: 'mega', color: '#ff6b6b' },
		{ id: 'gmax', label: 'gigantamax', color: '#ff7ad9' },
		{ id: 'primal', label: 'primal', color: '#ff9f43' },
		{ id: 'terastal', label: 'terastal', color: '#8fe3ff' },
		{ id: 'origin', label: 'origin', color: '#b98cff' },
		{ id: 'therian', label: 'therian', color: '#87c5a4' },
		{ id: 'crowned', label: 'crowned', color: '#ffcf5c' },
		{ id: 'alola', label: 'alolan', color: '#4fd1c5' },
		{ id: 'galar', label: 'galarian', color: '#8ab4f8' },
		{ id: 'hisui', label: 'hisuian', color: '#c39b6b' },
		{ id: 'paldea', label: 'paldean', color: '#a3d977' },
		{ id: 'totem', label: 'totem', color: '#e0a458' },
		{ id: 'variant', label: 'other forms', color: '#9aa3ad' },
		{ id: 'legendary', label: 'legendary', color: '#ffd166' },
		{ id: 'mythical', label: 'mythical', color: '#ff9ec7' }
	];

	function openDex(filter = '') {
		dexFilter = filter;
		showDex = true;
	}

	// a few forms (the Koraidon/Miraidon build modes) have no sprite anywhere, so
	// step down: animated form -> static form -> plain species
	function fallback(e: Event, c: Catch) {
		const img = e.currentTarget as HTMLImageElement;
		const step = Number(img.dataset.fb ?? 0);
		if (step === 0) {
			img.dataset.fb = '1';
			img.src = spriteOf(c.spriteId ?? c.id, c.shiny);
		} else if (step === 1) {
			img.dataset.fb = '2';
			img.src = spriteOf(c.id, c.shiny);
		}
	}

	// object-fit already fits each sprite to the box, so what still looks uneven is
	// aspect ratio: a wide fish reads small, a tall deer reads narrow. Even out the
	// drawn AREA instead. After contain, area = w*h*(box/max(w,h))^2, so the
	// correction reduces to max(w,h)/sqrt(w*h) and never depends on the box.
	const SIZE_FACTOR: Record<string, number> = { XXS: 0.8, XS: 0.9, M: 1, XL: 1.1, XXL: 1.22 };
	let scales = $state<Record<number, number>>({});

	function measure(e: Event, i: number, c: Catch) {
		const img = e.currentTarget as HTMLImageElement;
		const w = img.naturalWidth || 96;
		const h = img.naturalHeight || 96;
		const norm = Math.min(1.15, Math.max(0.85, (0.86 * Math.max(w, h)) / Math.sqrt(w * h)));
		scales = { ...scales, [i]: norm * (SIZE_FACTOR[c.size] ?? 1) };
	}

	// a fresh pack starts from unmeasured
	$effect(() => {
		dex.pack;
		untrack(() => (scales = {}));
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

	// the flourish clears itself once it has played out
	$effect(() => {
		if (!dex.lastSpecial) return;
		const t = setTimeout(() => dex.clearSpecial(), 2600);
		return () => clearTimeout(t);
	});

	onMount(() => {
		dex.init();
		function key(e: KeyboardEvent) {
			if (e.code !== 'Space' || !spaceMode || showDex) return;
			const t = e.target as HTMLElement | null;
			if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
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
		<a class="back" href="/">‹ Binder</a>
		<h1>Unboxing</h1>

		<button
			class="spacebtn"
			class:on={spaceMode}
			onclick={() => (spaceMode = !spaceMode)}
			title={spaceMode
				? 'Space opens a pack, then reveals all of it'
				: 'Turn on to play with the spacebar'}
			aria-pressed={spaceMode}
		>
			<span class="knob"></span>
			Space {spaceMode ? 'on' : 'off'}
		</button>

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
			<button class="chip pokedex" onclick={() => openDex()}>Pokédex</button>
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
	{:else}
		<p class="prompt">{dex.allFlipped ? 'Nice haul.' : 'Tap the cards to reveal them.'}</p>

		<div class="cards">
			{#each dex.pack as c, i (i)}
				{@const shown = dex.opened.includes(i)}
				{@const fin = finishOf(c)}
				{@const fk = formKind(c.form)}
				<button
					class="card {shown ? fin.tier : 'hidden'}"
					class:shown
					style:--rc={fin.color}
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

								<span class="tags">
									{#if fin.label}<span class="tag" style:--t={fin.color}>{fin.label}</span>{/if}
									{#if fk}<span class="tag" style:--t={fk.color}>{fk.label}</span>{/if}
									{#if isLegendary(c.id)}<span class="tag" style:--t="#ffd166">LEGENDARY</span>{/if}
									{#if isMythical(c.id)}<span class="tag" style:--t="#ff9ec7">MYTHICAL</span>{/if}
								</span>
							</span>

							<small>{c.height} m · {c.weight} kg</small>
						</span>
					{:else}
						<span class="back"><span class="q">?</span></span>
					{/if}
				</button>
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

<!-- shiny shadow flourish: short, centred, never blocks a click -->
{#if dex.lastSpecial}
	{@const s = dex.lastSpecial}
	<div class="flourish" transition:fade={{ duration: 220 }} aria-hidden="true">
		<span class="halo"></span>
		<span class="ring"></span>
		<img src={aniOf(s.name, true)} alt="" />
		<span class="ftxt">SHINY SHADOW</span>
	</div>
{/if}

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
	.back:hover {
		background: rgba(var(--accent-rgb), 0.24);
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
	.chip.pokedex {
		--c: #ffffff;
		font-weight: 700;
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
		gap: 0.45rem;
		padding: 0.3rem 0.75rem 0.3rem 0.35rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(255, 255, 255, 0.04);
		color: #d8d2f0;
		font-size: 0.76rem;
		cursor: pointer;
		white-space: nowrap;
	}
	.spacebtn.on {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.16);
		color: #d1f6ef;
	}
	.knob {
		position: relative;
		width: 30px;
		height: 17px;
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
		width: 13px;
		height: 13px;
		border-radius: 50%;
		background: #fff;
		transition: transform 0.18s;
	}
	.spacebtn.on .knob {
		background: var(--accent);
	}
	.spacebtn.on .knob::after {
		transform: translateX(13px);
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
	.prompt {
		margin: 0;
		font-size: 0.9rem;
		opacity: 0.7;
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
		width: clamp(172px, min(22vw, 38dvh), 284px);
		aspect-ratio: 3 / 4;
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
	.back {
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
		width: clamp(96px, 11.5vw, 150px);
		height: clamp(96px, 11.5vw, 150px);
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
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		justify-content: center;
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

	/* ---- shiny shadow flourish ---- */
	.flourish {
		position: fixed;
		inset: 0;
		z-index: 70;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		pointer-events: none;
	}
	.halo {
		position: absolute;
		width: 60vmin;
		height: 60vmin;
		border-radius: 50%;
		background: radial-gradient(
			closest-side,
			rgba(255, 138, 224, 0.32),
			rgba(240, 200, 90, 0.16) 55%,
			transparent 72%
		);
		animation: halo 2.6s ease-out forwards;
	}
	@keyframes halo {
		0% {
			transform: scale(0.2);
			opacity: 0;
		}
		25% {
			opacity: 1;
		}
		100% {
			transform: scale(1.25);
			opacity: 0;
		}
	}
	.ring {
		position: absolute;
		width: 26vmin;
		height: 26vmin;
		border-radius: 50%;
		border: 2px solid rgba(255, 138, 224, 0.9);
		box-shadow: 0 0 26px rgba(255, 138, 224, 0.8);
		animation: ringout 1.6s ease-out forwards;
	}
	@keyframes ringout {
		0% {
			transform: scale(0.35);
			opacity: 0;
		}
		30% {
			opacity: 1;
		}
		100% {
			transform: scale(2.4);
			opacity: 0;
		}
	}
	.flourish img {
		width: clamp(120px, 20vmin, 200px);
		image-rendering: pixelated;
		filter: brightness(0.8) saturate(0.7) drop-shadow(0 0 18px rgba(255, 138, 224, 0.95));
		animation: pop 2.6s ease-out forwards;
	}
	@keyframes pop {
		0% {
			transform: scale(0.5);
			opacity: 0;
		}
		18% {
			transform: scale(1.12);
			opacity: 1;
		}
		30% {
			transform: scale(1);
		}
		82% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
	.ftxt {
		font-size: clamp(1.1rem, 3.4vmin, 2rem);
		font-weight: 900;
		letter-spacing: 0.12em;
		background: linear-gradient(90deg, #ff8ae0, #f0c85a, #ff8ae0);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		animation: pop 2.6s ease-out forwards;
	}

	@media (max-width: 700px) {
		.inner,
		.wrap {
			padding-left: 1rem;
			padding-right: 1rem;
		}
	}
</style>
