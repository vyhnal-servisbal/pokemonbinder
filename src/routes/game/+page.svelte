<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import {
		dex,
		GENS,
		DEX_MAX,
		spriteOf,
		aniOf,
		pretty,
		type Catch
	} from '$lib/dexStore.svelte';

	let gen = $state(0);
	let detail = $state<number | null>(null);
	let confirmReset = $state(false);

	onMount(() => dex.init());

	const range = $derived(GENS[gen]);
	const ids = $derived(
		Array.from({ length: range.to - range.from + 1 }, (_, k) => range.from + k)
	);
	const inGen = $derived(ids.filter((id) => dex.dex[id]).length);

	// the reveal steps through the pack one card at a time
	function next() {
		if (dex.revealed < dex.pack.length) dex.revealNext();
		else dex.clearPack();
	}

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
			<span class="stat"><b>{dex.caughtCount}</b> / {DEX_MAX} caught</span>
			<span class="stat shiny"><b>{dex.shinyCount}</b> shiny</span>
			<span class="stat shadow"><b>{dex.shadowCount}</b> shadow</span>
		</div>
	</div>
</header>

<main class="wrap">
	<section class="opener">
		<button class="open" onclick={() => dex.openPack()} disabled={dex.opening || !!dex.pack.length}>
			{dex.opening ? 'Opening...' : 'Open a pack'}
		</button>
		<p class="tip">Five random Pokémon. Every catch rolls shiny, shadow and a size.</p>
	</section>

	<!-- pack reveal -->
	{#if dex.pack.length}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="reveal" transition:fade={{ duration: 160 }} onclick={next} role="presentation">
			<div class="cards" onclick={(e) => e.stopPropagation()} role="presentation">
				{#each dex.pack as c, i (c.id + '-' + i)}
					{@const shown = i < dex.revealed}
					{@const isNew = dex.dex[c.id]?.count === 1}
					<div class="card" class:shown class:shiny={c.shiny} class:shadow={c.shadow}>
						{#if shown}
							<div class="face" transition:scale={{ duration: 260, start: 0.7 }}>
								<img
									src={aniOf(c.name, c.shiny)}
									alt={c.name}
									onerror={(e) => fallback(e, c)}
									draggable="false"
								/>
								<b class="nm">{pretty(c.name)}</b>
								<div class="tags">
									{#if isNew}<span class="tag new">NEW</span>{/if}
									{#if c.shiny}<span class="tag sh">✨ SHINY</span>{/if}
									{#if c.shadow}<span class="tag sd">SHADOW</span>{/if}
									{#if c.size}<span class="tag sz">{c.size}</span>{/if}
								</div>
								<small>{c.height} m · {c.weight} kg</small>
							</div>
						{:else}
							<div class="back"><span>?</span></div>
						{/if}
					</div>
				{/each}
			</div>

			<div class="revbtns">
				{#if dex.revealed < dex.pack.length}
					<button class="ghost" onclick={() => dex.revealNext()}>Reveal next</button>
					<button class="ghost" onclick={() => dex.revealAll()}>Reveal all</button>
				{:else}
					<button class="ghost" onclick={() => dex.clearPack()}>Done</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- pokedex -->
	<section class="dex">
		<div class="dexhead">
			<h2>Pokédex</h2>
			<span class="sub">{inGen} / {ids.length} in this range</span>
			<div class="gens">
				{#each GENS as g, i (g.label)}
					<button class:on={gen === i} onclick={() => (gen = i)}>{g.label}</button>
				{/each}
			</div>
		</div>

		<div class="grid">
			{#each ids as id (id)}
				{@const e = dex.dex[id]}
				<button
					class="slot"
					class:got={!!e}
					class:shiny={e?.shiny}
					class:shadow={e?.shadow}
					onclick={() => e && (detail = id)}
					title={dex.names[id - 1] ? pretty(dex.names[id - 1]) : '#' + id}
				>
					<img src={spriteOf(id, !!e?.shiny)} alt="" loading="lazy" draggable="false" />
					<span class="id">#{String(id).padStart(4, '0')}</span>
					{#if e && e.count > 1}<span class="cnt">×{e.count}</span>{/if}
				</button>
			{/each}
		</div>

		<div class="dexfoot">
			{#if confirmReset}
				<span class="warn">Wipe the whole dex?</span>
				<button
					class="danger"
					onclick={() => {
						dex.reset();
						confirmReset = false;
					}}>Wipe it</button
				>
				<button class="ghost" onclick={() => (confirmReset = false)}>Keep</button>
			{:else}
				<button class="ghost" onclick={() => (confirmReset = true)}>Reset dex</button>
			{/if}
		</div>
	</section>
</main>

<!-- single entry detail -->
{#if detail !== null && dex.dex[detail]}
	{@const e = dex.dex[detail]}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="backdrop"
		transition:fade={{ duration: 150 }}
		onclick={() => (detail = null)}
		role="presentation"
	>
		<div
			class="entry"
			transition:scale={{ duration: 200, start: 0.94 }}
			onclick={(ev) => ev.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-label="Entry"
			tabindex="-1"
		>
			<img src={aniOf(e.best.name, e.shiny)} alt="" class:shadow={e.shadow} />
			<h3>{pretty(e.best.name)}</h3>
			<span class="eid">#{String(detail).padStart(4, '0')}</span>
			<div class="tags">
				{#if e.shiny}<span class="tag sh">✨ SHINY</span>{/if}
				{#if e.shadow}<span class="tag sd">SHADOW</span>{/if}
				{#each e.sizes as s (s)}<span class="tag sz">{s}</span>{/each}
			</div>
			<p class="meta">
				Caught {e.count}×<br />
				Best: {e.best.height} m · {e.best.weight} kg
			</p>
			<button class="close" onclick={() => (detail = null)} aria-label="Close">×</button>
		</div>
	</div>
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
		padding: 0.28rem 0.7rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(255, 255, 255, 0.05);
		font-size: 0.78rem;
	}
	.stat b {
		font-variant-numeric: tabular-nums;
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
		padding: 1.6rem 2rem 4rem;
		display: flex;
		flex-direction: column;
		gap: 1.6rem;
	}
	.opener {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}
	.open {
		padding: 0.9rem 2.2rem;
		border: 0;
		border-radius: 14px;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 1.05rem;
		font-weight: 800;
		cursor: pointer;
		box-shadow: 0 14px 34px rgba(var(--accent-rgb), 0.28);
	}
	.open:disabled {
		opacity: 0.45;
		cursor: default;
		box-shadow: none;
	}
	.tip {
		margin: 0;
		font-size: 0.8rem;
		opacity: 0.55;
	}

	/* ---- reveal ---- */
	.reveal {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.4rem;
		padding: 1.5rem;
		background: rgba(6, 4, 16, 0.86);
		backdrop-filter: blur(8px);
	}
	.cards {
		display: flex;
		gap: 0.8rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	.card {
		width: clamp(120px, 17vw, 168px);
		aspect-ratio: 3 / 4;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: linear-gradient(160deg, #22232c, #14151b);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}
	.card.shown.shiny {
		border-color: rgba(240, 200, 90, 0.8);
		box-shadow: 0 0 26px rgba(240, 200, 90, 0.35);
	}
	.card.shown.shadow {
		border-color: rgba(170, 110, 220, 0.8);
		box-shadow: 0 0 26px rgba(170, 110, 220, 0.35);
	}
	.back {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2.4rem;
		font-weight: 900;
		opacity: 0.25;
		background: repeating-linear-gradient(
			45deg,
			rgba(255, 255, 255, 0.04) 0 10px,
			transparent 10px 20px
		);
	}
	.face {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
		text-align: center;
	}
	.face img {
		width: 74px;
		height: 74px;
		object-fit: contain;
		image-rendering: pixelated;
	}
	.card.shadow .face img {
		filter: brightness(0.72) saturate(0.6) drop-shadow(0 0 8px rgba(170, 110, 220, 0.9));
	}
	.nm {
		font-size: 0.82rem;
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
		padding: 0.1rem 0.35rem;
		border-radius: 5px;
		font-size: 0.56rem;
		font-weight: 800;
		letter-spacing: 0.03em;
	}
	.tag.new {
		background: rgba(90, 200, 130, 0.25);
		color: #7fe0a4;
	}
	.tag.sh {
		background: rgba(240, 200, 90, 0.22);
		color: #f0c85a;
	}
	.tag.sd {
		background: rgba(170, 110, 220, 0.22);
		color: #c79bea;
	}
	.tag.sz {
		background: rgba(var(--accent-rgb), 0.2);
		color: #9be6db;
	}
	.revbtns {
		display: flex;
		gap: 0.5rem;
	}
	.ghost {
		padding: 0.5rem 1rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.16);
		background: rgba(255, 255, 255, 0.06);
		color: #ece9f7;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.ghost:hover {
		background: rgba(255, 255, 255, 0.14);
	}

	/* ---- dex ---- */
	.dex {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}
	.dexhead {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		flex-wrap: wrap;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	.sub {
		font-size: 0.78rem;
		opacity: 0.55;
	}
	.gens {
		margin-left: auto;
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}
	.gens button {
		min-width: 34px;
		padding: 0.3rem 0.55rem;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: #d8d2f0;
		font-size: 0.76rem;
		cursor: pointer;
	}
	.gens button.on {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.2);
		color: #d1f6ef;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
		gap: 0.4rem;
	}
	.slot {
		position: relative;
		padding: 0.25rem;
		border-radius: 9px;
		border: 1px solid rgba(255, 255, 255, 0.07);
		background: rgba(255, 255, 255, 0.02);
		cursor: default;
	}
	.slot.got {
		cursor: pointer;
		border-color: rgba(255, 255, 255, 0.14);
		background: rgba(255, 255, 255, 0.05);
	}
	.slot.got:hover {
		border-color: var(--accent);
	}
	.slot.got.shiny {
		border-color: rgba(240, 200, 90, 0.55);
		background: rgba(240, 200, 90, 0.09);
	}
	.slot.got.shadow {
		border-color: rgba(170, 110, 220, 0.55);
	}
	.slot img {
		width: 100%;
		height: auto;
		image-rendering: pixelated;
		/* not caught yet = classic black silhouette, no extra request */
		filter: brightness(0);
		opacity: 0.35;
	}
	.slot.got img {
		filter: none;
		opacity: 1;
	}
	.slot.got.shadow img {
		filter: brightness(0.78) saturate(0.6);
	}
	.id {
		display: block;
		text-align: center;
		font-size: 0.58rem;
		opacity: 0.4;
		font-variant-numeric: tabular-nums;
	}
	.slot.got .id {
		opacity: 0.75;
	}
	.cnt {
		position: absolute;
		top: 0.15rem;
		right: 0.25rem;
		font-size: 0.56rem;
		font-weight: 800;
		opacity: 0.65;
	}
	.dexfoot {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-top: 0.4rem;
	}
	.warn {
		font-size: 0.82rem;
		color: #ffcf8b;
	}
	.danger {
		padding: 0.45rem 0.9rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 120, 140, 0.6);
		background: rgba(200, 50, 70, 0.9);
		color: #fff;
		font-size: 0.82rem;
		font-weight: 700;
		cursor: pointer;
	}

	/* ---- entry ---- */
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 62;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: rgba(6, 4, 16, 0.75);
		backdrop-filter: blur(6px);
	}
	.entry {
		position: relative;
		width: min(320px, 100%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		padding: 1.6rem;
		border-radius: 16px;
		background: linear-gradient(150deg, #23242e, #16171d);
		border: 1px solid rgba(255, 255, 255, 0.09);
		box-shadow: 0 40px 90px rgba(0, 0, 0, 0.6);
		text-align: center;
	}
	.entry img {
		width: 108px;
		height: 108px;
		object-fit: contain;
		image-rendering: pixelated;
	}
	.entry img.shadow {
		filter: brightness(0.72) saturate(0.6) drop-shadow(0 0 10px rgba(170, 110, 220, 0.9));
	}
	.entry h3 {
		margin: 0;
		font-size: 1.1rem;
	}
	.eid {
		font-size: 0.72rem;
		opacity: 0.5;
		font-variant-numeric: tabular-nums;
	}
	.meta {
		margin: 0.3rem 0 0;
		font-size: 0.78rem;
		opacity: 0.7;
		line-height: 1.5;
	}
	.close {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 30px;
		height: 30px;
		border: 0;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
		font-size: 1.2rem;
		line-height: 1;
		cursor: pointer;
	}

	@media (max-width: 700px) {
		.inner,
		.wrap {
			padding-left: 1.1rem;
			padding-right: 1.1rem;
		}
	}
</style>
