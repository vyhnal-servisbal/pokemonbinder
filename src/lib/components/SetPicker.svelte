<script lang="ts">
	import type { CardSet } from '$lib/cardApi';

	let {
		sets,
		value,
		onPick
	}: { sets: CardSet[]; value: string; onPick: (id: string) => void } = $props();

	let open = $state(false);
	let query = $state('');
	let box: HTMLDivElement;

	const current = $derived(sets.find((s) => s.id === value));

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return sets.slice(0, 80);
		return sets.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 80);
	});

	function toggle() {
		open = !open;
		if (open) query = '';
	}
	function pick(id: string) {
		onPick(id);
		open = false;
	}
	function onWindowClick(e: MouseEvent) {
		if (open && box && !box.contains(e.target as Node)) open = false;
	}
	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) open = false;
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onKey} />

<div class="setbox" bind:this={box}>
	<button class="trigger" class:picked={!!current} onclick={toggle} title={current?.name ?? ''}>
		<span class="label">{current ? current.name : 'All sets'}</span>
		<span class="caret" class:up={open}>▾</span>
	</button>

	{#if value}
		<button class="clear-set" onclick={() => pick('')} title="Clear set" aria-label="Clear set"
			>✕</button
		>
	{/if}

	{#if open}
		<div class="pop">
			<div class="searchwrap">
				<!-- svelte-ignore a11y_autofocus -->
				<input
					class="s"
					placeholder="Search sets..."
					bind:value={query}
					autofocus
					onclick={(e) => e.stopPropagation()}
				/>
				{#if query}
					<button class="x" onclick={() => (query = '')} aria-label="Clear">✕</button>
				{/if}
			</div>

			<div class="list">
				<button class="opt" class:on={value === ''} onclick={() => pick('')}>All sets</button>
				{#each filtered as s (s.id)}
					<button class="opt" class:on={value === s.id} onclick={() => pick(s.id)}>{s.name}</button>
				{/each}
				{#if filtered.length === 0}
					<p class="none">Nothing found.</p>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.setbox {
		position: relative;
		display: flex;
		gap: 0.4rem;
	}
	.trigger {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.4rem;
		padding: 0.55rem 0.65rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(0, 0, 0, 0.25);
		color: #fff;
		font-size: 0.85rem;
		cursor: pointer;
		text-align: left;
	}
	.trigger:hover {
		border-color: rgba(var(--accent-rgb), 0.6);
	}
	.trigger.picked {
		border-color: var(--accent);
	}
	.label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.caret {
		flex: none;
		font-size: 0.7rem;
		opacity: 0.6;
		transition: transform 0.15s;
	}
	.caret.up {
		transform: rotate(180deg);
	}
	.clear-set {
		flex: none;
		width: 34px;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(255, 255, 255, 0.06);
		color: #fff;
		cursor: pointer;
		font-size: 0.72rem;
	}
	.clear-set:hover {
		background: rgba(255, 255, 255, 0.18);
	}
	.pop {
		position: absolute;
		top: calc(100% + 0.35rem);
		left: 0;
		right: 0;
		z-index: 20;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.5rem;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: #1b1c23;
		box-shadow: 0 20px 44px rgba(0, 0, 0, 0.6);
	}
	.searchwrap {
		position: relative;
	}
	.s {
		width: 100%;
		padding: 0.5rem 2rem 0.5rem 0.6rem;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(0, 0, 0, 0.3);
		color: #fff;
		font-size: 0.82rem;
	}
	.s:focus {
		outline: none;
		border-color: var(--accent);
	}
	.x {
		position: absolute;
		right: 0.35rem;
		top: 50%;
		transform: translateY(-50%);
		width: 20px;
		height: 20px;
		border: 0;
		border-radius: 5px;
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
		cursor: pointer;
		font-size: 0.65rem;
		line-height: 1;
	}
	.x:hover {
		background: rgba(255, 255, 255, 0.22);
	}
	.list {
		display: flex;
		flex-direction: column;
		max-height: 46vh;
		overflow-y: auto;
	}
	.opt {
		padding: 0.45rem 0.55rem;
		border: 0;
		border-radius: 7px;
		background: none;
		color: #d8d2f0;
		cursor: pointer;
		text-align: left;
		font-size: 0.82rem;
	}
	.opt:hover {
		background: rgba(var(--accent-rgb), 0.18);
	}
	.opt.on {
		background: rgba(var(--accent-rgb), 0.28);
		color: #d1f6ef;
	}
	.none {
		margin: 0;
		padding: 0.4rem 0.55rem;
		font-size: 0.78rem;
		opacity: 0.5;
	}
</style>
