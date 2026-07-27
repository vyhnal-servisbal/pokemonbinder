<script lang="ts">
	import { untrack } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	let {
		title,
		placeholder = '',
		value = '',
		confirmText = 'OK',
		onConfirm,
		onClose
	}: {
		title: string;
		placeholder?: string;
		value?: string;
		confirmText?: string;
		onConfirm: (v: string) => void;
		onClose: () => void;
	} = $props();

	let text = $state(untrack(() => value));

	function submit(e: Event) {
		e.preventDefault();
		onConfirm(text.trim());
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={onKey} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="backdrop" transition:fade={{ duration: 160 }} onclick={onClose} role="presentation">
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<form
		class="dialog"
		transition:scale={{ duration: 200, start: 0.94 }}
		onclick={(e) => e.stopPropagation()}
		onsubmit={submit}
	>
		<h2>{title}</h2>
		<!-- svelte-ignore a11y_autofocus -->
		<input bind:value={text} {placeholder} autofocus />
		<div class="actions">
			<button type="button" class="ghost" onclick={onClose}>Zrušiť</button>
			<button type="submit" class="primary">{confirmText}</button>
		</div>
	</form>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 70;
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
		background: linear-gradient(150deg, #23242e, #16171d);
		border: 1px solid rgba(255, 255, 255, 0.09);
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
