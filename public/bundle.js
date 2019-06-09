
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function (exports) {
	'use strict';

	function noop() {}

	function add_location(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file, line, column, char }
		};
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	function run_all(fns) {
		fns.forEach(run);
	}

	function is_function(thing) {
		return typeof thing === 'function';
	}

	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
	}

	function validate_store(store, name) {
		if (!store || typeof store.subscribe !== 'function') {
			throw new Error(`'${name}' is not a store with a 'subscribe' method`);
		}
	}

	function subscribe(component, store, callback) {
		const unsub = store.subscribe(callback);

		component.$$.on_destroy.push(unsub.unsubscribe
			? () => unsub.unsubscribe()
			: unsub);
	}

	function append(target, node) {
		target.appendChild(node);
	}

	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	function detach(node) {
		node.parentNode.removeChild(node);
	}

	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
	}

	function element(name) {
		return document.createElement(name);
	}

	function svg_element(name) {
		return document.createElementNS('http://www.w3.org/2000/svg', name);
	}

	function text(data) {
		return document.createTextNode(data);
	}

	function space() {
		return text(' ');
	}

	function empty() {
		return text('');
	}

	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else node.setAttribute(attribute, value);
	}

	function children(element) {
		return Array.from(element.childNodes);
	}

	function set_data(text, data) {
		data = '' + data;
		if (text.data !== data) text.data = data;
	}

	function toggle_class(element, name, toggle) {
		element.classList[toggle ? 'add' : 'remove'](name);
	}

	let current_component;

	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error(`Function called outside component initialization`);
		return current_component;
	}

	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}

	function onDestroy(fn) {
		get_current_component().$$.on_destroy.push(fn);
	}

	const dirty_components = [];

	const resolved_promise = Promise.resolve();
	let update_scheduled = false;
	const binding_callbacks = [];
	const render_callbacks = [];
	const flush_callbacks = [];

	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	function flush() {
		const seen_callbacks = new Set();

		do {
			// first, call beforeUpdate functions
			// and update components
			while (dirty_components.length) {
				const component = dirty_components.shift();
				set_current_component(component);
				update(component.$$);
			}

			while (binding_callbacks.length) binding_callbacks.shift()();

			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			while (render_callbacks.length) {
				const callback = render_callbacks.pop();
				if (!seen_callbacks.has(callback)) {
					callback();

					// ...so guard against infinite loops
					seen_callbacks.add(callback);
				}
			}
		} while (dirty_components.length);

		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}

		update_scheduled = false;
	}

	function update($$) {
		if ($$.fragment) {
			$$.update($$.dirty);
			run_all($$.before_render);
			$$.fragment.p($$.dirty, $$.ctx);
			$$.dirty = null;

			$$.after_render.forEach(add_render_callback);
		}
	}

	let outros;

	function group_outros() {
		outros = {
			remaining: 0,
			callbacks: []
		};
	}

	function check_outros() {
		if (!outros.remaining) {
			run_all(outros.callbacks);
		}
	}

	function on_outro(callback) {
		outros.callbacks.push(callback);
	}

	function mount_component(component, target, anchor) {
		const { fragment, on_mount, on_destroy, after_render } = component.$$;

		fragment.m(target, anchor);

		// onMount happens after the initial afterUpdate. Because
		// afterUpdate callbacks happen in reverse order (inner first)
		// we schedule onMount callbacks before afterUpdate callbacks
		add_render_callback(() => {
			const new_on_destroy = on_mount.map(run).filter(is_function);
			if (on_destroy) {
				on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});

		after_render.forEach(add_render_callback);
	}

	function destroy(component, detaching) {
		if (component.$$) {
			run_all(component.$$.on_destroy);
			component.$$.fragment.d(detaching);

			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			component.$$.on_destroy = component.$$.fragment = null;
			component.$$.ctx = {};
		}
	}

	function make_dirty(component, key) {
		if (!component.$$.dirty) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty = blank_object();
		}
		component.$$.dirty[key] = true;
	}

	function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
		const parent_component = current_component;
		set_current_component(component);

		const props = options.props || {};

		const $$ = component.$$ = {
			fragment: null,
			ctx: null,

			// state
			props: prop_names,
			update: noop,
			not_equal: not_equal$$1,
			bound: blank_object(),

			// lifecycle
			on_mount: [],
			on_destroy: [],
			before_render: [],
			after_render: [],
			context: new Map(parent_component ? parent_component.$$.context : []),

			// everything else
			callbacks: blank_object(),
			dirty: null
		};

		let ready = false;

		$$.ctx = instance
			? instance(component, props, (key, value) => {
				if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
					if ($$.bound[key]) $$.bound[key](value);
					if (ready) make_dirty(component, key);
				}
			})
			: props;

		$$.update();
		ready = true;
		run_all($$.before_render);
		$$.fragment = create_fragment($$.ctx);

		if (options.target) {
			if (options.hydrate) {
				$$.fragment.l(children(options.target));
			} else {
				$$.fragment.c();
			}

			if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
			mount_component(component, options.target, options.anchor);
			flush();
		}

		set_current_component(parent_component);
	}

	class SvelteComponent {
		$destroy() {
			destroy(this, true);
			this.$destroy = noop;
		}

		$on(type, callback) {
			const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
			callbacks.push(callback);

			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		$set() {
			// overridden by instance, if it has props
		}
	}

	class SvelteComponentDev extends SvelteComponent {
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error(`'target' is a required option`);
			}

			super();
		}

		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn(`Component was already destroyed`); // eslint-disable-line no-console
			};
		}
	}

	function noop$1() {}

	function safe_not_equal$1(a, b) {
		return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
	}
	/**
	 * Create a `Writable` store that allows both updating and reading by subscription.
	 * @param value initial value
	 * @param start start and stop notifications for subscriptions
	 */
	function writable(value, start = noop$1) {
	    let stop;
	    const subscribers = [];
	    function set(new_value) {
	        if (safe_not_equal$1(value, new_value)) {
	            value = new_value;
	            if (!stop) {
	                return; // not ready
	            }
	            subscribers.forEach((s) => s[1]());
	            subscribers.forEach((s) => s[0](value));
	        }
	    }
	    function update(fn) {
	        set(fn(value));
	    }
	    function subscribe$$1(run$$1, invalidate = noop$1) {
	        const subscriber = [run$$1, invalidate];
	        subscribers.push(subscriber);
	        if (subscribers.length === 1) {
	            stop = start(set) || noop$1;
	        }
	        run$$1(value);
	        return () => {
	            const index = subscribers.indexOf(subscriber);
	            if (index !== -1) {
	                subscribers.splice(index, 1);
	            }
	            if (subscribers.length === 0) {
	                stop();
	            }
	        };
	    }
	    return { set, update, subscribe: subscribe$$1 };
	}

	const state = writable({playing: false, indx: -1});
	const stations = writable([]);

	function onInterval(callback, milliseconds) {
		const interval = setInterval(callback, milliseconds);

		onDestroy(() => {
			clearInterval(interval);
		});
	}

	/* src/Player.svelte generated by Svelte v3.4.2 */

	const file = "src/Player.svelte";

	// (90:0) {#if $state.indx >= 0 && $state.playing }
	function create_if_block(ctx) {
		var audio, audio_src_value, dispose;

		return {
			c: function create() {
				audio = element("audio");
				audio.autoplay = true;
				audio.src = audio_src_value = ctx.$stations[ctx.$state.indx].url;
				add_location(audio, file, 90, 1, 2295);

				dispose = [
					listen(audio, "ended", onEnded),
					listen(audio, "error", ctx.onError)
				];
			},

			m: function mount(target, anchor) {
				insert(target, audio, anchor);
			},

			p: function update(changed, ctx) {
				if ((changed.$stations || changed.$state) && audio_src_value !== (audio_src_value = ctx.$stations[ctx.$state.indx].url)) {
					audio.src = audio_src_value;
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(audio);
				}

				run_all(dispose);
			}
		};
	}

	function create_fragment(ctx) {
		var if_block_anchor;

		var if_block = (ctx.$state.indx >= 0 && ctx.$state.playing) && create_if_block(ctx);

		return {
			c: function create() {
				if (if_block) if_block.c();
				if_block_anchor = empty();
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert(target, if_block_anchor, anchor);
			},

			p: function update(changed, ctx) {
				if (ctx.$state.indx >= 0 && ctx.$state.playing) {
					if (if_block) {
						if_block.p(changed, ctx);
					} else {
						if_block = create_if_block(ctx);
						if_block.c();
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (if_block) if_block.d(detaching);

				if (detaching) {
					detach(if_block_anchor);
				}
			}
		};
	}

	const stationsUrl = '/stations.json';

	const statusUrl = '/status-json.xsl';

	function onEnded() {
		state.set({playing: false, indx: -1});
	}

	function instance($$self, $$props, $$invalidate) {
		let $stations, $state;

		validate_store(stations, 'stations');
		subscribe($$self, stations, $$value => { $stations = $$value; $$invalidate('$stations', $stations); });
		validate_store(state, 'state');
		subscribe($$self, state, $$value => { $state = $$value; $$invalidate('$state', $state); });

		

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

		onMount(async () => { getStations(); });

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

		return { onError, $stations, $state };
	}

	class Player extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, []);
		}
	}

	/* src/Station.svelte generated by Svelte v3.4.2 */

	const file$1 = "src/Station.svelte";

	// (40:2) {:else}
	function create_else_block_1(ctx) {
		var svg, g, path0, path1;

		return {
			c: function create() {
				svg = svg_element("svg");
				g = svg_element("g");
				path0 = svg_element("path");
				path1 = svg_element("path");
				attr(path0, "fill", "none");
				attr(path0, "d", "M0 0h24v24H0z");
				add_location(path0, file$1, 43, 5, 974);
				attr(path1, "d", "M19.376 12.416L8.777 19.482A.5.5 0 0 1 8 19.066V4.934a.5.5 0 0 1 .777-.416l10.599 7.066a.5.5 0 0 1 0 .832z");
				add_location(path1, file$1, 44, 5, 1017);
				add_location(g, file$1, 42, 4, 965);
				attr(svg, "xmlns", "http://www.w3.org/2000/svg");
				attr(svg, "viewBox", "0 0 24 24");
				attr(svg, "class", "svelte-1in8u09");
				add_location(svg, file$1, 41, 3, 900);
			},

			m: function mount(target, anchor) {
				insert(target, svg, anchor);
				append(svg, g);
				append(g, path0);
				append(g, path1);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(svg);
				}
			}
		};
	}

	// (32:2) {#if $state.indx === indx && $state.playing}
	function create_if_block_2(ctx) {
		var svg, g, path0, path1;

		return {
			c: function create() {
				svg = svg_element("svg");
				g = svg_element("g");
				path0 = svg_element("path");
				path1 = svg_element("path");
				attr(path0, "fill", "none");
				attr(path0, "d", "M0 0h24v24H0z");
				add_location(path0, file$1, 35, 11, 747);
				attr(path1, "d", "M6 5h2v14H6V5zm10 0h2v14h-2V5z");
				add_location(path1, file$1, 36, 11, 796);
				add_location(g, file$1, 34, 4, 732);
				attr(svg, "xmlns", "http://www.w3.org/2000/svg");
				attr(svg, "viewBox", "0 0 24 24");
				attr(svg, "class", "svelte-1in8u09");
				add_location(svg, file$1, 33, 3, 667);
			},

			m: function mount(target, anchor) {
				insert(target, svg, anchor);
				append(svg, g);
				append(g, path0);
				append(g, path1);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(svg);
				}
			}
		};
	}

	// (54:2) {#if station.listeners && station.listeners > 0 }
	function create_if_block$1(ctx) {
		var span, t0, t1_value = ctx.station.listeners, t1;

		function select_block_type_1(ctx) {
			if (ctx.station.listeners === 1) return create_if_block_1;
			return create_else_block;
		}

		var current_block_type = select_block_type_1(ctx);
		var if_block = current_block_type(ctx);

		return {
			c: function create() {
				span = element("span");
				if_block.c();
				t0 = space();
				t1 = text(t1_value);
				span.className = "stats svelte-1in8u09";
				add_location(span, file$1, 54, 3, 1315);
			},

			m: function mount(target, anchor) {
				insert(target, span, anchor);
				if_block.m(span, null);
				append(span, t0);
				append(span, t1);
			},

			p: function update(changed, ctx) {
				if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
					if_block.d(1);
					if_block = current_block_type(ctx);
					if (if_block) {
						if_block.c();
						if_block.m(span, t0);
					}
				}

				if ((changed.station) && t1_value !== (t1_value = ctx.station.listeners)) {
					set_data(t1, t1_value);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(span);
				}

				if_block.d();
			}
		};
	}

	// (64:3) {:else}
	function create_else_block(ctx) {
		var svg, g, path0, path1;

		return {
			c: function create() {
				svg = svg_element("svg");
				g = svg_element("g");
				path0 = svg_element("path");
				path1 = svg_element("path");
				attr(path0, "fill", "none");
				attr(path0, "d", "M0 0h24v24H0z");
				add_location(path0, file$1, 67, 6, 1841);
				attr(path1, "d", "M2 22a8 8 0 1 1 16 0h-2a6 6 0 1 0-12 0H2zm8-9c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6zm0-2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm8.284 3.703A8.002 8.002 0 0 1 23 22h-2a6.001 6.001 0 0 0-3.537-5.473l.82-1.824zm-.688-11.29A5.5 5.5 0 0 1 21 8.5a5.499 5.499 0 0 1-5 5.478v-2.013a3.5 3.5 0 0 0 1.041-6.609l.555-1.943z");
				add_location(path1, file$1, 68, 6, 1885);
				add_location(g, file$1, 66, 5, 1831);
				attr(svg, "xmlns", "http://www.w3.org/2000/svg");
				attr(svg, "viewBox", "0 0 24 24");
				attr(svg, "class", "svelte-1in8u09");
				add_location(svg, file$1, 65, 4, 1765);
			},

			m: function mount(target, anchor) {
				insert(target, svg, anchor);
				append(svg, g);
				append(g, path0);
				append(g, path1);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(svg);
				}
			}
		};
	}

	// (56:3) {#if station.listeners === 1}
	function create_if_block_1(ctx) {
		var svg, g, path0, path1;

		return {
			c: function create() {
				svg = svg_element("svg");
				g = svg_element("g");
				path0 = svg_element("path");
				path1 = svg_element("path");
				attr(path0, "fill", "none");
				attr(path0, "d", "M0 0h24v24H0z");
				add_location(path0, file$1, 59, 6, 1480);
				attr(path1, "d", "M4 22a8 8 0 1 1 16 0h-2a6 6 0 1 0-12 0H4zm8-9c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6zm0-2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z");
				add_location(path1, file$1, 60, 6, 1524);
				add_location(g, file$1, 58, 5, 1470);
				attr(svg, "xmlns", "http://www.w3.org/2000/svg");
				attr(svg, "viewBox", "0 0 24 24");
				attr(svg, "class", "svelte-1in8u09");
				add_location(svg, file$1, 57, 4, 1404);
			},

			m: function mount(target, anchor) {
				insert(target, svg, anchor);
				append(svg, g);
				append(g, path0);
				append(g, path1);
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(svg);
				}
			}
		};
	}

	function create_fragment$1(ctx) {
		var button, span, t0, t1_value = ctx.station.title, t1, t2, button_disabled_value, dispose;

		function select_block_type(ctx) {
			if (ctx.$state.indx === ctx.indx && ctx.$state.playing) return create_if_block_2;
			return create_else_block_1;
		}

		var current_block_type = select_block_type(ctx);
		var if_block0 = current_block_type(ctx);

		var if_block1 = (ctx.station.listeners && ctx.station.listeners > 0) && create_if_block$1(ctx);

		return {
			c: function create() {
				button = element("button");
				span = element("span");
				if_block0.c();
				t0 = space();
				t1 = text(t1_value);
				t2 = space();
				if (if_block1) if_block1.c();
				span.className = "control svelte-1in8u09";
				add_location(span, file$1, 30, 2, 570);
				button.disabled = button_disabled_value = ctx.station.disabled;
				button.className = "svelte-1in8u09";
				toggle_class(button, "active", ctx.$state.indx === ctx.indx);
				toggle_class(button, "playing", ctx.$state.indx === ctx.indx && ctx.$state.playing);
				add_location(button, file$1, 24, 0, 402);
				dispose = listen(button, "click", ctx.click_handler);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, button, anchor);
				append(button, span);
				if_block0.m(span, null);
				append(button, t0);
				append(button, t1);
				append(button, t2);
				if (if_block1) if_block1.m(button, null);
			},

			p: function update(changed, ctx) {
				if (current_block_type !== (current_block_type = select_block_type(ctx))) {
					if_block0.d(1);
					if_block0 = current_block_type(ctx);
					if (if_block0) {
						if_block0.c();
						if_block0.m(span, null);
					}
				}

				if ((changed.station) && t1_value !== (t1_value = ctx.station.title)) {
					set_data(t1, t1_value);
				}

				if (ctx.station.listeners && ctx.station.listeners > 0) {
					if (if_block1) {
						if_block1.p(changed, ctx);
					} else {
						if_block1 = create_if_block$1(ctx);
						if_block1.c();
						if_block1.m(button, null);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if ((changed.station) && button_disabled_value !== (button_disabled_value = ctx.station.disabled)) {
					button.disabled = button_disabled_value;
				}

				if ((changed.$state || changed.indx)) {
					toggle_class(button, "active", ctx.$state.indx === ctx.indx);
					toggle_class(button, "playing", ctx.$state.indx === ctx.indx && ctx.$state.playing);
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(button);
				}

				if_block0.d();
				if (if_block1) if_block1.d();
				dispose();
			}
		};
	}

	function instance$1($$self, $$props, $$invalidate) {
		let $state;

		validate_store(state, 'state');
		subscribe($$self, state, $$value => { $state = $$value; $$invalidate('$state', $state); });

		let { indx, station } = $$props;

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

		function click_handler() {
			return play(indx);
		}

		$$self.$set = $$props => {
			if ('indx' in $$props) $$invalidate('indx', indx = $$props.indx);
			if ('station' in $$props) $$invalidate('station', station = $$props.station);
		};

		return {
			indx,
			station,
			play,
			$state,
			click_handler
		};
	}

	class Station extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$1, safe_not_equal, ["indx", "station"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.indx === undefined && !('indx' in props)) {
				console.warn("<Station> was created without expected prop 'indx'");
			}
			if (ctx.station === undefined && !('station' in props)) {
				console.warn("<Station> was created without expected prop 'station'");
			}
		}

		get indx() {
			throw new Error("<Station>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set indx(value) {
			throw new Error("<Station>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get station() {
			throw new Error("<Station>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set station(value) {
			throw new Error("<Station>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/App.svelte generated by Svelte v3.4.2 */

	const file$2 = "src/App.svelte";

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.station = list[i];
		child_ctx.indx = i;
		return child_ctx;
	}

	// (27:0) {#if $stations.length > 0}
	function create_if_block$2(ctx) {
		var div, current;

		var each_value = ctx.$stations;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		function outro_block(i, detaching, local) {
			if (each_blocks[i]) {
				if (detaching) {
					on_outro(() => {
						each_blocks[i].d(detaching);
						each_blocks[i] = null;
					});
				}

				each_blocks[i].o(local);
			}
		}

		return {
			c: function create() {
				div = element("div");

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}
				div.id = "stations";
				div.className = "svelte-cllps7";
				add_location(div, file$2, 27, 0, 752);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);

				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(div, null);
				}

				current = true;
			},

			p: function update(changed, ctx) {
				if (changed.$stations) {
					each_value = ctx.$stations;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
							each_blocks[i].i(1);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							each_blocks[i].i(1);
							each_blocks[i].m(div, null);
						}
					}

					group_outros();
					for (; i < each_blocks.length; i += 1) outro_block(i, 1, 1);
					check_outros();
				}
			},

			i: function intro(local) {
				if (current) return;
				for (var i = 0; i < each_value.length; i += 1) each_blocks[i].i();

				current = true;
			},

			o: function outro(local) {
				each_blocks = each_blocks.filter(Boolean);
				for (let i = 0; i < each_blocks.length; i += 1) outro_block(i, 0);

				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}

				destroy_each(each_blocks, detaching);
			}
		};
	}

	// (29:1) {#each $stations as station, indx}
	function create_each_block(ctx) {
		var current;

		var station = new Station({
			props: { indx: ctx.indx, station: ctx.station },
			$$inline: true
		});

		return {
			c: function create() {
				station.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(station, target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var station_changes = {};
				if (changed.$stations) station_changes.station = ctx.station;
				station.$set(station_changes);
			},

			i: function intro(local) {
				if (current) return;
				station.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				station.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				station.$destroy(detaching);
			}
		};
	}

	function create_fragment$2(ctx) {
		var t, if_block_anchor, current;

		var player = new Player({ $$inline: true });

		var if_block = (ctx.$stations.length > 0) && create_if_block$2(ctx);

		return {
			c: function create() {
				player.$$.fragment.c();
				t = space();
				if (if_block) if_block.c();
				if_block_anchor = empty();
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				mount_component(player, target, anchor);
				insert(target, t, anchor);
				if (if_block) if_block.m(target, anchor);
				insert(target, if_block_anchor, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if (ctx.$stations.length > 0) {
					if (if_block) {
						if_block.p(changed, ctx);
						if_block.i(1);
					} else {
						if_block = create_if_block$2(ctx);
						if_block.c();
						if_block.i(1);
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					group_outros();
					on_outro(() => {
						if_block.d(1);
						if_block = null;
					});

					if_block.o(1);
					check_outros();
				}
			},

			i: function intro(local) {
				if (current) return;
				player.$$.fragment.i(local);

				if (if_block) if_block.i();
				current = true;
			},

			o: function outro(local) {
				player.$$.fragment.o(local);
				if (if_block) if_block.o();
				current = false;
			},

			d: function destroy(detaching) {
				player.$destroy(detaching);

				if (detaching) {
					detach(t);
				}

				if (if_block) if_block.d(detaching);

				if (detaching) {
					detach(if_block_anchor);
				}
			}
		};
	}

	function instance$2($$self, $$props, $$invalidate) {
		let $state, $stations;

		validate_store(state, 'state');
		subscribe($$self, state, $$value => { $state = $$value; $$invalidate('$state', $state); });
		validate_store(stations, 'stations');
		subscribe($$self, stations, $$value => { $stations = $$value; $$invalidate('$stations', $stations); });

		

		const title = document.title;

		$$self.$$.update = ($$dirty = { $state: 1, $stations: 1 }) => {
			if ($$dirty.$state || $$dirty.$stations) { if ($state.playing) {
					document.title = $stations[$state.indx].title + " :: " + title;
					document.getElementById('title').innerText = title + " '" + $stations[$state.indx].title + "'";
				} else {
					document.title = title;
					document.getElementById('title').innerText = title;
				} }
			if ($$dirty.$stations) { if ($stations.length) {
					document.getElementById('preload').style = 'display:none';
					document.getElementsByTagName('header')[0].style = 'display:block';
				} }
		};

		return { $stations };
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
		}
	}

	const app = new App({
		target: document.body
	});

	exports.app = app;

	return exports;

}({}));
//# sourceMappingURL=bundle.js.map
