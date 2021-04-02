import {writable} from "svelte/store"
export const isAuthenticated =writable(false); //initialize state
export const user =writable({});