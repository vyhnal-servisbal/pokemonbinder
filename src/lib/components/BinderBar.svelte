<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { cloud } from '$lib/cloud.svelte';

	let copied = $state(false);
	let creating = $state(false);
	let newName = $state('');

	function onSwitch(e: Event) {
		const id = (e.currentTarget as HTMLSelectElement).value;
		if (id && id !== cloud.currentId) cloud.switchBinder(id);
	}

	function openNew() {
		newName = '';
		creating = true;
	}

	function submitNew(e: Event) {
		e.preventDefault();
		cloud.createBinder(newName.trim() || 'Nový binder');
		creating = false;
	}

	async function share() {
		const link = cloud.shareLink();
		try {
			await navigator.clipboard.writeText(link);
			copied = true;
			setTimeout(() => (copied = false), 1800);
		} catch {
			prompt('Skopíruj tento link:', link);
		}
	}

	function changeName() {
		const n = prompt('Tvoje meno:', cloud.profileName);
		if (n) cloud.setProfile(n);
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') creating = false;
	}
</script>

<svelte:window onkeydown={onKey} />

{#if cloud.enabled}
	<div class="bar">
		<button class="profile" onclick={changeName} title="Zmeniť meno">
			{cloud.profileName || 'Neznámy'}
		</button>

		<select value={cloud.currentId ?? ''} onchange={onSwitch} aria-label="Vyber binder">
			{#each cloud.binders as b (b.id)}
				<option value={b.id}>{b.name}</option>
			{/each}
		</select>

		<button onclick={openNew}>+ Nový</button>
		<button class="share" onclick={share}>{copied ? 'Skopírované' : 'Zdieľať'}</button>
	</div>
{/if}

{#if creating}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="backdrop" transition:fade={{ duration: 160 }} onclick={() => (creating = false)} role="presentation">
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<form
			class="dialog"
			transition:scale={{ duration: 200, start: 0.94 }}
			onclick={(e) => e.stopPropagation()}
			onsubmit={submitNew}
		>
			<h2>Nový binder</h2>
			<!-- svelte-ignore a11y_autofocus -->
			<input bind:value={newName} placeholder="Názov binderu" autofocus />
			<div class="actions">
				<button type="button" class="ghost" onclick={() => (creating = false)}>Zrušiť</button>
				<button type="submit" class="primary">Vytvoriť</button>
			</div>
		</form>
	</div>
{/if}

<style>
	.bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.bar button,
	.bar select {
		padding: 0.5rem 0.8rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: #d8d2f0;
		cursor: pointer;
		font-size: 0.85rem;
	}
	.bar select {
		max-width: 200px;
	}
	.bar button:hover,
	.bar select:hover {
		border-color: var(--accent);
	}
	.profile {
		background: rgba(var(--accent-rgb), 0.2);
		border-color: transparent;
		font-weight: 600;
	}
	.share {
		background: rgba(255, 255, 255, 0.06);
	}
	option {
		background: #1a1233;
		color: #fff;
	}

	/* custom "new binder" dialog */
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 55;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: rgba(6, 4, 16, 0.72);
		backdrop-filter: blur(6px);
	}
	.dialog {
		width: min(360px, 100%);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.75rem;
		border-radius: 16px;
		background: linear-gradient(150deg, #2a2050, #171030);
		box-shadow: 0 40px 90px rgba(0, 0, 0, 0.6);
		color: #ece9f7;
	}
	.dialog h2 {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 700;
	}
	.dialog input {
		padding: 0.7rem 0.85rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: rgba(0, 0, 0, 0.25);
		color: #fff;
		font-size: 0.95rem;
	}
	.dialog input:focus {
		outline: none;
		border-color: var(--accent);
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.6rem;
	}
	.actions button {
		padding: 0.6rem 1.1rem;
		border-radius: 10px;
		border: 0;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
	}
	.ghost {
		background: rgba(255, 255, 255, 0.08);
		color: #d8d2f0;
	}
	.ghost:hover {
		background: rgba(255, 255, 255, 0.15);
	}
	.primary {
		background: var(--accent);
		color: var(--on-accent);
	}
	.primary:hover {
		background: var(--accent-strong);
	}
</style>
