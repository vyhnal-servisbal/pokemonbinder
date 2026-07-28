<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import DexModal from '$lib/components/DexModal.svelte';
	import { dex, DEX_MAX, spriteOf, aniOf, pretty, rarityOf, type Catch } from '$lib/dexStore.svelte';

	let showDex = $state(false);

	onMount(() => dex.init());

	function fallback(e: Event, c: Catch) {
		const img = e.currentTarget as HTMLImageElement;
		if (!img.dataset.fb) {
			img.dataset.fb = '1';
			img.src = spriteOf(c.id, c.shiny);
		}
	}
</script>

<svelte:head><title>Unboxing · Pokémon Binder</title></svelte:head>

<header class="topbar">
	<div class="inner">
		<a class="back" href="/">‹ Binder</a>
		<h1>Unboxing</h1>
		<div class="stats">
			<button class="stat main" onclick={() => (showDex = true)}
				><b>{dex.caughtCount}</b> / {DEX_MAX} caught</button
			>
			<span class="stat shiny"><b>{dex.shinyCount}</b> shiny</span>
			<span class="stat shadow"><b>{dex.shadowCount}</b> shadow</span>
			<button class="stat" onclick={() => (showDex = true)}>Pokédex</button>
		</div>
	</div>
</header>

<main class="wrap">
	{#if !dex.pack.length}
		<!-- the pack itself is the button -->
		<button class="pack" onclick={() => dex.openPack()} disabled={dex.opening}>
			<span class="ball"></span>
			<span class="lbl">{dex.opening ? 'Opening...' : 'Tap to open a pack'}</span>
			<span class="hint">5 Pokémon · shiny, shadow and size are rolled per catch</span>
		</button>
	{:else}
		<p class="prompt">
			{dex.allFlipped ? 'Nice haul.' : 'Tap the cards to reveal them.'}
		</p>

		<div class="cards">
			{#each dex.pack as c, i (i)}
				{@const shown = dex.opened.includes(i)}
				{@const r = rarityOf(c)}
				<button
					class="card {shown ? r.tier : 'hidden'}"
					class:shown
					style:--rc={r.color}
					onclick={() => dex.flip(i)}
					aria-label={shown ? pretty(c.name) : 'Reveal card'}
				>
					{#if shown}
						{#if r.tier === 'shiny' || r.tier === 'shinyShadow'}
							<span class="rays"></span>
							{#each [0, 1, 2, 3, 4, 5] as s (s)}
								<span class="spark" style:--d="{s * 0.16}s" style:--a="{s * 60}deg"></span>
							{/each}
						{/if}

						<span class="face" in:scale={{ duration: 280, start: 0.55 }}>
							<img
								src={aniOf(c.name, c.shiny)}
								alt={c.name}
								onerror={(e) => fallback(e, c)}
								draggable="false"
							/>
							<b class="nm">{pretty(c.name)}</b>
							<span class="tags">
								{#if dex.wasNew(i)}<span class="tag new">NEW</span>{/if}
								{#if r.label}<span class="tag rare">{r.label}</span>{/if}
								{#if c.size !== 'M' && r.tier !== 'size'}<span class="tag sz">{c.size}</span>{/if}
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

{#if showDex}
	<DexModal onClose={() => (showDex = false)} />
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
		gap: 1.2rem;
		flex-wrap: wrap;
		max-width: 1400px;
		margin: 0 auto;
		padding: 0.6rem 2rem;
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
		font-size: 1.1rem;
	}
	.stats {
		margin-left: auto;
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.stat {
		padding: 0.32rem 0.75rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(255, 255, 255, 0.05);
		color: #ece9f7;
		font-size: 0.78rem;
	}
	button.stat {
		cursor: pointer;
	}
	button.stat:hover {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.18);
	}
	.stat b {
		font-variant-numeric: tabular-nums;
	}
	.stat.main {
		border-color: rgba(var(--accent-rgb), 0.5);
		color: #d1f6ef;
	}
	.stat.shiny {
		border-color: rgba(240, 200, 90, 0.5);
		color: #f0c85a;
	}
	.stat.shadow {
		border-color: rgba(170, 110, 220, 0.5);
		color: #c79bea;
	}

	.wrap {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2.4rem 2rem 4rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.4rem;
	}

	/* ---- the pack ---- */
	.pack {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
		padding: 2.2rem 3rem;
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
	.pack:active:not(:disabled) {
		transform: translateY(-1px) scale(0.99);
	}
	.pack:disabled {
		opacity: 0.6;
		cursor: default;
	}
	.ball {
		width: 96px;
		height: 96px;
		border-radius: 50%;
		background:
			linear-gradient(#e0574f 0 46%, #111 46% 54%, #fff 54% 100%),
			#fff;
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
		width: 28px;
		height: 28px;
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
		font-size: 1.05rem;
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

	/* ---- cards ---- */
	.cards {
		display: flex;
		gap: 0.9rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	.card {
		position: relative;
		width: clamp(128px, 17vw, 172px);
		aspect-ratio: 3 / 4;
		padding: 0;
		border-radius: 14px;
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
		box-shadow: 0 0 26px color-mix(in srgb, var(--rc) 40%, transparent);
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
			box-shadow: 0 0 42px color-mix(in srgb, var(--rc) 70%, transparent);
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
		font-size: 2.4rem;
		font-weight: 900;
		opacity: 0.3;
	}
	.face {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
		text-align: center;
		z-index: 2;
	}
	.face img {
		width: 76px;
		height: 76px;
		object-fit: contain;
		image-rendering: pixelated;
	}
	.card.shadow .face img,
	.card.shinyShadow .face img {
		filter: brightness(0.74) saturate(0.6) drop-shadow(0 0 9px rgba(170, 110, 220, 0.95));
	}
	.nm {
		font-size: 0.84rem;
	}
	.face small {
		font-size: 0.62rem;
		opacity: 0.55;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem;
		justify-content: center;
	}
	.tag {
		padding: 0.1rem 0.38rem;
		border-radius: 5px;
		font-size: 0.56rem;
		font-weight: 800;
		letter-spacing: 0.04em;
	}
	.tag.new {
		background: rgba(90, 200, 130, 0.25);
		color: #7fe0a4;
	}
	.tag.rare {
		background: color-mix(in srgb, var(--rc) 25%, transparent);
		color: var(--rc);
	}
	.tag.sz {
		background: rgba(255, 255, 255, 0.12);
		opacity: 0.8;
	}

	/* rare drop flourishes, only rendered for shiny */
	.rays {
		position: absolute;
		inset: -40%;
		background: conic-gradient(
			from 0deg,
			transparent 0 10deg,
			color-mix(in srgb, var(--rc) 35%, transparent) 10deg 14deg,
			transparent 14deg 30deg
		);
		animation: spin 9s linear infinite;
		opacity: 0.55;
		pointer-events: none;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.spark {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--rc);
		box-shadow: 0 0 10px var(--rc);
		transform: rotate(var(--a)) translateY(-46px);
		animation: twinkle 1.5s ease-in-out infinite;
		animation-delay: var(--d);
		pointer-events: none;
	}
	@keyframes twinkle {
		0%,
		100% {
			opacity: 0;
			scale: 0.4;
		}
		50% {
			opacity: 1;
			scale: 1.15;
		}
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
	.ghost:hover {
		background: rgba(255, 255, 255, 0.14);
	}

	@media (max-width: 700px) {
		.inner,
		.wrap {
			padding-left: 1.1rem;
			padding-right: 1.1rem;
		}
	}
</style>
