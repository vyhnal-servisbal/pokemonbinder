// Easter eggs and achievements. Kept in one store so any part of the app can
// trigger them without wiring props through the tree.

const LS = 'pb_fun';

// same odds as rolling a shiny buddy
const ODDS = 50;
// gen 1-3; the /pokemon list is ordered by id, so index + 1 IS the pokedex id
const QUIZ_POOL = 386;
const SNORLAX_POKES = 10;

export interface Achievement {
	id: string;
	title: string;
	desc: string;
	icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
	{ id: 'first-card', title: 'Gotta start somewhere', desc: 'Add your first card', icon: '🃏' },
	{ id: 'full-page', title: 'Nine out of nine', desc: 'Fill a whole page', icon: '🧩' },
	{ id: 'fifty', title: 'Serious collector', desc: '50 cards in the binder', icon: '📚' },
	{ id: 'pokedex', title: 'Original Pokedex', desc: '151 cards in the binder', icon: '📕' },
	{ id: 'sets10', title: 'Well travelled', desc: 'Cards from 10 different sets', icon: '🌍' },
	{ id: 'shiny', title: 'One in fifty', desc: 'Roll a shiny poopemon', icon: '✨' },
	{ id: 'evolve', title: 'It evolved!', desc: 'Evolve a poopemon', icon: '🌀' },
	{ id: 'poop', title: 'Up up down down', desc: 'Find poop mode', icon: '💩' },
	{ id: 'snorlax', title: 'Move it!', desc: 'Get Snorlax out of the way', icon: '😴' },
	{ id: 'quiz', title: "Who's that Pokemon?", desc: 'Guess one right', icon: '❓' }
];

export interface Quiz {
	dexId: number;
	name: string;
	options: string[];
	picked: string | null;
}

export function pretty(name: string) {
	return name
		.split('-')
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join(' ');
}

class FunStore {
	unlocked = $state<string[]>([]);
	toast = $state<Achievement | null>(null);

	snorlax = $state(false);
	snorlaxPokes = $state(0);
	snorlaxWaking = $state(false); // poked enough -> plays the walk-off

	winError = $state(false);
	quiz = $state<Quiz | null>(null);

	init() {
		try {
			const saved = JSON.parse(localStorage.getItem(LS) ?? '[]');
			if (Array.isArray(saved)) this.unlocked = saved;
		} catch {
			/* ignore */
		}
	}

	private persist() {
		try {
			localStorage.setItem(LS, JSON.stringify(this.unlocked));
		} catch {
			/* ignore */
		}
	}

	has(id: string) {
		return this.unlocked.includes(id);
	}

	unlock(id: string) {
		if (this.has(id)) return;
		const a = ACHIEVEMENTS.find((x) => x.id === id);
		if (!a) return;
		this.unlocked = [...this.unlocked, id];
		this.persist();
		this.toast = a;
		setTimeout(() => {
			if (this.toast?.id === id) this.toast = null;
		}, 4200);
	}

	private roll(odds = ODDS) {
		return Math.floor(Math.random() * odds) === 0;
	}

	// any add/remove/upload in the binder can wake Snorlax
	binderAction() {
		if (this.snorlax || this.quiz) return;
		if (!this.roll()) return;
		this.snorlax = true;
		this.snorlaxPokes = 0;
		this.snorlaxWaking = false;
	}

	// removing a card additionally risks a very old looking crash
	cardRemoved() {
		this.binderAction();
		if (!this.winError && this.roll(10)) this.winError = true;
	}

	pokeSnorlax() {
		if (this.snorlaxWaking) return;
		this.snorlaxPokes++;
		if (this.snorlaxPokes < SNORLAX_POKES) return;
		this.snorlaxWaking = true; // the component plays the exit, then dismisses
		this.unlock('snorlax');
	}

	dismissSnorlax() {
		this.snorlax = false;
		this.snorlaxPokes = 0;
		this.snorlaxWaking = false;
	}

	openQuiz(pool: string[]) {
		if (this.quiz || this.snorlax) return;
		const n = Math.min(QUIZ_POOL, pool.length);
		if (n < 4) return;
		const idx = Math.floor(Math.random() * n);
		const picks = new Set<string>([pool[idx]]);
		while (picks.size < 4) picks.add(pool[Math.floor(Math.random() * n)]);
		const options = [...picks].sort(() => Math.random() - 0.5);
		this.quiz = { dexId: idx + 1, name: pool[idx], options, picked: null };
	}

	answerQuiz(name: string) {
		if (!this.quiz || this.quiz.picked) return;
		this.quiz = { ...this.quiz, picked: name };
		if (name === this.quiz.name) this.unlock('quiz');
		setTimeout(() => (this.quiz = null), 2800);
	}

	closeQuiz() {
		this.quiz = null;
	}
}

export const fun = new FunStore();
