// Multiplayer memory game. One row in Supabase holds the whole board, so both
// players look at the exact same deal; realtime keeps them in step.
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, hasSupabase } from './supabase';
import { DEX_MAX } from './dexStore.svelte';

const LS_NAME = 'pb_battle_name'; // shared with pack battle on purpose
const LS_ROOM = 'pb_pexeso_room';
const ROOM_TTL_MIN = 120;

export const PAIR_CHOICES = [8, 12, 18, 24];
export const MISS_DELAY = 1100; // how long a wrong pair stays visible

export type Role = 'host' | 'guest';

export interface Game {
	id: string;
	host_name: string | null;
	guest_name: string | null;
	pairs: number;
	cards: number[];
	matched: number[];
	flipped: number[];
	turn: Role;
	host_score: number;
	guest_score: number;
	created_at: string;
}

const COLS =
	'id, host_name, guest_name, pairs, cards, matched, flipped, turn, host_score, guest_score, created_at';

// pairs of random species, shuffled
function deal(pairs: number): number[] {
	const picked = new Set<number>();
	while (picked.size < pairs) picked.add(1 + Math.floor(Math.random() * DEX_MAX));
	const cards = [...picked, ...picked];
	for (let i = cards.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[cards[i], cards[j]] = [cards[j], cards[i]];
	}
	return cards;
}

class PexesoStore {
	enabled = hasSupabase;
	name = $state('');
	game = $state<Game | null>(null);
	role = $state<Role | null>(null);
	openRooms = $state<Game[]>([]);
	status = $state<'idle' | 'busy' | 'error'>('idle');
	error = $state('');

	private channel: RealtimeChannel | null = null;
	private resolving = false;

	init() {
		try {
			this.name = localStorage.getItem(LS_NAME) ?? '';
		} catch {
			/* ignore */
		}
	}

	setName(n: string) {
		this.name = n.trim();
		try {
			localStorage.setItem(LS_NAME, this.name);
		} catch {
			/* ignore */
		}
	}

	async setMyName(n: string) {
		const name = n.trim();
		if (!name) return;
		this.setName(name);
		if (!this.game || !this.role) return;
		await this.patch(this.role === 'host' ? { host_name: name } : { guest_name: name });
	}

	private remember(id: string, role: Role) {
		try {
			localStorage.setItem(LS_ROOM, JSON.stringify({ id, role }));
		} catch {
			/* ignore */
		}
	}
	private recall(id: string): Role | null {
		try {
			const v = JSON.parse(localStorage.getItem(LS_ROOM) ?? 'null');
			return v?.id === id ? (v.role as Role) : null;
		} catch {
			return null;
		}
	}

	get myTurn() {
		return !!this.game && this.role === this.game.turn;
	}
	get myScore() {
		if (!this.game || !this.role) return 0;
		return this.role === 'host' ? this.game.host_score : this.game.guest_score;
	}
	get theirScore() {
		if (!this.game || !this.role) return 0;
		return this.role === 'host' ? this.game.guest_score : this.game.host_score;
	}
	get myName() {
		if (!this.game || !this.role) return this.name || 'You';
		return (this.role === 'host' ? this.game.host_name : this.game.guest_name) || 'You';
	}
	get theirName() {
		if (!this.game || !this.role) return 'Opponent';
		return (this.role === 'host' ? this.game.guest_name : this.game.host_name) || 'Waiting…';
	}
	get hasOpponent() {
		return !!this.game?.host_name && !!this.game?.guest_name;
	}
	get done() {
		return !!this.game && this.game.matched.length === this.game.cards.length;
	}

	private async signIn() {
		const { data } = await supabase.auth.getSession();
		if (data.session) return true;
		const anon = await supabase.auth.signInAnonymously();
		return !!anon.data.session;
	}

	async listOpen() {
		if (!this.enabled || !(await this.signIn())) return;
		const since = new Date(Date.now() - ROOM_TTL_MIN * 60_000).toISOString();
		const got = await supabase
			.from('pexeso')
			.select(COLS)
			.is('guest_name', null)
			.gt('created_at', since)
			.order('created_at', { ascending: false })
			.limit(12);
		this.openRooms = (got.data ?? []) as Game[];
	}

	async tidy() {
		if (!this.enabled) return;
		const cutoff = new Date(Date.now() - ROOM_TTL_MIN * 60_000).toISOString();
		await supabase.from('pexeso').delete().lt('created_at', cutoff).is('guest_name', null);
	}

	async create(pairs: number) {
		if (!this.enabled) return this.fail('Cloud is not configured (.env).');
		this.status = 'busy';
		if (!(await this.signIn())) return this.fail('Could not sign in anonymously.');
		const ins = await supabase
			.from('pexeso')
			.insert({ host_name: this.name || 'Host', pairs, cards: deal(pairs), turn: 'host' })
			.select(COLS)
			.single();
		if (ins.error || !ins.data) return this.fail(ins.error?.message ?? 'Could not create the room.');
		this.game = ins.data as Game;
		this.role = 'host';
		this.remember(this.game.id, 'host');
		this.subscribe();
		this.status = 'idle';
	}

	async join(id: string) {
		if (!this.enabled) return this.fail('Cloud is not configured (.env).');
		this.status = 'busy';
		if (!(await this.signIn())) return this.fail('Could not sign in anonymously.');
		const got = await supabase.from('pexeso').select(COLS).eq('id', id).maybeSingle();
		if (got.error || !got.data) return this.fail('That game is gone.');
		this.game = got.data as Game;
		this.role = this.recall(this.game.id) ?? 'guest';
		this.remember(this.game.id, this.role);
		if (this.role === 'guest' && this.game.guest_name !== this.name) {
			await this.patch({ guest_name: this.name || 'Guest' });
		}
		this.subscribe();
		this.status = 'idle';
	}

	private fail(msg: string) {
		this.error = msg;
		this.status = 'error';
	}

	private async patch(fields: Partial<Game>) {
		if (!this.game) return;
		const up = await supabase
			.from('pexeso')
			.update(fields)
			.eq('id', this.game.id)
			.select(COLS)
			.single();
		if (up.data) this.game = up.data as Game;
	}

	private subscribe() {
		if (!this.game) return;
		if (this.channel) {
			supabase.removeChannel(this.channel);
			this.channel = null;
		}
		const id = this.game.id;
		try {
			this.channel = supabase
				.channel('pexeso-' + id)
				.on(
					'postgres_changes',
					{ event: 'UPDATE', schema: 'public', table: 'pexeso', filter: 'id=eq.' + id },
					(payload) => (this.game = payload.new as Game)
				)
				.subscribe();
		} catch {
			/* realtime optional, the poll below covers it */
		}
	}

	async refresh() {
		if (!this.game) return;
		const got = await supabase.from('pexeso').select(COLS).eq('id', this.game.id).maybeSingle();
		if (got.data) this.game = got.data as Game;
	}

	// turning a card is just adding its index to flipped
	async flip(i: number) {
		const g = this.game;
		if (!g || !this.myTurn || this.done) return;
		if (g.flipped.length >= 2) return;
		if (g.flipped.includes(i) || g.matched.includes(i)) return;
		await this.patch({ flipped: [...g.flipped, i] });
	}

	// called by both clients on a timer; the write is the same either way, so a
	// double fire is harmless and a disconnected opponent cannot stall the game
	async resolve() {
		const g = this.game;
		if (!g || this.resolving || g.flipped.length !== 2) return;
		this.resolving = true;
		const [a, b] = g.flipped;
		const hit = g.cards[a] === g.cards[b];
		try {
			if (hit) {
				await this.patch({
					matched: [...g.matched, a, b],
					flipped: [],
					host_score: g.turn === 'host' ? g.host_score + 1 : g.host_score,
					guest_score: g.turn === 'guest' ? g.guest_score + 1 : g.guest_score
				});
			} else {
				await this.patch({ flipped: [], turn: g.turn === 'host' ? 'guest' : 'host' });
			}
		} finally {
			this.resolving = false;
		}
	}

	async rematch(pairs?: number) {
		if (!this.game) return;
		const n = pairs ?? this.game.pairs;
		await this.patch({
			pairs: n,
			cards: deal(n),
			matched: [],
			flipped: [],
			turn: 'host',
			host_score: 0,
			guest_score: 0
		});
	}

	leave() {
		if (this.channel) {
			supabase.removeChannel(this.channel);
			this.channel = null;
		}
		this.game = null;
		this.role = null;
	}
}

export const pexeso = new PexesoStore();
