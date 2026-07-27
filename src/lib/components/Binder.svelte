<script lang="ts">
	import { store } from '$lib/binderStore.svelte';
	import BinderPage from './BinderPage.svelte';
	import type { BinderSide } from '$lib/types';

	const isSpread = $derived(store.view === 'spread');
	const left = $derived(store.binder.sides[store.index]);
	const right = $derived(isSpread ? store.binder.sides[store.index + 1] : undefined);

	let animating = $state(false);
	let dir = $state<'next' | 'prev'>('next');

	// pages captured for the turn animation
	let frontPage = $state<BinderSide | undefined>();
	let backPage = $state<BinderSide | undefined>();
	let underLeft = $state<BinderSide | undefined>();
	let underRight = $state<BinderSide | undefined>();
	let underSingle = $state<BinderSide | undefined>();

	function next() {
		if (animating || !store.canNext) return;
		const i = store.index;
		const s = store.binder.sides;
		dir = 'next';
		if (isSpread) {
			frontPage = s[i + 1]; // current right turns
			backPage = s[i + 2]; // its back is the new left
			underLeft = s[i]; // stays under
			underRight = s[i + 3]; // new right revealed
		} else {
			frontPage = s[i];
			backPage = s[i + 1];
			underSingle = s[i + 1];
		}
		animating = true;
	}

	function prev() {
		if (animating || !store.canPrev) return;
		const i = store.index;
		const s = store.binder.sides;
		dir = 'prev';
		if (isSpread) {
			frontPage = s[i]; // current left turns back
			backPage = s[i - 1]; // its back is the new right
			underLeft = s[i - 2]; // new left revealed
			underRight = s[i + 1]; // stays under
		} else {
			frontPage = s[i];
			backPage = s[i - 1];
			underSingle = s[i - 1];
		}
		animating = true;
	}

	function finish(e: AnimationEvent) {
		if (e.target !== e.currentTarget) return;
		if (dir === 'next') store.next();
		else store.prev();
		animating = false;
	}
</script>

<div class="binder">
	<button
		class="nav"
		onclick={prev}
		disabled={animating || !store.canPrev}
		aria-label="Predchádzajúca strana">‹</button
	>

	<div class="spread" class:single={!isSpread} class:anim={animating}>
		{#if animating}
			{#if isSpread}
				<div class="half">{#if underLeft}<BinderPage side={underLeft} />{/if}</div>
				<div class="half">{#if underRight}<BinderPage side={underRight} />{/if}</div>
			{:else}
				<div class="half">{#if underSingle}<BinderPage side={underSingle} />{/if}</div>
			{/if}

			<div class="flip {dir}" class:single={!isSpread} onanimationend={finish}>
				<div class="face front">{#if frontPage}<BinderPage side={frontPage} />{/if}</div>
				<div class="face back">{#if backPage}<BinderPage side={backPage} />{/if}</div>
			</div>
		{:else}
			{#if left}<div class="half"><BinderPage side={left} /></div>{/if}
			{#if right}<div class="half"><BinderPage side={right} /></div>{/if}
		{/if}
	</div>

	<button class="nav" onclick={next} disabled={animating || !store.canNext} aria-label="Ďalšia strana"
		>›</button
	>
</div>

<style>
	.binder {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.25rem;
		width: 100%;
	}
	.spread {
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: 1.75rem;
		flex: 1;
		min-width: 0;
		max-width: 900px;
		padding: 1.5rem;
		border-radius: 18px;
		background: linear-gradient(145deg, #2c2150, #1a1233);
		box-shadow: 0 30px 70px rgba(0, 0, 0, 0.55);
		perspective: 2200px;
	}
	.spread.single {
		max-width: 480px;
		margin: 0 auto;
	}
	.half {
		width: 50%;
		min-width: 0;
	}
	.spread.single .half {
		width: 100%;
	}
	.spread.anim .half {
		pointer-events: none;
	}
	/* binder rings down the middle of the open spread */
	.spread:not(.single)::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 5%;
		bottom: 5%;
		width: 16px;
		transform: translateX(-50%);
		z-index: 5;
		background: repeating-linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0.25) 0 7px,
			transparent 7px 26px
		);
		border-radius: 8px;
		opacity: 0.5;
		pointer-events: none;
	}

	/* the turning leaf */
	.flip {
		position: absolute;
		top: 1.5rem;
		bottom: 1.5rem;
		width: calc(50% - 0.875rem - 1.5rem);
		transform-style: preserve-3d;
		pointer-events: none;
		z-index: 4;
	}
	.flip.next {
		right: 1.5rem;
		transform-origin: left center;
		animation: flip-next 0.66s ease-in-out forwards;
	}
	.flip.prev {
		left: 1.5rem;
		transform-origin: right center;
		animation: flip-prev 0.66s ease-in-out forwards;
	}
	.flip.single {
		width: calc(100% - 3rem);
	}
	.flip.single.next {
		right: 1.5rem;
	}
	.flip.single.prev {
		left: 1.5rem;
	}
	.face {
		position: absolute;
		inset: 0;
		backface-visibility: hidden;
		border-radius: 12px;
		overflow: hidden;
	}
	.face.front {
		transform: rotateY(0deg);
	}
	.face.back {
		transform: rotateY(180deg);
	}

	@keyframes flip-next {
		0% {
			transform: rotateY(0deg);
			filter: brightness(1);
		}
		50% {
			transform: rotateY(-90deg);
			filter: brightness(0.72);
		}
		100% {
			transform: rotateY(-180deg);
			filter: brightness(1);
		}
	}
	@keyframes flip-prev {
		0% {
			transform: rotateY(0deg);
			filter: brightness(1);
		}
		50% {
			transform: rotateY(90deg);
			filter: brightness(0.72);
		}
		100% {
			transform: rotateY(180deg);
			filter: brightness(1);
		}
	}

	.nav {
		flex: none;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		border: none;
		font-size: 1.9rem;
		line-height: 1;
		color: #fff;
		background: rgba(255, 255, 255, 0.08);
		cursor: pointer;
		transition: background 0.2s;
	}
	.nav:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
	}
	.nav:disabled {
		opacity: 0.25;
		cursor: default;
	}
</style>
