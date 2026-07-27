<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { cloud } from '$lib/cloud.svelte';

	let name = $state('');

	function submit(e: Event) {
		e.preventDefault();
		if (name.trim()) cloud.setProfile(name);
	}
</script>

<div class="backdrop" transition:fade={{ duration: 160 }}>
	<form class="dialog" transition:scale={{ duration: 200, start: 0.94 }} onsubmit={submit}>
		<h2>Ako sa voláš?</h2>
		<p>Bez hesla, len meno na označenie tvojich uložení a binderov.</p>
		<!-- svelte-ignore a11y_autofocus -->
		<input bind:value={name} placeholder="Meno" autofocus />
		<button type="submit" disabled={!name.trim()}>Pokračovať</button>
	</form>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: rgba(6, 4, 16, 0.8);
		backdrop-filter: blur(6px);
	}
	.dialog {
		width: min(360px, 100%);
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		padding: 2rem;
		border-radius: 16px;
		background: linear-gradient(150deg, #2a2050, #171030);
		box-shadow: 0 40px 90px rgba(0, 0, 0, 0.6);
		color: #ece9f7;
		text-align: center;
	}
	h2 {
		margin: 0;
		font-size: 1.3rem;
		font-weight: 800;
	}
	p {
		margin: 0;
		font-size: 0.85rem;
		opacity: 0.7;
		line-height: 1.5;
	}
	input {
		padding: 0.7rem 0.85rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: rgba(0, 0, 0, 0.25);
		color: #fff;
		font-size: 0.95rem;
		text-align: center;
	}
	input:focus {
		outline: none;
		border-color: #8b5cf6;
	}
	button {
		padding: 0.7rem;
		border-radius: 10px;
		border: 0;
		background: #8b5cf6;
		color: #fff;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
