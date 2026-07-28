<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { searchCards, getCard, listSets, listSeries, type CardSet } from '$lib/cardApi';
	import { seriesColor } from '$lib/cardStyle';
	import SetPicker from './SetPicker.svelte';
	import { store } from '$lib/binderStore.svelte';
	import { cloud } from '$lib/cloud.svelte';
	import type { PokemonCard } from '$lib/types';

	let query = $state('');
	let setId = $state('');
	let sets = $state<CardSet[]>([]);
	let results = $state<PokemonCard[]>([]);
	let loading = $state(false);
	let flash = $state<string | null>(null);
	let timer: ReturnType<typeof setTimeout>;

	onMount(async () => {
		listSeries(); // era logos for the card preview, no need to await
		sets = await listSets();
	});

	function say(msg: string) {
		flash = msg;
		clearTimeout(timer);
		timer = setTimeout(() => (flash = null), 1800);
	}

	async function run() {
		const name = query.trim();
		if (!name && !setId) {
			results = [];
			return;
		}
		loading = true;
		try {
			results = await searchCards({ name, setId });
		} finally {
			loading = false;
		}
	}

	function onInput() {
		clearTimeout(timer);
		timer = setTimeout(run, 320);
	}

	function onSetPick(id: string) {
		setId = id;
		run();
	}

	function clearQuery() {
		query = '';
		run();
	}

	async function add(card: PokemonCard) {
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

	<div class="searchbox">
		<input
			class="search"
			type="text"
			placeholder="Hľadaj podľa názvu..."
			bind:value={query}
			oninput={onInput}
		/>
		{#if query}
			<button class="clear" onclick={clearQuery} title="Vymazať" aria-label="Vymazať hľadanie">✕</button
			>
		{/if}
	</div>

	<SetPicker {sets} value={setId} onPick={onSetPick} />

	{#if loading}
		<p class="status">Hľadám...</p>
	{:else if (query.trim() || setId) && results.length === 0}
		<p class="status">Nič sa nenašlo</p>
	{/if}

	<div class="results">
		{#each results as card (card.id)}
			<button
				class="result"
				draggable="true"
				ondragstart={(e) => {
					e.dataTransfer?.setData('text/plain', card.id);
					store.startSearchDrag(card);
				}}
				ondragend={() => store.endSearchDrag()}
				onclick={() => add(card)}
				title={card.set ? `${card.name} · ${card.set}` : card.name}
			>
				<span class="thumb">
					{#if card.image}
						<img src={card.image} alt={card.name} loading="lazy" />
					{:else}
						<span class="noimg">{card.name}</span>
					{/if}
				</span>
				{#if card.set}
					<span class="cap" style="color:{seriesColor(card.series)}">{card.set}</span>
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
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(22px);
		-webkit-backdrop-filter: blur(22px);
		border: 1px solid rgba(255, 255, 255, 0.12);
		box-shadow:
			0 24px 60px rgba(0, 0, 0, 0.45),
			inset 0 1px 0 rgba(255, 255, 255, 0.07);
	}
	h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
	}
	.searchbox {
		position: relative;
	}
	.search {
		width: 100%;
		padding: 0.6rem 2.1rem 0.6rem 0.75rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(0, 0, 0, 0.25);
		color: #fff;
		font-size: 0.9rem;
	}
	.search:focus {
		outline: none;
		border-color: var(--accent);
	}
	.clear {
		position: absolute;
		right: 0.4rem;
		top: 50%;
		transform: translateY(-50%);
		width: 22px;
		height: 22px;
		border: 0;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
		cursor: pointer;
		font-size: 0.72rem;
		line-height: 1;
	}
	.clear:hover {
		background: rgba(255, 255, 255, 0.22);
	}
	.status {
		margin: 0;
		font-size: 0.8rem;
		opacity: 0.6;
	}
	.results {
		display: grid;
		/* minmax(0,...) so a long set name can't stretch the column and overflow */
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.5rem;
		max-height: 46vh;
		overflow-y: auto;
	}
	.result {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}
	.result:hover {
		transform: translateY(-3px) scale(1.03);
	}
	.thumb {
		display: block;
		aspect-ratio: 63 / 88;
		border-radius: 6px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.05);
	}
	.result:hover .thumb {
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
		color: #fff;
	}
	/* set name under each hit, colour = era */
	.cap {
		display: block;
		font-size: 0.58rem;
		line-height: 1.15;
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		opacity: 0.9;
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
		background: rgba(var(--accent-rgb), 0.25);
		border-color: var(--accent);
	}
	.flash {
		margin: 0;
		font-size: 0.8rem;
		color: #8de0b0;
	}
</style>
