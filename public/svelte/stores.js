import { writable } from 'svelte/store';

export const isOwner = writable(false);
export const players = writable([]);