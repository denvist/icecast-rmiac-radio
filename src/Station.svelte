<script>
	export let indx;
	export let station;

	import { state } from './player.js';

	function play(indx) {
		const st = $state;

		if ($state.indx == indx) {
			// Если нажимаем на туже станцию
			// то делаем простой toogle
			st.playing = !st.playing;
			// st.indx = -1;
		} else {
			// Иначе начинаем играть
			st.indx = indx;
			st.playing = true;
		}

		state.update(v => st);
	}
</script>

<button
	disabled={station.disabled}
	on:click={() => play(indx)}
	class:active="{$state.indx === indx}"
	class:playing="{$state.indx === indx && $state.playing}"
	>
		<span class="control">
		{#if $state.indx === indx && $state.playing}
		<!-- икнока пауза -->
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
				<g>
        			<path fill="none" d="M0 0h24v24H0z"/>
        			<path d="M6 5h2v14H6V5zm10 0h2v14h-2V5z"/>
    			</g>
			</svg>
		{:else}
			<!-- иконка играть -->
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
				<g>
					<path fill="none" d="M0 0h24v24H0z"/>
					<path d="M19.376 12.416L8.777 19.482A.5.5 0 0 1 8 19.066V4.934a.5.5 0 0 1 .777-.416l10.599 7.066a.5.5 0 0 1 0 .832z"/>
				</g>
			</svg>
		{/if}
		</span>
		<!-- название радиостанции -->
		{ station.title }

		<!-- количество слушателей -->
		{#if station.listeners && station.listeners > 0 }
			<span class="stats">
			{#if station.listeners === 1}
				<!-- иконка человечика -->
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
					<g>
						<path fill="none" d="M0 0h24v24H0z"/>
						<path d="M4 22a8 8 0 1 1 16 0h-2a6 6 0 1 0-12 0H4zm8-9c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6zm0-2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/>
					</g>
				</svg>
			{:else}
				<!-- иконка человечиков -->
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
					<g>
						<path fill="none" d="M0 0h24v24H0z"/>
						<path d="M2 22a8 8 0 1 1 16 0h-2a6 6 0 1 0-12 0H2zm8-9c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6zm0-2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm8.284 3.703A8.002 8.002 0 0 1 23 22h-2a6.001 6.001 0 0 0-3.537-5.473l.82-1.824zm-.688-11.29A5.5 5.5 0 0 1 21 8.5a5.499 5.499 0 0 1-5 5.478v-2.013a3.5 3.5 0 0 0 1.041-6.609l.555-1.943z"/>
					</g>
				</svg>
			{/if} { station.listeners }
			</span>
		{/if}
	</button>

<style>
	button {
		text-align: left;
		text-transform: capitalize;
		background-color: transparent;
		margin: .2rem;
		padding: .8rem;
		border: 1px dashed #eee;
		cursor: pointer;
	}

	button span {
		opacity: .4;
		font-size: smaller;
	}

	button span.control {
		fill: none;
	}

	button.active span.control,
	button:hover span.control {
		fill: inherit;
	}

	button > span.stats {
		float: right;
	}
	button svg {
		vertical-align: middle;
		margin-bottom: 0.2em;
		height: 1em;
	}

	button:disabled {
		color: lightgrey;
		fill: lightgrey;
	}

	button.active,
	button:hover {
		border: 1px solid grey;
	}

	button.playing {
		animation: animate 28s linear infinite;
	}

	@keyframes animate {
		0%{
			color: #FF0000;
			border-color: #FF0000;
			fill: #FF0000;
		}
		14% {
			color: #FF7F00;
			border-color: #FF7F00;
			fill: #FF7F00;
		}
		28% {
			color: #FFFF00;
			border-color: #FFFF00;
			fill: #FFFF00;
		}
		42% {
			color: #00FF00;
			border-color: #00FF00;
			fill: #00FF00;
		}
		56% {
			color: #0000FF;
			border-color: #0000FF;
			fill: #0000FF;
		}
		70% {
			color: #4B0082;
			border-color: #4B0082;
			fill: #4B0082;
		}
		84% {
			color: #8B00FF;
			border-color: #8B00FF;
			fill: #8B00FF;
		}
		100% {
			color: #FF0000;
			border-color: #FF0000;
			fill: #FF0000;
		}
	}
</style>