import type { Session } from '@supabase/supabase-js';
import { supabase, hasSupabase } from './supabase';
import { store } from './binderStore.svelte';
import type { Binder } from './types';

const BUCKET = 'binder-images';

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
}

// Ties Supabase (anonymous auth + persistence + storage + realtime + snapshots) to the local store.
class Cloud {
	enabled = hasSupabase;
	session = $state<Session | null>(null);
	ready = $state(false);
	status = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	sessions = $state<SessionRow[]>([]);

	private binderId: string | null = null;
	private started = false;
	private subscribed = false;
	private applying = false;
	private lastJson = '';
	private lastSavedAt = 0;
	private saveTimer: ReturnType<typeof setTimeout> | undefined;

	async init() {
		if (!this.enabled || this.started) {
			this.ready = true;
			return;
		}
		this.started = true;

		const { data } = await supabase.auth.getSession();
		this.session = data.session;
		if (!this.session) {
			// no email login: sign in anonymously (enable it in Supabase Auth > Providers)
			const anon = await supabase.auth.signInAnonymously();
			this.session = anon.data.session ?? null;
			if (anon.error) this.status = 'error';
		}
		supabase.auth.onAuthStateChange((_event, s) => {
			if (s) this.session = s;
		});

		if (this.session) await this.load();
		this.ready = true;
	}

	private async load() {
		const { data, error } = await supabase
			.from('binders')
			.select('id, data, updated_at')
			.order('updated_at', { ascending: false })
			.limit(1)
			.maybeSingle();

		if (error) {
			this.status = 'error';
			return;
		}

		if (data) {
			this.binderId = data.id;
			this.lastSavedAt = new Date(data.updated_at).getTime();
			if (data.data && (data.data as Binder).sides) this.applyRemote(data.data as Binder);
		} else {
			const ins = await supabase
				.from('binders')
				.insert({ name: store.binder.name, data: store.binder })
				.select('id, updated_at')
				.single();
			if (ins.data) {
				this.binderId = ins.data.id;
				this.lastSavedAt = new Date(ins.data.updated_at).getTime();
				this.lastJson = JSON.stringify(store.binder);
			}
		}
		this.subscribe();
		this.loadSessions();
	}

	private applyRemote(b: Binder) {
		this.applying = true;
		store.binder = b;
		store.ensureMinPages();
		if (store.index >= store.binder.sides.length) store.index = 0;
		this.lastJson = JSON.stringify(store.binder);
		this.applying = false;
	}

	private subscribe() {
		if (this.subscribed || !this.binderId) return;
		this.subscribed = true;
		try {
			supabase
				.channel('binder-' + this.binderId)
				.on(
					'postgres_changes',
					{ event: 'UPDATE', schema: 'public', table: 'binders', filter: 'id=eq.' + this.binderId },
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
		if (!this.enabled || !this.session || this.applying || !this.binderId) return;
		this.status = 'saving';
		clearTimeout(this.saveTimer);
		this.saveTimer = setTimeout(() => this.save(), 700);
	}

	private async save() {
		if (!this.binderId) return;
		const json = JSON.stringify(store.binder);
		if (json === this.lastJson) {
			this.status = 'saved';
			return;
		}
		const { data, error } = await supabase
			.from('binders')
			.update({ name: store.binder.name, data: store.binder, updated_at: new Date().toISOString() })
			.eq('id', this.binderId)
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

	// ----- session snapshots (manual save points) -----

	async loadSessions() {
		if (!this.enabled) return;
		const { data } = await supabase
			.from('binder_sessions')
			.select('id, name, created_at')
			.order('created_at', { ascending: false });
		this.sessions = data ?? [];
	}

	async saveSession(name: string) {
		if (!this.enabled) return;
		await supabase
			.from('binder_sessions')
			.insert({ name: name.trim() || 'Sesia', data: store.binder });
		await this.loadSessions();
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
			// deliberately keep lastJson stale so autosave pushes the restored state to the live binder
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
