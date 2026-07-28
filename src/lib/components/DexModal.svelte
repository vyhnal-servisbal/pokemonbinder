<script lang="ts">
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
		type Base
	} from '$lib/dexStore.svelte';

	let { onClose }: { onClose: () => void } = $props();

	let gen = $state(0);
	let open = $state<number | null>(null); // species being inspected
	let info = $state<Base | null>(null);

	const range = $derived(GENS[gen]);
	const ids = $derived(
		Array.from({ length: range.to - range.from + 1 }, (_, k) => range.from + k)
	);
	const inGen = $derived(ids.filter((id) => dex.dex[id]).length);
	const entry = $derived(open !== null ? dex.dex[open] : undefined);

	// stats load lazily, only for the species you actually open
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

			<div class="grid">
				{#each ids as id (id)}
					{@const e = dex.dex[id]}
					{@const done = dex.isComplete(id)}
					<button
						class="slot"
						class:got={!!e}
						class:done
						class:shiny={(e?.forms ?? []).some((f) => f.startsWith('shiny'))}
						class:shadow={(e?.forms ?? []).includes('shadow')}
						onclick={() => inspect(id)}
						title={dex.names[id - 1] ? pretty(dex.names[id - 1]) : '#' + id}
					>
						<img
							src={spriteOf(id, (e?.forms ?? []).some((f) => f.startsWith('shiny')))}
							alt=""
							loading="lazy"
							draggable="false"
						/>
						<span class="id">#{String(id).padStart(4, '0')}</span>
						{#if e && e.count > 1}<span class="cnt">×{e.count}</span>{/if}
						{#if done}<span class="star">★</span>{/if}
					</button>
				{/each}
			</div>
		{:else}
			{@const oid = open}
			{@const shinyGot = (entry.forms ?? []).some((f) => f.startsWith('shiny'))}
			<div class="detail" in:fly={{ x: 24, duration: 200 }}>
				<button class="backbtn" onclick={back}>‹ Pokédex</button>

				<div class="hero">
					<img
						class="art"
						class:shadow={(entry.forms ?? []).includes('shadow')}
						src={aniOf(entry.best.name, shinyGot)}
						alt=""
						onerror={(e) => ((e.currentTarget as HTMLImageElement).src = spriteOf(oid, shinyGot))}
					/>
					<div class="herotxt">
						<h3>{pretty(entry.best.name)}</h3>
						<span class="eid">#{String(oid).padStart(4, '0')}</span>
						{#if info?.types.length}
							<div class="types">
								{#each info.types as t (t)}<span class="type {t}">{t}</span>{/each}
							</div>
						{/if}
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
					<h4>Forms</h4>
					<div class="vars">
						{#each FORMS as f (f.id)}
							{@const got = (entry.forms ?? []).includes(f.id)}
							<span class="var {f.id}" class:got>
								<b>{got ? '✓' : '✗'}</b>
								{f.label}
							</span>
						{/each}
					</div>
				</div>

				<div class="block">
					<h4>Sizes</h4>
					<div class="vars">
						{#each SIZES as s (s)}
							{@const got = (entry.sizes ?? []).includes(s)}
							<span class="var size" class:got>
								<b>{got ? '✓' : '✗'}</b>
								{s === 'M' ? 'Normal' : s}
							</span>
						{/each}
					</div>
				</div>

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
		padding: 1.5rem;
		background: rgba(6, 4, 16, 0.75);
		backdrop-filter: blur(6px);
	}
	.dialog {
		position: relative;
		width: min(880px, 100%);
		max-height: 86vh;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.6rem;
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
		/* keep the counter clear of the close button in the corner */
		padding-right: 2.6rem;
	}
	h2 {
		margin: 0;
		font-size: 1.2rem;
	}
	.total {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--accent);
		font-variant-numeric: tabular-nums;
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
	/* the numeral stays, just dimmed so the region name leads */
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
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
		gap: 0.35rem;
		overflow-y: auto;
		padding: 0.1rem;
	}
	.slot {
		position: relative;
		padding: 0.2rem;
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
	.slot.done {
		box-shadow: inset 0 0 0 1px rgba(240, 200, 90, 0.5);
	}
	.slot img {
		width: 100%;
		height: auto;
		image-rendering: pixelated;
		/* not caught yet = classic black silhouette, no extra request */
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
	.id {
		display: block;
		text-align: center;
		font-size: 0.56rem;
		opacity: 0.4;
		font-variant-numeric: tabular-nums;
	}
	.slot.got .id {
		opacity: 0.72;
	}
	.cnt {
		position: absolute;
		top: 0.1rem;
		right: 0.22rem;
		font-size: 0.54rem;
		font-weight: 800;
		opacity: 0.65;
	}
	.star {
		position: absolute;
		top: 0.1rem;
		left: 0.22rem;
		font-size: 0.6rem;
		color: #f0c85a;
	}

	/* ---- detail ---- */
	.detail {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		overflow-y: auto;
		padding-right: 0.2rem;
	}
	.backbtn {
		align-self: flex-start;
		padding: 0.3rem 0.7rem;
		border-radius: 9px;
		border: 1px solid rgba(var(--accent-rgb), 0.35);
		background: rgba(var(--accent-rgb), 0.12);
		color: #d1f6ef;
		font-size: 0.8rem;
		cursor: pointer;
	}
	.hero {
		display: flex;
		align-items: center;
		gap: 1.2rem;
		flex-wrap: wrap;
	}
	.art {
		width: 120px;
		height: 120px;
		object-fit: contain;
		image-rendering: pixelated;
	}
	.art.shadow {
		filter: brightness(0.75) saturate(0.6) drop-shadow(0 0 10px rgba(170, 110, 220, 0.85));
	}
	h3 {
		margin: 0;
		font-size: 1.3rem;
	}
	.eid {
		font-size: 0.76rem;
		opacity: 0.5;
		font-variant-numeric: tabular-nums;
	}
	.types {
		display: flex;
		gap: 0.3rem;
		margin: 0.45rem 0;
	}
	.type {
		padding: 0.16rem 0.55rem;
		border-radius: 999px;
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: capitalize;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.16);
	}
	.meta {
		margin: 0;
		font-size: 0.8rem;
		opacity: 0.75;
		line-height: 1.5;
	}
	.block h4 {
		margin: 0 0 0.4rem;
		font-size: 0.82rem;
		opacity: 0.65;
		font-weight: 700;
	}
	.stats {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.3rem 0.6rem;
		align-items: center;
	}
	.sname {
		font-size: 0.72rem;
		opacity: 0.65;
	}
	.sbar {
		display: block;
		height: 7px;
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
		font-size: 0.72rem;
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
		padding: 0.3rem 0.65rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.03);
		font-size: 0.76rem;
		opacity: 0.5;
	}
	.var b {
		font-size: 0.7rem;
	}
	.var.got {
		opacity: 1;
		border-color: rgba(var(--accent-rgb), 0.5);
		background: rgba(var(--accent-rgb), 0.14);
	}
	.var.shiny.got,
	.var.shinyShadow.got {
		border-color: rgba(240, 200, 90, 0.6);
		background: rgba(240, 200, 90, 0.16);
		color: #f0c85a;
	}
	.var.shadow.got {
		border-color: rgba(170, 110, 220, 0.6);
		background: rgba(170, 110, 220, 0.16);
		color: #c79bea;
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
