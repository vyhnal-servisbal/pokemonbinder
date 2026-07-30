// Networked pack battle. A room is one row in Supabase; realtime pushes the
// opponent's pack over the moment they open it. The dex is never touched.
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, hasSupabase } from './supabase';
import type { Catch } from './dexStore.svelte';

const LS_NAME = 'pb_battle_name';
const LS_ROOM = 'pb_battle_room'; // remembers which side of a room is yours

export type Role = 'host' | 'guest';

export interface Msg {
	id: number;
	author: string | null;
	body: string;
	created_at: string;
}

export interface Room {
	id: string;
	host_name: string | null;
	host_pack: Catch[] | null;
	host_score: number | null;
	guest_name: string | null;
	guest_pack: Catch[] | null;
	guest_score: number | null;
	round: number;
	host_wins: number;
	guest_wins: number;
	created_at: string;
}

const COLS =
	'id, host_name, host_pack, host_score, guest_name, guest_pack, guest_score, round, host_wins, guest_wins, created_at';

// rooms older than this are treated as abandoned and hidden from the lobby
const ROOM_TTL_MIN = 120;

class BattleStore {
	enabled = hasSupabase;
	name = $state('');
	room = $state<Room | null>(null);
	role = $state<Role | null>(null);
	status = $state<'idle' | 'busy' | 'error'>('idle');
	error = $state('');
	openRooms = $state<Room[]>([]);
	messages = $state<Msg[]>([]);

	private channel: RealtimeChannel | null = null;
	private settledRound = -1; // one tally per round, no matter how often realtime fires

	init() {
		try {
			this.name = localStorage.getItem(LS_NAME) ?? '';
		} catch {
			/* ignore */
		}
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

	setName(n: string) {
		this.name = n.trim();
		try {
			localStorage.setItem(LS_NAME, this.name);
		} catch {
			/* ignore */
		}
	}

	// both sides have opened their pack
	get ready() {
		return !!this.room?.host_pack && !!this.room?.guest_pack;
	}

	get mine(): Catch[] | null {
		if (!this.room || !this.role) return null;
		return this.role === 'host' ? this.room.host_pack : this.room.guest_pack;
	}
	get theirs(): Catch[] | null {
		if (!this.room || !this.role) return null;
		return this.role === 'host' ? this.room.guest_pack : this.room.host_pack;
	}
	get myScore() {
		if (!this.room || !this.role) return 0;
		return (this.role === 'host' ? this.room.host_score : this.room.guest_score) ?? 0;
	}
	get theirScore() {
		if (!this.room || !this.role) return 0;
		return (this.role === 'host' ? this.room.guest_score : this.room.host_score) ?? 0;
	}
	get myName() {
		if (!this.room || !this.role) return this.name;
		return (this.role === 'host' ? this.room.host_name : this.room.guest_name) || 'You';
	}
	get theirName() {
		if (!this.room || !this.role) return 'Opponent';
		return (this.role === 'host' ? this.room.guest_name : this.room.host_name) || 'Waiting…';
	}
	get myWins() {
		if (!this.room || !this.role) return 0;
		return this.role === 'host' ? this.room.host_wins : this.room.guest_wins;
	}
	get theirWins() {
		if (!this.room || !this.role) return 0;
		return this.role === 'host' ? this.room.guest_wins : this.room.host_wins;
	}

	// anything waiting for a second player, so joining is one click and no link
	async listOpen() {
		if (!this.enabled) return;
		if (!(await this.signIn())) return;
		const since = new Date(Date.now() - ROOM_TTL_MIN * 60_000).toISOString();
		const got = await supabase
			.from('battles')
			.select(COLS)
			.is('guest_name', null)
			.gt('created_at', since)
			.order('created_at', { ascending: false })
			.limit(12);
		this.openRooms = (got.data ?? []) as Room[];
	}

	// drop your own leftovers so the lobby stays readable
	async tidy() {
		if (!this.enabled) return;
		const cutoff = new Date(Date.now() - ROOM_TTL_MIN * 60_000).toISOString();
		await supabase.from('battles').delete().lt('created_at', cutoff).is('guest_name', null);
	}

	private async signIn() {
		const { data } = await supabase.auth.getSession();
		if (data.session) return true;
		const anon = await supabase.auth.signInAnonymously();
		return !!anon.data.session;
	}

	async create() {
		if (!this.enabled) return this.fail('Cloud is not configured (.env).');
		this.status = 'busy';
		if (!(await this.signIn())) return this.fail('Could not sign in anonymously.');
		const ins = await supabase
			.from('battles')
			.insert({ host_name: this.name || 'Host' })
			.select(COLS)
			.single();
		if (ins.error || !ins.data) return this.fail(ins.error?.message ?? 'Could not create the room.');
		this.room = ins.data as Room;
		this.role = 'host';
		this.remember(this.room.id, 'host');
		this.subscribe();
		this.loadMessages();
		this.status = 'idle';
	}

	async join(id: string) {
		if (!this.enabled) return this.fail('Cloud is not configured (.env).');
		this.status = 'busy';
		if (!(await this.signIn())) return this.fail('Could not sign in anonymously.');
		const got = await supabase.from('battles').select(COLS).eq('id', id).maybeSingle();
		if (got.error || !got.data) return this.fail('That battle link is not valid any more.');

		const row = got.data as Room;
		this.room = row;
		// a host who just reloads must not be handed the guest slot
		this.role = this.recall(row.id) ?? 'guest';
		this.remember(row.id, this.role);
		if (this.role === 'guest' && row.guest_name !== this.name) {
			await this.patch({ guest_name: this.name || 'Guest' });
		}
		this.subscribe();
		this.status = 'idle';
	}

	// changing your name inside a room updates the label and every future message
	async setMyName(n: string) {
		const name = n.trim();
		if (!name) return;
		this.setName(name);
		if (!this.room || !this.role) return;
		await this.patch(this.role === 'host' ? { host_name: name } : { guest_name: name });
	}

	async loadMessages() {
		if (!this.room) return;
		const got = await supabase
			.from('battle_messages')
			.select('id, author, body, created_at')
			.eq('battle_id', this.room.id)
			.order('id', { ascending: true })
			.limit(200);
		this.messages = (got.data ?? []) as Msg[];
	}

	async send(body: string) {
		const text = body.trim().slice(0, 400);
		if (!text || !this.room) return;
		await supabase
			.from('battle_messages')
			.insert({ battle_id: this.room.id, author: this.myName, body: text });
	}

	private fail(msg: string) {
		this.error = msg;
		this.status = 'error';
	}

	private async patch(fields: Partial<Room>) {
		if (!this.room) return;
		const up = await supabase
			.from('battles')
			.update(fields)
			.eq('id', this.room.id)
			.select(COLS)
			.single();
		if (up.data) this.room = up.data as Room;
	}

	private subscribe() {
		if (!this.room) return;
		if (this.channel) {
			supabase.removeChannel(this.channel);
			this.channel = null;
		}
		const id = this.room.id;
		try {
			this.channel = supabase
				.channel('battle-' + id)
				.on(
					'postgres_changes',
					{ event: 'UPDATE', schema: 'public', table: 'battles', filter: 'id=eq.' + id },
					(payload) => {
						this.room = payload.new as Room;
					}
				)
				.on(
					'postgres_changes',
					{
						event: 'INSERT',
						schema: 'public',
						table: 'battle_messages',
						filter: 'battle_id=eq.' + id
					},
					(payload) => {
						const m = payload.new as Msg;
						if (!this.messages.some((x) => x.id === m.id)) this.messages = [...this.messages, m];
					}
				)
				.subscribe();
		} catch {
			/* realtime optional; polling below still refreshes */
		}
	}

	// realtime can drop on flaky wifi, so a light poll keeps the room honest
	async refresh() {
		if (!this.room) return;
		const got = await supabase.from('battles').select(COLS).eq('id', this.room.id).maybeSingle();
		if (got.data) this.room = got.data as Room;
	}

	async submit(pack: Catch[], score: number) {
		if (!this.room || !this.role) return;
		await this.patch(
			this.role === 'host'
				? { host_pack: pack, host_score: score }
				: { guest_pack: pack, guest_score: score }
		);
	}

	// only the host settles the round, so the tally cannot be counted twice
	async settle() {
		if (!this.room || this.role !== 'host' || !this.ready) return;
		if (this.settledRound === this.room.round) return;
		this.settledRound = this.room.round;
		const h = this.room.host_score ?? 0;
		const g = this.room.guest_score ?? 0;
		if (h === g) return;
		await this.patch(
			h > g ? { host_wins: this.room.host_wins + 1 } : { guest_wins: this.room.guest_wins + 1 }
		);
	}

	async rematch() {
		if (!this.room) return;
		await this.patch({
			host_pack: null,
			host_score: null,
			guest_pack: null,
			guest_score: null,
			round: (this.room.round ?? 1) + 1
		});
	}

	link() {
		if (!this.room) return '';
		return `${window.location.origin}/battle?room=${this.room.id}`;
	}

	leave() {
		if (this.channel) {
			supabase.removeChannel(this.channel);
			this.channel = null;
		}
		this.room = null;
		this.role = null;
		this.messages = [];
	}
}

export const battle = new BattleStore();
