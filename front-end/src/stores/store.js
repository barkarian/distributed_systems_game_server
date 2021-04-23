import { writable } from 'svelte/store';

export const isAuthenticated = writable(false); //initialize state
export const user = writable({});
export const curGame = writable('');
export let moveDetails = writable('');
export let fen = writable('');
