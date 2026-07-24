<script lang="ts">
	import { fly } from 'svelte/transition';
	import { searchCards, getCard } from '$lib/tcgdex';
	import { store } from '$lib/binderStore.svelte';
	import { cloud } from '$lib/cloud.svelte';
	import type { PokemonCard } from '$lib/types';

	let query = $state('');
	let results = $state<PokemonCard[]>([]);
	let loading = $state(false);
	let flash = $state<string | null>(null);
	let timer: ReturnType<typeof setTimeout>;

	function say(msg: string) {
		flash = msg;
		clearTimeout(timer);
		timer = setTimeout(() => (flash = null), 1800);
	}

	function onInput() {
		clearTimeout(timer);
		if (query.trim().length < 2) {
			results = [];
			return;
		}
		timer = setTimeout(run, 350);
	}

	async function run() {
		loading = true;
		try {
			results = await searchCards(query.trim());
		} finally {
			loading = false;
		}
	}

	async function add(card: PokemonCard) {
		// enrich with full data (rarity drives the holo shine) then place it
		const full = (await getCard(card.id)) ?? card;
		say(store.addCard(full) ? `Pridané: ${full.name}` : 'Na tejto strane nie je voľné vrecko');
	}

	async function onFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		input.value = '';
		const url = await cloud.uploadImage(file);
		say(store.addImage(url) ? 'Obrázok pridaný' : 'Na tejto strane nie je voľné vrecko');
	}
</script>

<div class="panel">
	<h2>Pridať kartu</h2>

	<input
		class="search"
		type="text"
		placeholder="Hľadaj kartu, napr. Charizard"
		bind:value={query}
		oninput={onInput}
	/>

	{#if loading}
		<p class="status">Hľadám...</p>
	{:else if query.trim().length >= 2 && results.length === 0}
		<p class="status">Nič sa nenašlo</p>
	{/if}

	<div class="results">
		{#each results as card (card.id)}
			<button class="result" onclick={() => add(card)} title={card.name}>
				{#if card.image}
					<img src={card.image} alt={card.name} loading="lazy" />
				{:else}
					<span class="noimg">{card.name}</span>
				{/if}
			</button>
		{/each}
	</div>

	<div class="divider"></div>

	<div class="actions">
		<label class="btn">
			<input type="file" accept="image/*" onchange={onFile} hidden />
			Nahrať obrázok
		</label>
		<button class="btn" onclick={() => window.print()}>Tlačiť / PDF</button>
	</div>

	{#if flash}
		<p class="flash" transition:fly={{ y: -6, duration: 200 }}>{flash}</p>
	{/if}
</div>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		padding: 1.2rem;
		border-radius: 14px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.07);
	}
	h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
	}
	.search {
		width: 100%;
		padding: 0.6rem 0.75rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(0, 0, 0, 0.25);
		color: #fff;
		font-size: 0.9rem;
	}
	.search:focus {
		outline: none;
		border-color: #8b5cf6;
	}
	.status {
		margin: 0;
		font-size: 0.8rem;
		opacity: 0.6;
	}
	.results {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		max-height: 46vh;
		overflow-y: auto;
	}
	.result {
		aspect-ratio: 63 / 88;
		padding: 0;
		border: 0;
		border-radius: 6px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.05);
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}
	.result:hover {
		transform: translateY(-3px) scale(1.03);
		box-shadow: 0 8px 18px rgba(0, 0, 0, 0.45);
	}
	.result img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.noimg {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		padding: 0.3rem;
		font-size: 0.65rem;
		text-align: center;
	}
	.divider {
		height: 1px;
		background: rgba(255, 255, 255, 0.08);
		margin: 0.2rem 0;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
	}
	.btn {
		flex: 1;
		text-align: center;
		padding: 0.55rem 0.6rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(255, 255, 255, 0.06);
		color: #fff;
		font-size: 0.82rem;
		cursor: pointer;
	}
	.btn:hover {
		background: rgba(139, 92, 246, 0.25);
		border-color: #8b5cf6;
	}
	.flash {
		margin: 0;
		font-size: 0.8rem;
		color: #8de0b0;
	}
</style>
