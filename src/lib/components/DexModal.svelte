<script lang="ts">
	import { untrack } from 'svelte';
	import { fade, scale, fly } from 'svelte/transition';
	import {
		dex,
		GENS,
		DEX_MAX,
		FORMS,
		SIZES,
		spriteOf,
		aniOf,
		pretty,
		isLegendary,
		isMythical,
		formKind,
		type Base
	} from '$lib/dexStore.svelte';

	let { onClose, filter = '' }: { onClose: () => void; filter?: string } = $props();

	let gen = $state(0);
	// the modal is re-created on every open, so seeding from the prop once is intended
	let mode = $state(untrack(() => filter)); // '' = browse by generation
	let open = $state<number | null>(null);
	let info = $state<Base | null>(null);

	const COLLECTIONS = [
		{ id: 'shiny', label: 'Shiny', color: '#f0c85a' },
		{ id: 'shadow', label: 'Shadow', color: '#b47ae0' },
		{ id: 'shinyShadow', label: 'Shiny Shadow', color: '#ff8ae0' },
		{ id: 'mega', label: 'Mega', color: '#ff6b6b' },
		{ id: 'gmax', label: 'Gigantamax', color: '#ff7ad9' },
		{ id: 'alola', label: 'Alolan', color: '#4fd1c5' },
		{ id: 'galar', label: 'Galarian', color: '#8ab4f8' },
		{ id: 'hisui', label: 'Hisuian', color: '#c39b6b' },
		{ id: 'paldea', label: 'Paldean', color: '#a3d977' },
		{ id: 'legendary', label: 'Legendary', color: '#ffd166' },
		{ id: 'mythical', label: 'Mythical', color: '#ff9ec7' }
	];

	const range = $derived(GENS[gen]);
	const ids = $derived(
		mode
			? dex.idsWhere(mode)
			: Array.from({ length: range.to - range.from + 1 }, (_, k) => range.from + k)
	);
	const inGen = $derived(ids.filter((id) => dex.dex[id]).length);
	const entry = $derived(open !== null ? dex.dex[open] : undefined);

	async function inspect(id: number) {
		if (!dex.dex[id]) return;
		open = id;
		info = dex.base[id] ?? null;
		info = await dex.loadBase(id);
	}

	function back() {
		open = null;
		info = null;
	}

	function onKey(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		if (open !== null) back();
		else onClose();
	}
</script>

<svelte:window onkeydown={onKey} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="backdrop" transition:fade={{ duration: 160 }} onclick={onClose} role="presentation">
	<div
		class="dialog"
		transition:scale={{ duration: 200, start: 0.95 }}
		onclick={(e) => e.stopPropagation()}
		role="dialog"
		aria-modal="true"
		aria-label="Pokedex"
		tabindex="-1"
	>
		{#if open === null || !entry}
			<div class="head">
				<h2>Pokédex</h2>
				<span class="total">{dex.caughtCount} / {DEX_MAX}</span>
			</div>

			<div class="tabs">
				<button class="tab" class:on={mode === ''} onclick={() => (mode = '')}>Generations</button>
				{#each COLLECTIONS as c (c.id)}
					{@const n = dex.countOf(c.id)}
					{#if n > 0 || mode === c.id}
						<button
							class="tab col"
							class:on={mode === c.id}
							style:--c={c.color}
							onclick={() => (mode = c.id)}>{c.label} <i>{n}</i></button
						>
					{/if}
				{/each}
			</div>

			{#if mode === ''}
				<div class="gens">
					{#each GENS as g, i (g.label)}
						{@const caught = Array.from(
							{ length: g.to - g.from + 1 },
							(_, k) => g.from + k
						).filter((id) => dex.dex[id]).length}
						<button class:on={gen === i} onclick={() => (gen = i)}>
							<b><span class="rom">{g.label}</span> {g.name}</b>
							<i>{caught} / {g.to - g.from + 1}</i>
						</button>
					{/each}
				</div>
				<div class="sub">{inGen} of {ids.length} caught in {range.name}</div>
			{:else}
				<div class="sub">{ids.length} in this collection</div>
			{/if}

			<div class="grid">
				{#each ids as id (id)}
					{@const e = dex.dex[id]}
					{@const f = e?.forms ?? []}
					{@const shinyGot = f.some((x) => x.startsWith('shiny'))}
					<button
						class="slot"
						class:got={!!e}
						class:done={dex.isComplete(id)}
						class:shiny={shinyGot}
						class:shadow={f.includes('shadow') || f.includes('shinyShadow')}
						class:legend={isLegendary(id)}
						class:myth={isMythical(id)}
						onclick={() => inspect(id)}
						title={dex.names[id - 1] ? pretty(dex.names[id - 1]) : '#' + id}
					>
						<img src={spriteOf(id, shinyGot)} alt="" loading="lazy" draggable="false" />
						<span class="nm">{dex.names[id - 1] ? pretty(dex.names[id - 1]) : '???'}</span>
						<span class="id">#{String(id).padStart(4, '0')}</span>
						{#if e && e.count > 1}<span class="cnt">×{e.count}</span>{/if}
						{#if dex.isComplete(id)}<span class="star">★</span>{/if}
					</button>
				{/each}
				{#if !ids.length}
					<p class="none">Nothing here yet.</p>
				{/if}
			</div>
		{:else}
			{@const oid = open}
			{@const f = entry.forms ?? []}
			{@const shinyGot = f.some((x) => x.startsWith('shiny'))}
			{@const pool = dex.alts[oid] ?? []}
			<div class="detail" in:fly={{ x: 24, duration: 200 }}>
				<button class="backbtn" onclick={back}>‹ Pokédex</button>

				<div class="hero">
					<img
						class="art"
						class:shadow={f.includes('shadow') || f.includes('shinyShadow')}
						src={aniOf(entry.best.name, shinyGot)}
						alt=""
						onerror={(e) =>
							((e.currentTarget as HTMLImageElement).src = spriteOf(entry.best.spriteId ?? oid, shinyGot))}
					/>
					<div class="herotxt">
						<h3>{pretty(dex.names[oid - 1] ?? entry.best.name)}</h3>
						<span class="eid">#{String(oid).padStart(4, '0')}</span>

						<div class="badges">
							{#if isLegendary(oid)}<span class="badge" style:--c="#ffd166">Legendary</span>{/if}
							{#if isMythical(oid)}<span class="badge" style:--c="#ff9ec7">Mythical</span>{/if}
							{#each info?.types ?? [] as t (t)}<span class="badge type">{t}</span>{/each}
						</div>

						<p class="meta">
							Caught <b>{entry.count}×</b><br />
							Best: {entry.best.height} m · {entry.best.weight} kg
						</p>
					</div>
				</div>

				{#if info?.stats.length}
					<div class="block">
						<h4>Base stats</h4>
						<div class="stats">
							{#each info.stats as s (s.name)}
								<span class="sname">{dex.statLabel(s.name)}</span>
								<span class="sbar"><i style:width="{Math.min(100, (s.value / 180) * 100)}%"></i></span>
								<span class="sval">{s.value}</span>
							{/each}
						</div>
					</div>
				{/if}

				<div class="block">
					<h4>Finish</h4>
					<div class="vars">
						{#each FORMS as x (x.id)}
							{@const got = f.includes(x.id)}
							<span class="var {x.id}" class:got><b>{got ? '✓' : '✗'}</b> {x.label}</span>
						{/each}
					</div>
				</div>

				<div class="block">
					<h4>Sizes</h4>
					<div class="vars">
						{#each SIZES as s (s)}
							{@const got = (entry.sizes ?? []).includes(s)}
							<span class="var size" class:got
								><b>{got ? '✓' : '✗'}</b> {s === 'M' ? 'Normal' : s}</span
							>
						{/each}
					</div>
				</div>

				{#if pool.length}
					<div class="block">
						<h4>Alternate forms</h4>
						<div class="vars">
							{#each pool as a (a.key)}
								{@const got = (entry.alts ?? []).includes(a.key)}
								{@const k = formKind(a.key)}
								<span class="var" class:got style:--c={k?.color}>
									<b>{got ? '✓' : '✗'}</b>
									{k?.label ?? pretty(a.key)}
								</span>
							{/each}
						</div>
					</div>
				{/if}

				{#if dex.isComplete(oid)}
					<p class="complete">★ Entry complete</p>
				{/if}
			</div>
		{/if}

		<button class="close" onclick={onClose} aria-label="Close">×</button>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 62;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: rgba(6, 4, 16, 0.75);
		backdrop-filter: blur(6px);
	}
	/* sized to the window, so it fits any screen without tuning */
	.dialog {
		position: relative;
		width: min(1180px, 100%);
		height: min(92dvh, 980px);
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		padding: 1.5rem;
		border-radius: 16px;
		background: linear-gradient(150deg, #23242e, #16171d);
		border: 1px solid rgba(255, 255, 255, 0.09);
		box-shadow: 0 40px 90px rgba(0, 0, 0, 0.6);
		color: #ece9f7;
		overflow: hidden;
	}
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding-right: 2.6rem;
	}
	h2 {
		margin: 0;
		font-size: 1.25rem;
	}
	.total {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--accent);
		font-variant-numeric: tabular-nums;
	}

	.tabs {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
	}
	.tab {
		padding: 0.3rem 0.7rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(255, 255, 255, 0.04);
		color: #d8d2f0;
		font-size: 0.76rem;
		cursor: pointer;
		white-space: nowrap;
	}
	.tab i {
		font-style: normal;
		opacity: 0.6;
		font-variant-numeric: tabular-nums;
	}
	.tab.col {
		border-color: color-mix(in srgb, var(--c) 45%, transparent);
		color: var(--c);
	}
	.tab.on {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.2);
		color: #d1f6ef;
	}
	.tab.col.on {
		border-color: var(--c);
		background: color-mix(in srgb, var(--c) 22%, transparent);
		color: var(--c);
	}

	.gens {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
	}
	.gens button {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.08rem;
		padding: 0.32rem 0.7rem;
		border-radius: 9px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: #d8d2f0;
		cursor: pointer;
		white-space: nowrap;
	}
	.gens button b {
		font-size: 0.76rem;
		font-weight: 600;
	}
	.rom {
		display: inline-block;
		min-width: 1.6em;
		opacity: 0.5;
		font-weight: 800;
	}
	.gens button.on .rom {
		opacity: 0.9;
	}
	.gens button i {
		font-style: normal;
		font-size: 0.6rem;
		opacity: 0.55;
		font-variant-numeric: tabular-nums;
	}
	.gens button.on {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.2);
		color: #d1f6ef;
	}
	.sub {
		font-size: 0.78rem;
		opacity: 0.55;
	}

	/* bigger tiles, with the name on them */
	.grid {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
		gap: 0.45rem;
		overflow-y: auto;
		padding: 0.1rem;
		align-content: start;
	}
	.slot {
		position: relative;
		padding: 0.3rem 0.2rem 0.25rem;
		border-radius: 10px;
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
	/* finish drives the border, species class only tints the corner strip */
	.slot.got.shiny {
		border-color: rgba(240, 200, 90, 0.6);
		background: rgba(240, 200, 90, 0.09);
	}
	.slot.got.shadow {
		border-color: rgba(170, 110, 220, 0.6);
	}
	.slot.got.shiny.shadow {
		border-color: rgba(255, 138, 224, 0.75);
		background: rgba(255, 138, 224, 0.1);
	}
	.slot.legend::before,
	.slot.myth::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		height: 3px;
		border-radius: 10px 10px 0 0;
	}
	.slot.legend::before {
		background: #ffd166;
	}
	.slot.myth::before {
		background: #ff9ec7;
	}
	.slot.done {
		box-shadow: inset 0 0 0 1px rgba(240, 200, 90, 0.5);
	}
	.slot img {
		width: 100%;
		height: auto;
		image-rendering: pixelated;
		filter: brightness(0);
		opacity: 0.32;
	}
	.slot.got img {
		filter: none;
		opacity: 1;
	}
	.slot.got.shadow img {
		filter: brightness(0.78) saturate(0.6);
	}
	.nm {
		display: block;
		text-align: center;
		font-size: 0.62rem;
		line-height: 1.15;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		opacity: 0.35;
	}
	.slot.got .nm {
		opacity: 0.95;
	}
	.id {
		display: block;
		text-align: center;
		font-size: 0.55rem;
		opacity: 0.35;
		font-variant-numeric: tabular-nums;
	}
	.cnt {
		position: absolute;
		top: 0.24rem;
		right: 0.28rem;
		font-size: 0.55rem;
		font-weight: 800;
		opacity: 0.7;
	}
	.star {
		position: absolute;
		top: 0.24rem;
		left: 0.28rem;
		font-size: 0.62rem;
		color: #f0c85a;
	}
	.none {
		grid-column: 1 / -1;
		margin: 1rem 0;
		text-align: center;
		font-size: 0.85rem;
		opacity: 0.5;
	}

	/* ---- detail ---- */
	.detail {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		overflow-y: auto;
		padding-right: 0.2rem;
	}
	.backbtn {
		align-self: flex-start;
		padding: 0.32rem 0.75rem;
		border-radius: 9px;
		border: 1px solid rgba(var(--accent-rgb), 0.35);
		background: rgba(var(--accent-rgb), 0.12);
		color: #d1f6ef;
		font-size: 0.82rem;
		cursor: pointer;
	}
	.hero {
		display: flex;
		align-items: center;
		gap: 1.4rem;
		flex-wrap: wrap;
	}
	.art {
		width: 150px;
		height: 150px;
		object-fit: contain;
		image-rendering: pixelated;
	}
	.art.shadow {
		filter: brightness(0.75) saturate(0.6) drop-shadow(0 0 10px rgba(170, 110, 220, 0.85));
	}
	h3 {
		margin: 0;
		font-size: 1.5rem;
	}
	.eid {
		font-size: 0.78rem;
		opacity: 0.5;
		font-variant-numeric: tabular-nums;
	}
	.badges {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
		margin: 0.5rem 0;
	}
	.badge {
		padding: 0.18rem 0.6rem;
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: capitalize;
		color: var(--c, #ece9f7);
		background: color-mix(in srgb, var(--c, #ffffff) 18%, transparent);
		border: 1px solid color-mix(in srgb, var(--c, #ffffff) 45%, transparent);
	}
	.badge.type {
		--c: #9aa3ad;
	}
	.meta {
		margin: 0;
		font-size: 0.84rem;
		opacity: 0.75;
		line-height: 1.5;
	}
	.block h4 {
		margin: 0 0 0.4rem;
		font-size: 0.84rem;
		opacity: 0.65;
		font-weight: 700;
	}
	.stats {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.32rem 0.6rem;
		align-items: center;
		max-width: 460px;
	}
	.sname {
		font-size: 0.74rem;
		opacity: 0.65;
	}
	.sbar {
		display: block;
		height: 8px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.08);
		overflow: hidden;
	}
	.sbar i {
		display: block;
		height: 100%;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--accent), #57c9ba);
	}
	.sval {
		font-size: 0.74rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		min-width: 26px;
		text-align: right;
	}
	.vars {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.var {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.32rem 0.7rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.03);
		font-size: 0.78rem;
		opacity: 0.5;
	}
	.var b {
		font-size: 0.72rem;
	}
	.var.got {
		opacity: 1;
		border-color: color-mix(in srgb, var(--c, #79e2d5) 55%, transparent);
		background: color-mix(in srgb, var(--c, #79e2d5) 16%, transparent);
		color: var(--c, #d1f6ef);
	}
	.var.shiny.got,
	.var.shinyShadow.got {
		--c: #f0c85a;
	}
	.var.shadow.got {
		--c: #b47ae0;
	}
	.complete {
		margin: 0;
		text-align: center;
		font-weight: 800;
		color: #f0c85a;
	}

	.close {
		position: absolute;
		top: 0.6rem;
		right: 0.6rem;
		width: 32px;
		height: 32px;
		border: 0;
		border-radius: 50%;
		font-size: 1.3rem;
		line-height: 1;
		color: #fff;
		background: rgba(255, 255, 255, 0.1);
		cursor: pointer;
	}
	.close:hover {
		background: rgba(255, 255, 255, 0.22);
	}
</style>
