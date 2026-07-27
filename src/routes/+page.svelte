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
	<header class="topbar">
		<div class="topbar-inner">
			<BinderBar />
			<div class="menu">
				{#if cloud.enabled}
					<span class="save" class:on={saveLabel !== ''}>{saveLabel}</span>
				{/if}
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
	</header>

	<div class="app">
		<section class="stage">
			<Binder />
		</section>

		<aside class="sidebar">
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

	.topbar {
		position: sticky;
		top: 0;
		z-index: 40;
		background: rgba(18, 19, 26, 0.82);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}
	.topbar-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		max-width: 1640px;
		margin: 0 auto;
		padding: 0.7rem 2.25rem;
	}
	.menu {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		flex-wrap: wrap;
	}
	.save {
		font-size: 0.78rem;
		color: #8de0b0;
		opacity: 0;
		transition: opacity 0.2s;
	}
	.save.on {
		opacity: 1;
	}
	.edit {
		padding: 0.5rem 0.9rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: #d8d2f0;
		cursor: pointer;
		font-size: 0.85rem;
	}
	.edit:hover {
		background: rgba(139, 92, 246, 0.22);
		border-color: #8b5cf6;
	}
	.views {
		display: flex;
		gap: 4px;
		padding: 3px;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
	}
	.views button {
		padding: 0.4rem 0.8rem;
		border-radius: 7px;
		border: 0;
		background: transparent;
		color: #b9b3d4;
		cursor: pointer;
		font-size: 0.82rem;
	}
	.views button.active {
		background: #8b5cf6;
		color: #fff;
	}

	.app {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 340px;
		gap: 2rem;
		align-items: start;
		max-width: 1640px;
		margin: 0 auto;
		padding: 2rem 2.25rem 3rem;
	}
	.stage {
		min-width: 0;
	}
	.sidebar {
		position: sticky;
		top: 5rem;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}
	@media (max-width: 900px) {
		.topbar-inner {
			padding: 0.7rem 1.25rem;
		}
		.app {
			grid-template-columns: 1fr;
			padding: 1.5rem 1.25rem 3rem;
		}
		.sidebar {
			position: static;
		}
	}
</style>
