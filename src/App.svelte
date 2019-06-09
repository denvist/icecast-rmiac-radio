<script>
	import Player from './Player.svelte';
	import Station from './Station.svelte';
	import { state, stations } from './player.js';

	const title = document.title;

	// обновляем title у документа
	// и у элемента с id=title
	$: if ($state.playing) {
		document.title = $stations[$state.indx].title + " :: " + title;
		document.getElementById('title').innerText = title + " '" + $stations[$state.indx].title + "'";
	} else {
		document.title = title;
		document.getElementById('title').innerText = title;
	}

	// Самодельный прелоадер
	$: if ($stations.length) {
		document.getElementById('preload').style = 'display:none';
		document.getElementsByTagName('header')[0].style = 'display:block';
	}
</script>

<Player />

{#if $stations.length > 0}
<div id="stations">
	{#each $stations as station, indx}
	<Station
		indx={indx}
		station={station}
	/>
	{/each}
</div>
{/if}

<style>
	div#stations {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
	}
</style>