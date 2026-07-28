<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { fade, scale, fly } from 'svelte/transition';
	import { store } from '$lib/binderStore.svelte';
	import { buddies } from '$lib/buddyStore.svelte';
	import { fun, pretty } from '$lib/funStore.svelte';

	interface Drop {
		id: number;
		x: number;
		size: number;
		dur: number;
		delay: number;
		rot: number;
	}
	interface Zzz {
		id: number;
		x: number;
		y: number;
	}

	// ArrowUp ArrowUp ArrowDown ArrowDown toggles poop mode
	const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown'];
	const QUIZ_EVERY = 15 * 60 * 1000;
	const ART = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';

	let poop = $state(false);
	let toast = $state<string | null>(null);
	let brainrot = $state(false);
	let nice = $state(false);
	let drops = $state<Drop[]>([]);
	let zzz = $state<Zzz[]>([]);
	let errPos = $state<{ x: number; y: number } | null>(null);
	let did = 0;

	const cards = $derived(store.binder.sides.flatMap((s) => s.items).filter((i) => i.type === 'card'));
	const cardCount = $derived(cards.length);
	const setCount = $derived(new Set(cards.map((c) => c.card?.set).filter(Boolean)).size);
	const fullPage = $derived(store.binder.sides.some((s) => s.items.length >= 9));

	function say(msg: string) {
		toast = msg;
		setTimeout(() => (toast = null), 2400);
	}

	// number gags fire only when crossing INTO the magic count
	let seen = -1;
	$effect(() => {
		const n = cardCount;
		if (n === seen) return;
		seen = n;
		if (n === 69) {
			nice = true;
			setTimeout(() => (nice = false), 2600);
		} else if (n === 67) {
			brainrot = true;
			setTimeout(() => (brainrot = false), 2400);
		}
	});

	// achievements. untrack so unlocking cannot re-trigger this effect
	$effect(() => {
		const n = cardCount;
		const sets = setCount;
		const full = fullPage;
		untrack(() => {
			if (n >= 1) fun.unlock('first-card');
			if (n >= 50) fun.unlock('fifty');
			if (n >= 151) fun.unlock('pokedex');
			if (sets >= 10) fun.unlock('sets10');
			if (full) fun.unlock('full-page');
		});
	});

	// walking in -> asleep -> woken and walking off
	let snorPhase = $state<'in' | 'sleep' | 'out'>('in');
	let snorEl: HTMLElement | undefined = $state();

	function puff(scatter = 0.25) {
		if (!snorEl) return;
		const r = snorEl.getBoundingClientRect();
		const id = did++;
		zzz = [...zzz, { id, x: r.left + r.width * (0.5 + Math.random() * scatter), y: r.top + 30 }];
		setTimeout(() => (zzz = zzz.filter((z) => z.id !== id)), 1400);
	}

	function pokeSnorlax() {
		if (fun.snorlaxWaking) return;
		puff();
		fun.pokeSnorlax();
	}

	// drive the phases; snoring puffs run on their own while he sleeps
	$effect(() => {
		if (!fun.snorlax) return;
		snorPhase = 'in';
		const walkIn = setTimeout(() => (snorPhase = 'sleep'), 2200);
		const snore = setInterval(() => {
			if (snorPhase === 'sleep' && !fun.snorlaxWaking) puff(0.15);
		}, 1600);
		return () => {
			clearTimeout(walkIn);
			clearInterval(snore);
		};
	});

	$effect(() => {
		if (!fun.snorlaxWaking) return;
		snorPhase = 'out';
		const t = setTimeout(() => fun.dismissSnorlax(), 1700);
		return () => clearTimeout(t);
	});

	onMount(() => {
		fun.init();

		let hit = 0;
		function key(e: KeyboardEvent) {
			const t = e.target as HTMLElement | null;
			if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
			hit = e.key === CODE[hit] ? hit + 1 : e.key === CODE[0] ? 1 : 0;
			if (hit === CODE.length) {
				hit = 0;
				poop = !poop;
				say(poop ? '💩 POOP MODE ON 💩' : 'poop mode off');
				if (poop) fun.unlock('poop');
			}
		}
		window.addEventListener('keydown', key);

		// top the rain up only while the mode is on
		const rain = setInterval(() => {
			if (!poop) {
				if (drops.length) drops = [];
				return;
			}
			const d: Drop = {
				id: did++,
				x: Math.random() * 100,
				size: 16 + Math.random() * 22,
				dur: 4200 + Math.random() * 3200,
				delay: Math.random() * 300,
				rot: (Math.random() - 0.5) * 720
			};
			drops = [...drops, d].slice(-45);
			setTimeout(() => (drops = drops.filter((x) => x.id !== d.id)), d.dur + d.delay);
		}, 260);

		const quizTimer = setInterval(() => fun.openQuiz(buddies.all), QUIZ_EVERY);

		return () => {
			window.removeEventListener('keydown', key);
			clearInterval(rain);
			clearInterval(quizTimer);
		};
	});
</script>

{#if poop}
	<div class="rain" aria-hidden="true">
		{#each drops as d (d.id)}
			<span
				class="drop"
				style:left="{d.x}vw"
				style:font-size="{d.size}px"
				style:animation-duration="{d.dur}ms"
				style:animation-delay="{d.delay}ms"
				style:--rot="{d.rot}deg">💩</span
			>
		{/each}
	</div>
{/if}

<!-- Snorlax parks himself in the way until you poke him enough -->
{#if fun.snorlax}
	<div class="block" transition:fade={{ duration: 200 }}>
		<button
			class="snor {snorPhase}"
			bind:this={snorEl}
			onclick={pokeSnorlax}
			aria-label="Poke Snorlax"
		>
			<img src="https://play.pokemonshowdown.com/sprites/ani/snorlax.gif" alt="Snorlax" />
			{#if snorPhase === 'sleep'}
				<span class="pokes">{fun.snorlaxPokes} / 10</span>
			{/if}
		</button>
		{#if snorPhase === 'sleep'}
			<p class="blocktip" transition:fade={{ duration: 200 }}>
				Snorlax fell asleep here. Poke him 10 times.
			</p>
		{/if}
	</div>
{/if}

{#each zzz as z (z.id)}
	<span class="zzz" style:left="{z.x}px" style:top="{z.y}px" aria-hidden="true">💤</span>
{/each}

<!-- Who's that Pokemon? -->
{#if fun.quiz}
	{@const q = fun.quiz}
	<div class="quiz" transition:fade={{ duration: 180 }}>
		<div class="quizbox" transition:scale={{ duration: 220, start: 0.9 }}>
			<h2>Who's that Pokémon?</h2>
			<div class="silo" class:revealed={!!q.picked}>
				<img src="{ART}/{q.dexId}.png" alt="" />
			</div>
			<div class="opts">
				{#each q.options as o (o)}
					<button
						class="opt"
						class:right={q.picked && o === q.name}
						class:wrong={q.picked === o && o !== q.name}
						disabled={!!q.picked}
						onclick={() => fun.answerQuiz(o)}>{pretty(o)}</button
					>
				{/each}
			</div>
			{#if q.picked}
				<p class="verdict">
					It's <strong>{pretty(q.name)}</strong>!
					{q.picked === q.name ? '🎉' : '💀'}
				</p>
			{/if}
			<button class="qclose" onclick={() => fun.closeQuiz()} aria-label="Close">×</button>
		</div>
	</div>
{/if}

<!-- very old looking crash, fires sometimes when a card is thrown out -->
{#if fun.winError}
	<div class="werr-wrap">
		<div
			class="werr"
			style:left={errPos ? errPos.x + 'px' : null}
			style:top={errPos ? errPos.y + 'px' : null}
			style:transform={errPos ? 'none' : null}
			transition:scale={{ duration: 140, start: 0.9 }}
		>
			<div class="wbar">
				<span>BINDER.EXE</span>
				<button onclick={() => (fun.winError = false)} aria-label="Close">✕</button>
			</div>
			<div class="wbody">
				<span class="wicon">⚠️</span>
				<p>
					A fatal exception <b>0x67</b> has occurred at POOP:0069.<br />
					The card has been yeeted. Press OK to pretend nothing happened.
				</p>
			</div>
			<div class="wbtns">
				<button onclick={() => (fun.winError = false)}>OK</button>
				<button
					onclick={() =>
						(errPos = {
							x: Math.random() * Math.max(0, window.innerWidth - 340),
							y: Math.random() * Math.max(0, window.innerHeight - 200)
						})}>Cancel</button
				>
			</div>
		</div>
	</div>
{/if}

{#if fun.toast}
	<div class="ach" transition:fly={{ x: -30, duration: 260 }}>
		<span class="achicon">{fun.toast.icon}</span>
		<span class="achtxt">
			<b>{fun.toast.title}</b>
			<i>{fun.toast.desc}</i>
		</span>
	</div>
{/if}

{#if toast}
	<div class="toast" transition:fade={{ duration: 180 }}>{toast}</div>
{/if}

{#if nice}
	<div class="nice" transition:scale={{ duration: 260, start: 0.6 }} aria-hidden="true">nice</div>
{/if}

{#if brainrot}
	<div class="rot" transition:fade={{ duration: 120 }} aria-hidden="true">
		<span class="six">6</span><span class="seven">7</span>
	</div>
{/if}

<style>
	.rain {
		position: fixed;
		inset: 0;
		z-index: 46;
		pointer-events: none;
		overflow: hidden;
	}
	.drop {
		position: absolute;
		top: -8vh;
		line-height: 1;
		animation-name: fall;
		animation-timing-function: linear;
		animation-fill-mode: forwards;
		will-change: transform;
	}
	@keyframes fall {
		to {
			transform: translateY(115vh) rotate(var(--rot));
		}
	}

	/* ---- Snorlax ---- */
	.block {
		position: fixed;
		inset: 0;
		z-index: 80;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		gap: 1rem;
		padding-left: 4vw;
		background: rgba(6, 4, 16, 0.55);
		backdrop-filter: blur(3px);
	}
	.snor {
		border: 0;
		background: none;
		padding: 0;
		position: relative;
	}
	/* walks in from off screen, rocking side to side like a heavy thing */
	.snor.in {
		animation:
			walkin 2.2s cubic-bezier(0.3, 0, 0.5, 1) forwards,
			rock 0.42s ease-in-out 5;
	}
	.snor.sleep {
		animation: breathe 3.4s ease-in-out infinite;
	}
	.snor.out {
		animation:
			walkout 1.7s cubic-bezier(0.5, 0, 0.7, 1) forwards,
			rock 0.34s ease-in-out 5;
	}
	@keyframes walkin {
		from {
			transform: translateX(-130vw);
		}
		to {
			transform: translateX(0);
		}
	}
	@keyframes walkout {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(130vw);
		}
	}
	@keyframes rock {
		0%,
		100% {
			rotate: -3deg;
		}
		50% {
			rotate: 3deg;
		}
	}
	@keyframes breathe {
		0%,
		100% {
			scale: 1 1;
		}
		50% {
			scale: 1.02 0.98;
		}
	}
	.snor img {
		width: clamp(190px, 26vw, 320px);
		image-rendering: pixelated;
		filter: drop-shadow(0 18px 26px rgba(0, 0, 0, 0.6));
	}
	.snor.sleep:active img {
		transform: scale(0.96) rotate(-2deg);
	}
	.pokes {
		position: absolute;
		right: -0.4rem;
		top: -0.4rem;
		padding: 0.25rem 0.6rem;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.75);
		border: 1px solid rgba(255, 255, 255, 0.25);
		color: #fff;
		font-size: 0.85rem;
		font-weight: 700;
	}
	.blocktip {
		margin: 0;
		padding: 0.5rem 0.9rem;
		border-radius: 10px;
		background: rgba(0, 0, 0, 0.6);
		color: #ece9f7;
		font-size: 0.9rem;
	}
	.zzz {
		position: fixed;
		z-index: 81;
		font-size: 1.4rem;
		pointer-events: none;
		animation: zup 1.4s ease-out forwards;
	}
	@keyframes zup {
		0% {
			opacity: 0;
			transform: translateY(0) scale(0.7);
		}
		20% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translateY(-70px) scale(1.2);
		}
	}

	/* ---- quiz ---- */
	.quiz {
		position: fixed;
		inset: 0;
		z-index: 78;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: rgba(6, 4, 16, 0.75);
		backdrop-filter: blur(6px);
	}
	.quizbox {
		position: relative;
		width: min(430px, 100%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.9rem;
		padding: 1.6rem;
		border-radius: 16px;
		background: linear-gradient(150deg, #23242e, #16171d);
		border: 1px solid rgba(255, 255, 255, 0.09);
		box-shadow: 0 40px 90px rgba(0, 0, 0, 0.6);
		color: #ece9f7;
	}
	.quizbox h2 {
		margin: 0;
		font-size: 1.15rem;
	}
	.silo img {
		width: min(210px, 52vw);
		height: auto;
		/* real artwork, blacked out until you answer */
		filter: brightness(0);
		transition: filter 0.45s ease;
	}
	.silo.revealed img {
		filter: none;
		animation: pop 0.45s ease-out;
	}
	@keyframes pop {
		0% {
			filter: brightness(4);
			transform: scale(1.1);
		}
		100% {
			filter: none;
			transform: scale(1);
		}
	}
	.opts {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.45rem;
		width: 100%;
	}
	.opt {
		padding: 0.55rem 0.6rem;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(255, 255, 255, 0.05);
		color: #ece9f7;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.opt:hover:not(:disabled) {
		border-color: var(--accent);
		background: rgba(var(--accent-rgb), 0.18);
	}
	.opt.right {
		background: rgba(80, 200, 120, 0.28);
		border-color: #50c878;
	}
	.opt.wrong {
		background: rgba(220, 60, 80, 0.28);
		border-color: #dc3c50;
	}
	.verdict {
		margin: 0;
		font-size: 0.9rem;
	}
	.qclose {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 30px;
		height: 30px;
		border: 0;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
		font-size: 1.2rem;
		line-height: 1;
		cursor: pointer;
	}

	/* ---- fake crash ---- */
	.werr-wrap {
		position: fixed;
		inset: 0;
		z-index: 82;
		pointer-events: none;
	}
	.werr {
		position: absolute;
		left: 50%;
		top: 42%;
		transform: translate(-50%, -50%);
		width: min(340px, 90vw);
		pointer-events: auto;
		background: #c0c0c0;
		border: 2px outset #fff;
		font-family: 'Tahoma', 'Segoe UI', sans-serif;
		color: #000;
		box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.45);
	}
	.wbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 2px 3px;
		background: linear-gradient(90deg, #000080, #1084d0);
		color: #fff;
		font-size: 0.78rem;
		font-weight: 700;
	}
	.wbar button {
		width: 18px;
		height: 16px;
		border: 1px outset #fff;
		background: #c0c0c0;
		color: #000;
		font-size: 0.6rem;
		line-height: 1;
		cursor: pointer;
	}
	.wbody {
		display: flex;
		gap: 0.7rem;
		padding: 1rem 0.9rem 0.6rem;
	}
	.wicon {
		font-size: 1.8rem;
		line-height: 1;
	}
	.wbody p {
		margin: 0;
		font-size: 0.78rem;
		line-height: 1.45;
	}
	.wbtns {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.3rem 0 0.9rem;
	}
	.wbtns button {
		min-width: 76px;
		padding: 0.25rem 0.5rem;
		border: 2px outset #fff;
		background: #c0c0c0;
		color: #000;
		font-size: 0.76rem;
		cursor: pointer;
	}
	.wbtns button:active {
		border-style: inset;
	}

	/* ---- achievement ---- */
	.ach {
		position: fixed;
		left: 1.2rem;
		bottom: 1.4rem;
		z-index: 79;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.7rem 1.1rem 0.7rem 0.8rem;
		border-radius: 12px;
		background: linear-gradient(150deg, #2a2b36, #17181f);
		border: 1px solid rgba(240, 200, 90, 0.5);
		box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
		pointer-events: none;
	}
	.achicon {
		font-size: 1.7rem;
	}
	.achtxt {
		display: flex;
		flex-direction: column;
		line-height: 1.25;
	}
	.achtxt b {
		font-size: 0.9rem;
		color: #f0c85a;
	}
	.achtxt i {
		font-style: normal;
		font-size: 0.76rem;
		opacity: 0.7;
	}

	.toast {
		position: fixed;
		left: 50%;
		bottom: 2.2rem;
		transform: translateX(-50%);
		z-index: 70;
		padding: 0.7rem 1.3rem;
		border-radius: 999px;
		background: rgba(20, 14, 8, 0.92);
		border: 1px solid rgba(200, 140, 60, 0.55);
		color: #f3d9a8;
		font-weight: 700;
		font-size: 0.95rem;
		pointer-events: none;
	}

	/* 69 cards */
	.nice {
		position: fixed;
		left: 50%;
		top: 42%;
		transform: translate(-50%, -50%);
		z-index: 70;
		font-size: clamp(3rem, 14vw, 9rem);
		font-weight: 900;
		letter-spacing: -0.03em;
		color: #79e2d5;
		text-shadow: 0 0 40px rgba(121, 226, 213, 0.65);
		pointer-events: none;
	}

	/* 67 */
	.rot {
		position: fixed;
		inset: 0;
		z-index: 70;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		pointer-events: none;
		background: rgba(0, 0, 0, 0.35);
		animation: shake 0.11s linear infinite;
	}
	.rot span {
		font-size: clamp(5rem, 26vw, 20rem);
		font-weight: 900;
		line-height: 0.85;
		/* chromatic aberration, the cursed look */
		text-shadow:
			5px 0 0 rgba(255, 0, 80, 0.9),
			-5px 0 0 rgba(0, 230, 255, 0.9);
	}
	.six {
		color: #fff;
		animation: wob 0.18s ease-in-out infinite alternate;
	}
	.seven {
		color: #fff;
		animation: wob 0.18s ease-in-out infinite alternate-reverse;
	}
	@keyframes wob {
		0% {
			transform: rotate(-9deg) scale(0.92);
		}
		100% {
			transform: rotate(9deg) scale(1.12);
		}
	}
	@keyframes shake {
		0% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(-7px, 4px);
		}
		50% {
			transform: translate(6px, -5px);
		}
		75% {
			transform: translate(-4px, -3px);
		}
		100% {
			transform: translate(5px, 3px);
		}
	}
</style>
