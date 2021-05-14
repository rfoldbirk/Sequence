import { writable } from 'svelte/store';

export const me = writable('');
export const isOwner = writable(false);
export const players = writable([]);
export const selected_card = writable('');
export const show_hand = writable(true);
export const in_progress = writable(false);