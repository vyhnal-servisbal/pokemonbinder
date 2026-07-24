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

// Ties Supabase (auth + persistence + storage + realtime) to the local binder store.
class Cloud {
	enabled = hasSupabase;
	session = $state<Session | null>(null);
	ready = $state(false); // auth has been checked
	status = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');

	private binderId: string | null = null;
	private started = false;
	private subscribed = false;
	private applying = false; // we're writing remote data into the store, don't echo-save
	private lastJson = ''; // last content we saved/loaded, to skip no-op saves
	private lastSavedAt = 0; // updated_at (ms) of our last write, to ignore realtime echo
	private saveTimer: ReturnType<typeof setTimeout> | undefined;

	async init() {
		if (!this.enabled || this.started) {
			this.ready = true;
			return;
		}
		this.started = true;
		const { data } = await supabase.auth.getSession();
		this.session = data.session;
		supabase.auth.onAuthStateChange((_event, s) => {
			this.session = s;
			if (s) this.load();
		});
		if (this.session) await this.load();
		this.ready = true;
	}

	async signIn(email: string) {
		return supabase.auth.signInWithOtp({
			email,
			options: { emailRedirectTo: window.location.origin }
		});
	}

	async signOut() {
		await supabase.auth.signOut();
		this.session = null;
	}

	private async load() {
		// single shared space: newest binder row
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
			// no row yet: create one from whatever is on screen now
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
	}

	private applyRemote(b: Binder) {
		this.applying = true;
		store.binder = b;
		if (store.index >= b.sides.length) store.index = 0;
		this.lastJson = JSON.stringify(b);
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
						if (at <= this.lastSavedAt) return; // our own write echoing back
						this.lastSavedAt = at;
						if (row.data && row.data.sides) this.applyRemote(row.data);
					}
				)
				.subscribe();
		} catch {
			// realtime is optional; save/load still work without it
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

	// upload to Storage and return a public URL; falls back to a data URL when offline/local
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
