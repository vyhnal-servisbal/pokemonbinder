<script lang="ts">
	import { cloud } from '$lib/cloud.svelte';

	let copied = $state(false);

	function onSwitch(e: Event) {
		const id = (e.currentTarget as HTMLSelectElement).value;
		if (id && id !== cloud.currentId) cloud.switchBinder(id);
	}

	function newBinder() {
		const name = prompt('Názov nového binderu:');
		if (name !== null) cloud.createBinder(name || 'Nový binder');
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
</script>

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

		<button onclick={newBinder}>+ Nový</button>
		<button class="share" onclick={share}>{copied ? 'Skopírované' : 'Zdieľať'}</button>
	</div>
{/if}

<style>
	.bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	button,
	select {
		padding: 0.5rem 0.8rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: transparent;
		color: #d8d2f0;
		cursor: pointer;
		font-size: 0.85rem;
	}
	select {
		max-width: 200px;
	}
	button:hover,
	select:hover {
		border-color: #8b5cf6;
	}
	.profile {
		background: rgba(139, 92, 246, 0.2);
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
</style>
