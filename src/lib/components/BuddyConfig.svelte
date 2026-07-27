<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { buddies } from '$lib/buddyStore.svelte';

	let { onClose }: { onClose: () => void } = $props();

	let query = $state('');

	const results = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return [];
		return buddies.all.filter((n) => n.includes(q)).slice(0, 60);
	});

	function cap(s: string) {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}
	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={onKey} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="backdrop" transition:fade={{ duration: 160 }} onclick={onClose} role="presentation">
	<div
		class="dialog"
		transition:scale={{ duration: 200, start: 0.94 }}
		onclick={(e) => e.stopPropagation()}
		role="dialog"
		aria-modal="true"
		aria-label="Pokémon kamaráti"
		tabindex="-1"
	>
		<h2>Pokémon kamaráti</h2>
		<p class="hint">Vyber si Pokémonov do pravého rohu. Klik na nich spustí efekt podľa typu.</p>

		<input class="search" placeholder="Hľadaj Pokémona (napr. pikachu)..." bind:value={query} />

		{#if results.length}
			<div class="picker">
				{#each results as name (name)}
					<button class="pick" onclick={() => buddies.add(name)} disabled={buddies.has(name)}>
						{cap(name)}
					</button>
				{/each}
			</div>
		{:else if query.trim()}
			<p class="empty">Nič sa nenašlo.</p>
		{/if}

		<div class="current">
			<h3>Tvoji kamaráti ({buddies.list.length})</h3>
			{#if buddies.list.length}
				<div class="chips">
					{#each buddies.list as b (b.name)}
						<span class="chip" class:shiny={b.shiny}>
							<button
								class="sh"
								class:on={b.shiny}
								onclick={() => buddies.toggleShiny(b.name)}
								title="Shiny"
								aria-label="Shiny">✨</button
							>
							<span>{b.fx} {b.label}</span>
							<button class="rm" onclick={() => buddies.remove(b.name)} aria-label="Odobrať">✕</button
							>
						</span>
					{/each}
				</div>
			{:else}
				<p class="empty">Zatiaľ žiadni, pridaj si niekoho vyššie.</p>
			{/if}
		</div>

		<button class="close" onclick={onClose} aria-label="Zavrieť">×</button>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: rgba(6, 4, 16, 0.72);
		backdrop-filter: blur(6px);
	}
	.dialog {
		position: relative;
		width: min(460px, 100%);
		max-height: 82vh;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		padding: 1.75rem;
		border-radius: 16px;
		background: linear-gradient(150deg, #23242e, #16171d);
		border: 1px solid rgba(255, 255, 255, 0.09);
		box-shadow: 0 40px 90px rgba(0, 0, 0, 0.6);
		color: #ece9f7;
	}
	h2 {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 700;
	}
	.hint {
		margin: 0;
		font-size: 0.82rem;
		opacity: 0.65;
		line-height: 1.4;
	}
	.search {
		padding: 0.7rem 0.85rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: rgba(0, 0, 0, 0.25);
		color: #fff;
		font-size: 0.95rem;
	}
	.search:focus {
		outline: none;
		border-color: var(--accent);
	}
	.picker {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		max-height: 32vh;
		overflow-y: auto;
	}
	.pick {
		padding: 0.4rem 0.7rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.05);
		color: #d8d2f0;
		cursor: pointer;
		font-size: 0.8rem;
	}
	.pick:hover:not(:disabled) {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.16);
	}
	.pick:disabled {
		opacity: 0.35;
		cursor: default;
	}
	.current h3 {
		margin: 0 0 0.5rem;
		font-size: 0.9rem;
		font-weight: 700;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.3rem 0.4rem;
		border-radius: 999px;
		background: rgba(var(--accent-rgb), 0.14);
		border: 1px solid rgba(var(--accent-rgb), 0.35);
		font-size: 0.8rem;
	}
	.chip.shiny {
		background: rgba(240, 200, 90, 0.16);
		border-color: rgba(240, 200, 90, 0.5);
	}
	.sh {
		width: 20px;
		height: 20px;
		border: 0;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
		cursor: pointer;
		font-size: 0.62rem;
		line-height: 1;
		opacity: 0.5;
	}
	.sh.on {
		background: rgba(240, 200, 90, 0.9);
		opacity: 1;
	}
	.rm {
		width: 18px;
		height: 18px;
		border: 0;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.12);
		color: #fff;
		cursor: pointer;
		font-size: 0.65rem;
		line-height: 1;
	}
	.rm:hover {
		background: rgba(220, 60, 80, 0.9);
	}
	.empty {
		margin: 0;
		font-size: 0.8rem;
		opacity: 0.5;
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
