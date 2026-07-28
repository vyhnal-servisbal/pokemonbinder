<script lang="ts">
	import { onMount } from 'svelte';
	import Binder from '$lib/components/Binder.svelte';
	import AddPanel from '$lib/components/AddPanel.svelte';
	import SessionsModal from '$lib/components/SessionsModal.svelte';
	import CardPreview from '$lib/components/CardPreview.svelte';
	import PrintSheet from '$lib/components/PrintSheet.svelte';
	import EditBinder from '$lib/components/EditBinder.svelte';
	import BinderBar from '$lib/components/BinderBar.svelte';
	import PromptModal from '$lib/components/PromptModal.svelte';
	import ProfilePrompt from '$lib/components/ProfilePrompt.svelte';
	import PokeBuddy from '$lib/components/PokeBuddy.svelte';
	import BuddyConfig from '$lib/components/BuddyConfig.svelte';
	import FunFx from '$lib/components/FunFx.svelte';
	import Achievements from '$lib/components/Achievements.svelte';
	import PagesModal from '$lib/components/PagesModal.svelte';
	import { fun } from '$lib/funStore.svelte';
	import { store } from '$lib/binderStore.svelte';
	import { cloud } from '$lib/cloud.svelte';
	import { buddies } from '$lib/buddyStore.svelte';

	let editing = $state(false);
	let configuring = $state(false);
	let sessions = $state(false);
	let achievements = $state(false);
	let pages = $state(false);
	let prompt = $state<{ mode: 'new' | 'name' } | null>(null);

	onMount(() => {
		cloud.init();
		buddies.init();
	});

	// auto-save: reading the whole binder makes this effect depend on every change
	$effect(() => {
		JSON.stringify(store.binder);
		cloud.scheduleSave();
	});

	const saveLabel = $derived(
		cloud.status === 'saving'
			? 'Saving...'
			: cloud.status === 'saved'
				? 'Saved'
				: cloud.status === 'error'
					? 'Error'
					: ''
	);

	const pageInfo = $derived.by(() => {
		const n = store.binder.sides.length;
		if (store.view === 'spread') {
			const a = store.index + 1;
			const b = Math.min(store.index + 2, n);
			return a === b ? `Page ${a} / ${n}` : `Pages ${a}-${b} / ${n}`;
		}
		return `Page ${store.index + 1} / ${n}`;
	});
</script>

<svelte:head>
	<title>Pokémon Binder</title>
</svelte:head>

{#if cloud.enabled && !cloud.ready}
	<div class="center">Loading...</div>
{:else}
	<div class="bg-deco" aria-hidden="true">
		<svg class="ball ball-left" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.4">
			<circle cx="50" cy="50" r="46" />
			<path d="M10 50 H35 M65 50 H90" />
			<circle cx="50" cy="50" r="14" />
			<circle cx="50" cy="50" r="5.5" />
		</svg>
		<svg class="ball ball-right" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.4">
			<circle cx="50" cy="50" r="46" />
			<path d="M10 50 H35 M65 50 H90" />
			<circle cx="50" cy="50" r="14" />
			<circle cx="50" cy="50" r="5.5" />
		</svg>
		<svg class="ball ball-top" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.4">
			<circle cx="50" cy="50" r="46" />
			<path d="M10 50 H35 M65 50 H90" />
			<circle cx="50" cy="50" r="14" />
			<circle cx="50" cy="50" r="5.5" />
		</svg>
		<svg class="ball ball-bottom" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.4">
			<circle cx="50" cy="50" r="46" />
			<path d="M10 50 H35 M65 50 H90" />
			<circle cx="50" cy="50" r="14" />
			<circle cx="50" cy="50" r="5.5" />
		</svg>
	</div>

	<header class="topbar">
		<div class="topbar-inner">
			<div class="left">
				<BinderBar
					onNew={() => (prompt = { mode: 'new' })}
					onRename={() => (prompt = { mode: 'name' })}
				/>
				<span class="count">{pageInfo}</span>
				<button
					class="trim"
					onclick={() => store.trimEmptyPages()}
					disabled={!store.lastEmpty}
					title="Remove empty pages">🧹</button
				>
				<button class="trim" onclick={() => (pages = true)} title="Rearrange pages">🗂️</button>
			</div>
			<div class="menu">
				{#if cloud.enabled}
					<span class="save" class:on={saveLabel !== ''}>{saveLabel}</span>
				{/if}
				<button class="holo" class:on={store.holoOn} onclick={() => (store.holoOn = !store.holoOn)}
					>✨ Holo</button
				>
				<button class="holo" onclick={() => (configuring = true)} title="Poopemons">🐾</button>
				<button class="holo" onclick={() => fun.openQuiz(buddies.all)} title="Who's that Pokémon?"
					>❓</button
				>
				<button class="holo" onclick={() => (achievements = true)} title="Achievements">🏆</button>
				{#if cloud.enabled}
					<button class="holo" onclick={() => (sessions = true)} title="Saved states">💾</button>
				{/if}
				<button class="edit" onclick={() => (editing = true)}>✏️ Edit binder</button>
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
		</aside>
	</div>

	{#if store.preview}
		<CardPreview card={store.preview} onClose={() => store.closePreview()} />
	{/if}

	{#if editing}
		<EditBinder onClose={() => (editing = false)} />
	{/if}

	{#if configuring}
		<BuddyConfig onClose={() => (configuring = false)} />
	{/if}

	{#if sessions}
		<SessionsModal onClose={() => (sessions = false)} />
	{/if}

	{#if achievements}
		<Achievements onClose={() => (achievements = false)} />
	{/if}

	{#if pages}
		<PagesModal onClose={() => (pages = false)} />
	{/if}

	{#if prompt}
		<PromptModal
			title={prompt.mode === 'new' ? 'New binder' : 'Your name'}
			placeholder={prompt.mode === 'new' ? 'Binder name' : 'Name'}
			value={prompt.mode === 'name' ? cloud.profileName : ''}
			confirmText={prompt.mode === 'new' ? 'Create' : 'Save'}
			onConfirm={(v) => {
				if (prompt?.mode === 'new') cloud.createBinder(v || 'New binder');
				else if (v) cloud.setProfile(v);
				prompt = null;
			}}
			onClose={() => (prompt = null)}
		/>
	{/if}

	{#if cloud.needsProfile}
		<ProfilePrompt />
	{/if}

	<PrintSheet />

	<PokeBuddy />

	<FunFx />
{/if}

<style>
	.center {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.6;
	}

	/* faint Pokéball outlines in the background */
	.bg-deco {
		position: fixed;
		inset: 0;
		z-index: -1;
		overflow: hidden;
		pointer-events: none;
		color: rgba(var(--accent-rgb), 0.18);
	}
	.ball {
		position: absolute;
	}
	.bg-deco :global(circle),
	.bg-deco :global(path) {
		vector-effect: non-scaling-stroke;
	}
	.ball-left {
		left: -45vh;
		top: 50%;
		width: 90vh;
		height: 90vh;
		transform: translateY(-50%);
	}
	.ball-right {
		right: -45vh;
		top: 50%;
		width: 90vh;
		height: 90vh;
		transform: translateY(-50%);
	}
	.ball-top {
		left: 50%;
		top: 5%;
		width: 74px;
		height: 74px;
		transform: translateX(-50%);
	}
	.ball-bottom {
		left: 50%;
		bottom: 5%;
		width: 74px;
		height: 74px;
		transform: translateX(-50%);
	}

	.topbar {
		position: sticky;
		top: 0;
		z-index: 40;
		background: rgba(14, 15, 20, 0.8);
		backdrop-filter: blur(14px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.09);
	}
	.topbar-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		max-width: 1640px;
		margin: 0 auto;
		padding: 0.45rem 2.25rem;
	}
	.left {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		flex-wrap: wrap;
	}
	.count {
		padding: 0.3rem 0.75rem;
		border-radius: 999px;
		border: 1px solid rgba(var(--accent-rgb), 0.45);
		background: rgba(var(--accent-rgb), 0.14);
		color: #d1f6ef;
		font-size: 0.86rem;
		font-weight: 700;
		letter-spacing: 0.01em;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.trim {
		width: 34px;
		height: 34px;
		border-radius: 10px;
		border: 1px solid rgba(var(--accent-rgb), 0.35);
		background: rgba(var(--accent-rgb), 0.12);
		color: #d1f6ef;
		cursor: pointer;
		font-size: 0.95rem;
	}
	.trim:hover:not(:disabled) {
		background: rgba(var(--accent-rgb), 0.22);
	}
	.trim:disabled {
		opacity: 0.3;
		cursor: default;
		border-color: rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
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
	.holo {
		padding: 0.5rem 0.9rem;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: #d8d2f0;
		cursor: pointer;
		font-size: 0.85rem;
	}
	.holo.on {
		background: rgba(var(--accent-rgb), 0.18);
		border-color: var(--accent);
		color: #d1f6ef;
	}
	.edit {
		padding: 0.5rem 0.9rem;
		border-radius: 12px;
		border: 1px solid rgba(var(--accent-rgb), 0.35);
		background: rgba(var(--accent-rgb), 0.12);
		color: #d1f6ef;
		cursor: pointer;
		font-size: 0.85rem;
	}
	.edit:hover {
		background: rgba(var(--accent-rgb), 0.22);
		border-color: var(--accent);
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
		background: var(--accent);
		color: var(--on-accent);
	}

	.app {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 340px;
		gap: 2rem;
		align-items: start;
		max-width: 1640px;
		margin: 0 auto;
		padding: 1rem 2.25rem 1rem;
	}
	.stage {
		min-width: 0;
		position: relative;
		isolation: isolate;
	}
	.stage::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 8%;
		width: 78%;
		height: 82%;
		transform: translateX(-50%);
		background: radial-gradient(closest-side, rgba(var(--accent-rgb), 0.16), transparent 70%);
		filter: blur(50px);
		z-index: 0;
		pointer-events: none;
	}
	.stage :global(.binder) {
		position: relative;
		z-index: 1;
	}
	.sidebar {
		position: sticky;
		top: 3.75rem;
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
