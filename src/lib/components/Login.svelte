<script lang="ts">
	import { cloud } from '$lib/cloud.svelte';

	let email = $state('');
	let sent = $state(false);
	let error = $state('');
	let busy = $state(false);

	async function submit(e: Event) {
		e.preventDefault();
		error = '';
		busy = true;
		const { error: err } = await cloud.signIn(email.trim());
		busy = false;
		if (err) error = err.message;
		else sent = true;
	}
</script>

<div class="wrap">
	<div class="card">
		<h1>Pokémon Binder</h1>
		{#if sent}
			<p class="msg">Poslali sme ti prihlasovací odkaz na <strong>{email}</strong>. Otvor ho na tomto zariadení.</p>
		{:else}
			<p class="msg">Prihlás sa mailom, príde ti magic link.</p>
			<form onsubmit={submit}>
				<input
					type="email"
					placeholder="tvoj@email.sk"
					bind:value={email}
					required
					autocomplete="email"
				/>
				<button type="submit" disabled={busy}>{busy ? 'Posielam...' : 'Poslať odkaz'}</button>
			</form>
			{#if error}<p class="err">{error}</p>{/if}
		{/if}
	</div>
</div>

<style>
	.wrap {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}
	.card {
		width: min(380px, 100%);
		padding: 2rem;
		border-radius: 16px;
		background: linear-gradient(150deg, #2a2050, #171030);
		box-shadow: 0 30px 70px rgba(0, 0, 0, 0.55);
		text-align: center;
	}
	h1 {
		margin: 0 0 0.5rem;
		font-size: 1.4rem;
		font-weight: 800;
	}
	.msg {
		margin: 0 0 1.25rem;
		font-size: 0.9rem;
		opacity: 0.75;
		line-height: 1.5;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	input {
		padding: 0.7rem 0.85rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: rgba(0, 0, 0, 0.25);
		color: #fff;
		font-size: 0.95rem;
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
		opacity: 0.6;
		cursor: default;
	}
	.err {
		margin: 0.8rem 0 0;
		font-size: 0.8rem;
		color: #ff9b9b;
	}
</style>
