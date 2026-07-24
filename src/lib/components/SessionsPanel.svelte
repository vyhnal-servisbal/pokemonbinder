<script lang="ts">
	import { cloud } from '$lib/cloud.svelte';

	let name = $state('');

	function fmt(iso: string) {
		const d = new Date(iso);
		return d.toLocaleString('sk-SK', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function save() {
		await cloud.saveSession(name);
		name = '';
	}

	function restore(id: string) {
		if (confirm('Obnoviť tento uložený stav? Prepíše aktuálny binder.')) {
			cloud.restoreSession(id);
		}
	}
</script>

{#if cloud.enabled}
	<div class="panel">
		<h2>Uložené stavy</h2>

		<div class="row">
			<input type="text" placeholder="Názov (nepovinné)" bind:value={name} />
			<button class="save" onclick={save}>Uložiť</button>
		</div>

		{#if cloud.sessions.length === 0}
			<p class="empty">Zatiaľ žiadne uložené stavy.</p>
		{:else}
			<ul class="list">
				{#each cloud.sessions as s (s.id)}
					<li>
						<button class="restore" onclick={() => restore(s.id)} title="Obnoviť tento stav">
							<span class="name">{s.name}</span>
							<span class="time">{fmt(s.created_at)}</span>
						</button>
						<button class="del" onclick={() => cloud.deleteSession(s.id)} title="Zmazať">×</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{/if}

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
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
	.row {
		display: flex;
		gap: 0.5rem;
	}
	.row input {
		flex: 1;
		min-width: 0;
		padding: 0.55rem 0.65rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(0, 0, 0, 0.25);
		color: #fff;
		font-size: 0.85rem;
	}
	.row input:focus {
		outline: none;
		border-color: #8b5cf6;
	}
	.save {
		flex: none;
		padding: 0.55rem 0.8rem;
		border: 0;
		border-radius: 10px;
		background: #8b5cf6;
		color: #fff;
		font-weight: 600;
		font-size: 0.82rem;
		cursor: pointer;
	}
	.empty {
		margin: 0;
		font-size: 0.78rem;
		opacity: 0.5;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		max-height: 30vh;
		overflow-y: auto;
	}
	.list li {
		display: flex;
		gap: 0.4rem;
		align-items: stretch;
	}
	.restore {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem 0.7rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 9px;
		background: rgba(255, 255, 255, 0.03);
		color: #ece9f7;
		cursor: pointer;
		text-align: left;
		font-size: 0.82rem;
	}
	.restore:hover {
		background: rgba(139, 92, 246, 0.18);
		border-color: rgba(139, 92, 246, 0.5);
	}
	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.time {
		flex: none;
		opacity: 0.55;
		font-size: 0.72rem;
	}
	.del {
		flex: none;
		width: 32px;
		border: 0;
		border-radius: 9px;
		background: rgba(255, 255, 255, 0.06);
		color: #fff;
		cursor: pointer;
		font-size: 0.9rem;
	}
	.del:hover {
		background: rgba(180, 40, 60, 0.9);
	}
</style>
