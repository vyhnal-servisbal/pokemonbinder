<script lang="ts">
	import { cloud } from '$lib/cloud.svelte';

	let { onNew, onRename }: { onNew: () => void; onRename: () => void } = $props();

	let copied = $state(false);

	function onSwitch(e: Event) {
		const id = (e.currentTarget as HTMLSelectElement).value;
		if (id && id !== cloud.currentId) cloud.switchBinder(id);
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
</script>

{#if cloud.enabled}
	<div class="bar">
		<button class="profile" onclick={onRename} title="Zmeniť meno">
			{cloud.profileName || 'Neznámy'}
		</button>

		<select value={cloud.currentId ?? ''} onchange={onSwitch} aria-label="Vyber binder">
			{#each cloud.binders as b (b.id)}
				<option value={b.id}>{b.name}</option>
			{/each}
		</select>

		<button onclick={onNew}>+ Nový</button>
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
		background: #1a1b22;
		color: #fff;
	}
</style>
