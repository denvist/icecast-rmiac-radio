import { writable } from 'svelte/store';

export const state = writable({playing: false, indx: -1});
export const stations = writable([]);