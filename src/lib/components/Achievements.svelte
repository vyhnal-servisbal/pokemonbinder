<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { fun, ACHIEVEMENTS } from '$lib/funStore.svelte';

	let { onClose }: { onClose: () => void } = $props();

	const done = $derived(ACHIEVEMENTS.filter((a) => fun.has(a.id)).length);

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
		aria-label="Achievements"
		tabindex="-1"
	>
		<div class="head">
			<h2>Achievements</h2>
			<span class="score">{done} / {ACHIEVEMENTS.length}</span>
		</div>

		<div class="bar"><span style:width="{(done / ACHIEVEMENTS.length) * 100}%"></span></div>

		<ul class="list">
			{#each ACHIEVEMENTS as a (a.id)}
				{@const got = fun.has(a.id)}
				<li class:got>
					<span class="icon">{got ? a.icon : '🔒'}</span>
					<span class="txt">
						<b>{got ? a.title : '???'}</b>
						<i>{a.desc}</i>
					</span>
				</li>
			{/each}
		</ul>

		<button class="close" onclick={onClose} aria-label="Close">×</button>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 58;
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
		gap: 0.8rem;
		padding: 1.75rem;
		border-radius: 16px;
		background: linear-gradient(150deg, #23242e, #16171d);
		border: 1px solid rgba(255, 255, 255, 0.09);
		box-shadow: 0 40px 90px rgba(0, 0, 0, 0.6);
		color: #ece9f7;
	}
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}
	h2 {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 700;
	}
	.score {
		font-size: 0.9rem;
		font-weight: 700;
		color: #f0c85a;
		font-variant-numeric: tabular-nums;
	}
	.bar {
		height: 6px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.09);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		border-radius: 999px;
		background: linear-gradient(90deg, #f0c85a, #f5a94e);
		transition: width 0.4s ease;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.list li {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.55rem 0.7rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.03);
		opacity: 0.55;
	}
	.list li.got {
		opacity: 1;
		border-color: rgba(240, 200, 90, 0.45);
		background: rgba(240, 200, 90, 0.1);
	}
	.icon {
		font-size: 1.5rem;
		line-height: 1;
	}
	.txt {
		display: flex;
		flex-direction: column;
		line-height: 1.3;
	}
	.txt b {
		font-size: 0.88rem;
	}
	.got .txt b {
		color: #f0c85a;
	}
	.txt i {
		font-style: normal;
		font-size: 0.76rem;
		opacity: 0.7;
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
