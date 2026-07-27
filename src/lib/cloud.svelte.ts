import type { RealtimeChannel, Session } from '@supabase/supabase-js';
import { supabase, hasSupabase } from './supabase';
import { store, makeEmptyBinder } from './binderStore.svelte';
import type { Binder } from './types';

const BUCKET = 'binder-images';
const LS_PROFILE = 'pb_profile';
const LS_KNOWN = 'pb_binders';
const LS_CURRENT = 'pb_current';

function lsGet(k: string): string | null {
	try {
		return localStorage.getItem(k);
	} catch {
		return null;
	}
}
function lsSet(k: string, v: string) {
	try {
		localStorage.setItem(k, v);
	} catch {
		/* ignore */
	}
}

function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve) => {
		const r = new FileReader();
		r.onload = () => resolve(String(r.result));
		r.readAsDataURL(file);
	});
}

interface SessionRow {
	id: string;
	name: string;
	created_at: string;
	profile_name: string | null;
}
interface BinderRow {
	id: string;
	name: string;
	updated_at: string;
}

// Ties Supabase (anonymous auth + profiles + multiple binders + sharing + snapshots) to the store.
class Cloud {
	enabled = hasSupabase;
	session = $state<Session | null>(null);
	ready = $state(false);
	status = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	sessions = $state<SessionRow[]>([]);
	binders = $state<BinderRow[]>([]);
	profileName = $state('');
	needsProfile = $state(false);
	currentId = $state<string | null>(null);

	private started = false;
	private applying = false;
	private lastJson = '';
	private lastSavedAt = 0;
	private saveTimer: ReturnType<typeof setTimeout> | undefined;
	private channel: RealtimeChannel | null = null;
	private known: string[] = [];

	async init() {
		if (!this.enabled || this.started) {
			this.ready = true;
			return;
		}
		this.started = true;

		this.profileName = lsGet(LS_PROFILE) ?? '';
		this.needsProfile = !this.profileName;
		try {
			this.known = JSON.parse(lsGet(LS_KNOWN) ?? '[]');
		} catch {
			this.known = [];
		}

		const { data } = await supabase.auth.getSession();
		this.session = data.session;
		if (!this.session) {
			const anon = await supabase.auth.signInAnonymously();
			this.session = anon.data.session ?? null;
			if (anon.error) this.status = 'error';
		}
		supabase.auth.onAuthStateChange((_event, s) => {
			if (s) this.session = s;
		});

		if (this.session) await this.bootstrapBinder();
		this.ready = true;
	}

	private persistKnown() {
		lsSet(LS_KNOWN, JSON.stringify(this.known));
	}
	private addKnown(id: string) {
		if (!this.known.includes(id)) {
			this.known.push(id);
			this.persistKnown();
		}
	}

	// decide which binder to open on start: shared link -> last used -> known -> adopt/create
	private async bootstrapBinder() {
		const params = new URLSearchParams(window.location.search);
		const linked = params.get('binder');
		let target: string | null = null;

		if (linked) {
			this.addKnown(linked);
			target = linked;
			history.replaceState(null, '', window.location.pathname);
		}
		if (!target) {
			const last = lsGet(LS_CURRENT);
			if (last && this.known.includes(last)) target = last;
		}
		if (!target && this.known.length) target = this.known[0];

		if (target) {
			await this.switchBinder(target);
		} else {
			// adopt an existing binder (old single-binder setup) or create a fresh one
			const { data } = await supabase
				.from('binders')
				.select('id')
				.order('updated_at', { ascending: false })
				.limit(1)
				.maybeSingle();
			if (data) {
				this.addKnown(data.id);
				await this.switchBinder(data.id);
			} else {
				await this.createBinder('Môj binder');
			}
		}
		await this.refreshBinders();
	}

	async switchBinder(id: string) {
		const { data, error } = await supabase
			.from('binders')
			.select('id, data, updated_at')
			.eq('id', id)
			.maybeSingle();
		if (error || !data) {
			this.status = 'error';
			return;
		}
		this.currentId = id;
		lsSet(LS_CURRENT, id);
		this.addKnown(id);
		this.lastSavedAt = new Date(data.updated_at).getTime();
		if (data.data && (data.data as Binder).sides) this.applyRemote(data.data as Binder);
		this.subscribe(id);
		await this.loadSessions();
		await this.refreshBinders();
	}

	async createBinder(name: string) {
		const b = makeEmptyBinder(name || 'Nový binder');
		const ins = await supabase
			.from('binders')
			.insert({ name: b.name, data: b, profile_name: this.profileName || null })
			.select('id, updated_at')
			.single();
		if (ins.error || !ins.data) {
			this.status = 'error';
			return;
		}
		this.currentId = ins.data.id;
		lsSet(LS_CURRENT, ins.data.id);
		this.addKnown(ins.data.id);
		this.applying = true;
		store.binder = b;
		store.ensureMinPages();
		store.index = 0;
		this.lastJson = JSON.stringify($state.snapshot(store.binder));
		this.lastSavedAt = new Date(ins.data.updated_at).getTime();
		this.applying = false;
		this.subscribe(ins.data.id);
		await this.loadSessions();
		await this.refreshBinders();
	}

	async refreshBinders() {
		if (!this.known.length) {
			this.binders = [];
			return;
		}
		const { data } = await supabase
			.from('binders')
			.select('id, name, updated_at')
			.in('id', this.known)
			.order('updated_at', { ascending: false });
		this.binders = data ?? [];
	}

	setProfile(name: string) {
		this.profileName = name.trim();
		lsSet(LS_PROFILE, this.profileName);
		this.needsProfile = !this.profileName;
	}

	shareLink(): string {
		return `${window.location.origin}/?binder=${this.currentId ?? ''}`;
	}

	private applyRemote(b: Binder) {
		this.applying = true;
		store.binder = b;
		store.ensureMinPages();
		if (store.index >= store.binder.sides.length) store.index = 0;
		this.lastJson = JSON.stringify($state.snapshot(store.binder));
		this.applying = false;
	}

	private subscribe(id: string) {
		if (this.channel) {
			supabase.removeChannel(this.channel);
			this.channel = null;
		}
		try {
			this.channel = supabase
				.channel('binder-' + id)
				.on(
					'postgres_changes',
					{ event: 'UPDATE', schema: 'public', table: 'binders', filter: 'id=eq.' + id },
					(payload) => {
						const row = payload.new as { data: Binder; updated_at: string };
						const at = new Date(row.updated_at).getTime();
						if (at <= this.lastSavedAt) return;
						this.lastSavedAt = at;
						if (row.data && row.data.sides) this.applyRemote(row.data);
					}
				)
				.subscribe();
		} catch {
			// realtime optional
		}
	}

	scheduleSave() {
		if (!this.enabled || !this.session || this.applying || !this.currentId) return;
		this.status = 'saving';
		clearTimeout(this.saveTimer);
		this.saveTimer = setTimeout(() => this.save(), 700);
	}

	private async save() {
		if (!this.currentId) return;
		const snap = $state.snapshot(store.binder);
		const json = JSON.stringify(snap);
		if (json === this.lastJson) {
			this.status = 'saved';
			return;
		}
		const { data, error } = await supabase
			.from('binders')
			.update({ name: store.binder.name, data: snap, updated_at: new Date().toISOString() })
			.eq('id', this.currentId)
			.select('updated_at')
			.single();
		if (error) {
			this.status = 'error';
			return;
		}
		this.lastJson = json;
		if (data) this.lastSavedAt = new Date(data.updated_at).getTime();
		this.status = 'saved';
	}

	// ----- session snapshots (per binder, labelled by profile) -----

	async loadSessions() {
		if (!this.enabled || !this.currentId) {
			this.sessions = [];
			return;
		}
		const { data } = await supabase
			.from('binder_sessions')
			.select('id, name, created_at, profile_name')
			.eq('binder_id', this.currentId)
			.order('created_at', { ascending: false });
		this.sessions = data ?? [];
	}

	async saveSession(name: string): Promise<string | null> {
		if (!this.enabled) return 'Cloud nie je nakonfigurovaný (.env).';
		if (!this.session) return 'Nepripojené: zapni Anonymous sign-ins v Supabase.';
		if (!this.currentId) return 'Žiadny aktívny binder.';
		const { error } = await supabase.from('binder_sessions').insert({
			name: name.trim() || 'Sesia',
			data: $state.snapshot(store.binder),
			binder_id: this.currentId,
			profile_name: this.profileName || null
		});
		if (error) return error.message;
		await this.loadSessions();
		return null;
	}

	async restoreSession(id: string) {
		if (!this.enabled) return;
		const { data } = await supabase.from('binder_sessions').select('data').eq('id', id).single();
		if (data && data.data && (data.data as Binder).sides) {
			this.applying = true;
			store.binder = data.data as Binder;
			store.ensureMinPages();
			if (store.index >= store.binder.sides.length) store.index = 0;
			this.applying = false;
			this.scheduleSave();
		}
	}

	async deleteSession(id: string) {
		if (!this.enabled) return;
		await supabase.from('binder_sessions').delete().eq('id', id);
		await this.loadSessions();
	}

	// ----- image upload -----

	async uploadImage(file: File): Promise<string> {
		if (!this.enabled || !this.session) return fileToDataUrl(file);
		const ext = (file.name.split('.').pop() || 'png').toLowerCase();
		const path = `${this.session.user.id}/${Date.now()}.${ext}`;
		const up = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
		if (up.error) return fileToDataUrl(file);
		return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
	}
}

export const cloud = new Cloud();
