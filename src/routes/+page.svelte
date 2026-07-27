<script lang="ts">
	import { onMount } from 'svelte';
	import Binder from '$lib/components/Binder.svelte';
	import AddPanel from '$lib/components/AddPanel.svelte';
	import SessionsPanel from '$lib/components/SessionsPanel.svelte';
	import CardPreview from '$lib/components/CardPreview.svelte';
	import PrintSheet from '$lib/components/PrintSheet.svelte';
	import EditBinder from '$lib/components/EditBinder.svelte';
	import BinderBar from '$lib/components/BinderBar.svelte';
	import ProfilePrompt from '$lib/components/ProfilePrompt.svelte';
	import { store } from '$lib/binderStore.svelte';
	import { cloud } from '$lib/cloud.svelte';

	let editing = $state(false);

	onMount(() => {
		cloud.init();
	});

	// auto-save: reading the whole binder makes this effect depend on every change
	$effect(() => {
		JSON.stringify(store.binder);
		cloud.scheduleSave();
	});

	const saveLabel = $derived(
		cloud.status === 'saving'
			? 'Ukladám...'
			: cloud.status === 'saved'
				? 'Uložené'
				: cloud.status === 'error'
					? 'Chyba'
					: ''
	);
</script>

<svelte:head>
	<title>Pokémon Binder</title>
</svelte:head>

{#if cloud.enabled && !cloud.ready}
	<div class="center">Načítavam...</div>
{:else}
	<div class="app">
		<section class="stage">
			<div class="topbar">
				<BinderBar />
				<div class="right">
					<button class="edit" onclick={() => (editing = true)}>Upraviť binder</button>
					<div class="views">
						<button class:active={store.view === 'single'} onclick={() => (store.view = 'single')}
							>Single 3×3</button
						>
						<button class:active={store.view === 'spread'} onclick={() => (store.view = 'spread')}
							>Double 3×3</button
						>
					</div>
				</div>
			</div>

			<Binder />
		</section>

		<aside class="sidebar">
			{#if cloud.enabled}
				<div class="status"><span class="save" class:on={saveLabel !== ''}>{saveLabel}</span></div>
			{/if}
			<AddPanel />
			<SessionsPanel />
		</aside>
	</div>

	{#if store.preview}
		<CardPreview card={store.preview} onClose={() => store.closePreview()} />
	{/if}

	{#if editing}
		<EditBinder onClose={() => (editing = false)} />
	{/if}

	{#if cloud.needsProfile}
		<ProfilePrompt />
	{/if}

	<PrintSheet />
{/if}

<style>
	.center {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.6;
	}
	.app {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 340px;
		gap: 2rem;
		align-items: start;
		max-width: 1640px;
		margin: 0 auto;
		padding: 1.75rem 2.25rem 3rem;
	}
	.stage {
		min-width: 0;
	}
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
		flex-wrap: wrap;
	}
	.right {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.edit {
		padding: 0.5rem 0.9rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: transparent;
		color: #d8d2f0;
		cursor: pointer;
		font-size: 0.85rem;
	}
	.edit:hover {
		background: rgba(139, 92, 246, 0.2);
		border-color: #8b5cf6;
	}
	.views {
		display: flex;
		gap: 0.4rem;
	}
	.views button {
		padding: 0.5rem 0.9rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: transparent;
		color: #d8d2f0;
		cursor: pointer;
		font-size: 0.85rem;
	}
	.views button.active {
		background: #fff;
		color: #1a1233;
		border-color: #fff;
	}
	.sidebar {
		position: sticky;
		top: 1.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}
	.status {
		display: flex;
		justify-content: flex-end;
		min-height: 1rem;
	}
	.save {
		opacity: 0;
		transition: opacity 0.2s;
		color: #8de0b0;
		font-size: 0.78rem;
	}
	.save.on {
		opacity: 1;
	}
	@media (max-width: 900px) {
		.app {
			grid-template-columns: 1fr;
		}
		.sidebar {
			position: static;
		}
	}
</style>
