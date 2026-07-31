// Easter eggs and achievements. Kept in one store so any part of the app can
// trigger them without wiring props through the tree.

const LS = 'pb_fun';

// same odds as rolling a shiny buddy
const ODDS = 50;
// Snorlax is parked for now: the full screen blur + scaled gif was heavy on
// slower machines. The whole feature stays in place, this just stops it firing.
const SNORLAX_ENABLED = false;
// the fake crash is meant to be a once-in-a-blue-moon thing
const CRASH_ODDS = 10000;
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
	ready = $state(false); // nothing may unlock before the save file is read
	toast = $state<Achievement | null>(null);

	snorlax = $state(false);
	snorlaxPokes = $state(0);
	snorlaxWaking = $state(false); // poked enough -> plays the walk-off

	winError = $state(false);
	quiz = $state<Quiz | null>(null);
	quizRight = $state(0);
	quizTotal = $state(0);

	init() {
		try {
			const saved = JSON.parse(localStorage.getItem(LS) ?? '[]');
			if (Array.isArray(saved)) this.unlocked = saved;
		} catch {
			/* ignore */
		}
		this.ready = true;
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
		// before init the list is empty, so unlocking now would re-announce
		// everything the player already has on every single page load
		if (!this.ready || this.has(id)) return;
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

	// every add/remove/upload counts as an interaction
	binderAction() {
		if (!this.winError && this.roll(CRASH_ODDS)) this.winError = true;
		if (!SNORLAX_ENABLED) return;
		if (this.snorlax || this.quiz) return;
		if (!this.roll()) return;
		this.snorlax = true;
		this.snorlaxPokes = 0;
		this.snorlaxWaking = false;
	}

	cardRemoved() {
		this.binderAction();
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
		this.quizRight = 0;
		this.quizTotal = 0;
		this.nextQuiz(pool);
	}

	// deals a fresh question into the same popup, so a session keeps running
	nextQuiz(pool: string[]) {
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
		this.quizTotal++;
		if (name === this.quiz.name) {
			this.quizRight++;
			this.unlock('quiz');
		}
	}

	closeQuiz() {
		this.quiz = null;
	}
}

export const fun = new FunStore();
