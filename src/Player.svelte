<script>
	import { onMount } from 'svelte';
	import { state, stations } from './player.js';
	import { onInterval } from './utils.js';

	// откуда будем брать данные о радиостанциях
	const stationsUrl = '/stations.json';
	// и количестве слушателей
	const statusUrl = '/status-json.xsl';

	// получаем данные о радиостанциях
	async function getStations() {
		const resource = await fetch(stationsUrl + "?" + Date.now());
		const response = await resource.json();

		if (resource.ok) {
			response.sort(function(a, b) {
				return a.title.localeCompare(b.title);
			});
			stations.update(v => response);

			// идём за количеством слушателей
			getListeners();
		}
	}

	// icecast умеет отдавать статистику в json
	// получаем данные о количестве слушающих
	async function getListeners() {
		const resource = await fetch(statusUrl + "?" + Date.now());
		const response = await resource.json();

		if (resource.ok) {
			const st = $stations;
			// проходимся по всем source-ам
			response.icestats.source.forEach(source => {
				const listeners = source.listeners;
				const url = "/" + source.listenurl.split("/")[3];

				// теперь по всем нашим радиостанциям
				for(let i = 0; i < st.length; i++)
				{
					// если если нашли нужную радиостанцию
					if (st[i].url == url) {
						st[i].listeners = listeners;
						break;
					}
				}	
			});

			// обновим информацию
			stations.update(v => st);
		}
	}

	// раз в минуты будем обновлять данные о слушателях
	onInterval(() => getListeners(), 1000*60);

	onMount(async () => { getStations(); })

	function onError() {
		// отключим радиостанцию, если она недоступна в данный момент
		const st = $stations;
		st[$state.indx].disabled = true;
		stations.update(v => st);

		const indx = $state.indx;

		// через минуту верн>м радиостанцию в строй
		setTimeout(() => {
			st[indx].disabled = false;
			stations.update(v => st);
		}, 1000*60);

		// сбрасываем состояние плеера
		state.set({playing: false, indx: -1});
	}

	// заглушна, на случай если поток закончился
	function onEnded() {
		state.set({playing: false, indx: -1});
	}
</script>

<!--
	самопальный плеер - обычный audio тег, без controls
	если ничего не играет,
	то audio элемента нет на странице и проигрывание потока прекращается
-->
{#if $state.indx >= 0 && $state.playing }
	<audio
		autoplay
		on:ended={onEnded}
		on:error={onError}
		src={$stations[$state.indx].url}/>
{/if}