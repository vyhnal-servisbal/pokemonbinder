<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { cloud } from '$lib/cloud.svelte';

	let { onClose }: { onClose: () => void } = $props();

	let name = $state('');
	let msg = $state<string | null>(null);

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
		const err = await cloud.saveSession(name);
		if (err) {
			msg = err;
		} else {
			msg = 'Uložené';
			name = '';
		}
		setTimeout(() => (msg = null), 2600);
	}

	function restore(id: string) {
		if (confirm('Obnoviť tento uložený stav? Prepíše aktuálny binder.')) {
			cloud.restoreSession(id);
			onClose();
		}
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
		aria-label="Uložené stavy"
		tabindex="-1"
	>
		<h2>Uložené stavy</h2>
		<p class="hint">Ulož si aktuálnu podobu binderu, aby si sa k nej vedel kedykoľvek vrátiť.</p>

		<div class="row">
			<div class="inwrap">
				<input type="text" placeholder="Názov (nepovinné)" bind:value={name} />
				{#if name}
					<button class="x" onclick={() => (name = '')} title="Vymazať" aria-label="Vymazať">✕</button
					>
				{/if}
			</div>
			<button class="save cur-ball" onclick={save}>Uložiť</button>
		</div>

		{#if cloud.ready && !cloud.session}
			<p class="warn">Nepripojené k cloudu. Zapni Anonymous sign-ins v Supabase.</p>
		{/if}
		{#if msg}
			<p class="msg">{msg}</p>
		{/if}

		{#if cloud.sessions.length === 0}
			<p class="empty">Zatiaľ žiadne uložené stavy.</p>
		{:else}
			<ul class="list">
				{#each cloud.sessions as s (s.id)}
					<li>
						<button class="restore" onclick={() => restore(s.id)} title="Obnoviť tento stav">
							<span class="name">{s.name}</span>
							<span class="time">{s.profile_name ? s.profile_name + ' · ' : ''}{fmt(s.created_at)}</span>
						</button>
						<button class="del" onclick={() => cloud.deleteSession(s.id)} title="Zmazať">×</button>
					</li>
				{/each}
			</ul>
		{/if}

		<button class="close" onclick={onClose} aria-label="Zavrieť">×</button>
	</div>
</div>

<style>
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
		position: relative;
		width: min(460px, 100%);
		max-height: 82vh;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
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
	.row {
		display: flex;
		gap: 0.5rem;
	}
	.inwrap {
		position: relative;
		display: flex;
		flex: 1;
		min-width: 0;
	}
	.inwrap input {
		flex: 1;
		min-width: 0;
		padding: 0.55rem 2.1rem 0.55rem 0.65rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(0, 0, 0, 0.25);
		color: #fff;
		font-size: 0.85rem;
	}
	.inwrap input:focus {
		outline: none;
		border-color: var(--accent);
	}
	.x {
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
		font-size: 0.7rem;
		line-height: 1;
	}
	.x:hover {
		background: rgba(255, 255, 255, 0.22);
	}
	.save {
		flex: none;
		padding: 0.55rem 0.9rem;
		border: 0;
		border-radius: 10px;
		background: var(--accent);
		color: var(--on-accent);
		font-weight: 600;
		font-size: 0.82rem;
		cursor: pointer;
	}
	.empty {
		margin: 0;
		font-size: 0.78rem;
		opacity: 0.5;
	}
	.warn {
		margin: 0;
		font-size: 0.78rem;
		color: #ffcf8b;
		line-height: 1.4;
	}
	.msg {
		margin: 0;
		font-size: 0.8rem;
		color: #8de0b0;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		max-height: 42vh;
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
		background: rgba(var(--accent-rgb), 0.18);
		border-color: rgba(var(--accent-rgb), 0.5);
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
