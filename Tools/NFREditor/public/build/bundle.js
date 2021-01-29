
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function compute_rest_props(props, keys) {
        const rest = {};
        keys = new Set(keys);
        for (const k in props)
            if (!keys.has(k) && k[0] !== '$')
                rest[k] = props[k];
        return rest;
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
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
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
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function self$1(fn) {
        return function (event) {
            // @ts-ignore
            if (event.target === this)
                fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var strictUriEncode = str => encodeURIComponent(str).replace(/[!'()*]/g, x => `%${x.charCodeAt(0).toString(16).toUpperCase()}`);

    var token = '%[a-f0-9]{2}';
    var singleMatcher = new RegExp(token, 'gi');
    var multiMatcher = new RegExp('(' + token + ')+', 'gi');

    function decodeComponents(components, split) {
    	try {
    		// Try to decode the entire string first
    		return decodeURIComponent(components.join(''));
    	} catch (err) {
    		// Do nothing
    	}

    	if (components.length === 1) {
    		return components;
    	}

    	split = split || 1;

    	// Split the array in 2 parts
    	var left = components.slice(0, split);
    	var right = components.slice(split);

    	return Array.prototype.concat.call([], decodeComponents(left), decodeComponents(right));
    }

    function decode(input) {
    	try {
    		return decodeURIComponent(input);
    	} catch (err) {
    		var tokens = input.match(singleMatcher);

    		for (var i = 1; i < tokens.length; i++) {
    			input = decodeComponents(tokens, i).join('');

    			tokens = input.match(singleMatcher);
    		}

    		return input;
    	}
    }

    function customDecodeURIComponent(input) {
    	// Keep track of all the replacements and prefill the map with the `BOM`
    	var replaceMap = {
    		'%FE%FF': '\uFFFD\uFFFD',
    		'%FF%FE': '\uFFFD\uFFFD'
    	};

    	var match = multiMatcher.exec(input);
    	while (match) {
    		try {
    			// Decode as big chunks as possible
    			replaceMap[match[0]] = decodeURIComponent(match[0]);
    		} catch (err) {
    			var result = decode(match[0]);

    			if (result !== match[0]) {
    				replaceMap[match[0]] = result;
    			}
    		}

    		match = multiMatcher.exec(input);
    	}

    	// Add `%C2` at the end of the map to make sure it does not replace the combinator before everything else
    	replaceMap['%C2'] = '\uFFFD';

    	var entries = Object.keys(replaceMap);

    	for (var i = 0; i < entries.length; i++) {
    		// Replace all decoded components
    		var key = entries[i];
    		input = input.replace(new RegExp(key, 'g'), replaceMap[key]);
    	}

    	return input;
    }

    var decodeUriComponent = function (encodedURI) {
    	if (typeof encodedURI !== 'string') {
    		throw new TypeError('Expected `encodedURI` to be of type `string`, got `' + typeof encodedURI + '`');
    	}

    	try {
    		encodedURI = encodedURI.replace(/\+/g, ' ');

    		// Try the built in decoder first
    		return decodeURIComponent(encodedURI);
    	} catch (err) {
    		// Fallback to a more advanced decoder
    		return customDecodeURIComponent(encodedURI);
    	}
    };

    var splitOnFirst = (string, separator) => {
    	if (!(typeof string === 'string' && typeof separator === 'string')) {
    		throw new TypeError('Expected the arguments to be of type `string`');
    	}

    	if (separator === '') {
    		return [string];
    	}

    	const separatorIndex = string.indexOf(separator);

    	if (separatorIndex === -1) {
    		return [string];
    	}

    	return [
    		string.slice(0, separatorIndex),
    		string.slice(separatorIndex + separator.length)
    	];
    };

    var queryString = createCommonjsModule(function (module, exports) {




    const isNullOrUndefined = value => value === null || value === undefined;

    function encoderForArrayFormat(options) {
    	switch (options.arrayFormat) {
    		case 'index':
    			return key => (result, value) => {
    				const index = result.length;

    				if (
    					value === undefined ||
    					(options.skipNull && value === null) ||
    					(options.skipEmptyString && value === '')
    				) {
    					return result;
    				}

    				if (value === null) {
    					return [...result, [encode(key, options), '[', index, ']'].join('')];
    				}

    				return [
    					...result,
    					[encode(key, options), '[', encode(index, options), ']=', encode(value, options)].join('')
    				];
    			};

    		case 'bracket':
    			return key => (result, value) => {
    				if (
    					value === undefined ||
    					(options.skipNull && value === null) ||
    					(options.skipEmptyString && value === '')
    				) {
    					return result;
    				}

    				if (value === null) {
    					return [...result, [encode(key, options), '[]'].join('')];
    				}

    				return [...result, [encode(key, options), '[]=', encode(value, options)].join('')];
    			};

    		case 'comma':
    		case 'separator':
    			return key => (result, value) => {
    				if (value === null || value === undefined || value.length === 0) {
    					return result;
    				}

    				if (result.length === 0) {
    					return [[encode(key, options), '=', encode(value, options)].join('')];
    				}

    				return [[result, encode(value, options)].join(options.arrayFormatSeparator)];
    			};

    		default:
    			return key => (result, value) => {
    				if (
    					value === undefined ||
    					(options.skipNull && value === null) ||
    					(options.skipEmptyString && value === '')
    				) {
    					return result;
    				}

    				if (value === null) {
    					return [...result, encode(key, options)];
    				}

    				return [...result, [encode(key, options), '=', encode(value, options)].join('')];
    			};
    	}
    }

    function parserForArrayFormat(options) {
    	let result;

    	switch (options.arrayFormat) {
    		case 'index':
    			return (key, value, accumulator) => {
    				result = /\[(\d*)\]$/.exec(key);

    				key = key.replace(/\[\d*\]$/, '');

    				if (!result) {
    					accumulator[key] = value;
    					return;
    				}

    				if (accumulator[key] === undefined) {
    					accumulator[key] = {};
    				}

    				accumulator[key][result[1]] = value;
    			};

    		case 'bracket':
    			return (key, value, accumulator) => {
    				result = /(\[\])$/.exec(key);
    				key = key.replace(/\[\]$/, '');

    				if (!result) {
    					accumulator[key] = value;
    					return;
    				}

    				if (accumulator[key] === undefined) {
    					accumulator[key] = [value];
    					return;
    				}

    				accumulator[key] = [].concat(accumulator[key], value);
    			};

    		case 'comma':
    		case 'separator':
    			return (key, value, accumulator) => {
    				const isArray = typeof value === 'string' && value.includes(options.arrayFormatSeparator);
    				const isEncodedArray = (typeof value === 'string' && !isArray && decode(value, options).includes(options.arrayFormatSeparator));
    				value = isEncodedArray ? decode(value, options) : value;
    				const newValue = isArray || isEncodedArray ? value.split(options.arrayFormatSeparator).map(item => decode(item, options)) : value === null ? value : decode(value, options);
    				accumulator[key] = newValue;
    			};

    		default:
    			return (key, value, accumulator) => {
    				if (accumulator[key] === undefined) {
    					accumulator[key] = value;
    					return;
    				}

    				accumulator[key] = [].concat(accumulator[key], value);
    			};
    	}
    }

    function validateArrayFormatSeparator(value) {
    	if (typeof value !== 'string' || value.length !== 1) {
    		throw new TypeError('arrayFormatSeparator must be single character string');
    	}
    }

    function encode(value, options) {
    	if (options.encode) {
    		return options.strict ? strictUriEncode(value) : encodeURIComponent(value);
    	}

    	return value;
    }

    function decode(value, options) {
    	if (options.decode) {
    		return decodeUriComponent(value);
    	}

    	return value;
    }

    function keysSorter(input) {
    	if (Array.isArray(input)) {
    		return input.sort();
    	}

    	if (typeof input === 'object') {
    		return keysSorter(Object.keys(input))
    			.sort((a, b) => Number(a) - Number(b))
    			.map(key => input[key]);
    	}

    	return input;
    }

    function removeHash(input) {
    	const hashStart = input.indexOf('#');
    	if (hashStart !== -1) {
    		input = input.slice(0, hashStart);
    	}

    	return input;
    }

    function getHash(url) {
    	let hash = '';
    	const hashStart = url.indexOf('#');
    	if (hashStart !== -1) {
    		hash = url.slice(hashStart);
    	}

    	return hash;
    }

    function extract(input) {
    	input = removeHash(input);
    	const queryStart = input.indexOf('?');
    	if (queryStart === -1) {
    		return '';
    	}

    	return input.slice(queryStart + 1);
    }

    function parseValue(value, options) {
    	if (options.parseNumbers && !Number.isNaN(Number(value)) && (typeof value === 'string' && value.trim() !== '')) {
    		value = Number(value);
    	} else if (options.parseBooleans && value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
    		value = value.toLowerCase() === 'true';
    	}

    	return value;
    }

    function parse(query, options) {
    	options = Object.assign({
    		decode: true,
    		sort: true,
    		arrayFormat: 'none',
    		arrayFormatSeparator: ',',
    		parseNumbers: false,
    		parseBooleans: false
    	}, options);

    	validateArrayFormatSeparator(options.arrayFormatSeparator);

    	const formatter = parserForArrayFormat(options);

    	// Create an object with no prototype
    	const ret = Object.create(null);

    	if (typeof query !== 'string') {
    		return ret;
    	}

    	query = query.trim().replace(/^[?#&]/, '');

    	if (!query) {
    		return ret;
    	}

    	for (const param of query.split('&')) {
    		let [key, value] = splitOnFirst(options.decode ? param.replace(/\+/g, ' ') : param, '=');

    		// Missing `=` should be `null`:
    		// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
    		value = value === undefined ? null : ['comma', 'separator'].includes(options.arrayFormat) ? value : decode(value, options);
    		formatter(decode(key, options), value, ret);
    	}

    	for (const key of Object.keys(ret)) {
    		const value = ret[key];
    		if (typeof value === 'object' && value !== null) {
    			for (const k of Object.keys(value)) {
    				value[k] = parseValue(value[k], options);
    			}
    		} else {
    			ret[key] = parseValue(value, options);
    		}
    	}

    	if (options.sort === false) {
    		return ret;
    	}

    	return (options.sort === true ? Object.keys(ret).sort() : Object.keys(ret).sort(options.sort)).reduce((result, key) => {
    		const value = ret[key];
    		if (Boolean(value) && typeof value === 'object' && !Array.isArray(value)) {
    			// Sort object keys, not values
    			result[key] = keysSorter(value);
    		} else {
    			result[key] = value;
    		}

    		return result;
    	}, Object.create(null));
    }

    exports.extract = extract;
    exports.parse = parse;

    exports.stringify = (object, options) => {
    	if (!object) {
    		return '';
    	}

    	options = Object.assign({
    		encode: true,
    		strict: true,
    		arrayFormat: 'none',
    		arrayFormatSeparator: ','
    	}, options);

    	validateArrayFormatSeparator(options.arrayFormatSeparator);

    	const shouldFilter = key => (
    		(options.skipNull && isNullOrUndefined(object[key])) ||
    		(options.skipEmptyString && object[key] === '')
    	);

    	const formatter = encoderForArrayFormat(options);

    	const objectCopy = {};

    	for (const key of Object.keys(object)) {
    		if (!shouldFilter(key)) {
    			objectCopy[key] = object[key];
    		}
    	}

    	const keys = Object.keys(objectCopy);

    	if (options.sort !== false) {
    		keys.sort(options.sort);
    	}

    	return keys.map(key => {
    		const value = object[key];

    		if (value === undefined) {
    			return '';
    		}

    		if (value === null) {
    			return encode(key, options);
    		}

    		if (Array.isArray(value)) {
    			return value
    				.reduce(formatter(key), [])
    				.join('&');
    		}

    		return encode(key, options) + '=' + encode(value, options);
    	}).filter(x => x.length > 0).join('&');
    };

    exports.parseUrl = (url, options) => {
    	options = Object.assign({
    		decode: true
    	}, options);

    	const [url_, hash] = splitOnFirst(url, '#');

    	return Object.assign(
    		{
    			url: url_.split('?')[0] || '',
    			query: parse(extract(url), options)
    		},
    		options && options.parseFragmentIdentifier && hash ? {fragmentIdentifier: decode(hash, options)} : {}
    	);
    };

    exports.stringifyUrl = (object, options) => {
    	options = Object.assign({
    		encode: true,
    		strict: true
    	}, options);

    	const url = removeHash(object.url).split('?')[0] || '';
    	const queryFromUrl = exports.extract(object.url);
    	const parsedQueryFromUrl = exports.parse(queryFromUrl, {sort: false});

    	const query = Object.assign(parsedQueryFromUrl, object.query);
    	let queryString = exports.stringify(query, options);
    	if (queryString) {
    		queryString = `?${queryString}`;
    	}

    	let hash = getHash(object.url);
    	if (object.fragmentIdentifier) {
    		hash = `#${encode(object.fragmentIdentifier, options)}`;
    	}

    	return `${url}${queryString}${hash}`;
    };
    });

    /*!
     * cookie
     * Copyright(c) 2012-2014 Roman Shtylman
     * Copyright(c) 2015 Douglas Christopher Wilson
     * MIT Licensed
     */

    /**
     * Module exports.
     * @public
     */

    var parse_1 = parse;
    var serialize_1 = serialize;

    /**
     * Module variables.
     * @private
     */

    var decode$1 = decodeURIComponent;
    var encode = encodeURIComponent;
    var pairSplitRegExp = /; */;

    /**
     * RegExp to match field-content in RFC 7230 sec 3.2
     *
     * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
     * field-vchar   = VCHAR / obs-text
     * obs-text      = %x80-FF
     */

    var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

    /**
     * Parse a cookie header.
     *
     * Parse the given cookie header string into an object
     * The object has the various cookies as keys(names) => values
     *
     * @param {string} str
     * @param {object} [options]
     * @return {object}
     * @public
     */

    function parse(str, options) {
      if (typeof str !== 'string') {
        throw new TypeError('argument str must be a string');
      }

      var obj = {};
      var opt = options || {};
      var pairs = str.split(pairSplitRegExp);
      var dec = opt.decode || decode$1;

      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var eq_idx = pair.indexOf('=');

        // skip things that don't look like key=value
        if (eq_idx < 0) {
          continue;
        }

        var key = pair.substr(0, eq_idx).trim();
        var val = pair.substr(++eq_idx, pair.length).trim();

        // quoted values
        if ('"' == val[0]) {
          val = val.slice(1, -1);
        }

        // only assign once
        if (undefined == obj[key]) {
          obj[key] = tryDecode(val, dec);
        }
      }

      return obj;
    }

    /**
     * Serialize data into a cookie header.
     *
     * Serialize the a name value pair into a cookie string suitable for
     * http headers. An optional options object specified cookie parameters.
     *
     * serialize('foo', 'bar', { httpOnly: true })
     *   => "foo=bar; httpOnly"
     *
     * @param {string} name
     * @param {string} val
     * @param {object} [options]
     * @return {string}
     * @public
     */

    function serialize(name, val, options) {
      var opt = options || {};
      var enc = opt.encode || encode;

      if (typeof enc !== 'function') {
        throw new TypeError('option encode is invalid');
      }

      if (!fieldContentRegExp.test(name)) {
        throw new TypeError('argument name is invalid');
      }

      var value = enc(val);

      if (value && !fieldContentRegExp.test(value)) {
        throw new TypeError('argument val is invalid');
      }

      var str = name + '=' + value;

      if (null != opt.maxAge) {
        var maxAge = opt.maxAge - 0;

        if (isNaN(maxAge) || !isFinite(maxAge)) {
          throw new TypeError('option maxAge is invalid')
        }

        str += '; Max-Age=' + Math.floor(maxAge);
      }

      if (opt.domain) {
        if (!fieldContentRegExp.test(opt.domain)) {
          throw new TypeError('option domain is invalid');
        }

        str += '; Domain=' + opt.domain;
      }

      if (opt.path) {
        if (!fieldContentRegExp.test(opt.path)) {
          throw new TypeError('option path is invalid');
        }

        str += '; Path=' + opt.path;
      }

      if (opt.expires) {
        if (typeof opt.expires.toUTCString !== 'function') {
          throw new TypeError('option expires is invalid');
        }

        str += '; Expires=' + opt.expires.toUTCString();
      }

      if (opt.httpOnly) {
        str += '; HttpOnly';
      }

      if (opt.secure) {
        str += '; Secure';
      }

      if (opt.sameSite) {
        var sameSite = typeof opt.sameSite === 'string'
          ? opt.sameSite.toLowerCase() : opt.sameSite;

        switch (sameSite) {
          case true:
            str += '; SameSite=Strict';
            break;
          case 'lax':
            str += '; SameSite=Lax';
            break;
          case 'strict':
            str += '; SameSite=Strict';
            break;
          case 'none':
            str += '; SameSite=None';
            break;
          default:
            throw new TypeError('option sameSite is invalid');
        }
      }

      return str;
    }

    /**
     * Try decoding a string using a decoding function.
     *
     * @param {string} str
     * @param {function} decode
     * @private
     */

    function tryDecode(str, decode) {
      try {
        return decode(str);
      } catch (e) {
        return str;
      }
    }

    var cookie = {
    	parse: parse_1,
    	serialize: serialize_1
    };

    class Debug {
        static log(...data) {
            //if (Debug.enabled) {
            console.log(data);
            //}
        }
    }

    class SurveyQuestion {
        constructor() {
            this.question = "New question";
            this.howToMeasure = "How to measure";
            this.target = "Target";
            this.tags = [];
        }
        generateHTML() {
            return `
    <div class="surveyQuestion">
        <div class="text">${this.question}</div>
        <div class="measurement">${this.howToMeasure}</div>
        <div class="target">${this.target}</div>
    </div>`;
        }
    }

    class BestPracticeEntry {
        /**
         * Initialise a best practice entry from the HTML content
         */
        constructor(content = undefined) {
            if (!content) {
                this.descriptionHTML = "New best practice entry";
                this.titleHTML = "Best practice entry";
                this.tags = ["new"];
                this.surveyQuestions = [];
            }
            else {
                var el = BestPracticeEntry.getElementFromText(content);
                let col = el.getElementsByClassName("description");
                this.descriptionHTML = col[0] ? col[0].innerHTML : " ";
                Debug.log("Description: " + this.descriptionHTML);
                col = el.getElementsByClassName("title");
                this.titleHTML = col[0] ? col[0].innerHTML : " ";
                Debug.log("Title: " + this.titleHTML);
                this.tags = new Array();
                col = el.getElementsByClassName("tags");
                if (col[0]) {
                    let tagElement = col[0].getElementsByClassName("tag");
                    for (let i = 0; i < tagElement.length; ++i) {
                        this.tags.push(tagElement[i].innerHTML);
                    }
                }
                Debug.log("Tags: " + this.tags);
                this.surveyQuestions = new Array();
                col = el.getElementsByClassName("survey");
                if (col[0]) {
                    let questionElement = col[0].getElementsByClassName("surveyQuestion");
                    for (let i = 0; i < questionElement.length; ++i) {
                        let q = new SurveyQuestion();
                        let text = questionElement[i].getElementsByClassName("text");
                        q.question = text[0] ? text[0].innerHTML : " ";
                        let measurement = questionElement[i].getElementsByClassName("measurement");
                        q.howToMeasure = measurement[0] ? measurement[0].innerHTML : " ";
                        let target = questionElement[i].getElementsByClassName("target");
                        q.target = target[0] ? target[0].innerHTML : " ";
                        this.surveyQuestions.push(q);
                    }
                }
            }
        }
        /**
         * Returns an in-memory document element
         * Useful to parse HTML using DOM
         * @param content
         */
        static getElementFromText(content) {
            var el = document.createElement("html");
            el.innerHTML =
                "<html><head><title></title></head><body>" +
                    content +
                    "</body></html>";
            return el;
        }
        /**
         * Converts best practice entry to HTML
         */
        generateHTML() {
            return new Promise((resolve, reject) => {
                fetch("htmlTemplate.html")
                    .then((response) => response.text())
                    .then((text) => {
                    let el = BestPracticeEntry.getElementFromText(text);
                    el.getElementsByClassName("title")[0].innerHTML = this.titleHTML;
                    el.getElementsByClassName("description")[0].innerHTML = this.descriptionHTML;
                    let tagHTML = "";
                    this.tags.forEach((val, idx) => {
                        tagHTML += `<div class='tag'>${val}</div>`;
                    });
                    el.getElementsByClassName("tags")[0].innerHTML = tagHTML;
                    let surveyQuestionsHTML = "";
                    this.surveyQuestions.forEach((val, idx) => {
                        surveyQuestionsHTML += val.generateHTML();
                    });
                    el.getElementsByClassName("survey")[0].innerHTML = surveyQuestionsHTML;
                    let res = el.getElementsByTagName("body")[0].innerHTML;
                    Debug.log("Saved HTML: " + res);
                    resolve(res);
                });
            });
        }
    }

    const ROOT_FOLDER = "Best practices";
    class GitContents {
        parentPath() {
            let idx = this.path.lastIndexOf("/");
            if (idx > 0) {
                return this.path.substr(0, idx);
            }
            else {
                return null;
            }
        }
        depthLevel() {
            let matches = this.path.match(/\//g);
            return matches ? matches.length : 0;
        }
    }

    class GitFile {
    }

    class APIHelper {
        static getContent(path) {
            if (!APIHelper.token || !APIHelper.user || !APIHelper.repo) {
                console.error("Token, user and repo must be set");
            }
            return new Promise((resolve, reject) => {
                APIHelper.apiGET(`${APIHelper.user}/${APIHelper.repo}/contents/${path}`, APIHelper.token).then(content => {
                    let res = new GitContents();
                    res.path = path;
                    if (Array.isArray(content)) {
                        console.log("Read dir:" + path + ". Number of entries: " + content.length);
                        res.type = "dir";
                        res.dirList = content;
                    }
                    else {
                        console.log("Read file:" + path);
                        if (content.content) {
                            console.log("Content: " + atob(content.content));
                        }
                        res.type = "file";
                        res.file = content;
                    }
                    resolve(res);
                }).catch(reason => {
                    reject(reason);
                });
            });
        }
        static getFileContent(path) {
            if (!APIHelper.token || !APIHelper.user || !APIHelper.repo) {
                console.error("Token, user and repo must be set");
            }
            return new Promise((resolve, reject) => {
                APIHelper.apiGET(`${APIHelper.user}/${APIHelper.repo}/contents/${path}`, APIHelper.token).then(file => {
                    console.log("Read file:" + file.name);
                    if (file.content) {
                        console.log("Content: " + atob(file.content));
                    }
                    resolve(file);
                }).catch(reason => {
                    reject(reason);
                });
            });
        }
        static getDirContent(path) {
            if (!APIHelper.token || !APIHelper.user || !APIHelper.repo) {
                console.error("Token, user and repo must be set");
            }
            return new Promise((resolve, reject) => {
                APIHelper.apiGET(`${APIHelper.user}/${APIHelper.repo}/contents/${path}`, APIHelper.token).then(dir => {
                    console.log("Read dir:" + path + ". Content count: " + dir.length);
                    resolve(dir);
                }).catch(reason => {
                    reject(reason);
                });
            });
        }
        static writeFile(file) {
            if (!APIHelper.token || !APIHelper.user || !APIHelper.repo) {
                console.error("Token, user and repo must be set");
            }
            return new Promise((resolve, reject) => {
                APIHelper.apiPUT(APIHelper.user, APIHelper.repo, file.path, APIHelper.token, file).then(fu => {
                    let updatedFile = fu["content"];
                    console.log("Updated file SHA:" + updatedFile.sha);
                    resolve(updatedFile);
                }).catch(reason => {
                    console.log("Update fail reason:" + reason);
                    reject(reason);
                });
            });
        }
        static createNewFile(path) {
            if (!APIHelper.token || !APIHelper.user || !APIHelper.repo) {
                console.error("Token, user and repo must be set");
            }
            return new Promise((resolve, reject) => {
                let newBP = new BestPracticeEntry();
                newBP.generateHTML().then(content => {
                    let gitFile = new GitFile();
                    gitFile.content = content;
                    gitFile.sha = undefined;
                    APIHelper.apiPUT(APIHelper.user, APIHelper.repo, path, APIHelper.token, gitFile).then(fu => {
                        let updatedFile = fu["content"];
                        console.log("Updated file SHA:" + updatedFile.sha);
                        resolve(updatedFile);
                    }).catch(reason => {
                        console.log("Update fail reason:" + reason);
                        reject(reason);
                    });
                });
            });
        }
        static apiGET(endpoint, token) {
            return new Promise((resolve, reject) => {
                fetch(`https://api.github.com/repos/${endpoint}`, {
                    headers: token ? {
                        Authorization: `Bearer ${token}`
                    } : undefined
                }).then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    reject(response.status);
                }).then(data => {
                    resolve(data);
                }).catch(reason => {
                    reject(reason);
                });
            });
        }
        static apiPUT(user, repository, path, token, file) {
            let body = {
                content: btoa(file.content),
                message: `Updating ${path} at: ${new Date().toTimeString()}`,
                sha: file.sha,
                path: path
            };
            path = encodeURI(path);
            let endpoint = `${user}/${repository}/contents/${path}`;
            return new Promise((resolve, reject) => {
                fetch(`https://api.github.com/repos/${endpoint}`, {
                    headers: token ? {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    } : undefined,
                    method: "PUT",
                    body: JSON.stringify(body)
                }).then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    reject(response.statusText);
                }).then(data => {
                    resolve(data);
                }).catch(reason => {
                    reject(reason);
                });
            });
        }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    class Control {
        constructor(what) {
            this.action = what;
        }
        static signalAuthChanged() {
            this.stateChange.update(c => new Control("signalAuthChanged"));
        }
        static showInfolog(message) {
            let ctrl = new Control("showInfolog");
            ctrl.infolog = message;
            this.stateChange.update(c => ctrl);
        }
        static showPopup(message, showOKButton = true, showCancelButton = true, showInput = true, onClose = undefined) {
            let ctrl = new Control("showPopup");
            ctrl.popupText = message;
            ctrl.popupOnclose = onClose;
            ctrl.popupShowOK = showOKButton;
            ctrl.popupShowCancel = showCancelButton;
            ctrl.popupShowInput = showInput;
            Debug.log("Showing popup");
            this.stateChange.update(c => ctrl);
        }
        static closePopup() {
            this.stateChange.update(c => new Control("closePopup"));
        }
        static setQueryString(obj) {
            const stringified = queryString.stringify(obj);
            window.history.pushState({}, '', `${window.origin}?${stringified}`);
        }
        static initOnPopState() {
            window.onpopstate = function (event) {
                let parsed = queryString.parse(location.search);
                if (parsed && parsed.path) {
                    Control.openPath(parsed.path.toString(), false);
                }
            };
        }
        static openPath(path, updateQueryString = true) {
            APIHelper.getContent(path).then(contents => {
                if (updateQueryString) {
                    this.setQueryString({ path: path });
                }
                Control.currentContents = contents;
                this.stateChange.update(c => new Control("pathChanged"));
            });
        }
    }
    Control.stateChange = writable(undefined);

    /* src\components\AuthPage.svelte generated by Svelte v3.31.2 */
    const file = "src\\components\\AuthPage.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div1;
    	let table;
    	let tr0;
    	let td0;
    	let label0;
    	let t3;
    	let td1;
    	let input0;
    	let td2;
    	let t4;
    	let tr1;
    	let td3;
    	let label1;
    	let t6;
    	let td4;
    	let input1;
    	let t7;
    	let td5;
    	let t8;
    	let tr2;
    	let td6;
    	let label2;
    	let t10;
    	let td7;
    	let input2;
    	let td8;
    	let i;
    	let t11;
    	let div0;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Best practices. Together";
    			t1 = space();
    			div1 = element("div");
    			table = element("table");
    			tr0 = element("tr");
    			td0 = element("td");
    			label0 = element("label");
    			label0.textContent = "User";
    			t3 = space();
    			td1 = element("td");
    			input0 = element("input");
    			td2 = element("td");
    			t4 = space();
    			tr1 = element("tr");
    			td3 = element("td");
    			label1 = element("label");
    			label1.textContent = "Repo";
    			t6 = space();
    			td4 = element("td");
    			input1 = element("input");
    			t7 = space();
    			td5 = element("td");
    			t8 = space();
    			tr2 = element("tr");
    			td6 = element("td");
    			label2 = element("label");
    			label2.textContent = "Token";
    			t10 = space();
    			td7 = element("td");
    			input2 = element("input");
    			td8 = element("td");
    			i = element("i");
    			t11 = space();
    			div0 = element("div");
    			button = element("button");
    			button.textContent = "Submit";
    			attr_dev(h1, "class", "svelte-u1niid");
    			add_location(h1, file, 34, 4, 1031);
    			attr_dev(label0, "for", "user");
    			add_location(label0, file, 39, 21, 1149);
    			add_location(td0, file, 39, 16, 1144);
    			attr_dev(input0, "id", "user");
    			attr_dev(input0, "placeholder", "Git user");
    			attr_dev(input0, "class", "svelte-u1niid");
    			add_location(input0, file, 41, 21, 1228);
    			add_location(td1, file, 40, 16, 1202);
    			add_location(td2, file, 46, 17, 1407);
    			add_location(tr0, file, 38, 12, 1122);
    			attr_dev(label1, "for", "repo");
    			add_location(label1, file, 49, 21, 1473);
    			add_location(td3, file, 49, 16, 1468);
    			attr_dev(input1, "id", "repo");
    			attr_dev(input1, "placeholder", "Git repo name");
    			attr_dev(input1, "class", "svelte-u1niid");
    			add_location(input1, file, 51, 20, 1552);
    			add_location(td4, file, 50, 16, 1526);
    			add_location(td5, file, 56, 21, 1736);
    			add_location(tr1, file, 48, 12, 1446);
    			attr_dev(label2, "for", "token");
    			add_location(label2, file, 59, 21, 1802);
    			add_location(td6, file, 59, 16, 1797);
    			attr_dev(input2, "id", "token");
    			attr_dev(input2, "placeholder", "Git token");
    			attr_dev(input2, "class", "svelte-u1niid");
    			add_location(input2, file, 61, 20, 1883);
    			add_location(td7, file, 60, 16, 1857);
    			attr_dev(i, "title", "How to generate a token");
    			attr_dev(i, "class", "fa fa-info-circle");
    			add_location(i, file, 66, 22, 2070);
    			add_location(td8, file, 66, 17, 2065);
    			add_location(tr2, file, 58, 12, 1775);
    			attr_dev(table, "class", "svelte-u1niid");
    			add_location(table, file, 37, 8, 1101);
    			add_location(button, file, 73, 12, 2339);
    			attr_dev(div0, "class", "controls");
    			add_location(div0, file, 72, 8, 2303);
    			attr_dev(div1, "id", "authForm");
    			add_location(div1, file, 36, 4, 1072);
    			attr_dev(main, "class", "svelte-u1niid");
    			add_location(main, file, 33, 0, 1019);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div1);
    			append_dev(div1, table);
    			append_dev(table, tr0);
    			append_dev(tr0, td0);
    			append_dev(td0, label0);
    			append_dev(tr0, t3);
    			append_dev(tr0, td1);
    			append_dev(td1, input0);
    			set_input_value(input0, /*user*/ ctx[0]);
    			append_dev(tr0, td2);
    			append_dev(table, t4);
    			append_dev(table, tr1);
    			append_dev(tr1, td3);
    			append_dev(td3, label1);
    			append_dev(tr1, t6);
    			append_dev(tr1, td4);
    			append_dev(td4, input1);
    			set_input_value(input1, /*repo*/ ctx[1]);
    			append_dev(td4, t7);
    			append_dev(tr1, td5);
    			append_dev(table, t8);
    			append_dev(table, tr2);
    			append_dev(tr2, td6);
    			append_dev(td6, label2);
    			append_dev(tr2, t10);
    			append_dev(tr2, td7);
    			append_dev(td7, input2);
    			set_input_value(input2, /*token*/ ctx[2]);
    			append_dev(tr2, td8);
    			append_dev(td8, i);
    			append_dev(div1, t11);
    			append_dev(div1, div0);
    			append_dev(div0, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[5]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[6]),
    					listen_dev(i, "click", /*click_handler*/ ctx[7], false, false, false),
    					listen_dev(button, "click", /*saveAuth*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*user*/ 1 && input0.value !== /*user*/ ctx[0]) {
    				set_input_value(input0, /*user*/ ctx[0]);
    			}

    			if (dirty & /*repo*/ 2 && input1.value !== /*repo*/ ctx[1]) {
    				set_input_value(input1, /*repo*/ ctx[1]);
    			}

    			if (dirty & /*token*/ 4 && input2.value !== /*token*/ ctx[2]) {
    				set_input_value(input2, /*token*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function openInNewTab(url) {
    	var win = window.open(url, "_blank");
    	win.focus();
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AuthPage", slots, []);
    	let user;
    	let repo;
    	let token;

    	function saveAuth() {
    		if (user && repo && token) {
    			APIHelper.user = user;
    			APIHelper.repo = repo;
    			APIHelper.token = token;

    			APIHelper.getContent("Best practices").then(content => {
    				Control.showInfolog("Authentication OK");
    				document.cookie = `nfrGitUser=${user}`;
    				document.cookie = `nfrGitRepo=${repo}`;
    				document.cookie = `nfrGitToken=${token}`;
    				Control.signalAuthChanged();
    			}).catch(reason => {
    				Control.showInfolog("Failed to retrieve root directory. Check if token still valid. Message: " + reason);
    			});
    		} else {
    			Control.showInfolog("Please provide git user, repo and token");
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AuthPage> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		user = this.value;
    		$$invalidate(0, user);
    	}

    	function input1_input_handler() {
    		repo = this.value;
    		$$invalidate(1, repo);
    	}

    	function input2_input_handler() {
    		token = this.value;
    		$$invalidate(2, token);
    	}

    	const click_handler = x => {
    		openInNewTab("https://github.com/settings/tokens");
    	};

    	$$self.$capture_state = () => ({
    		APIHelper,
    		Control,
    		user,
    		repo,
    		token,
    		saveAuth,
    		openInNewTab
    	});

    	$$self.$inject_state = $$props => {
    		if ("user" in $$props) $$invalidate(0, user = $$props.user);
    		if ("repo" in $$props) $$invalidate(1, repo = $$props.repo);
    		if ("token" in $$props) $$invalidate(2, token = $$props.token);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		user,
    		repo,
    		token,
    		saveAuth,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		click_handler
    	];
    }

    class AuthPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AuthPage",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var moment = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
         module.exports = factory() ;
    }(commonjsGlobal, (function () {
        var hookCallback;

        function hooks() {
            return hookCallback.apply(null, arguments);
        }

        // This is done to register the method called with moment()
        // without creating circular dependencies.
        function setHookCallback(callback) {
            hookCallback = callback;
        }

        function isArray(input) {
            return (
                input instanceof Array ||
                Object.prototype.toString.call(input) === '[object Array]'
            );
        }

        function isObject(input) {
            // IE8 will treat undefined and null as object if it wasn't for
            // input != null
            return (
                input != null &&
                Object.prototype.toString.call(input) === '[object Object]'
            );
        }

        function hasOwnProp(a, b) {
            return Object.prototype.hasOwnProperty.call(a, b);
        }

        function isObjectEmpty(obj) {
            if (Object.getOwnPropertyNames) {
                return Object.getOwnPropertyNames(obj).length === 0;
            } else {
                var k;
                for (k in obj) {
                    if (hasOwnProp(obj, k)) {
                        return false;
                    }
                }
                return true;
            }
        }

        function isUndefined(input) {
            return input === void 0;
        }

        function isNumber(input) {
            return (
                typeof input === 'number' ||
                Object.prototype.toString.call(input) === '[object Number]'
            );
        }

        function isDate(input) {
            return (
                input instanceof Date ||
                Object.prototype.toString.call(input) === '[object Date]'
            );
        }

        function map(arr, fn) {
            var res = [],
                i;
            for (i = 0; i < arr.length; ++i) {
                res.push(fn(arr[i], i));
            }
            return res;
        }

        function extend(a, b) {
            for (var i in b) {
                if (hasOwnProp(b, i)) {
                    a[i] = b[i];
                }
            }

            if (hasOwnProp(b, 'toString')) {
                a.toString = b.toString;
            }

            if (hasOwnProp(b, 'valueOf')) {
                a.valueOf = b.valueOf;
            }

            return a;
        }

        function createUTC(input, format, locale, strict) {
            return createLocalOrUTC(input, format, locale, strict, true).utc();
        }

        function defaultParsingFlags() {
            // We need to deep clone this object.
            return {
                empty: false,
                unusedTokens: [],
                unusedInput: [],
                overflow: -2,
                charsLeftOver: 0,
                nullInput: false,
                invalidEra: null,
                invalidMonth: null,
                invalidFormat: false,
                userInvalidated: false,
                iso: false,
                parsedDateParts: [],
                era: null,
                meridiem: null,
                rfc2822: false,
                weekdayMismatch: false,
            };
        }

        function getParsingFlags(m) {
            if (m._pf == null) {
                m._pf = defaultParsingFlags();
            }
            return m._pf;
        }

        var some;
        if (Array.prototype.some) {
            some = Array.prototype.some;
        } else {
            some = function (fun) {
                var t = Object(this),
                    len = t.length >>> 0,
                    i;

                for (i = 0; i < len; i++) {
                    if (i in t && fun.call(this, t[i], i, t)) {
                        return true;
                    }
                }

                return false;
            };
        }

        function isValid(m) {
            if (m._isValid == null) {
                var flags = getParsingFlags(m),
                    parsedParts = some.call(flags.parsedDateParts, function (i) {
                        return i != null;
                    }),
                    isNowValid =
                        !isNaN(m._d.getTime()) &&
                        flags.overflow < 0 &&
                        !flags.empty &&
                        !flags.invalidEra &&
                        !flags.invalidMonth &&
                        !flags.invalidWeekday &&
                        !flags.weekdayMismatch &&
                        !flags.nullInput &&
                        !flags.invalidFormat &&
                        !flags.userInvalidated &&
                        (!flags.meridiem || (flags.meridiem && parsedParts));

                if (m._strict) {
                    isNowValid =
                        isNowValid &&
                        flags.charsLeftOver === 0 &&
                        flags.unusedTokens.length === 0 &&
                        flags.bigHour === undefined;
                }

                if (Object.isFrozen == null || !Object.isFrozen(m)) {
                    m._isValid = isNowValid;
                } else {
                    return isNowValid;
                }
            }
            return m._isValid;
        }

        function createInvalid(flags) {
            var m = createUTC(NaN);
            if (flags != null) {
                extend(getParsingFlags(m), flags);
            } else {
                getParsingFlags(m).userInvalidated = true;
            }

            return m;
        }

        // Plugins that add properties should also add the key here (null value),
        // so we can properly clone ourselves.
        var momentProperties = (hooks.momentProperties = []),
            updateInProgress = false;

        function copyConfig(to, from) {
            var i, prop, val;

            if (!isUndefined(from._isAMomentObject)) {
                to._isAMomentObject = from._isAMomentObject;
            }
            if (!isUndefined(from._i)) {
                to._i = from._i;
            }
            if (!isUndefined(from._f)) {
                to._f = from._f;
            }
            if (!isUndefined(from._l)) {
                to._l = from._l;
            }
            if (!isUndefined(from._strict)) {
                to._strict = from._strict;
            }
            if (!isUndefined(from._tzm)) {
                to._tzm = from._tzm;
            }
            if (!isUndefined(from._isUTC)) {
                to._isUTC = from._isUTC;
            }
            if (!isUndefined(from._offset)) {
                to._offset = from._offset;
            }
            if (!isUndefined(from._pf)) {
                to._pf = getParsingFlags(from);
            }
            if (!isUndefined(from._locale)) {
                to._locale = from._locale;
            }

            if (momentProperties.length > 0) {
                for (i = 0; i < momentProperties.length; i++) {
                    prop = momentProperties[i];
                    val = from[prop];
                    if (!isUndefined(val)) {
                        to[prop] = val;
                    }
                }
            }

            return to;
        }

        // Moment prototype object
        function Moment(config) {
            copyConfig(this, config);
            this._d = new Date(config._d != null ? config._d.getTime() : NaN);
            if (!this.isValid()) {
                this._d = new Date(NaN);
            }
            // Prevent infinite loop in case updateOffset creates new moment
            // objects.
            if (updateInProgress === false) {
                updateInProgress = true;
                hooks.updateOffset(this);
                updateInProgress = false;
            }
        }

        function isMoment(obj) {
            return (
                obj instanceof Moment || (obj != null && obj._isAMomentObject != null)
            );
        }

        function warn(msg) {
            if (
                hooks.suppressDeprecationWarnings === false &&
                typeof console !== 'undefined' &&
                console.warn
            ) {
                console.warn('Deprecation warning: ' + msg);
            }
        }

        function deprecate(msg, fn) {
            var firstTime = true;

            return extend(function () {
                if (hooks.deprecationHandler != null) {
                    hooks.deprecationHandler(null, msg);
                }
                if (firstTime) {
                    var args = [],
                        arg,
                        i,
                        key;
                    for (i = 0; i < arguments.length; i++) {
                        arg = '';
                        if (typeof arguments[i] === 'object') {
                            arg += '\n[' + i + '] ';
                            for (key in arguments[0]) {
                                if (hasOwnProp(arguments[0], key)) {
                                    arg += key + ': ' + arguments[0][key] + ', ';
                                }
                            }
                            arg = arg.slice(0, -2); // Remove trailing comma and space
                        } else {
                            arg = arguments[i];
                        }
                        args.push(arg);
                    }
                    warn(
                        msg +
                            '\nArguments: ' +
                            Array.prototype.slice.call(args).join('') +
                            '\n' +
                            new Error().stack
                    );
                    firstTime = false;
                }
                return fn.apply(this, arguments);
            }, fn);
        }

        var deprecations = {};

        function deprecateSimple(name, msg) {
            if (hooks.deprecationHandler != null) {
                hooks.deprecationHandler(name, msg);
            }
            if (!deprecations[name]) {
                warn(msg);
                deprecations[name] = true;
            }
        }

        hooks.suppressDeprecationWarnings = false;
        hooks.deprecationHandler = null;

        function isFunction(input) {
            return (
                (typeof Function !== 'undefined' && input instanceof Function) ||
                Object.prototype.toString.call(input) === '[object Function]'
            );
        }

        function set(config) {
            var prop, i;
            for (i in config) {
                if (hasOwnProp(config, i)) {
                    prop = config[i];
                    if (isFunction(prop)) {
                        this[i] = prop;
                    } else {
                        this['_' + i] = prop;
                    }
                }
            }
            this._config = config;
            // Lenient ordinal parsing accepts just a number in addition to
            // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
            // TODO: Remove "ordinalParse" fallback in next major release.
            this._dayOfMonthOrdinalParseLenient = new RegExp(
                (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) +
                    '|' +
                    /\d{1,2}/.source
            );
        }

        function mergeConfigs(parentConfig, childConfig) {
            var res = extend({}, parentConfig),
                prop;
            for (prop in childConfig) {
                if (hasOwnProp(childConfig, prop)) {
                    if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                        res[prop] = {};
                        extend(res[prop], parentConfig[prop]);
                        extend(res[prop], childConfig[prop]);
                    } else if (childConfig[prop] != null) {
                        res[prop] = childConfig[prop];
                    } else {
                        delete res[prop];
                    }
                }
            }
            for (prop in parentConfig) {
                if (
                    hasOwnProp(parentConfig, prop) &&
                    !hasOwnProp(childConfig, prop) &&
                    isObject(parentConfig[prop])
                ) {
                    // make sure changes to properties don't modify parent config
                    res[prop] = extend({}, res[prop]);
                }
            }
            return res;
        }

        function Locale(config) {
            if (config != null) {
                this.set(config);
            }
        }

        var keys;

        if (Object.keys) {
            keys = Object.keys;
        } else {
            keys = function (obj) {
                var i,
                    res = [];
                for (i in obj) {
                    if (hasOwnProp(obj, i)) {
                        res.push(i);
                    }
                }
                return res;
            };
        }

        var defaultCalendar = {
            sameDay: '[Today at] LT',
            nextDay: '[Tomorrow at] LT',
            nextWeek: 'dddd [at] LT',
            lastDay: '[Yesterday at] LT',
            lastWeek: '[Last] dddd [at] LT',
            sameElse: 'L',
        };

        function calendar(key, mom, now) {
            var output = this._calendar[key] || this._calendar['sameElse'];
            return isFunction(output) ? output.call(mom, now) : output;
        }

        function zeroFill(number, targetLength, forceSign) {
            var absNumber = '' + Math.abs(number),
                zerosToFill = targetLength - absNumber.length,
                sign = number >= 0;
            return (
                (sign ? (forceSign ? '+' : '') : '-') +
                Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) +
                absNumber
            );
        }

        var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|N{1,5}|YYYYYY|YYYYY|YYYY|YY|y{2,4}|yo?|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,
            localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,
            formatFunctions = {},
            formatTokenFunctions = {};

        // token:    'M'
        // padded:   ['MM', 2]
        // ordinal:  'Mo'
        // callback: function () { this.month() + 1 }
        function addFormatToken(token, padded, ordinal, callback) {
            var func = callback;
            if (typeof callback === 'string') {
                func = function () {
                    return this[callback]();
                };
            }
            if (token) {
                formatTokenFunctions[token] = func;
            }
            if (padded) {
                formatTokenFunctions[padded[0]] = function () {
                    return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
                };
            }
            if (ordinal) {
                formatTokenFunctions[ordinal] = function () {
                    return this.localeData().ordinal(
                        func.apply(this, arguments),
                        token
                    );
                };
            }
        }

        function removeFormattingTokens(input) {
            if (input.match(/\[[\s\S]/)) {
                return input.replace(/^\[|\]$/g, '');
            }
            return input.replace(/\\/g, '');
        }

        function makeFormatFunction(format) {
            var array = format.match(formattingTokens),
                i,
                length;

            for (i = 0, length = array.length; i < length; i++) {
                if (formatTokenFunctions[array[i]]) {
                    array[i] = formatTokenFunctions[array[i]];
                } else {
                    array[i] = removeFormattingTokens(array[i]);
                }
            }

            return function (mom) {
                var output = '',
                    i;
                for (i = 0; i < length; i++) {
                    output += isFunction(array[i])
                        ? array[i].call(mom, format)
                        : array[i];
                }
                return output;
            };
        }

        // format date using native date object
        function formatMoment(m, format) {
            if (!m.isValid()) {
                return m.localeData().invalidDate();
            }

            format = expandFormat(format, m.localeData());
            formatFunctions[format] =
                formatFunctions[format] || makeFormatFunction(format);

            return formatFunctions[format](m);
        }

        function expandFormat(format, locale) {
            var i = 5;

            function replaceLongDateFormatTokens(input) {
                return locale.longDateFormat(input) || input;
            }

            localFormattingTokens.lastIndex = 0;
            while (i >= 0 && localFormattingTokens.test(format)) {
                format = format.replace(
                    localFormattingTokens,
                    replaceLongDateFormatTokens
                );
                localFormattingTokens.lastIndex = 0;
                i -= 1;
            }

            return format;
        }

        var defaultLongDateFormat = {
            LTS: 'h:mm:ss A',
            LT: 'h:mm A',
            L: 'MM/DD/YYYY',
            LL: 'MMMM D, YYYY',
            LLL: 'MMMM D, YYYY h:mm A',
            LLLL: 'dddd, MMMM D, YYYY h:mm A',
        };

        function longDateFormat(key) {
            var format = this._longDateFormat[key],
                formatUpper = this._longDateFormat[key.toUpperCase()];

            if (format || !formatUpper) {
                return format;
            }

            this._longDateFormat[key] = formatUpper
                .match(formattingTokens)
                .map(function (tok) {
                    if (
                        tok === 'MMMM' ||
                        tok === 'MM' ||
                        tok === 'DD' ||
                        tok === 'dddd'
                    ) {
                        return tok.slice(1);
                    }
                    return tok;
                })
                .join('');

            return this._longDateFormat[key];
        }

        var defaultInvalidDate = 'Invalid date';

        function invalidDate() {
            return this._invalidDate;
        }

        var defaultOrdinal = '%d',
            defaultDayOfMonthOrdinalParse = /\d{1,2}/;

        function ordinal(number) {
            return this._ordinal.replace('%d', number);
        }

        var defaultRelativeTime = {
            future: 'in %s',
            past: '%s ago',
            s: 'a few seconds',
            ss: '%d seconds',
            m: 'a minute',
            mm: '%d minutes',
            h: 'an hour',
            hh: '%d hours',
            d: 'a day',
            dd: '%d days',
            w: 'a week',
            ww: '%d weeks',
            M: 'a month',
            MM: '%d months',
            y: 'a year',
            yy: '%d years',
        };

        function relativeTime(number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return isFunction(output)
                ? output(number, withoutSuffix, string, isFuture)
                : output.replace(/%d/i, number);
        }

        function pastFuture(diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return isFunction(format) ? format(output) : format.replace(/%s/i, output);
        }

        var aliases = {};

        function addUnitAlias(unit, shorthand) {
            var lowerCase = unit.toLowerCase();
            aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
        }

        function normalizeUnits(units) {
            return typeof units === 'string'
                ? aliases[units] || aliases[units.toLowerCase()]
                : undefined;
        }

        function normalizeObjectUnits(inputObject) {
            var normalizedInput = {},
                normalizedProp,
                prop;

            for (prop in inputObject) {
                if (hasOwnProp(inputObject, prop)) {
                    normalizedProp = normalizeUnits(prop);
                    if (normalizedProp) {
                        normalizedInput[normalizedProp] = inputObject[prop];
                    }
                }
            }

            return normalizedInput;
        }

        var priorities = {};

        function addUnitPriority(unit, priority) {
            priorities[unit] = priority;
        }

        function getPrioritizedUnits(unitsObj) {
            var units = [],
                u;
            for (u in unitsObj) {
                if (hasOwnProp(unitsObj, u)) {
                    units.push({ unit: u, priority: priorities[u] });
                }
            }
            units.sort(function (a, b) {
                return a.priority - b.priority;
            });
            return units;
        }

        function isLeapYear(year) {
            return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        }

        function absFloor(number) {
            if (number < 0) {
                // -0 -> 0
                return Math.ceil(number) || 0;
            } else {
                return Math.floor(number);
            }
        }

        function toInt(argumentForCoercion) {
            var coercedNumber = +argumentForCoercion,
                value = 0;

            if (coercedNumber !== 0 && isFinite(coercedNumber)) {
                value = absFloor(coercedNumber);
            }

            return value;
        }

        function makeGetSet(unit, keepTime) {
            return function (value) {
                if (value != null) {
                    set$1(this, unit, value);
                    hooks.updateOffset(this, keepTime);
                    return this;
                } else {
                    return get(this, unit);
                }
            };
        }

        function get(mom, unit) {
            return mom.isValid()
                ? mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]()
                : NaN;
        }

        function set$1(mom, unit, value) {
            if (mom.isValid() && !isNaN(value)) {
                if (
                    unit === 'FullYear' &&
                    isLeapYear(mom.year()) &&
                    mom.month() === 1 &&
                    mom.date() === 29
                ) {
                    value = toInt(value);
                    mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](
                        value,
                        mom.month(),
                        daysInMonth(value, mom.month())
                    );
                } else {
                    mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
                }
            }
        }

        // MOMENTS

        function stringGet(units) {
            units = normalizeUnits(units);
            if (isFunction(this[units])) {
                return this[units]();
            }
            return this;
        }

        function stringSet(units, value) {
            if (typeof units === 'object') {
                units = normalizeObjectUnits(units);
                var prioritized = getPrioritizedUnits(units),
                    i;
                for (i = 0; i < prioritized.length; i++) {
                    this[prioritized[i].unit](units[prioritized[i].unit]);
                }
            } else {
                units = normalizeUnits(units);
                if (isFunction(this[units])) {
                    return this[units](value);
                }
            }
            return this;
        }

        var match1 = /\d/, //       0 - 9
            match2 = /\d\d/, //      00 - 99
            match3 = /\d{3}/, //     000 - 999
            match4 = /\d{4}/, //    0000 - 9999
            match6 = /[+-]?\d{6}/, // -999999 - 999999
            match1to2 = /\d\d?/, //       0 - 99
            match3to4 = /\d\d\d\d?/, //     999 - 9999
            match5to6 = /\d\d\d\d\d\d?/, //   99999 - 999999
            match1to3 = /\d{1,3}/, //       0 - 999
            match1to4 = /\d{1,4}/, //       0 - 9999
            match1to6 = /[+-]?\d{1,6}/, // -999999 - 999999
            matchUnsigned = /\d+/, //       0 - inf
            matchSigned = /[+-]?\d+/, //    -inf - inf
            matchOffset = /Z|[+-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
            matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi, // +00 -00 +00:00 -00:00 +0000 -0000 or Z
            matchTimestamp = /[+-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123
            // any word (or two) characters or numbers including two/three word month in arabic.
            // includes scottish gaelic two word and hyphenated months
            matchWord = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i,
            regexes;

        regexes = {};

        function addRegexToken(token, regex, strictRegex) {
            regexes[token] = isFunction(regex)
                ? regex
                : function (isStrict, localeData) {
                      return isStrict && strictRegex ? strictRegex : regex;
                  };
        }

        function getParseRegexForToken(token, config) {
            if (!hasOwnProp(regexes, token)) {
                return new RegExp(unescapeFormat(token));
            }

            return regexes[token](config._strict, config._locale);
        }

        // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
        function unescapeFormat(s) {
            return regexEscape(
                s
                    .replace('\\', '')
                    .replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (
                        matched,
                        p1,
                        p2,
                        p3,
                        p4
                    ) {
                        return p1 || p2 || p3 || p4;
                    })
            );
        }

        function regexEscape(s) {
            return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        }

        var tokens = {};

        function addParseToken(token, callback) {
            var i,
                func = callback;
            if (typeof token === 'string') {
                token = [token];
            }
            if (isNumber(callback)) {
                func = function (input, array) {
                    array[callback] = toInt(input);
                };
            }
            for (i = 0; i < token.length; i++) {
                tokens[token[i]] = func;
            }
        }

        function addWeekParseToken(token, callback) {
            addParseToken(token, function (input, array, config, token) {
                config._w = config._w || {};
                callback(input, config._w, config, token);
            });
        }

        function addTimeToArrayFromToken(token, input, config) {
            if (input != null && hasOwnProp(tokens, token)) {
                tokens[token](input, config._a, config, token);
            }
        }

        var YEAR = 0,
            MONTH = 1,
            DATE = 2,
            HOUR = 3,
            MINUTE = 4,
            SECOND = 5,
            MILLISECOND = 6,
            WEEK = 7,
            WEEKDAY = 8;

        function mod(n, x) {
            return ((n % x) + x) % x;
        }

        var indexOf;

        if (Array.prototype.indexOf) {
            indexOf = Array.prototype.indexOf;
        } else {
            indexOf = function (o) {
                // I know
                var i;
                for (i = 0; i < this.length; ++i) {
                    if (this[i] === o) {
                        return i;
                    }
                }
                return -1;
            };
        }

        function daysInMonth(year, month) {
            if (isNaN(year) || isNaN(month)) {
                return NaN;
            }
            var modMonth = mod(month, 12);
            year += (month - modMonth) / 12;
            return modMonth === 1
                ? isLeapYear(year)
                    ? 29
                    : 28
                : 31 - ((modMonth % 7) % 2);
        }

        // FORMATTING

        addFormatToken('M', ['MM', 2], 'Mo', function () {
            return this.month() + 1;
        });

        addFormatToken('MMM', 0, 0, function (format) {
            return this.localeData().monthsShort(this, format);
        });

        addFormatToken('MMMM', 0, 0, function (format) {
            return this.localeData().months(this, format);
        });

        // ALIASES

        addUnitAlias('month', 'M');

        // PRIORITY

        addUnitPriority('month', 8);

        // PARSING

        addRegexToken('M', match1to2);
        addRegexToken('MM', match1to2, match2);
        addRegexToken('MMM', function (isStrict, locale) {
            return locale.monthsShortRegex(isStrict);
        });
        addRegexToken('MMMM', function (isStrict, locale) {
            return locale.monthsRegex(isStrict);
        });

        addParseToken(['M', 'MM'], function (input, array) {
            array[MONTH] = toInt(input) - 1;
        });

        addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
            var month = config._locale.monthsParse(input, token, config._strict);
            // if we didn't find a month name, mark the date as invalid.
            if (month != null) {
                array[MONTH] = month;
            } else {
                getParsingFlags(config).invalidMonth = input;
            }
        });

        // LOCALES

        var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
                '_'
            ),
            defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split(
                '_'
            ),
            MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,
            defaultMonthsShortRegex = matchWord,
            defaultMonthsRegex = matchWord;

        function localeMonths(m, format) {
            if (!m) {
                return isArray(this._months)
                    ? this._months
                    : this._months['standalone'];
            }
            return isArray(this._months)
                ? this._months[m.month()]
                : this._months[
                      (this._months.isFormat || MONTHS_IN_FORMAT).test(format)
                          ? 'format'
                          : 'standalone'
                  ][m.month()];
        }

        function localeMonthsShort(m, format) {
            if (!m) {
                return isArray(this._monthsShort)
                    ? this._monthsShort
                    : this._monthsShort['standalone'];
            }
            return isArray(this._monthsShort)
                ? this._monthsShort[m.month()]
                : this._monthsShort[
                      MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'
                  ][m.month()];
        }

        function handleStrictParse(monthName, format, strict) {
            var i,
                ii,
                mom,
                llc = monthName.toLocaleLowerCase();
            if (!this._monthsParse) {
                // this is not used
                this._monthsParse = [];
                this._longMonthsParse = [];
                this._shortMonthsParse = [];
                for (i = 0; i < 12; ++i) {
                    mom = createUTC([2000, i]);
                    this._shortMonthsParse[i] = this.monthsShort(
                        mom,
                        ''
                    ).toLocaleLowerCase();
                    this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
                }
            }

            if (strict) {
                if (format === 'MMM') {
                    ii = indexOf.call(this._shortMonthsParse, llc);
                    return ii !== -1 ? ii : null;
                } else {
                    ii = indexOf.call(this._longMonthsParse, llc);
                    return ii !== -1 ? ii : null;
                }
            } else {
                if (format === 'MMM') {
                    ii = indexOf.call(this._shortMonthsParse, llc);
                    if (ii !== -1) {
                        return ii;
                    }
                    ii = indexOf.call(this._longMonthsParse, llc);
                    return ii !== -1 ? ii : null;
                } else {
                    ii = indexOf.call(this._longMonthsParse, llc);
                    if (ii !== -1) {
                        return ii;
                    }
                    ii = indexOf.call(this._shortMonthsParse, llc);
                    return ii !== -1 ? ii : null;
                }
            }
        }

        function localeMonthsParse(monthName, format, strict) {
            var i, mom, regex;

            if (this._monthsParseExact) {
                return handleStrictParse.call(this, monthName, format, strict);
            }

            if (!this._monthsParse) {
                this._monthsParse = [];
                this._longMonthsParse = [];
                this._shortMonthsParse = [];
            }

            // TODO: add sorting
            // Sorting makes sure if one month (or abbr) is a prefix of another
            // see sorting in computeMonthsParse
            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                mom = createUTC([2000, i]);
                if (strict && !this._longMonthsParse[i]) {
                    this._longMonthsParse[i] = new RegExp(
                        '^' + this.months(mom, '').replace('.', '') + '$',
                        'i'
                    );
                    this._shortMonthsParse[i] = new RegExp(
                        '^' + this.monthsShort(mom, '').replace('.', '') + '$',
                        'i'
                    );
                }
                if (!strict && !this._monthsParse[i]) {
                    regex =
                        '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (
                    strict &&
                    format === 'MMMM' &&
                    this._longMonthsParse[i].test(monthName)
                ) {
                    return i;
                } else if (
                    strict &&
                    format === 'MMM' &&
                    this._shortMonthsParse[i].test(monthName)
                ) {
                    return i;
                } else if (!strict && this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        }

        // MOMENTS

        function setMonth(mom, value) {
            var dayOfMonth;

            if (!mom.isValid()) {
                // No op
                return mom;
            }

            if (typeof value === 'string') {
                if (/^\d+$/.test(value)) {
                    value = toInt(value);
                } else {
                    value = mom.localeData().monthsParse(value);
                    // TODO: Another silent failure?
                    if (!isNumber(value)) {
                        return mom;
                    }
                }
            }

            dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
            mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
            return mom;
        }

        function getSetMonth(value) {
            if (value != null) {
                setMonth(this, value);
                hooks.updateOffset(this, true);
                return this;
            } else {
                return get(this, 'Month');
            }
        }

        function getDaysInMonth() {
            return daysInMonth(this.year(), this.month());
        }

        function monthsShortRegex(isStrict) {
            if (this._monthsParseExact) {
                if (!hasOwnProp(this, '_monthsRegex')) {
                    computeMonthsParse.call(this);
                }
                if (isStrict) {
                    return this._monthsShortStrictRegex;
                } else {
                    return this._monthsShortRegex;
                }
            } else {
                if (!hasOwnProp(this, '_monthsShortRegex')) {
                    this._monthsShortRegex = defaultMonthsShortRegex;
                }
                return this._monthsShortStrictRegex && isStrict
                    ? this._monthsShortStrictRegex
                    : this._monthsShortRegex;
            }
        }

        function monthsRegex(isStrict) {
            if (this._monthsParseExact) {
                if (!hasOwnProp(this, '_monthsRegex')) {
                    computeMonthsParse.call(this);
                }
                if (isStrict) {
                    return this._monthsStrictRegex;
                } else {
                    return this._monthsRegex;
                }
            } else {
                if (!hasOwnProp(this, '_monthsRegex')) {
                    this._monthsRegex = defaultMonthsRegex;
                }
                return this._monthsStrictRegex && isStrict
                    ? this._monthsStrictRegex
                    : this._monthsRegex;
            }
        }

        function computeMonthsParse() {
            function cmpLenRev(a, b) {
                return b.length - a.length;
            }

            var shortPieces = [],
                longPieces = [],
                mixedPieces = [],
                i,
                mom;
            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                mom = createUTC([2000, i]);
                shortPieces.push(this.monthsShort(mom, ''));
                longPieces.push(this.months(mom, ''));
                mixedPieces.push(this.months(mom, ''));
                mixedPieces.push(this.monthsShort(mom, ''));
            }
            // Sorting makes sure if one month (or abbr) is a prefix of another it
            // will match the longer piece.
            shortPieces.sort(cmpLenRev);
            longPieces.sort(cmpLenRev);
            mixedPieces.sort(cmpLenRev);
            for (i = 0; i < 12; i++) {
                shortPieces[i] = regexEscape(shortPieces[i]);
                longPieces[i] = regexEscape(longPieces[i]);
            }
            for (i = 0; i < 24; i++) {
                mixedPieces[i] = regexEscape(mixedPieces[i]);
            }

            this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
            this._monthsShortRegex = this._monthsRegex;
            this._monthsStrictRegex = new RegExp(
                '^(' + longPieces.join('|') + ')',
                'i'
            );
            this._monthsShortStrictRegex = new RegExp(
                '^(' + shortPieces.join('|') + ')',
                'i'
            );
        }

        // FORMATTING

        addFormatToken('Y', 0, 0, function () {
            var y = this.year();
            return y <= 9999 ? zeroFill(y, 4) : '+' + y;
        });

        addFormatToken(0, ['YY', 2], 0, function () {
            return this.year() % 100;
        });

        addFormatToken(0, ['YYYY', 4], 0, 'year');
        addFormatToken(0, ['YYYYY', 5], 0, 'year');
        addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

        // ALIASES

        addUnitAlias('year', 'y');

        // PRIORITIES

        addUnitPriority('year', 1);

        // PARSING

        addRegexToken('Y', matchSigned);
        addRegexToken('YY', match1to2, match2);
        addRegexToken('YYYY', match1to4, match4);
        addRegexToken('YYYYY', match1to6, match6);
        addRegexToken('YYYYYY', match1to6, match6);

        addParseToken(['YYYYY', 'YYYYYY'], YEAR);
        addParseToken('YYYY', function (input, array) {
            array[YEAR] =
                input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
        });
        addParseToken('YY', function (input, array) {
            array[YEAR] = hooks.parseTwoDigitYear(input);
        });
        addParseToken('Y', function (input, array) {
            array[YEAR] = parseInt(input, 10);
        });

        // HELPERS

        function daysInYear(year) {
            return isLeapYear(year) ? 366 : 365;
        }

        // HOOKS

        hooks.parseTwoDigitYear = function (input) {
            return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
        };

        // MOMENTS

        var getSetYear = makeGetSet('FullYear', true);

        function getIsLeapYear() {
            return isLeapYear(this.year());
        }

        function createDate(y, m, d, h, M, s, ms) {
            // can't just apply() to create a date:
            // https://stackoverflow.com/q/181348
            var date;
            // the date constructor remaps years 0-99 to 1900-1999
            if (y < 100 && y >= 0) {
                // preserve leap years using a full 400 year cycle, then reset
                date = new Date(y + 400, m, d, h, M, s, ms);
                if (isFinite(date.getFullYear())) {
                    date.setFullYear(y);
                }
            } else {
                date = new Date(y, m, d, h, M, s, ms);
            }

            return date;
        }

        function createUTCDate(y) {
            var date, args;
            // the Date.UTC function remaps years 0-99 to 1900-1999
            if (y < 100 && y >= 0) {
                args = Array.prototype.slice.call(arguments);
                // preserve leap years using a full 400 year cycle, then reset
                args[0] = y + 400;
                date = new Date(Date.UTC.apply(null, args));
                if (isFinite(date.getUTCFullYear())) {
                    date.setUTCFullYear(y);
                }
            } else {
                date = new Date(Date.UTC.apply(null, arguments));
            }

            return date;
        }

        // start-of-first-week - start-of-year
        function firstWeekOffset(year, dow, doy) {
            var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
                fwd = 7 + dow - doy,
                // first-week day local weekday -- which local weekday is fwd
                fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

            return -fwdlw + fwd - 1;
        }

        // https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
        function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
            var localWeekday = (7 + weekday - dow) % 7,
                weekOffset = firstWeekOffset(year, dow, doy),
                dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
                resYear,
                resDayOfYear;

            if (dayOfYear <= 0) {
                resYear = year - 1;
                resDayOfYear = daysInYear(resYear) + dayOfYear;
            } else if (dayOfYear > daysInYear(year)) {
                resYear = year + 1;
                resDayOfYear = dayOfYear - daysInYear(year);
            } else {
                resYear = year;
                resDayOfYear = dayOfYear;
            }

            return {
                year: resYear,
                dayOfYear: resDayOfYear,
            };
        }

        function weekOfYear(mom, dow, doy) {
            var weekOffset = firstWeekOffset(mom.year(), dow, doy),
                week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
                resWeek,
                resYear;

            if (week < 1) {
                resYear = mom.year() - 1;
                resWeek = week + weeksInYear(resYear, dow, doy);
            } else if (week > weeksInYear(mom.year(), dow, doy)) {
                resWeek = week - weeksInYear(mom.year(), dow, doy);
                resYear = mom.year() + 1;
            } else {
                resYear = mom.year();
                resWeek = week;
            }

            return {
                week: resWeek,
                year: resYear,
            };
        }

        function weeksInYear(year, dow, doy) {
            var weekOffset = firstWeekOffset(year, dow, doy),
                weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
            return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
        }

        // FORMATTING

        addFormatToken('w', ['ww', 2], 'wo', 'week');
        addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

        // ALIASES

        addUnitAlias('week', 'w');
        addUnitAlias('isoWeek', 'W');

        // PRIORITIES

        addUnitPriority('week', 5);
        addUnitPriority('isoWeek', 5);

        // PARSING

        addRegexToken('w', match1to2);
        addRegexToken('ww', match1to2, match2);
        addRegexToken('W', match1to2);
        addRegexToken('WW', match1to2, match2);

        addWeekParseToken(['w', 'ww', 'W', 'WW'], function (
            input,
            week,
            config,
            token
        ) {
            week[token.substr(0, 1)] = toInt(input);
        });

        // HELPERS

        // LOCALES

        function localeWeek(mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        }

        var defaultLocaleWeek = {
            dow: 0, // Sunday is the first day of the week.
            doy: 6, // The week that contains Jan 6th is the first week of the year.
        };

        function localeFirstDayOfWeek() {
            return this._week.dow;
        }

        function localeFirstDayOfYear() {
            return this._week.doy;
        }

        // MOMENTS

        function getSetWeek(input) {
            var week = this.localeData().week(this);
            return input == null ? week : this.add((input - week) * 7, 'd');
        }

        function getSetISOWeek(input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add((input - week) * 7, 'd');
        }

        // FORMATTING

        addFormatToken('d', 0, 'do', 'day');

        addFormatToken('dd', 0, 0, function (format) {
            return this.localeData().weekdaysMin(this, format);
        });

        addFormatToken('ddd', 0, 0, function (format) {
            return this.localeData().weekdaysShort(this, format);
        });

        addFormatToken('dddd', 0, 0, function (format) {
            return this.localeData().weekdays(this, format);
        });

        addFormatToken('e', 0, 0, 'weekday');
        addFormatToken('E', 0, 0, 'isoWeekday');

        // ALIASES

        addUnitAlias('day', 'd');
        addUnitAlias('weekday', 'e');
        addUnitAlias('isoWeekday', 'E');

        // PRIORITY
        addUnitPriority('day', 11);
        addUnitPriority('weekday', 11);
        addUnitPriority('isoWeekday', 11);

        // PARSING

        addRegexToken('d', match1to2);
        addRegexToken('e', match1to2);
        addRegexToken('E', match1to2);
        addRegexToken('dd', function (isStrict, locale) {
            return locale.weekdaysMinRegex(isStrict);
        });
        addRegexToken('ddd', function (isStrict, locale) {
            return locale.weekdaysShortRegex(isStrict);
        });
        addRegexToken('dddd', function (isStrict, locale) {
            return locale.weekdaysRegex(isStrict);
        });

        addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
            var weekday = config._locale.weekdaysParse(input, token, config._strict);
            // if we didn't get a weekday name, mark the date as invalid
            if (weekday != null) {
                week.d = weekday;
            } else {
                getParsingFlags(config).invalidWeekday = input;
            }
        });

        addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
            week[token] = toInt(input);
        });

        // HELPERS

        function parseWeekday(input, locale) {
            if (typeof input !== 'string') {
                return input;
            }

            if (!isNaN(input)) {
                return parseInt(input, 10);
            }

            input = locale.weekdaysParse(input);
            if (typeof input === 'number') {
                return input;
            }

            return null;
        }

        function parseIsoWeekday(input, locale) {
            if (typeof input === 'string') {
                return locale.weekdaysParse(input) % 7 || 7;
            }
            return isNaN(input) ? null : input;
        }

        // LOCALES
        function shiftWeekdays(ws, n) {
            return ws.slice(n, 7).concat(ws.slice(0, n));
        }

        var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
                '_'
            ),
            defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
            defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
            defaultWeekdaysRegex = matchWord,
            defaultWeekdaysShortRegex = matchWord,
            defaultWeekdaysMinRegex = matchWord;

        function localeWeekdays(m, format) {
            var weekdays = isArray(this._weekdays)
                ? this._weekdays
                : this._weekdays[
                      m && m !== true && this._weekdays.isFormat.test(format)
                          ? 'format'
                          : 'standalone'
                  ];
            return m === true
                ? shiftWeekdays(weekdays, this._week.dow)
                : m
                ? weekdays[m.day()]
                : weekdays;
        }

        function localeWeekdaysShort(m) {
            return m === true
                ? shiftWeekdays(this._weekdaysShort, this._week.dow)
                : m
                ? this._weekdaysShort[m.day()]
                : this._weekdaysShort;
        }

        function localeWeekdaysMin(m) {
            return m === true
                ? shiftWeekdays(this._weekdaysMin, this._week.dow)
                : m
                ? this._weekdaysMin[m.day()]
                : this._weekdaysMin;
        }

        function handleStrictParse$1(weekdayName, format, strict) {
            var i,
                ii,
                mom,
                llc = weekdayName.toLocaleLowerCase();
            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
                this._shortWeekdaysParse = [];
                this._minWeekdaysParse = [];

                for (i = 0; i < 7; ++i) {
                    mom = createUTC([2000, 1]).day(i);
                    this._minWeekdaysParse[i] = this.weekdaysMin(
                        mom,
                        ''
                    ).toLocaleLowerCase();
                    this._shortWeekdaysParse[i] = this.weekdaysShort(
                        mom,
                        ''
                    ).toLocaleLowerCase();
                    this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
                }
            }

            if (strict) {
                if (format === 'dddd') {
                    ii = indexOf.call(this._weekdaysParse, llc);
                    return ii !== -1 ? ii : null;
                } else if (format === 'ddd') {
                    ii = indexOf.call(this._shortWeekdaysParse, llc);
                    return ii !== -1 ? ii : null;
                } else {
                    ii = indexOf.call(this._minWeekdaysParse, llc);
                    return ii !== -1 ? ii : null;
                }
            } else {
                if (format === 'dddd') {
                    ii = indexOf.call(this._weekdaysParse, llc);
                    if (ii !== -1) {
                        return ii;
                    }
                    ii = indexOf.call(this._shortWeekdaysParse, llc);
                    if (ii !== -1) {
                        return ii;
                    }
                    ii = indexOf.call(this._minWeekdaysParse, llc);
                    return ii !== -1 ? ii : null;
                } else if (format === 'ddd') {
                    ii = indexOf.call(this._shortWeekdaysParse, llc);
                    if (ii !== -1) {
                        return ii;
                    }
                    ii = indexOf.call(this._weekdaysParse, llc);
                    if (ii !== -1) {
                        return ii;
                    }
                    ii = indexOf.call(this._minWeekdaysParse, llc);
                    return ii !== -1 ? ii : null;
                } else {
                    ii = indexOf.call(this._minWeekdaysParse, llc);
                    if (ii !== -1) {
                        return ii;
                    }
                    ii = indexOf.call(this._weekdaysParse, llc);
                    if (ii !== -1) {
                        return ii;
                    }
                    ii = indexOf.call(this._shortWeekdaysParse, llc);
                    return ii !== -1 ? ii : null;
                }
            }
        }

        function localeWeekdaysParse(weekdayName, format, strict) {
            var i, mom, regex;

            if (this._weekdaysParseExact) {
                return handleStrictParse$1.call(this, weekdayName, format, strict);
            }

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
                this._minWeekdaysParse = [];
                this._shortWeekdaysParse = [];
                this._fullWeekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already

                mom = createUTC([2000, 1]).day(i);
                if (strict && !this._fullWeekdaysParse[i]) {
                    this._fullWeekdaysParse[i] = new RegExp(
                        '^' + this.weekdays(mom, '').replace('.', '\\.?') + '$',
                        'i'
                    );
                    this._shortWeekdaysParse[i] = new RegExp(
                        '^' + this.weekdaysShort(mom, '').replace('.', '\\.?') + '$',
                        'i'
                    );
                    this._minWeekdaysParse[i] = new RegExp(
                        '^' + this.weekdaysMin(mom, '').replace('.', '\\.?') + '$',
                        'i'
                    );
                }
                if (!this._weekdaysParse[i]) {
                    regex =
                        '^' +
                        this.weekdays(mom, '') +
                        '|^' +
                        this.weekdaysShort(mom, '') +
                        '|^' +
                        this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (
                    strict &&
                    format === 'dddd' &&
                    this._fullWeekdaysParse[i].test(weekdayName)
                ) {
                    return i;
                } else if (
                    strict &&
                    format === 'ddd' &&
                    this._shortWeekdaysParse[i].test(weekdayName)
                ) {
                    return i;
                } else if (
                    strict &&
                    format === 'dd' &&
                    this._minWeekdaysParse[i].test(weekdayName)
                ) {
                    return i;
                } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        }

        // MOMENTS

        function getSetDayOfWeek(input) {
            if (!this.isValid()) {
                return input != null ? this : NaN;
            }
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                input = parseWeekday(input, this.localeData());
                return this.add(input - day, 'd');
            } else {
                return day;
            }
        }

        function getSetLocaleDayOfWeek(input) {
            if (!this.isValid()) {
                return input != null ? this : NaN;
            }
            var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
            return input == null ? weekday : this.add(input - weekday, 'd');
        }

        function getSetISODayOfWeek(input) {
            if (!this.isValid()) {
                return input != null ? this : NaN;
            }

            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.

            if (input != null) {
                var weekday = parseIsoWeekday(input, this.localeData());
                return this.day(this.day() % 7 ? weekday : weekday - 7);
            } else {
                return this.day() || 7;
            }
        }

        function weekdaysRegex(isStrict) {
            if (this._weekdaysParseExact) {
                if (!hasOwnProp(this, '_weekdaysRegex')) {
                    computeWeekdaysParse.call(this);
                }
                if (isStrict) {
                    return this._weekdaysStrictRegex;
                } else {
                    return this._weekdaysRegex;
                }
            } else {
                if (!hasOwnProp(this, '_weekdaysRegex')) {
                    this._weekdaysRegex = defaultWeekdaysRegex;
                }
                return this._weekdaysStrictRegex && isStrict
                    ? this._weekdaysStrictRegex
                    : this._weekdaysRegex;
            }
        }

        function weekdaysShortRegex(isStrict) {
            if (this._weekdaysParseExact) {
                if (!hasOwnProp(this, '_weekdaysRegex')) {
                    computeWeekdaysParse.call(this);
                }
                if (isStrict) {
                    return this._weekdaysShortStrictRegex;
                } else {
                    return this._weekdaysShortRegex;
                }
            } else {
                if (!hasOwnProp(this, '_weekdaysShortRegex')) {
                    this._weekdaysShortRegex = defaultWeekdaysShortRegex;
                }
                return this._weekdaysShortStrictRegex && isStrict
                    ? this._weekdaysShortStrictRegex
                    : this._weekdaysShortRegex;
            }
        }

        function weekdaysMinRegex(isStrict) {
            if (this._weekdaysParseExact) {
                if (!hasOwnProp(this, '_weekdaysRegex')) {
                    computeWeekdaysParse.call(this);
                }
                if (isStrict) {
                    return this._weekdaysMinStrictRegex;
                } else {
                    return this._weekdaysMinRegex;
                }
            } else {
                if (!hasOwnProp(this, '_weekdaysMinRegex')) {
                    this._weekdaysMinRegex = defaultWeekdaysMinRegex;
                }
                return this._weekdaysMinStrictRegex && isStrict
                    ? this._weekdaysMinStrictRegex
                    : this._weekdaysMinRegex;
            }
        }

        function computeWeekdaysParse() {
            function cmpLenRev(a, b) {
                return b.length - a.length;
            }

            var minPieces = [],
                shortPieces = [],
                longPieces = [],
                mixedPieces = [],
                i,
                mom,
                minp,
                shortp,
                longp;
            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                mom = createUTC([2000, 1]).day(i);
                minp = regexEscape(this.weekdaysMin(mom, ''));
                shortp = regexEscape(this.weekdaysShort(mom, ''));
                longp = regexEscape(this.weekdays(mom, ''));
                minPieces.push(minp);
                shortPieces.push(shortp);
                longPieces.push(longp);
                mixedPieces.push(minp);
                mixedPieces.push(shortp);
                mixedPieces.push(longp);
            }
            // Sorting makes sure if one weekday (or abbr) is a prefix of another it
            // will match the longer piece.
            minPieces.sort(cmpLenRev);
            shortPieces.sort(cmpLenRev);
            longPieces.sort(cmpLenRev);
            mixedPieces.sort(cmpLenRev);

            this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
            this._weekdaysShortRegex = this._weekdaysRegex;
            this._weekdaysMinRegex = this._weekdaysRegex;

            this._weekdaysStrictRegex = new RegExp(
                '^(' + longPieces.join('|') + ')',
                'i'
            );
            this._weekdaysShortStrictRegex = new RegExp(
                '^(' + shortPieces.join('|') + ')',
                'i'
            );
            this._weekdaysMinStrictRegex = new RegExp(
                '^(' + minPieces.join('|') + ')',
                'i'
            );
        }

        // FORMATTING

        function hFormat() {
            return this.hours() % 12 || 12;
        }

        function kFormat() {
            return this.hours() || 24;
        }

        addFormatToken('H', ['HH', 2], 0, 'hour');
        addFormatToken('h', ['hh', 2], 0, hFormat);
        addFormatToken('k', ['kk', 2], 0, kFormat);

        addFormatToken('hmm', 0, 0, function () {
            return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
        });

        addFormatToken('hmmss', 0, 0, function () {
            return (
                '' +
                hFormat.apply(this) +
                zeroFill(this.minutes(), 2) +
                zeroFill(this.seconds(), 2)
            );
        });

        addFormatToken('Hmm', 0, 0, function () {
            return '' + this.hours() + zeroFill(this.minutes(), 2);
        });

        addFormatToken('Hmmss', 0, 0, function () {
            return (
                '' +
                this.hours() +
                zeroFill(this.minutes(), 2) +
                zeroFill(this.seconds(), 2)
            );
        });

        function meridiem(token, lowercase) {
            addFormatToken(token, 0, 0, function () {
                return this.localeData().meridiem(
                    this.hours(),
                    this.minutes(),
                    lowercase
                );
            });
        }

        meridiem('a', true);
        meridiem('A', false);

        // ALIASES

        addUnitAlias('hour', 'h');

        // PRIORITY
        addUnitPriority('hour', 13);

        // PARSING

        function matchMeridiem(isStrict, locale) {
            return locale._meridiemParse;
        }

        addRegexToken('a', matchMeridiem);
        addRegexToken('A', matchMeridiem);
        addRegexToken('H', match1to2);
        addRegexToken('h', match1to2);
        addRegexToken('k', match1to2);
        addRegexToken('HH', match1to2, match2);
        addRegexToken('hh', match1to2, match2);
        addRegexToken('kk', match1to2, match2);

        addRegexToken('hmm', match3to4);
        addRegexToken('hmmss', match5to6);
        addRegexToken('Hmm', match3to4);
        addRegexToken('Hmmss', match5to6);

        addParseToken(['H', 'HH'], HOUR);
        addParseToken(['k', 'kk'], function (input, array, config) {
            var kInput = toInt(input);
            array[HOUR] = kInput === 24 ? 0 : kInput;
        });
        addParseToken(['a', 'A'], function (input, array, config) {
            config._isPm = config._locale.isPM(input);
            config._meridiem = input;
        });
        addParseToken(['h', 'hh'], function (input, array, config) {
            array[HOUR] = toInt(input);
            getParsingFlags(config).bigHour = true;
        });
        addParseToken('hmm', function (input, array, config) {
            var pos = input.length - 2;
            array[HOUR] = toInt(input.substr(0, pos));
            array[MINUTE] = toInt(input.substr(pos));
            getParsingFlags(config).bigHour = true;
        });
        addParseToken('hmmss', function (input, array, config) {
            var pos1 = input.length - 4,
                pos2 = input.length - 2;
            array[HOUR] = toInt(input.substr(0, pos1));
            array[MINUTE] = toInt(input.substr(pos1, 2));
            array[SECOND] = toInt(input.substr(pos2));
            getParsingFlags(config).bigHour = true;
        });
        addParseToken('Hmm', function (input, array, config) {
            var pos = input.length - 2;
            array[HOUR] = toInt(input.substr(0, pos));
            array[MINUTE] = toInt(input.substr(pos));
        });
        addParseToken('Hmmss', function (input, array, config) {
            var pos1 = input.length - 4,
                pos2 = input.length - 2;
            array[HOUR] = toInt(input.substr(0, pos1));
            array[MINUTE] = toInt(input.substr(pos1, 2));
            array[SECOND] = toInt(input.substr(pos2));
        });

        // LOCALES

        function localeIsPM(input) {
            // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
            // Using charAt should be more compatible.
            return (input + '').toLowerCase().charAt(0) === 'p';
        }

        var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i,
            // Setting the hour should keep the time, because the user explicitly
            // specified which hour they want. So trying to maintain the same hour (in
            // a new timezone) makes sense. Adding/subtracting hours does not follow
            // this rule.
            getSetHour = makeGetSet('Hours', true);

        function localeMeridiem(hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        }

        var baseConfig = {
            calendar: defaultCalendar,
            longDateFormat: defaultLongDateFormat,
            invalidDate: defaultInvalidDate,
            ordinal: defaultOrdinal,
            dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
            relativeTime: defaultRelativeTime,

            months: defaultLocaleMonths,
            monthsShort: defaultLocaleMonthsShort,

            week: defaultLocaleWeek,

            weekdays: defaultLocaleWeekdays,
            weekdaysMin: defaultLocaleWeekdaysMin,
            weekdaysShort: defaultLocaleWeekdaysShort,

            meridiemParse: defaultLocaleMeridiemParse,
        };

        // internal storage for locale config files
        var locales = {},
            localeFamilies = {},
            globalLocale;

        function commonPrefix(arr1, arr2) {
            var i,
                minl = Math.min(arr1.length, arr2.length);
            for (i = 0; i < minl; i += 1) {
                if (arr1[i] !== arr2[i]) {
                    return i;
                }
            }
            return minl;
        }

        function normalizeLocale(key) {
            return key ? key.toLowerCase().replace('_', '-') : key;
        }

        // pick the locale from the array
        // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
        // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
        function chooseLocale(names) {
            var i = 0,
                j,
                next,
                locale,
                split;

            while (i < names.length) {
                split = normalizeLocale(names[i]).split('-');
                j = split.length;
                next = normalizeLocale(names[i + 1]);
                next = next ? next.split('-') : null;
                while (j > 0) {
                    locale = loadLocale(split.slice(0, j).join('-'));
                    if (locale) {
                        return locale;
                    }
                    if (
                        next &&
                        next.length >= j &&
                        commonPrefix(split, next) >= j - 1
                    ) {
                        //the next array item is better than a shallower substring of this one
                        break;
                    }
                    j--;
                }
                i++;
            }
            return globalLocale;
        }

        function loadLocale(name) {
            var oldLocale = null,
                aliasedRequire;
            // TODO: Find a better way to register and load all the locales in Node
            if (
                locales[name] === undefined &&
                'object' !== 'undefined' &&
                module &&
                module.exports
            ) {
                try {
                    oldLocale = globalLocale._abbr;
                    aliasedRequire = commonjsRequire;
                    aliasedRequire('./locale/' + name);
                    getSetGlobalLocale(oldLocale);
                } catch (e) {
                    // mark as not found to avoid repeating expensive file require call causing high CPU
                    // when trying to find en-US, en_US, en-us for every format call
                    locales[name] = null; // null means not found
                }
            }
            return locales[name];
        }

        // This function will load locale and then set the global locale.  If
        // no arguments are passed in, it will simply return the current global
        // locale key.
        function getSetGlobalLocale(key, values) {
            var data;
            if (key) {
                if (isUndefined(values)) {
                    data = getLocale(key);
                } else {
                    data = defineLocale(key, values);
                }

                if (data) {
                    // moment.duration._locale = moment._locale = data;
                    globalLocale = data;
                } else {
                    if (typeof console !== 'undefined' && console.warn) {
                        //warn user if arguments are passed but the locale could not be set
                        console.warn(
                            'Locale ' + key + ' not found. Did you forget to load it?'
                        );
                    }
                }
            }

            return globalLocale._abbr;
        }

        function defineLocale(name, config) {
            if (config !== null) {
                var locale,
                    parentConfig = baseConfig;
                config.abbr = name;
                if (locales[name] != null) {
                    deprecateSimple(
                        'defineLocaleOverride',
                        'use moment.updateLocale(localeName, config) to change ' +
                            'an existing locale. moment.defineLocale(localeName, ' +
                            'config) should only be used for creating a new locale ' +
                            'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.'
                    );
                    parentConfig = locales[name]._config;
                } else if (config.parentLocale != null) {
                    if (locales[config.parentLocale] != null) {
                        parentConfig = locales[config.parentLocale]._config;
                    } else {
                        locale = loadLocale(config.parentLocale);
                        if (locale != null) {
                            parentConfig = locale._config;
                        } else {
                            if (!localeFamilies[config.parentLocale]) {
                                localeFamilies[config.parentLocale] = [];
                            }
                            localeFamilies[config.parentLocale].push({
                                name: name,
                                config: config,
                            });
                            return null;
                        }
                    }
                }
                locales[name] = new Locale(mergeConfigs(parentConfig, config));

                if (localeFamilies[name]) {
                    localeFamilies[name].forEach(function (x) {
                        defineLocale(x.name, x.config);
                    });
                }

                // backwards compat for now: also set the locale
                // make sure we set the locale AFTER all child locales have been
                // created, so we won't end up with the child locale set.
                getSetGlobalLocale(name);

                return locales[name];
            } else {
                // useful for testing
                delete locales[name];
                return null;
            }
        }

        function updateLocale(name, config) {
            if (config != null) {
                var locale,
                    tmpLocale,
                    parentConfig = baseConfig;

                if (locales[name] != null && locales[name].parentLocale != null) {
                    // Update existing child locale in-place to avoid memory-leaks
                    locales[name].set(mergeConfigs(locales[name]._config, config));
                } else {
                    // MERGE
                    tmpLocale = loadLocale(name);
                    if (tmpLocale != null) {
                        parentConfig = tmpLocale._config;
                    }
                    config = mergeConfigs(parentConfig, config);
                    if (tmpLocale == null) {
                        // updateLocale is called for creating a new locale
                        // Set abbr so it will have a name (getters return
                        // undefined otherwise).
                        config.abbr = name;
                    }
                    locale = new Locale(config);
                    locale.parentLocale = locales[name];
                    locales[name] = locale;
                }

                // backwards compat for now: also set the locale
                getSetGlobalLocale(name);
            } else {
                // pass null for config to unupdate, useful for tests
                if (locales[name] != null) {
                    if (locales[name].parentLocale != null) {
                        locales[name] = locales[name].parentLocale;
                        if (name === getSetGlobalLocale()) {
                            getSetGlobalLocale(name);
                        }
                    } else if (locales[name] != null) {
                        delete locales[name];
                    }
                }
            }
            return locales[name];
        }

        // returns locale data
        function getLocale(key) {
            var locale;

            if (key && key._locale && key._locale._abbr) {
                key = key._locale._abbr;
            }

            if (!key) {
                return globalLocale;
            }

            if (!isArray(key)) {
                //short-circuit everything else
                locale = loadLocale(key);
                if (locale) {
                    return locale;
                }
                key = [key];
            }

            return chooseLocale(key);
        }

        function listLocales() {
            return keys(locales);
        }

        function checkOverflow(m) {
            var overflow,
                a = m._a;

            if (a && getParsingFlags(m).overflow === -2) {
                overflow =
                    a[MONTH] < 0 || a[MONTH] > 11
                        ? MONTH
                        : a[DATE] < 1 || a[DATE] > daysInMonth(a[YEAR], a[MONTH])
                        ? DATE
                        : a[HOUR] < 0 ||
                          a[HOUR] > 24 ||
                          (a[HOUR] === 24 &&
                              (a[MINUTE] !== 0 ||
                                  a[SECOND] !== 0 ||
                                  a[MILLISECOND] !== 0))
                        ? HOUR
                        : a[MINUTE] < 0 || a[MINUTE] > 59
                        ? MINUTE
                        : a[SECOND] < 0 || a[SECOND] > 59
                        ? SECOND
                        : a[MILLISECOND] < 0 || a[MILLISECOND] > 999
                        ? MILLISECOND
                        : -1;

                if (
                    getParsingFlags(m)._overflowDayOfYear &&
                    (overflow < YEAR || overflow > DATE)
                ) {
                    overflow = DATE;
                }
                if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
                    overflow = WEEK;
                }
                if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
                    overflow = WEEKDAY;
                }

                getParsingFlags(m).overflow = overflow;
            }

            return m;
        }

        // iso 8601 regex
        // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
        var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
            basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d|))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
            tzRegex = /Z|[+-]\d\d(?::?\d\d)?/,
            isoDates = [
                ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
                ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
                ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
                ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
                ['YYYY-DDD', /\d{4}-\d{3}/],
                ['YYYY-MM', /\d{4}-\d\d/, false],
                ['YYYYYYMMDD', /[+-]\d{10}/],
                ['YYYYMMDD', /\d{8}/],
                ['GGGG[W]WWE', /\d{4}W\d{3}/],
                ['GGGG[W]WW', /\d{4}W\d{2}/, false],
                ['YYYYDDD', /\d{7}/],
                ['YYYYMM', /\d{6}/, false],
                ['YYYY', /\d{4}/, false],
            ],
            // iso time formats and regexes
            isoTimes = [
                ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
                ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
                ['HH:mm:ss', /\d\d:\d\d:\d\d/],
                ['HH:mm', /\d\d:\d\d/],
                ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
                ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
                ['HHmmss', /\d\d\d\d\d\d/],
                ['HHmm', /\d\d\d\d/],
                ['HH', /\d\d/],
            ],
            aspNetJsonRegex = /^\/?Date\((-?\d+)/i,
            // RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
            rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/,
            obsOffsets = {
                UT: 0,
                GMT: 0,
                EDT: -4 * 60,
                EST: -5 * 60,
                CDT: -5 * 60,
                CST: -6 * 60,
                MDT: -6 * 60,
                MST: -7 * 60,
                PDT: -7 * 60,
                PST: -8 * 60,
            };

        // date from iso format
        function configFromISO(config) {
            var i,
                l,
                string = config._i,
                match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
                allowTime,
                dateFormat,
                timeFormat,
                tzFormat;

            if (match) {
                getParsingFlags(config).iso = true;

                for (i = 0, l = isoDates.length; i < l; i++) {
                    if (isoDates[i][1].exec(match[1])) {
                        dateFormat = isoDates[i][0];
                        allowTime = isoDates[i][2] !== false;
                        break;
                    }
                }
                if (dateFormat == null) {
                    config._isValid = false;
                    return;
                }
                if (match[3]) {
                    for (i = 0, l = isoTimes.length; i < l; i++) {
                        if (isoTimes[i][1].exec(match[3])) {
                            // match[2] should be 'T' or space
                            timeFormat = (match[2] || ' ') + isoTimes[i][0];
                            break;
                        }
                    }
                    if (timeFormat == null) {
                        config._isValid = false;
                        return;
                    }
                }
                if (!allowTime && timeFormat != null) {
                    config._isValid = false;
                    return;
                }
                if (match[4]) {
                    if (tzRegex.exec(match[4])) {
                        tzFormat = 'Z';
                    } else {
                        config._isValid = false;
                        return;
                    }
                }
                config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
                configFromStringAndFormat(config);
            } else {
                config._isValid = false;
            }
        }

        function extractFromRFC2822Strings(
            yearStr,
            monthStr,
            dayStr,
            hourStr,
            minuteStr,
            secondStr
        ) {
            var result = [
                untruncateYear(yearStr),
                defaultLocaleMonthsShort.indexOf(monthStr),
                parseInt(dayStr, 10),
                parseInt(hourStr, 10),
                parseInt(minuteStr, 10),
            ];

            if (secondStr) {
                result.push(parseInt(secondStr, 10));
            }

            return result;
        }

        function untruncateYear(yearStr) {
            var year = parseInt(yearStr, 10);
            if (year <= 49) {
                return 2000 + year;
            } else if (year <= 999) {
                return 1900 + year;
            }
            return year;
        }

        function preprocessRFC2822(s) {
            // Remove comments and folding whitespace and replace multiple-spaces with a single space
            return s
                .replace(/\([^)]*\)|[\n\t]/g, ' ')
                .replace(/(\s\s+)/g, ' ')
                .replace(/^\s\s*/, '')
                .replace(/\s\s*$/, '');
        }

        function checkWeekday(weekdayStr, parsedInput, config) {
            if (weekdayStr) {
                // TODO: Replace the vanilla JS Date object with an independent day-of-week check.
                var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr),
                    weekdayActual = new Date(
                        parsedInput[0],
                        parsedInput[1],
                        parsedInput[2]
                    ).getDay();
                if (weekdayProvided !== weekdayActual) {
                    getParsingFlags(config).weekdayMismatch = true;
                    config._isValid = false;
                    return false;
                }
            }
            return true;
        }

        function calculateOffset(obsOffset, militaryOffset, numOffset) {
            if (obsOffset) {
                return obsOffsets[obsOffset];
            } else if (militaryOffset) {
                // the only allowed military tz is Z
                return 0;
            } else {
                var hm = parseInt(numOffset, 10),
                    m = hm % 100,
                    h = (hm - m) / 100;
                return h * 60 + m;
            }
        }

        // date and time from ref 2822 format
        function configFromRFC2822(config) {
            var match = rfc2822.exec(preprocessRFC2822(config._i)),
                parsedArray;
            if (match) {
                parsedArray = extractFromRFC2822Strings(
                    match[4],
                    match[3],
                    match[2],
                    match[5],
                    match[6],
                    match[7]
                );
                if (!checkWeekday(match[1], parsedArray, config)) {
                    return;
                }

                config._a = parsedArray;
                config._tzm = calculateOffset(match[8], match[9], match[10]);

                config._d = createUTCDate.apply(null, config._a);
                config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);

                getParsingFlags(config).rfc2822 = true;
            } else {
                config._isValid = false;
            }
        }

        // date from 1) ASP.NET, 2) ISO, 3) RFC 2822 formats, or 4) optional fallback if parsing isn't strict
        function configFromString(config) {
            var matched = aspNetJsonRegex.exec(config._i);
            if (matched !== null) {
                config._d = new Date(+matched[1]);
                return;
            }

            configFromISO(config);
            if (config._isValid === false) {
                delete config._isValid;
            } else {
                return;
            }

            configFromRFC2822(config);
            if (config._isValid === false) {
                delete config._isValid;
            } else {
                return;
            }

            if (config._strict) {
                config._isValid = false;
            } else {
                // Final attempt, use Input Fallback
                hooks.createFromInputFallback(config);
            }
        }

        hooks.createFromInputFallback = deprecate(
            'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
                'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
                'discouraged. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.',
            function (config) {
                config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
            }
        );

        // Pick the first defined of two or three arguments.
        function defaults(a, b, c) {
            if (a != null) {
                return a;
            }
            if (b != null) {
                return b;
            }
            return c;
        }

        function currentDateArray(config) {
            // hooks is actually the exported moment object
            var nowValue = new Date(hooks.now());
            if (config._useUTC) {
                return [
                    nowValue.getUTCFullYear(),
                    nowValue.getUTCMonth(),
                    nowValue.getUTCDate(),
                ];
            }
            return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
        }

        // convert an array to a date.
        // the array should mirror the parameters below
        // note: all values past the year are optional and will default to the lowest possible value.
        // [year, month, day , hour, minute, second, millisecond]
        function configFromArray(config) {
            var i,
                date,
                input = [],
                currentDate,
                expectedWeekday,
                yearToUse;

            if (config._d) {
                return;
            }

            currentDate = currentDateArray(config);

            //compute day of the year from weeks and weekdays
            if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
                dayOfYearFromWeekInfo(config);
            }

            //if the day of the year is set, figure out what it is
            if (config._dayOfYear != null) {
                yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

                if (
                    config._dayOfYear > daysInYear(yearToUse) ||
                    config._dayOfYear === 0
                ) {
                    getParsingFlags(config)._overflowDayOfYear = true;
                }

                date = createUTCDate(yearToUse, 0, config._dayOfYear);
                config._a[MONTH] = date.getUTCMonth();
                config._a[DATE] = date.getUTCDate();
            }

            // Default to current date.
            // * if no year, month, day of month are given, default to today
            // * if day of month is given, default month and year
            // * if month is given, default only year
            // * if year is given, don't default anything
            for (i = 0; i < 3 && config._a[i] == null; ++i) {
                config._a[i] = input[i] = currentDate[i];
            }

            // Zero out whatever was not defaulted, including time
            for (; i < 7; i++) {
                config._a[i] = input[i] =
                    config._a[i] == null ? (i === 2 ? 1 : 0) : config._a[i];
            }

            // Check for 24:00:00.000
            if (
                config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0
            ) {
                config._nextDay = true;
                config._a[HOUR] = 0;
            }

            config._d = (config._useUTC ? createUTCDate : createDate).apply(
                null,
                input
            );
            expectedWeekday = config._useUTC
                ? config._d.getUTCDay()
                : config._d.getDay();

            // Apply timezone offset from input. The actual utcOffset can be changed
            // with parseZone.
            if (config._tzm != null) {
                config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
            }

            if (config._nextDay) {
                config._a[HOUR] = 24;
            }

            // check for mismatching day of week
            if (
                config._w &&
                typeof config._w.d !== 'undefined' &&
                config._w.d !== expectedWeekday
            ) {
                getParsingFlags(config).weekdayMismatch = true;
            }
        }

        function dayOfYearFromWeekInfo(config) {
            var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow, curWeek;

            w = config._w;
            if (w.GG != null || w.W != null || w.E != null) {
                dow = 1;
                doy = 4;

                // TODO: We need to take the current isoWeekYear, but that depends on
                // how we interpret now (local, utc, fixed offset). So create
                // a now version of current config (take local/utc/offset flags, and
                // create now).
                weekYear = defaults(
                    w.GG,
                    config._a[YEAR],
                    weekOfYear(createLocal(), 1, 4).year
                );
                week = defaults(w.W, 1);
                weekday = defaults(w.E, 1);
                if (weekday < 1 || weekday > 7) {
                    weekdayOverflow = true;
                }
            } else {
                dow = config._locale._week.dow;
                doy = config._locale._week.doy;

                curWeek = weekOfYear(createLocal(), dow, doy);

                weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

                // Default to current week.
                week = defaults(w.w, curWeek.week);

                if (w.d != null) {
                    // weekday -- low day numbers are considered next week
                    weekday = w.d;
                    if (weekday < 0 || weekday > 6) {
                        weekdayOverflow = true;
                    }
                } else if (w.e != null) {
                    // local weekday -- counting starts from beginning of week
                    weekday = w.e + dow;
                    if (w.e < 0 || w.e > 6) {
                        weekdayOverflow = true;
                    }
                } else {
                    // default to beginning of week
                    weekday = dow;
                }
            }
            if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
                getParsingFlags(config)._overflowWeeks = true;
            } else if (weekdayOverflow != null) {
                getParsingFlags(config)._overflowWeekday = true;
            } else {
                temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
                config._a[YEAR] = temp.year;
                config._dayOfYear = temp.dayOfYear;
            }
        }

        // constant that refers to the ISO standard
        hooks.ISO_8601 = function () {};

        // constant that refers to the RFC 2822 form
        hooks.RFC_2822 = function () {};

        // date from string and format string
        function configFromStringAndFormat(config) {
            // TODO: Move this to another part of the creation flow to prevent circular deps
            if (config._f === hooks.ISO_8601) {
                configFromISO(config);
                return;
            }
            if (config._f === hooks.RFC_2822) {
                configFromRFC2822(config);
                return;
            }
            config._a = [];
            getParsingFlags(config).empty = true;

            // This array is used to make a Date, either with `new Date` or `Date.UTC`
            var string = '' + config._i,
                i,
                parsedInput,
                tokens,
                token,
                skipped,
                stringLength = string.length,
                totalParsedInputLength = 0,
                era;

            tokens =
                expandFormat(config._f, config._locale).match(formattingTokens) || [];

            for (i = 0; i < tokens.length; i++) {
                token = tokens[i];
                parsedInput = (string.match(getParseRegexForToken(token, config)) ||
                    [])[0];
                if (parsedInput) {
                    skipped = string.substr(0, string.indexOf(parsedInput));
                    if (skipped.length > 0) {
                        getParsingFlags(config).unusedInput.push(skipped);
                    }
                    string = string.slice(
                        string.indexOf(parsedInput) + parsedInput.length
                    );
                    totalParsedInputLength += parsedInput.length;
                }
                // don't parse if it's not a known token
                if (formatTokenFunctions[token]) {
                    if (parsedInput) {
                        getParsingFlags(config).empty = false;
                    } else {
                        getParsingFlags(config).unusedTokens.push(token);
                    }
                    addTimeToArrayFromToken(token, parsedInput, config);
                } else if (config._strict && !parsedInput) {
                    getParsingFlags(config).unusedTokens.push(token);
                }
            }

            // add remaining unparsed input length to the string
            getParsingFlags(config).charsLeftOver =
                stringLength - totalParsedInputLength;
            if (string.length > 0) {
                getParsingFlags(config).unusedInput.push(string);
            }

            // clear _12h flag if hour is <= 12
            if (
                config._a[HOUR] <= 12 &&
                getParsingFlags(config).bigHour === true &&
                config._a[HOUR] > 0
            ) {
                getParsingFlags(config).bigHour = undefined;
            }

            getParsingFlags(config).parsedDateParts = config._a.slice(0);
            getParsingFlags(config).meridiem = config._meridiem;
            // handle meridiem
            config._a[HOUR] = meridiemFixWrap(
                config._locale,
                config._a[HOUR],
                config._meridiem
            );

            // handle era
            era = getParsingFlags(config).era;
            if (era !== null) {
                config._a[YEAR] = config._locale.erasConvertYear(era, config._a[YEAR]);
            }

            configFromArray(config);
            checkOverflow(config);
        }

        function meridiemFixWrap(locale, hour, meridiem) {
            var isPm;

            if (meridiem == null) {
                // nothing to do
                return hour;
            }
            if (locale.meridiemHour != null) {
                return locale.meridiemHour(hour, meridiem);
            } else if (locale.isPM != null) {
                // Fallback
                isPm = locale.isPM(meridiem);
                if (isPm && hour < 12) {
                    hour += 12;
                }
                if (!isPm && hour === 12) {
                    hour = 0;
                }
                return hour;
            } else {
                // this is not supposed to happen
                return hour;
            }
        }

        // date from string and array of format strings
        function configFromStringAndArray(config) {
            var tempConfig,
                bestMoment,
                scoreToBeat,
                i,
                currentScore,
                validFormatFound,
                bestFormatIsValid = false;

            if (config._f.length === 0) {
                getParsingFlags(config).invalidFormat = true;
                config._d = new Date(NaN);
                return;
            }

            for (i = 0; i < config._f.length; i++) {
                currentScore = 0;
                validFormatFound = false;
                tempConfig = copyConfig({}, config);
                if (config._useUTC != null) {
                    tempConfig._useUTC = config._useUTC;
                }
                tempConfig._f = config._f[i];
                configFromStringAndFormat(tempConfig);

                if (isValid(tempConfig)) {
                    validFormatFound = true;
                }

                // if there is any input that was not parsed add a penalty for that format
                currentScore += getParsingFlags(tempConfig).charsLeftOver;

                //or tokens
                currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

                getParsingFlags(tempConfig).score = currentScore;

                if (!bestFormatIsValid) {
                    if (
                        scoreToBeat == null ||
                        currentScore < scoreToBeat ||
                        validFormatFound
                    ) {
                        scoreToBeat = currentScore;
                        bestMoment = tempConfig;
                        if (validFormatFound) {
                            bestFormatIsValid = true;
                        }
                    }
                } else {
                    if (currentScore < scoreToBeat) {
                        scoreToBeat = currentScore;
                        bestMoment = tempConfig;
                    }
                }
            }

            extend(config, bestMoment || tempConfig);
        }

        function configFromObject(config) {
            if (config._d) {
                return;
            }

            var i = normalizeObjectUnits(config._i),
                dayOrDate = i.day === undefined ? i.date : i.day;
            config._a = map(
                [i.year, i.month, dayOrDate, i.hour, i.minute, i.second, i.millisecond],
                function (obj) {
                    return obj && parseInt(obj, 10);
                }
            );

            configFromArray(config);
        }

        function createFromConfig(config) {
            var res = new Moment(checkOverflow(prepareConfig(config)));
            if (res._nextDay) {
                // Adding is smart enough around DST
                res.add(1, 'd');
                res._nextDay = undefined;
            }

            return res;
        }

        function prepareConfig(config) {
            var input = config._i,
                format = config._f;

            config._locale = config._locale || getLocale(config._l);

            if (input === null || (format === undefined && input === '')) {
                return createInvalid({ nullInput: true });
            }

            if (typeof input === 'string') {
                config._i = input = config._locale.preparse(input);
            }

            if (isMoment(input)) {
                return new Moment(checkOverflow(input));
            } else if (isDate(input)) {
                config._d = input;
            } else if (isArray(format)) {
                configFromStringAndArray(config);
            } else if (format) {
                configFromStringAndFormat(config);
            } else {
                configFromInput(config);
            }

            if (!isValid(config)) {
                config._d = null;
            }

            return config;
        }

        function configFromInput(config) {
            var input = config._i;
            if (isUndefined(input)) {
                config._d = new Date(hooks.now());
            } else if (isDate(input)) {
                config._d = new Date(input.valueOf());
            } else if (typeof input === 'string') {
                configFromString(config);
            } else if (isArray(input)) {
                config._a = map(input.slice(0), function (obj) {
                    return parseInt(obj, 10);
                });
                configFromArray(config);
            } else if (isObject(input)) {
                configFromObject(config);
            } else if (isNumber(input)) {
                // from milliseconds
                config._d = new Date(input);
            } else {
                hooks.createFromInputFallback(config);
            }
        }

        function createLocalOrUTC(input, format, locale, strict, isUTC) {
            var c = {};

            if (format === true || format === false) {
                strict = format;
                format = undefined;
            }

            if (locale === true || locale === false) {
                strict = locale;
                locale = undefined;
            }

            if (
                (isObject(input) && isObjectEmpty(input)) ||
                (isArray(input) && input.length === 0)
            ) {
                input = undefined;
            }
            // object construction must be done this way.
            // https://github.com/moment/moment/issues/1423
            c._isAMomentObject = true;
            c._useUTC = c._isUTC = isUTC;
            c._l = locale;
            c._i = input;
            c._f = format;
            c._strict = strict;

            return createFromConfig(c);
        }

        function createLocal(input, format, locale, strict) {
            return createLocalOrUTC(input, format, locale, strict, false);
        }

        var prototypeMin = deprecate(
                'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
                function () {
                    var other = createLocal.apply(null, arguments);
                    if (this.isValid() && other.isValid()) {
                        return other < this ? this : other;
                    } else {
                        return createInvalid();
                    }
                }
            ),
            prototypeMax = deprecate(
                'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
                function () {
                    var other = createLocal.apply(null, arguments);
                    if (this.isValid() && other.isValid()) {
                        return other > this ? this : other;
                    } else {
                        return createInvalid();
                    }
                }
            );

        // Pick a moment m from moments so that m[fn](other) is true for all
        // other. This relies on the function fn to be transitive.
        //
        // moments should either be an array of moment objects or an array, whose
        // first element is an array of moment objects.
        function pickBy(fn, moments) {
            var res, i;
            if (moments.length === 1 && isArray(moments[0])) {
                moments = moments[0];
            }
            if (!moments.length) {
                return createLocal();
            }
            res = moments[0];
            for (i = 1; i < moments.length; ++i) {
                if (!moments[i].isValid() || moments[i][fn](res)) {
                    res = moments[i];
                }
            }
            return res;
        }

        // TODO: Use [].sort instead?
        function min() {
            var args = [].slice.call(arguments, 0);

            return pickBy('isBefore', args);
        }

        function max() {
            var args = [].slice.call(arguments, 0);

            return pickBy('isAfter', args);
        }

        var now = function () {
            return Date.now ? Date.now() : +new Date();
        };

        var ordering = [
            'year',
            'quarter',
            'month',
            'week',
            'day',
            'hour',
            'minute',
            'second',
            'millisecond',
        ];

        function isDurationValid(m) {
            var key,
                unitHasDecimal = false,
                i;
            for (key in m) {
                if (
                    hasOwnProp(m, key) &&
                    !(
                        indexOf.call(ordering, key) !== -1 &&
                        (m[key] == null || !isNaN(m[key]))
                    )
                ) {
                    return false;
                }
            }

            for (i = 0; i < ordering.length; ++i) {
                if (m[ordering[i]]) {
                    if (unitHasDecimal) {
                        return false; // only allow non-integers for smallest unit
                    }
                    if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
                        unitHasDecimal = true;
                    }
                }
            }

            return true;
        }

        function isValid$1() {
            return this._isValid;
        }

        function createInvalid$1() {
            return createDuration(NaN);
        }

        function Duration(duration) {
            var normalizedInput = normalizeObjectUnits(duration),
                years = normalizedInput.year || 0,
                quarters = normalizedInput.quarter || 0,
                months = normalizedInput.month || 0,
                weeks = normalizedInput.week || normalizedInput.isoWeek || 0,
                days = normalizedInput.day || 0,
                hours = normalizedInput.hour || 0,
                minutes = normalizedInput.minute || 0,
                seconds = normalizedInput.second || 0,
                milliseconds = normalizedInput.millisecond || 0;

            this._isValid = isDurationValid(normalizedInput);

            // representation for dateAddRemove
            this._milliseconds =
                +milliseconds +
                seconds * 1e3 + // 1000
                minutes * 6e4 + // 1000 * 60
                hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
            // Because of dateAddRemove treats 24 hours as different from a
            // day when working around DST, we need to store them separately
            this._days = +days + weeks * 7;
            // It is impossible to translate months into days without knowing
            // which months you are are talking about, so we have to store
            // it separately.
            this._months = +months + quarters * 3 + years * 12;

            this._data = {};

            this._locale = getLocale();

            this._bubble();
        }

        function isDuration(obj) {
            return obj instanceof Duration;
        }

        function absRound(number) {
            if (number < 0) {
                return Math.round(-1 * number) * -1;
            } else {
                return Math.round(number);
            }
        }

        // compare two arrays, return the number of differences
        function compareArrays(array1, array2, dontConvert) {
            var len = Math.min(array1.length, array2.length),
                lengthDiff = Math.abs(array1.length - array2.length),
                diffs = 0,
                i;
            for (i = 0; i < len; i++) {
                if (
                    (dontConvert && array1[i] !== array2[i]) ||
                    (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))
                ) {
                    diffs++;
                }
            }
            return diffs + lengthDiff;
        }

        // FORMATTING

        function offset(token, separator) {
            addFormatToken(token, 0, 0, function () {
                var offset = this.utcOffset(),
                    sign = '+';
                if (offset < 0) {
                    offset = -offset;
                    sign = '-';
                }
                return (
                    sign +
                    zeroFill(~~(offset / 60), 2) +
                    separator +
                    zeroFill(~~offset % 60, 2)
                );
            });
        }

        offset('Z', ':');
        offset('ZZ', '');

        // PARSING

        addRegexToken('Z', matchShortOffset);
        addRegexToken('ZZ', matchShortOffset);
        addParseToken(['Z', 'ZZ'], function (input, array, config) {
            config._useUTC = true;
            config._tzm = offsetFromString(matchShortOffset, input);
        });

        // HELPERS

        // timezone chunker
        // '+10:00' > ['10',  '00']
        // '-1530'  > ['-15', '30']
        var chunkOffset = /([\+\-]|\d\d)/gi;

        function offsetFromString(matcher, string) {
            var matches = (string || '').match(matcher),
                chunk,
                parts,
                minutes;

            if (matches === null) {
                return null;
            }

            chunk = matches[matches.length - 1] || [];
            parts = (chunk + '').match(chunkOffset) || ['-', 0, 0];
            minutes = +(parts[1] * 60) + toInt(parts[2]);

            return minutes === 0 ? 0 : parts[0] === '+' ? minutes : -minutes;
        }

        // Return a moment from input, that is local/utc/zone equivalent to model.
        function cloneWithOffset(input, model) {
            var res, diff;
            if (model._isUTC) {
                res = model.clone();
                diff =
                    (isMoment(input) || isDate(input)
                        ? input.valueOf()
                        : createLocal(input).valueOf()) - res.valueOf();
                // Use low-level api, because this fn is low-level api.
                res._d.setTime(res._d.valueOf() + diff);
                hooks.updateOffset(res, false);
                return res;
            } else {
                return createLocal(input).local();
            }
        }

        function getDateOffset(m) {
            // On Firefox.24 Date#getTimezoneOffset returns a floating point.
            // https://github.com/moment/moment/pull/1871
            return -Math.round(m._d.getTimezoneOffset());
        }

        // HOOKS

        // This function will be called whenever a moment is mutated.
        // It is intended to keep the offset in sync with the timezone.
        hooks.updateOffset = function () {};

        // MOMENTS

        // keepLocalTime = true means only change the timezone, without
        // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
        // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
        // +0200, so we adjust the time as needed, to be valid.
        //
        // Keeping the time actually adds/subtracts (one hour)
        // from the actual represented time. That is why we call updateOffset
        // a second time. In case it wants us to change the offset again
        // _changeInProgress == true case, then we have to adjust, because
        // there is no such time in the given timezone.
        function getSetOffset(input, keepLocalTime, keepMinutes) {
            var offset = this._offset || 0,
                localAdjust;
            if (!this.isValid()) {
                return input != null ? this : NaN;
            }
            if (input != null) {
                if (typeof input === 'string') {
                    input = offsetFromString(matchShortOffset, input);
                    if (input === null) {
                        return this;
                    }
                } else if (Math.abs(input) < 16 && !keepMinutes) {
                    input = input * 60;
                }
                if (!this._isUTC && keepLocalTime) {
                    localAdjust = getDateOffset(this);
                }
                this._offset = input;
                this._isUTC = true;
                if (localAdjust != null) {
                    this.add(localAdjust, 'm');
                }
                if (offset !== input) {
                    if (!keepLocalTime || this._changeInProgress) {
                        addSubtract(
                            this,
                            createDuration(input - offset, 'm'),
                            1,
                            false
                        );
                    } else if (!this._changeInProgress) {
                        this._changeInProgress = true;
                        hooks.updateOffset(this, true);
                        this._changeInProgress = null;
                    }
                }
                return this;
            } else {
                return this._isUTC ? offset : getDateOffset(this);
            }
        }

        function getSetZone(input, keepLocalTime) {
            if (input != null) {
                if (typeof input !== 'string') {
                    input = -input;
                }

                this.utcOffset(input, keepLocalTime);

                return this;
            } else {
                return -this.utcOffset();
            }
        }

        function setOffsetToUTC(keepLocalTime) {
            return this.utcOffset(0, keepLocalTime);
        }

        function setOffsetToLocal(keepLocalTime) {
            if (this._isUTC) {
                this.utcOffset(0, keepLocalTime);
                this._isUTC = false;

                if (keepLocalTime) {
                    this.subtract(getDateOffset(this), 'm');
                }
            }
            return this;
        }

        function setOffsetToParsedOffset() {
            if (this._tzm != null) {
                this.utcOffset(this._tzm, false, true);
            } else if (typeof this._i === 'string') {
                var tZone = offsetFromString(matchOffset, this._i);
                if (tZone != null) {
                    this.utcOffset(tZone);
                } else {
                    this.utcOffset(0, true);
                }
            }
            return this;
        }

        function hasAlignedHourOffset(input) {
            if (!this.isValid()) {
                return false;
            }
            input = input ? createLocal(input).utcOffset() : 0;

            return (this.utcOffset() - input) % 60 === 0;
        }

        function isDaylightSavingTime() {
            return (
                this.utcOffset() > this.clone().month(0).utcOffset() ||
                this.utcOffset() > this.clone().month(5).utcOffset()
            );
        }

        function isDaylightSavingTimeShifted() {
            if (!isUndefined(this._isDSTShifted)) {
                return this._isDSTShifted;
            }

            var c = {},
                other;

            copyConfig(c, this);
            c = prepareConfig(c);

            if (c._a) {
                other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
                this._isDSTShifted =
                    this.isValid() && compareArrays(c._a, other.toArray()) > 0;
            } else {
                this._isDSTShifted = false;
            }

            return this._isDSTShifted;
        }

        function isLocal() {
            return this.isValid() ? !this._isUTC : false;
        }

        function isUtcOffset() {
            return this.isValid() ? this._isUTC : false;
        }

        function isUtc() {
            return this.isValid() ? this._isUTC && this._offset === 0 : false;
        }

        // ASP.NET json date format regex
        var aspNetRegex = /^(-|\+)?(?:(\d*)[. ])?(\d+):(\d+)(?::(\d+)(\.\d*)?)?$/,
            // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
            // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
            // and further modified to allow for strings containing both week and day
            isoRegex = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

        function createDuration(input, key) {
            var duration = input,
                // matching against regexp is expensive, do it on demand
                match = null,
                sign,
                ret,
                diffRes;

            if (isDuration(input)) {
                duration = {
                    ms: input._milliseconds,
                    d: input._days,
                    M: input._months,
                };
            } else if (isNumber(input) || !isNaN(+input)) {
                duration = {};
                if (key) {
                    duration[key] = +input;
                } else {
                    duration.milliseconds = +input;
                }
            } else if ((match = aspNetRegex.exec(input))) {
                sign = match[1] === '-' ? -1 : 1;
                duration = {
                    y: 0,
                    d: toInt(match[DATE]) * sign,
                    h: toInt(match[HOUR]) * sign,
                    m: toInt(match[MINUTE]) * sign,
                    s: toInt(match[SECOND]) * sign,
                    ms: toInt(absRound(match[MILLISECOND] * 1000)) * sign, // the millisecond decimal point is included in the match
                };
            } else if ((match = isoRegex.exec(input))) {
                sign = match[1] === '-' ? -1 : 1;
                duration = {
                    y: parseIso(match[2], sign),
                    M: parseIso(match[3], sign),
                    w: parseIso(match[4], sign),
                    d: parseIso(match[5], sign),
                    h: parseIso(match[6], sign),
                    m: parseIso(match[7], sign),
                    s: parseIso(match[8], sign),
                };
            } else if (duration == null) {
                // checks for null or undefined
                duration = {};
            } else if (
                typeof duration === 'object' &&
                ('from' in duration || 'to' in duration)
            ) {
                diffRes = momentsDifference(
                    createLocal(duration.from),
                    createLocal(duration.to)
                );

                duration = {};
                duration.ms = diffRes.milliseconds;
                duration.M = diffRes.months;
            }

            ret = new Duration(duration);

            if (isDuration(input) && hasOwnProp(input, '_locale')) {
                ret._locale = input._locale;
            }

            if (isDuration(input) && hasOwnProp(input, '_isValid')) {
                ret._isValid = input._isValid;
            }

            return ret;
        }

        createDuration.fn = Duration.prototype;
        createDuration.invalid = createInvalid$1;

        function parseIso(inp, sign) {
            // We'd normally use ~~inp for this, but unfortunately it also
            // converts floats to ints.
            // inp may be undefined, so careful calling replace on it.
            var res = inp && parseFloat(inp.replace(',', '.'));
            // apply sign while we're at it
            return (isNaN(res) ? 0 : res) * sign;
        }

        function positiveMomentsDifference(base, other) {
            var res = {};

            res.months =
                other.month() - base.month() + (other.year() - base.year()) * 12;
            if (base.clone().add(res.months, 'M').isAfter(other)) {
                --res.months;
            }

            res.milliseconds = +other - +base.clone().add(res.months, 'M');

            return res;
        }

        function momentsDifference(base, other) {
            var res;
            if (!(base.isValid() && other.isValid())) {
                return { milliseconds: 0, months: 0 };
            }

            other = cloneWithOffset(other, base);
            if (base.isBefore(other)) {
                res = positiveMomentsDifference(base, other);
            } else {
                res = positiveMomentsDifference(other, base);
                res.milliseconds = -res.milliseconds;
                res.months = -res.months;
            }

            return res;
        }

        // TODO: remove 'name' arg after deprecation is removed
        function createAdder(direction, name) {
            return function (val, period) {
                var dur, tmp;
                //invert the arguments, but complain about it
                if (period !== null && !isNaN(+period)) {
                    deprecateSimple(
                        name,
                        'moment().' +
                            name +
                            '(period, number) is deprecated. Please use moment().' +
                            name +
                            '(number, period). ' +
                            'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.'
                    );
                    tmp = val;
                    val = period;
                    period = tmp;
                }

                dur = createDuration(val, period);
                addSubtract(this, dur, direction);
                return this;
            };
        }

        function addSubtract(mom, duration, isAdding, updateOffset) {
            var milliseconds = duration._milliseconds,
                days = absRound(duration._days),
                months = absRound(duration._months);

            if (!mom.isValid()) {
                // No op
                return;
            }

            updateOffset = updateOffset == null ? true : updateOffset;

            if (months) {
                setMonth(mom, get(mom, 'Month') + months * isAdding);
            }
            if (days) {
                set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
            }
            if (milliseconds) {
                mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
            }
            if (updateOffset) {
                hooks.updateOffset(mom, days || months);
            }
        }

        var add = createAdder(1, 'add'),
            subtract = createAdder(-1, 'subtract');

        function isString(input) {
            return typeof input === 'string' || input instanceof String;
        }

        // type MomentInput = Moment | Date | string | number | (number | string)[] | MomentInputObject | void; // null | undefined
        function isMomentInput(input) {
            return (
                isMoment(input) ||
                isDate(input) ||
                isString(input) ||
                isNumber(input) ||
                isNumberOrStringArray(input) ||
                isMomentInputObject(input) ||
                input === null ||
                input === undefined
            );
        }

        function isMomentInputObject(input) {
            var objectTest = isObject(input) && !isObjectEmpty(input),
                propertyTest = false,
                properties = [
                    'years',
                    'year',
                    'y',
                    'months',
                    'month',
                    'M',
                    'days',
                    'day',
                    'd',
                    'dates',
                    'date',
                    'D',
                    'hours',
                    'hour',
                    'h',
                    'minutes',
                    'minute',
                    'm',
                    'seconds',
                    'second',
                    's',
                    'milliseconds',
                    'millisecond',
                    'ms',
                ],
                i,
                property;

            for (i = 0; i < properties.length; i += 1) {
                property = properties[i];
                propertyTest = propertyTest || hasOwnProp(input, property);
            }

            return objectTest && propertyTest;
        }

        function isNumberOrStringArray(input) {
            var arrayTest = isArray(input),
                dataTypeTest = false;
            if (arrayTest) {
                dataTypeTest =
                    input.filter(function (item) {
                        return !isNumber(item) && isString(input);
                    }).length === 0;
            }
            return arrayTest && dataTypeTest;
        }

        function isCalendarSpec(input) {
            var objectTest = isObject(input) && !isObjectEmpty(input),
                propertyTest = false,
                properties = [
                    'sameDay',
                    'nextDay',
                    'lastDay',
                    'nextWeek',
                    'lastWeek',
                    'sameElse',
                ],
                i,
                property;

            for (i = 0; i < properties.length; i += 1) {
                property = properties[i];
                propertyTest = propertyTest || hasOwnProp(input, property);
            }

            return objectTest && propertyTest;
        }

        function getCalendarFormat(myMoment, now) {
            var diff = myMoment.diff(now, 'days', true);
            return diff < -6
                ? 'sameElse'
                : diff < -1
                ? 'lastWeek'
                : diff < 0
                ? 'lastDay'
                : diff < 1
                ? 'sameDay'
                : diff < 2
                ? 'nextDay'
                : diff < 7
                ? 'nextWeek'
                : 'sameElse';
        }

        function calendar$1(time, formats) {
            // Support for single parameter, formats only overload to the calendar function
            if (arguments.length === 1) {
                if (!arguments[0]) {
                    time = undefined;
                    formats = undefined;
                } else if (isMomentInput(arguments[0])) {
                    time = arguments[0];
                    formats = undefined;
                } else if (isCalendarSpec(arguments[0])) {
                    formats = arguments[0];
                    time = undefined;
                }
            }
            // We want to compare the start of today, vs this.
            // Getting start-of-today depends on whether we're local/utc/offset or not.
            var now = time || createLocal(),
                sod = cloneWithOffset(now, this).startOf('day'),
                format = hooks.calendarFormat(this, sod) || 'sameElse',
                output =
                    formats &&
                    (isFunction(formats[format])
                        ? formats[format].call(this, now)
                        : formats[format]);

            return this.format(
                output || this.localeData().calendar(format, this, createLocal(now))
            );
        }

        function clone() {
            return new Moment(this);
        }

        function isAfter(input, units) {
            var localInput = isMoment(input) ? input : createLocal(input);
            if (!(this.isValid() && localInput.isValid())) {
                return false;
            }
            units = normalizeUnits(units) || 'millisecond';
            if (units === 'millisecond') {
                return this.valueOf() > localInput.valueOf();
            } else {
                return localInput.valueOf() < this.clone().startOf(units).valueOf();
            }
        }

        function isBefore(input, units) {
            var localInput = isMoment(input) ? input : createLocal(input);
            if (!(this.isValid() && localInput.isValid())) {
                return false;
            }
            units = normalizeUnits(units) || 'millisecond';
            if (units === 'millisecond') {
                return this.valueOf() < localInput.valueOf();
            } else {
                return this.clone().endOf(units).valueOf() < localInput.valueOf();
            }
        }

        function isBetween(from, to, units, inclusivity) {
            var localFrom = isMoment(from) ? from : createLocal(from),
                localTo = isMoment(to) ? to : createLocal(to);
            if (!(this.isValid() && localFrom.isValid() && localTo.isValid())) {
                return false;
            }
            inclusivity = inclusivity || '()';
            return (
                (inclusivity[0] === '('
                    ? this.isAfter(localFrom, units)
                    : !this.isBefore(localFrom, units)) &&
                (inclusivity[1] === ')'
                    ? this.isBefore(localTo, units)
                    : !this.isAfter(localTo, units))
            );
        }

        function isSame(input, units) {
            var localInput = isMoment(input) ? input : createLocal(input),
                inputMs;
            if (!(this.isValid() && localInput.isValid())) {
                return false;
            }
            units = normalizeUnits(units) || 'millisecond';
            if (units === 'millisecond') {
                return this.valueOf() === localInput.valueOf();
            } else {
                inputMs = localInput.valueOf();
                return (
                    this.clone().startOf(units).valueOf() <= inputMs &&
                    inputMs <= this.clone().endOf(units).valueOf()
                );
            }
        }

        function isSameOrAfter(input, units) {
            return this.isSame(input, units) || this.isAfter(input, units);
        }

        function isSameOrBefore(input, units) {
            return this.isSame(input, units) || this.isBefore(input, units);
        }

        function diff(input, units, asFloat) {
            var that, zoneDelta, output;

            if (!this.isValid()) {
                return NaN;
            }

            that = cloneWithOffset(input, this);

            if (!that.isValid()) {
                return NaN;
            }

            zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

            units = normalizeUnits(units);

            switch (units) {
                case 'year':
                    output = monthDiff(this, that) / 12;
                    break;
                case 'month':
                    output = monthDiff(this, that);
                    break;
                case 'quarter':
                    output = monthDiff(this, that) / 3;
                    break;
                case 'second':
                    output = (this - that) / 1e3;
                    break; // 1000
                case 'minute':
                    output = (this - that) / 6e4;
                    break; // 1000 * 60
                case 'hour':
                    output = (this - that) / 36e5;
                    break; // 1000 * 60 * 60
                case 'day':
                    output = (this - that - zoneDelta) / 864e5;
                    break; // 1000 * 60 * 60 * 24, negate dst
                case 'week':
                    output = (this - that - zoneDelta) / 6048e5;
                    break; // 1000 * 60 * 60 * 24 * 7, negate dst
                default:
                    output = this - that;
            }

            return asFloat ? output : absFloor(output);
        }

        function monthDiff(a, b) {
            if (a.date() < b.date()) {
                // end-of-month calculations work correct when the start month has more
                // days than the end month.
                return -monthDiff(b, a);
            }
            // difference in months
            var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month()),
                // b is in (anchor - 1 month, anchor + 1 month)
                anchor = a.clone().add(wholeMonthDiff, 'months'),
                anchor2,
                adjust;

            if (b - anchor < 0) {
                anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
                // linear across the month
                adjust = (b - anchor) / (anchor - anchor2);
            } else {
                anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
                // linear across the month
                adjust = (b - anchor) / (anchor2 - anchor);
            }

            //check for negative zero, return zero if negative zero
            return -(wholeMonthDiff + adjust) || 0;
        }

        hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
        hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

        function toString() {
            return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
        }

        function toISOString(keepOffset) {
            if (!this.isValid()) {
                return null;
            }
            var utc = keepOffset !== true,
                m = utc ? this.clone().utc() : this;
            if (m.year() < 0 || m.year() > 9999) {
                return formatMoment(
                    m,
                    utc
                        ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]'
                        : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ'
                );
            }
            if (isFunction(Date.prototype.toISOString)) {
                // native implementation is ~50x faster, use it when we can
                if (utc) {
                    return this.toDate().toISOString();
                } else {
                    return new Date(this.valueOf() + this.utcOffset() * 60 * 1000)
                        .toISOString()
                        .replace('Z', formatMoment(m, 'Z'));
                }
            }
            return formatMoment(
                m,
                utc ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ'
            );
        }

        /**
         * Return a human readable representation of a moment that can
         * also be evaluated to get a new moment which is the same
         *
         * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
         */
        function inspect() {
            if (!this.isValid()) {
                return 'moment.invalid(/* ' + this._i + ' */)';
            }
            var func = 'moment',
                zone = '',
                prefix,
                year,
                datetime,
                suffix;
            if (!this.isLocal()) {
                func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
                zone = 'Z';
            }
            prefix = '[' + func + '("]';
            year = 0 <= this.year() && this.year() <= 9999 ? 'YYYY' : 'YYYYYY';
            datetime = '-MM-DD[T]HH:mm:ss.SSS';
            suffix = zone + '[")]';

            return this.format(prefix + year + datetime + suffix);
        }

        function format(inputString) {
            if (!inputString) {
                inputString = this.isUtc()
                    ? hooks.defaultFormatUtc
                    : hooks.defaultFormat;
            }
            var output = formatMoment(this, inputString);
            return this.localeData().postformat(output);
        }

        function from(time, withoutSuffix) {
            if (
                this.isValid() &&
                ((isMoment(time) && time.isValid()) || createLocal(time).isValid())
            ) {
                return createDuration({ to: this, from: time })
                    .locale(this.locale())
                    .humanize(!withoutSuffix);
            } else {
                return this.localeData().invalidDate();
            }
        }

        function fromNow(withoutSuffix) {
            return this.from(createLocal(), withoutSuffix);
        }

        function to(time, withoutSuffix) {
            if (
                this.isValid() &&
                ((isMoment(time) && time.isValid()) || createLocal(time).isValid())
            ) {
                return createDuration({ from: this, to: time })
                    .locale(this.locale())
                    .humanize(!withoutSuffix);
            } else {
                return this.localeData().invalidDate();
            }
        }

        function toNow(withoutSuffix) {
            return this.to(createLocal(), withoutSuffix);
        }

        // If passed a locale key, it will set the locale for this
        // instance.  Otherwise, it will return the locale configuration
        // variables for this instance.
        function locale(key) {
            var newLocaleData;

            if (key === undefined) {
                return this._locale._abbr;
            } else {
                newLocaleData = getLocale(key);
                if (newLocaleData != null) {
                    this._locale = newLocaleData;
                }
                return this;
            }
        }

        var lang = deprecate(
            'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
            function (key) {
                if (key === undefined) {
                    return this.localeData();
                } else {
                    return this.locale(key);
                }
            }
        );

        function localeData() {
            return this._locale;
        }

        var MS_PER_SECOND = 1000,
            MS_PER_MINUTE = 60 * MS_PER_SECOND,
            MS_PER_HOUR = 60 * MS_PER_MINUTE,
            MS_PER_400_YEARS = (365 * 400 + 97) * 24 * MS_PER_HOUR;

        // actual modulo - handles negative numbers (for dates before 1970):
        function mod$1(dividend, divisor) {
            return ((dividend % divisor) + divisor) % divisor;
        }

        function localStartOfDate(y, m, d) {
            // the date constructor remaps years 0-99 to 1900-1999
            if (y < 100 && y >= 0) {
                // preserve leap years using a full 400 year cycle, then reset
                return new Date(y + 400, m, d) - MS_PER_400_YEARS;
            } else {
                return new Date(y, m, d).valueOf();
            }
        }

        function utcStartOfDate(y, m, d) {
            // Date.UTC remaps years 0-99 to 1900-1999
            if (y < 100 && y >= 0) {
                // preserve leap years using a full 400 year cycle, then reset
                return Date.UTC(y + 400, m, d) - MS_PER_400_YEARS;
            } else {
                return Date.UTC(y, m, d);
            }
        }

        function startOf(units) {
            var time, startOfDate;
            units = normalizeUnits(units);
            if (units === undefined || units === 'millisecond' || !this.isValid()) {
                return this;
            }

            startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

            switch (units) {
                case 'year':
                    time = startOfDate(this.year(), 0, 1);
                    break;
                case 'quarter':
                    time = startOfDate(
                        this.year(),
                        this.month() - (this.month() % 3),
                        1
                    );
                    break;
                case 'month':
                    time = startOfDate(this.year(), this.month(), 1);
                    break;
                case 'week':
                    time = startOfDate(
                        this.year(),
                        this.month(),
                        this.date() - this.weekday()
                    );
                    break;
                case 'isoWeek':
                    time = startOfDate(
                        this.year(),
                        this.month(),
                        this.date() - (this.isoWeekday() - 1)
                    );
                    break;
                case 'day':
                case 'date':
                    time = startOfDate(this.year(), this.month(), this.date());
                    break;
                case 'hour':
                    time = this._d.valueOf();
                    time -= mod$1(
                        time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
                        MS_PER_HOUR
                    );
                    break;
                case 'minute':
                    time = this._d.valueOf();
                    time -= mod$1(time, MS_PER_MINUTE);
                    break;
                case 'second':
                    time = this._d.valueOf();
                    time -= mod$1(time, MS_PER_SECOND);
                    break;
            }

            this._d.setTime(time);
            hooks.updateOffset(this, true);
            return this;
        }

        function endOf(units) {
            var time, startOfDate;
            units = normalizeUnits(units);
            if (units === undefined || units === 'millisecond' || !this.isValid()) {
                return this;
            }

            startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

            switch (units) {
                case 'year':
                    time = startOfDate(this.year() + 1, 0, 1) - 1;
                    break;
                case 'quarter':
                    time =
                        startOfDate(
                            this.year(),
                            this.month() - (this.month() % 3) + 3,
                            1
                        ) - 1;
                    break;
                case 'month':
                    time = startOfDate(this.year(), this.month() + 1, 1) - 1;
                    break;
                case 'week':
                    time =
                        startOfDate(
                            this.year(),
                            this.month(),
                            this.date() - this.weekday() + 7
                        ) - 1;
                    break;
                case 'isoWeek':
                    time =
                        startOfDate(
                            this.year(),
                            this.month(),
                            this.date() - (this.isoWeekday() - 1) + 7
                        ) - 1;
                    break;
                case 'day':
                case 'date':
                    time = startOfDate(this.year(), this.month(), this.date() + 1) - 1;
                    break;
                case 'hour':
                    time = this._d.valueOf();
                    time +=
                        MS_PER_HOUR -
                        mod$1(
                            time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
                            MS_PER_HOUR
                        ) -
                        1;
                    break;
                case 'minute':
                    time = this._d.valueOf();
                    time += MS_PER_MINUTE - mod$1(time, MS_PER_MINUTE) - 1;
                    break;
                case 'second':
                    time = this._d.valueOf();
                    time += MS_PER_SECOND - mod$1(time, MS_PER_SECOND) - 1;
                    break;
            }

            this._d.setTime(time);
            hooks.updateOffset(this, true);
            return this;
        }

        function valueOf() {
            return this._d.valueOf() - (this._offset || 0) * 60000;
        }

        function unix() {
            return Math.floor(this.valueOf() / 1000);
        }

        function toDate() {
            return new Date(this.valueOf());
        }

        function toArray() {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hour(),
                m.minute(),
                m.second(),
                m.millisecond(),
            ];
        }

        function toObject() {
            var m = this;
            return {
                years: m.year(),
                months: m.month(),
                date: m.date(),
                hours: m.hours(),
                minutes: m.minutes(),
                seconds: m.seconds(),
                milliseconds: m.milliseconds(),
            };
        }

        function toJSON() {
            // new Date(NaN).toJSON() === null
            return this.isValid() ? this.toISOString() : null;
        }

        function isValid$2() {
            return isValid(this);
        }

        function parsingFlags() {
            return extend({}, getParsingFlags(this));
        }

        function invalidAt() {
            return getParsingFlags(this).overflow;
        }

        function creationData() {
            return {
                input: this._i,
                format: this._f,
                locale: this._locale,
                isUTC: this._isUTC,
                strict: this._strict,
            };
        }

        addFormatToken('N', 0, 0, 'eraAbbr');
        addFormatToken('NN', 0, 0, 'eraAbbr');
        addFormatToken('NNN', 0, 0, 'eraAbbr');
        addFormatToken('NNNN', 0, 0, 'eraName');
        addFormatToken('NNNNN', 0, 0, 'eraNarrow');

        addFormatToken('y', ['y', 1], 'yo', 'eraYear');
        addFormatToken('y', ['yy', 2], 0, 'eraYear');
        addFormatToken('y', ['yyy', 3], 0, 'eraYear');
        addFormatToken('y', ['yyyy', 4], 0, 'eraYear');

        addRegexToken('N', matchEraAbbr);
        addRegexToken('NN', matchEraAbbr);
        addRegexToken('NNN', matchEraAbbr);
        addRegexToken('NNNN', matchEraName);
        addRegexToken('NNNNN', matchEraNarrow);

        addParseToken(['N', 'NN', 'NNN', 'NNNN', 'NNNNN'], function (
            input,
            array,
            config,
            token
        ) {
            var era = config._locale.erasParse(input, token, config._strict);
            if (era) {
                getParsingFlags(config).era = era;
            } else {
                getParsingFlags(config).invalidEra = input;
            }
        });

        addRegexToken('y', matchUnsigned);
        addRegexToken('yy', matchUnsigned);
        addRegexToken('yyy', matchUnsigned);
        addRegexToken('yyyy', matchUnsigned);
        addRegexToken('yo', matchEraYearOrdinal);

        addParseToken(['y', 'yy', 'yyy', 'yyyy'], YEAR);
        addParseToken(['yo'], function (input, array, config, token) {
            var match;
            if (config._locale._eraYearOrdinalRegex) {
                match = input.match(config._locale._eraYearOrdinalRegex);
            }

            if (config._locale.eraYearOrdinalParse) {
                array[YEAR] = config._locale.eraYearOrdinalParse(input, match);
            } else {
                array[YEAR] = parseInt(input, 10);
            }
        });

        function localeEras(m, format) {
            var i,
                l,
                date,
                eras = this._eras || getLocale('en')._eras;
            for (i = 0, l = eras.length; i < l; ++i) {
                switch (typeof eras[i].since) {
                    case 'string':
                        // truncate time
                        date = hooks(eras[i].since).startOf('day');
                        eras[i].since = date.valueOf();
                        break;
                }

                switch (typeof eras[i].until) {
                    case 'undefined':
                        eras[i].until = +Infinity;
                        break;
                    case 'string':
                        // truncate time
                        date = hooks(eras[i].until).startOf('day').valueOf();
                        eras[i].until = date.valueOf();
                        break;
                }
            }
            return eras;
        }

        function localeErasParse(eraName, format, strict) {
            var i,
                l,
                eras = this.eras(),
                name,
                abbr,
                narrow;
            eraName = eraName.toUpperCase();

            for (i = 0, l = eras.length; i < l; ++i) {
                name = eras[i].name.toUpperCase();
                abbr = eras[i].abbr.toUpperCase();
                narrow = eras[i].narrow.toUpperCase();

                if (strict) {
                    switch (format) {
                        case 'N':
                        case 'NN':
                        case 'NNN':
                            if (abbr === eraName) {
                                return eras[i];
                            }
                            break;

                        case 'NNNN':
                            if (name === eraName) {
                                return eras[i];
                            }
                            break;

                        case 'NNNNN':
                            if (narrow === eraName) {
                                return eras[i];
                            }
                            break;
                    }
                } else if ([name, abbr, narrow].indexOf(eraName) >= 0) {
                    return eras[i];
                }
            }
        }

        function localeErasConvertYear(era, year) {
            var dir = era.since <= era.until ? +1 : -1;
            if (year === undefined) {
                return hooks(era.since).year();
            } else {
                return hooks(era.since).year() + (year - era.offset) * dir;
            }
        }

        function getEraName() {
            var i,
                l,
                val,
                eras = this.localeData().eras();
            for (i = 0, l = eras.length; i < l; ++i) {
                // truncate time
                val = this.clone().startOf('day').valueOf();

                if (eras[i].since <= val && val <= eras[i].until) {
                    return eras[i].name;
                }
                if (eras[i].until <= val && val <= eras[i].since) {
                    return eras[i].name;
                }
            }

            return '';
        }

        function getEraNarrow() {
            var i,
                l,
                val,
                eras = this.localeData().eras();
            for (i = 0, l = eras.length; i < l; ++i) {
                // truncate time
                val = this.clone().startOf('day').valueOf();

                if (eras[i].since <= val && val <= eras[i].until) {
                    return eras[i].narrow;
                }
                if (eras[i].until <= val && val <= eras[i].since) {
                    return eras[i].narrow;
                }
            }

            return '';
        }

        function getEraAbbr() {
            var i,
                l,
                val,
                eras = this.localeData().eras();
            for (i = 0, l = eras.length; i < l; ++i) {
                // truncate time
                val = this.clone().startOf('day').valueOf();

                if (eras[i].since <= val && val <= eras[i].until) {
                    return eras[i].abbr;
                }
                if (eras[i].until <= val && val <= eras[i].since) {
                    return eras[i].abbr;
                }
            }

            return '';
        }

        function getEraYear() {
            var i,
                l,
                dir,
                val,
                eras = this.localeData().eras();
            for (i = 0, l = eras.length; i < l; ++i) {
                dir = eras[i].since <= eras[i].until ? +1 : -1;

                // truncate time
                val = this.clone().startOf('day').valueOf();

                if (
                    (eras[i].since <= val && val <= eras[i].until) ||
                    (eras[i].until <= val && val <= eras[i].since)
                ) {
                    return (
                        (this.year() - hooks(eras[i].since).year()) * dir +
                        eras[i].offset
                    );
                }
            }

            return this.year();
        }

        function erasNameRegex(isStrict) {
            if (!hasOwnProp(this, '_erasNameRegex')) {
                computeErasParse.call(this);
            }
            return isStrict ? this._erasNameRegex : this._erasRegex;
        }

        function erasAbbrRegex(isStrict) {
            if (!hasOwnProp(this, '_erasAbbrRegex')) {
                computeErasParse.call(this);
            }
            return isStrict ? this._erasAbbrRegex : this._erasRegex;
        }

        function erasNarrowRegex(isStrict) {
            if (!hasOwnProp(this, '_erasNarrowRegex')) {
                computeErasParse.call(this);
            }
            return isStrict ? this._erasNarrowRegex : this._erasRegex;
        }

        function matchEraAbbr(isStrict, locale) {
            return locale.erasAbbrRegex(isStrict);
        }

        function matchEraName(isStrict, locale) {
            return locale.erasNameRegex(isStrict);
        }

        function matchEraNarrow(isStrict, locale) {
            return locale.erasNarrowRegex(isStrict);
        }

        function matchEraYearOrdinal(isStrict, locale) {
            return locale._eraYearOrdinalRegex || matchUnsigned;
        }

        function computeErasParse() {
            var abbrPieces = [],
                namePieces = [],
                narrowPieces = [],
                mixedPieces = [],
                i,
                l,
                eras = this.eras();

            for (i = 0, l = eras.length; i < l; ++i) {
                namePieces.push(regexEscape(eras[i].name));
                abbrPieces.push(regexEscape(eras[i].abbr));
                narrowPieces.push(regexEscape(eras[i].narrow));

                mixedPieces.push(regexEscape(eras[i].name));
                mixedPieces.push(regexEscape(eras[i].abbr));
                mixedPieces.push(regexEscape(eras[i].narrow));
            }

            this._erasRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
            this._erasNameRegex = new RegExp('^(' + namePieces.join('|') + ')', 'i');
            this._erasAbbrRegex = new RegExp('^(' + abbrPieces.join('|') + ')', 'i');
            this._erasNarrowRegex = new RegExp(
                '^(' + narrowPieces.join('|') + ')',
                'i'
            );
        }

        // FORMATTING

        addFormatToken(0, ['gg', 2], 0, function () {
            return this.weekYear() % 100;
        });

        addFormatToken(0, ['GG', 2], 0, function () {
            return this.isoWeekYear() % 100;
        });

        function addWeekYearFormatToken(token, getter) {
            addFormatToken(0, [token, token.length], 0, getter);
        }

        addWeekYearFormatToken('gggg', 'weekYear');
        addWeekYearFormatToken('ggggg', 'weekYear');
        addWeekYearFormatToken('GGGG', 'isoWeekYear');
        addWeekYearFormatToken('GGGGG', 'isoWeekYear');

        // ALIASES

        addUnitAlias('weekYear', 'gg');
        addUnitAlias('isoWeekYear', 'GG');

        // PRIORITY

        addUnitPriority('weekYear', 1);
        addUnitPriority('isoWeekYear', 1);

        // PARSING

        addRegexToken('G', matchSigned);
        addRegexToken('g', matchSigned);
        addRegexToken('GG', match1to2, match2);
        addRegexToken('gg', match1to2, match2);
        addRegexToken('GGGG', match1to4, match4);
        addRegexToken('gggg', match1to4, match4);
        addRegexToken('GGGGG', match1to6, match6);
        addRegexToken('ggggg', match1to6, match6);

        addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (
            input,
            week,
            config,
            token
        ) {
            week[token.substr(0, 2)] = toInt(input);
        });

        addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
            week[token] = hooks.parseTwoDigitYear(input);
        });

        // MOMENTS

        function getSetWeekYear(input) {
            return getSetWeekYearHelper.call(
                this,
                input,
                this.week(),
                this.weekday(),
                this.localeData()._week.dow,
                this.localeData()._week.doy
            );
        }

        function getSetISOWeekYear(input) {
            return getSetWeekYearHelper.call(
                this,
                input,
                this.isoWeek(),
                this.isoWeekday(),
                1,
                4
            );
        }

        function getISOWeeksInYear() {
            return weeksInYear(this.year(), 1, 4);
        }

        function getISOWeeksInISOWeekYear() {
            return weeksInYear(this.isoWeekYear(), 1, 4);
        }

        function getWeeksInYear() {
            var weekInfo = this.localeData()._week;
            return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
        }

        function getWeeksInWeekYear() {
            var weekInfo = this.localeData()._week;
            return weeksInYear(this.weekYear(), weekInfo.dow, weekInfo.doy);
        }

        function getSetWeekYearHelper(input, week, weekday, dow, doy) {
            var weeksTarget;
            if (input == null) {
                return weekOfYear(this, dow, doy).year;
            } else {
                weeksTarget = weeksInYear(input, dow, doy);
                if (week > weeksTarget) {
                    week = weeksTarget;
                }
                return setWeekAll.call(this, input, week, weekday, dow, doy);
            }
        }

        function setWeekAll(weekYear, week, weekday, dow, doy) {
            var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
                date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

            this.year(date.getUTCFullYear());
            this.month(date.getUTCMonth());
            this.date(date.getUTCDate());
            return this;
        }

        // FORMATTING

        addFormatToken('Q', 0, 'Qo', 'quarter');

        // ALIASES

        addUnitAlias('quarter', 'Q');

        // PRIORITY

        addUnitPriority('quarter', 7);

        // PARSING

        addRegexToken('Q', match1);
        addParseToken('Q', function (input, array) {
            array[MONTH] = (toInt(input) - 1) * 3;
        });

        // MOMENTS

        function getSetQuarter(input) {
            return input == null
                ? Math.ceil((this.month() + 1) / 3)
                : this.month((input - 1) * 3 + (this.month() % 3));
        }

        // FORMATTING

        addFormatToken('D', ['DD', 2], 'Do', 'date');

        // ALIASES

        addUnitAlias('date', 'D');

        // PRIORITY
        addUnitPriority('date', 9);

        // PARSING

        addRegexToken('D', match1to2);
        addRegexToken('DD', match1to2, match2);
        addRegexToken('Do', function (isStrict, locale) {
            // TODO: Remove "ordinalParse" fallback in next major release.
            return isStrict
                ? locale._dayOfMonthOrdinalParse || locale._ordinalParse
                : locale._dayOfMonthOrdinalParseLenient;
        });

        addParseToken(['D', 'DD'], DATE);
        addParseToken('Do', function (input, array) {
            array[DATE] = toInt(input.match(match1to2)[0]);
        });

        // MOMENTS

        var getSetDayOfMonth = makeGetSet('Date', true);

        // FORMATTING

        addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

        // ALIASES

        addUnitAlias('dayOfYear', 'DDD');

        // PRIORITY
        addUnitPriority('dayOfYear', 4);

        // PARSING

        addRegexToken('DDD', match1to3);
        addRegexToken('DDDD', match3);
        addParseToken(['DDD', 'DDDD'], function (input, array, config) {
            config._dayOfYear = toInt(input);
        });

        // HELPERS

        // MOMENTS

        function getSetDayOfYear(input) {
            var dayOfYear =
                Math.round(
                    (this.clone().startOf('day') - this.clone().startOf('year')) / 864e5
                ) + 1;
            return input == null ? dayOfYear : this.add(input - dayOfYear, 'd');
        }

        // FORMATTING

        addFormatToken('m', ['mm', 2], 0, 'minute');

        // ALIASES

        addUnitAlias('minute', 'm');

        // PRIORITY

        addUnitPriority('minute', 14);

        // PARSING

        addRegexToken('m', match1to2);
        addRegexToken('mm', match1to2, match2);
        addParseToken(['m', 'mm'], MINUTE);

        // MOMENTS

        var getSetMinute = makeGetSet('Minutes', false);

        // FORMATTING

        addFormatToken('s', ['ss', 2], 0, 'second');

        // ALIASES

        addUnitAlias('second', 's');

        // PRIORITY

        addUnitPriority('second', 15);

        // PARSING

        addRegexToken('s', match1to2);
        addRegexToken('ss', match1to2, match2);
        addParseToken(['s', 'ss'], SECOND);

        // MOMENTS

        var getSetSecond = makeGetSet('Seconds', false);

        // FORMATTING

        addFormatToken('S', 0, 0, function () {
            return ~~(this.millisecond() / 100);
        });

        addFormatToken(0, ['SS', 2], 0, function () {
            return ~~(this.millisecond() / 10);
        });

        addFormatToken(0, ['SSS', 3], 0, 'millisecond');
        addFormatToken(0, ['SSSS', 4], 0, function () {
            return this.millisecond() * 10;
        });
        addFormatToken(0, ['SSSSS', 5], 0, function () {
            return this.millisecond() * 100;
        });
        addFormatToken(0, ['SSSSSS', 6], 0, function () {
            return this.millisecond() * 1000;
        });
        addFormatToken(0, ['SSSSSSS', 7], 0, function () {
            return this.millisecond() * 10000;
        });
        addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
            return this.millisecond() * 100000;
        });
        addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
            return this.millisecond() * 1000000;
        });

        // ALIASES

        addUnitAlias('millisecond', 'ms');

        // PRIORITY

        addUnitPriority('millisecond', 16);

        // PARSING

        addRegexToken('S', match1to3, match1);
        addRegexToken('SS', match1to3, match2);
        addRegexToken('SSS', match1to3, match3);

        var token, getSetMillisecond;
        for (token = 'SSSS'; token.length <= 9; token += 'S') {
            addRegexToken(token, matchUnsigned);
        }

        function parseMs(input, array) {
            array[MILLISECOND] = toInt(('0.' + input) * 1000);
        }

        for (token = 'S'; token.length <= 9; token += 'S') {
            addParseToken(token, parseMs);
        }

        getSetMillisecond = makeGetSet('Milliseconds', false);

        // FORMATTING

        addFormatToken('z', 0, 0, 'zoneAbbr');
        addFormatToken('zz', 0, 0, 'zoneName');

        // MOMENTS

        function getZoneAbbr() {
            return this._isUTC ? 'UTC' : '';
        }

        function getZoneName() {
            return this._isUTC ? 'Coordinated Universal Time' : '';
        }

        var proto = Moment.prototype;

        proto.add = add;
        proto.calendar = calendar$1;
        proto.clone = clone;
        proto.diff = diff;
        proto.endOf = endOf;
        proto.format = format;
        proto.from = from;
        proto.fromNow = fromNow;
        proto.to = to;
        proto.toNow = toNow;
        proto.get = stringGet;
        proto.invalidAt = invalidAt;
        proto.isAfter = isAfter;
        proto.isBefore = isBefore;
        proto.isBetween = isBetween;
        proto.isSame = isSame;
        proto.isSameOrAfter = isSameOrAfter;
        proto.isSameOrBefore = isSameOrBefore;
        proto.isValid = isValid$2;
        proto.lang = lang;
        proto.locale = locale;
        proto.localeData = localeData;
        proto.max = prototypeMax;
        proto.min = prototypeMin;
        proto.parsingFlags = parsingFlags;
        proto.set = stringSet;
        proto.startOf = startOf;
        proto.subtract = subtract;
        proto.toArray = toArray;
        proto.toObject = toObject;
        proto.toDate = toDate;
        proto.toISOString = toISOString;
        proto.inspect = inspect;
        if (typeof Symbol !== 'undefined' && Symbol.for != null) {
            proto[Symbol.for('nodejs.util.inspect.custom')] = function () {
                return 'Moment<' + this.format() + '>';
            };
        }
        proto.toJSON = toJSON;
        proto.toString = toString;
        proto.unix = unix;
        proto.valueOf = valueOf;
        proto.creationData = creationData;
        proto.eraName = getEraName;
        proto.eraNarrow = getEraNarrow;
        proto.eraAbbr = getEraAbbr;
        proto.eraYear = getEraYear;
        proto.year = getSetYear;
        proto.isLeapYear = getIsLeapYear;
        proto.weekYear = getSetWeekYear;
        proto.isoWeekYear = getSetISOWeekYear;
        proto.quarter = proto.quarters = getSetQuarter;
        proto.month = getSetMonth;
        proto.daysInMonth = getDaysInMonth;
        proto.week = proto.weeks = getSetWeek;
        proto.isoWeek = proto.isoWeeks = getSetISOWeek;
        proto.weeksInYear = getWeeksInYear;
        proto.weeksInWeekYear = getWeeksInWeekYear;
        proto.isoWeeksInYear = getISOWeeksInYear;
        proto.isoWeeksInISOWeekYear = getISOWeeksInISOWeekYear;
        proto.date = getSetDayOfMonth;
        proto.day = proto.days = getSetDayOfWeek;
        proto.weekday = getSetLocaleDayOfWeek;
        proto.isoWeekday = getSetISODayOfWeek;
        proto.dayOfYear = getSetDayOfYear;
        proto.hour = proto.hours = getSetHour;
        proto.minute = proto.minutes = getSetMinute;
        proto.second = proto.seconds = getSetSecond;
        proto.millisecond = proto.milliseconds = getSetMillisecond;
        proto.utcOffset = getSetOffset;
        proto.utc = setOffsetToUTC;
        proto.local = setOffsetToLocal;
        proto.parseZone = setOffsetToParsedOffset;
        proto.hasAlignedHourOffset = hasAlignedHourOffset;
        proto.isDST = isDaylightSavingTime;
        proto.isLocal = isLocal;
        proto.isUtcOffset = isUtcOffset;
        proto.isUtc = isUtc;
        proto.isUTC = isUtc;
        proto.zoneAbbr = getZoneAbbr;
        proto.zoneName = getZoneName;
        proto.dates = deprecate(
            'dates accessor is deprecated. Use date instead.',
            getSetDayOfMonth
        );
        proto.months = deprecate(
            'months accessor is deprecated. Use month instead',
            getSetMonth
        );
        proto.years = deprecate(
            'years accessor is deprecated. Use year instead',
            getSetYear
        );
        proto.zone = deprecate(
            'moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/',
            getSetZone
        );
        proto.isDSTShifted = deprecate(
            'isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information',
            isDaylightSavingTimeShifted
        );

        function createUnix(input) {
            return createLocal(input * 1000);
        }

        function createInZone() {
            return createLocal.apply(null, arguments).parseZone();
        }

        function preParsePostFormat(string) {
            return string;
        }

        var proto$1 = Locale.prototype;

        proto$1.calendar = calendar;
        proto$1.longDateFormat = longDateFormat;
        proto$1.invalidDate = invalidDate;
        proto$1.ordinal = ordinal;
        proto$1.preparse = preParsePostFormat;
        proto$1.postformat = preParsePostFormat;
        proto$1.relativeTime = relativeTime;
        proto$1.pastFuture = pastFuture;
        proto$1.set = set;
        proto$1.eras = localeEras;
        proto$1.erasParse = localeErasParse;
        proto$1.erasConvertYear = localeErasConvertYear;
        proto$1.erasAbbrRegex = erasAbbrRegex;
        proto$1.erasNameRegex = erasNameRegex;
        proto$1.erasNarrowRegex = erasNarrowRegex;

        proto$1.months = localeMonths;
        proto$1.monthsShort = localeMonthsShort;
        proto$1.monthsParse = localeMonthsParse;
        proto$1.monthsRegex = monthsRegex;
        proto$1.monthsShortRegex = monthsShortRegex;
        proto$1.week = localeWeek;
        proto$1.firstDayOfYear = localeFirstDayOfYear;
        proto$1.firstDayOfWeek = localeFirstDayOfWeek;

        proto$1.weekdays = localeWeekdays;
        proto$1.weekdaysMin = localeWeekdaysMin;
        proto$1.weekdaysShort = localeWeekdaysShort;
        proto$1.weekdaysParse = localeWeekdaysParse;

        proto$1.weekdaysRegex = weekdaysRegex;
        proto$1.weekdaysShortRegex = weekdaysShortRegex;
        proto$1.weekdaysMinRegex = weekdaysMinRegex;

        proto$1.isPM = localeIsPM;
        proto$1.meridiem = localeMeridiem;

        function get$1(format, index, field, setter) {
            var locale = getLocale(),
                utc = createUTC().set(setter, index);
            return locale[field](utc, format);
        }

        function listMonthsImpl(format, index, field) {
            if (isNumber(format)) {
                index = format;
                format = undefined;
            }

            format = format || '';

            if (index != null) {
                return get$1(format, index, field, 'month');
            }

            var i,
                out = [];
            for (i = 0; i < 12; i++) {
                out[i] = get$1(format, i, field, 'month');
            }
            return out;
        }

        // ()
        // (5)
        // (fmt, 5)
        // (fmt)
        // (true)
        // (true, 5)
        // (true, fmt, 5)
        // (true, fmt)
        function listWeekdaysImpl(localeSorted, format, index, field) {
            if (typeof localeSorted === 'boolean') {
                if (isNumber(format)) {
                    index = format;
                    format = undefined;
                }

                format = format || '';
            } else {
                format = localeSorted;
                index = format;
                localeSorted = false;

                if (isNumber(format)) {
                    index = format;
                    format = undefined;
                }

                format = format || '';
            }

            var locale = getLocale(),
                shift = localeSorted ? locale._week.dow : 0,
                i,
                out = [];

            if (index != null) {
                return get$1(format, (index + shift) % 7, field, 'day');
            }

            for (i = 0; i < 7; i++) {
                out[i] = get$1(format, (i + shift) % 7, field, 'day');
            }
            return out;
        }

        function listMonths(format, index) {
            return listMonthsImpl(format, index, 'months');
        }

        function listMonthsShort(format, index) {
            return listMonthsImpl(format, index, 'monthsShort');
        }

        function listWeekdays(localeSorted, format, index) {
            return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
        }

        function listWeekdaysShort(localeSorted, format, index) {
            return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
        }

        function listWeekdaysMin(localeSorted, format, index) {
            return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
        }

        getSetGlobalLocale('en', {
            eras: [
                {
                    since: '0001-01-01',
                    until: +Infinity,
                    offset: 1,
                    name: 'Anno Domini',
                    narrow: 'AD',
                    abbr: 'AD',
                },
                {
                    since: '0000-12-31',
                    until: -Infinity,
                    offset: 1,
                    name: 'Before Christ',
                    narrow: 'BC',
                    abbr: 'BC',
                },
            ],
            dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
            ordinal: function (number) {
                var b = number % 10,
                    output =
                        toInt((number % 100) / 10) === 1
                            ? 'th'
                            : b === 1
                            ? 'st'
                            : b === 2
                            ? 'nd'
                            : b === 3
                            ? 'rd'
                            : 'th';
                return number + output;
            },
        });

        // Side effect imports

        hooks.lang = deprecate(
            'moment.lang is deprecated. Use moment.locale instead.',
            getSetGlobalLocale
        );
        hooks.langData = deprecate(
            'moment.langData is deprecated. Use moment.localeData instead.',
            getLocale
        );

        var mathAbs = Math.abs;

        function abs() {
            var data = this._data;

            this._milliseconds = mathAbs(this._milliseconds);
            this._days = mathAbs(this._days);
            this._months = mathAbs(this._months);

            data.milliseconds = mathAbs(data.milliseconds);
            data.seconds = mathAbs(data.seconds);
            data.minutes = mathAbs(data.minutes);
            data.hours = mathAbs(data.hours);
            data.months = mathAbs(data.months);
            data.years = mathAbs(data.years);

            return this;
        }

        function addSubtract$1(duration, input, value, direction) {
            var other = createDuration(input, value);

            duration._milliseconds += direction * other._milliseconds;
            duration._days += direction * other._days;
            duration._months += direction * other._months;

            return duration._bubble();
        }

        // supports only 2.0-style add(1, 's') or add(duration)
        function add$1(input, value) {
            return addSubtract$1(this, input, value, 1);
        }

        // supports only 2.0-style subtract(1, 's') or subtract(duration)
        function subtract$1(input, value) {
            return addSubtract$1(this, input, value, -1);
        }

        function absCeil(number) {
            if (number < 0) {
                return Math.floor(number);
            } else {
                return Math.ceil(number);
            }
        }

        function bubble() {
            var milliseconds = this._milliseconds,
                days = this._days,
                months = this._months,
                data = this._data,
                seconds,
                minutes,
                hours,
                years,
                monthsFromDays;

            // if we have a mix of positive and negative values, bubble down first
            // check: https://github.com/moment/moment/issues/2166
            if (
                !(
                    (milliseconds >= 0 && days >= 0 && months >= 0) ||
                    (milliseconds <= 0 && days <= 0 && months <= 0)
                )
            ) {
                milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
                days = 0;
                months = 0;
            }

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds = absFloor(milliseconds / 1000);
            data.seconds = seconds % 60;

            minutes = absFloor(seconds / 60);
            data.minutes = minutes % 60;

            hours = absFloor(minutes / 60);
            data.hours = hours % 24;

            days += absFloor(hours / 24);

            // convert days to months
            monthsFromDays = absFloor(daysToMonths(days));
            months += monthsFromDays;
            days -= absCeil(monthsToDays(monthsFromDays));

            // 12 months -> 1 year
            years = absFloor(months / 12);
            months %= 12;

            data.days = days;
            data.months = months;
            data.years = years;

            return this;
        }

        function daysToMonths(days) {
            // 400 years have 146097 days (taking into account leap year rules)
            // 400 years have 12 months === 4800
            return (days * 4800) / 146097;
        }

        function monthsToDays(months) {
            // the reverse of daysToMonths
            return (months * 146097) / 4800;
        }

        function as(units) {
            if (!this.isValid()) {
                return NaN;
            }
            var days,
                months,
                milliseconds = this._milliseconds;

            units = normalizeUnits(units);

            if (units === 'month' || units === 'quarter' || units === 'year') {
                days = this._days + milliseconds / 864e5;
                months = this._months + daysToMonths(days);
                switch (units) {
                    case 'month':
                        return months;
                    case 'quarter':
                        return months / 3;
                    case 'year':
                        return months / 12;
                }
            } else {
                // handle milliseconds separately because of floating point math errors (issue #1867)
                days = this._days + Math.round(monthsToDays(this._months));
                switch (units) {
                    case 'week':
                        return days / 7 + milliseconds / 6048e5;
                    case 'day':
                        return days + milliseconds / 864e5;
                    case 'hour':
                        return days * 24 + milliseconds / 36e5;
                    case 'minute':
                        return days * 1440 + milliseconds / 6e4;
                    case 'second':
                        return days * 86400 + milliseconds / 1000;
                    // Math.floor prevents floating point math errors here
                    case 'millisecond':
                        return Math.floor(days * 864e5) + milliseconds;
                    default:
                        throw new Error('Unknown unit ' + units);
                }
            }
        }

        // TODO: Use this.as('ms')?
        function valueOf$1() {
            if (!this.isValid()) {
                return NaN;
            }
            return (
                this._milliseconds +
                this._days * 864e5 +
                (this._months % 12) * 2592e6 +
                toInt(this._months / 12) * 31536e6
            );
        }

        function makeAs(alias) {
            return function () {
                return this.as(alias);
            };
        }

        var asMilliseconds = makeAs('ms'),
            asSeconds = makeAs('s'),
            asMinutes = makeAs('m'),
            asHours = makeAs('h'),
            asDays = makeAs('d'),
            asWeeks = makeAs('w'),
            asMonths = makeAs('M'),
            asQuarters = makeAs('Q'),
            asYears = makeAs('y');

        function clone$1() {
            return createDuration(this);
        }

        function get$2(units) {
            units = normalizeUnits(units);
            return this.isValid() ? this[units + 's']() : NaN;
        }

        function makeGetter(name) {
            return function () {
                return this.isValid() ? this._data[name] : NaN;
            };
        }

        var milliseconds = makeGetter('milliseconds'),
            seconds = makeGetter('seconds'),
            minutes = makeGetter('minutes'),
            hours = makeGetter('hours'),
            days = makeGetter('days'),
            months = makeGetter('months'),
            years = makeGetter('years');

        function weeks() {
            return absFloor(this.days() / 7);
        }

        var round = Math.round,
            thresholds = {
                ss: 44, // a few seconds to seconds
                s: 45, // seconds to minute
                m: 45, // minutes to hour
                h: 22, // hours to day
                d: 26, // days to month/week
                w: null, // weeks to month
                M: 11, // months to year
            };

        // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
        function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
            return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
        }

        function relativeTime$1(posNegDuration, withoutSuffix, thresholds, locale) {
            var duration = createDuration(posNegDuration).abs(),
                seconds = round(duration.as('s')),
                minutes = round(duration.as('m')),
                hours = round(duration.as('h')),
                days = round(duration.as('d')),
                months = round(duration.as('M')),
                weeks = round(duration.as('w')),
                years = round(duration.as('y')),
                a =
                    (seconds <= thresholds.ss && ['s', seconds]) ||
                    (seconds < thresholds.s && ['ss', seconds]) ||
                    (minutes <= 1 && ['m']) ||
                    (minutes < thresholds.m && ['mm', minutes]) ||
                    (hours <= 1 && ['h']) ||
                    (hours < thresholds.h && ['hh', hours]) ||
                    (days <= 1 && ['d']) ||
                    (days < thresholds.d && ['dd', days]);

            if (thresholds.w != null) {
                a =
                    a ||
                    (weeks <= 1 && ['w']) ||
                    (weeks < thresholds.w && ['ww', weeks]);
            }
            a = a ||
                (months <= 1 && ['M']) ||
                (months < thresholds.M && ['MM', months]) ||
                (years <= 1 && ['y']) || ['yy', years];

            a[2] = withoutSuffix;
            a[3] = +posNegDuration > 0;
            a[4] = locale;
            return substituteTimeAgo.apply(null, a);
        }

        // This function allows you to set the rounding function for relative time strings
        function getSetRelativeTimeRounding(roundingFunction) {
            if (roundingFunction === undefined) {
                return round;
            }
            if (typeof roundingFunction === 'function') {
                round = roundingFunction;
                return true;
            }
            return false;
        }

        // This function allows you to set a threshold for relative time strings
        function getSetRelativeTimeThreshold(threshold, limit) {
            if (thresholds[threshold] === undefined) {
                return false;
            }
            if (limit === undefined) {
                return thresholds[threshold];
            }
            thresholds[threshold] = limit;
            if (threshold === 's') {
                thresholds.ss = limit - 1;
            }
            return true;
        }

        function humanize(argWithSuffix, argThresholds) {
            if (!this.isValid()) {
                return this.localeData().invalidDate();
            }

            var withSuffix = false,
                th = thresholds,
                locale,
                output;

            if (typeof argWithSuffix === 'object') {
                argThresholds = argWithSuffix;
                argWithSuffix = false;
            }
            if (typeof argWithSuffix === 'boolean') {
                withSuffix = argWithSuffix;
            }
            if (typeof argThresholds === 'object') {
                th = Object.assign({}, thresholds, argThresholds);
                if (argThresholds.s != null && argThresholds.ss == null) {
                    th.ss = argThresholds.s - 1;
                }
            }

            locale = this.localeData();
            output = relativeTime$1(this, !withSuffix, th, locale);

            if (withSuffix) {
                output = locale.pastFuture(+this, output);
            }

            return locale.postformat(output);
        }

        var abs$1 = Math.abs;

        function sign(x) {
            return (x > 0) - (x < 0) || +x;
        }

        function toISOString$1() {
            // for ISO strings we do not use the normal bubbling rules:
            //  * milliseconds bubble up until they become hours
            //  * days do not bubble at all
            //  * months bubble up until they become years
            // This is because there is no context-free conversion between hours and days
            // (think of clock changes)
            // and also not between days and months (28-31 days per month)
            if (!this.isValid()) {
                return this.localeData().invalidDate();
            }

            var seconds = abs$1(this._milliseconds) / 1000,
                days = abs$1(this._days),
                months = abs$1(this._months),
                minutes,
                hours,
                years,
                s,
                total = this.asSeconds(),
                totalSign,
                ymSign,
                daysSign,
                hmsSign;

            if (!total) {
                // this is the same as C#'s (Noda) and python (isodate)...
                // but not other JS (goog.date)
                return 'P0D';
            }

            // 3600 seconds -> 60 minutes -> 1 hour
            minutes = absFloor(seconds / 60);
            hours = absFloor(minutes / 60);
            seconds %= 60;
            minutes %= 60;

            // 12 months -> 1 year
            years = absFloor(months / 12);
            months %= 12;

            // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
            s = seconds ? seconds.toFixed(3).replace(/\.?0+$/, '') : '';

            totalSign = total < 0 ? '-' : '';
            ymSign = sign(this._months) !== sign(total) ? '-' : '';
            daysSign = sign(this._days) !== sign(total) ? '-' : '';
            hmsSign = sign(this._milliseconds) !== sign(total) ? '-' : '';

            return (
                totalSign +
                'P' +
                (years ? ymSign + years + 'Y' : '') +
                (months ? ymSign + months + 'M' : '') +
                (days ? daysSign + days + 'D' : '') +
                (hours || minutes || seconds ? 'T' : '') +
                (hours ? hmsSign + hours + 'H' : '') +
                (minutes ? hmsSign + minutes + 'M' : '') +
                (seconds ? hmsSign + s + 'S' : '')
            );
        }

        var proto$2 = Duration.prototype;

        proto$2.isValid = isValid$1;
        proto$2.abs = abs;
        proto$2.add = add$1;
        proto$2.subtract = subtract$1;
        proto$2.as = as;
        proto$2.asMilliseconds = asMilliseconds;
        proto$2.asSeconds = asSeconds;
        proto$2.asMinutes = asMinutes;
        proto$2.asHours = asHours;
        proto$2.asDays = asDays;
        proto$2.asWeeks = asWeeks;
        proto$2.asMonths = asMonths;
        proto$2.asQuarters = asQuarters;
        proto$2.asYears = asYears;
        proto$2.valueOf = valueOf$1;
        proto$2._bubble = bubble;
        proto$2.clone = clone$1;
        proto$2.get = get$2;
        proto$2.milliseconds = milliseconds;
        proto$2.seconds = seconds;
        proto$2.minutes = minutes;
        proto$2.hours = hours;
        proto$2.days = days;
        proto$2.weeks = weeks;
        proto$2.months = months;
        proto$2.years = years;
        proto$2.humanize = humanize;
        proto$2.toISOString = toISOString$1;
        proto$2.toString = toISOString$1;
        proto$2.toJSON = toISOString$1;
        proto$2.locale = locale;
        proto$2.localeData = localeData;

        proto$2.toIsoString = deprecate(
            'toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)',
            toISOString$1
        );
        proto$2.lang = lang;

        // FORMATTING

        addFormatToken('X', 0, 0, 'unix');
        addFormatToken('x', 0, 0, 'valueOf');

        // PARSING

        addRegexToken('x', matchSigned);
        addRegexToken('X', matchTimestamp);
        addParseToken('X', function (input, array, config) {
            config._d = new Date(parseFloat(input) * 1000);
        });
        addParseToken('x', function (input, array, config) {
            config._d = new Date(toInt(input));
        });

        //! moment.js

        hooks.version = '2.29.1';

        setHookCallback(createLocal);

        hooks.fn = proto;
        hooks.min = min;
        hooks.max = max;
        hooks.now = now;
        hooks.utc = createUTC;
        hooks.unix = createUnix;
        hooks.months = listMonths;
        hooks.isDate = isDate;
        hooks.locale = getSetGlobalLocale;
        hooks.invalid = createInvalid;
        hooks.duration = createDuration;
        hooks.isMoment = isMoment;
        hooks.weekdays = listWeekdays;
        hooks.parseZone = createInZone;
        hooks.localeData = getLocale;
        hooks.isDuration = isDuration;
        hooks.monthsShort = listMonthsShort;
        hooks.weekdaysMin = listWeekdaysMin;
        hooks.defineLocale = defineLocale;
        hooks.updateLocale = updateLocale;
        hooks.locales = listLocales;
        hooks.weekdaysShort = listWeekdaysShort;
        hooks.normalizeUnits = normalizeUnits;
        hooks.relativeTimeRounding = getSetRelativeTimeRounding;
        hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
        hooks.calendarFormat = getCalendarFormat;
        hooks.prototype = proto;

        // currently HTML5 input type only supports 24-hour formats
        hooks.HTML5_FMT = {
            DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm', // <input type="datetime-local" />
            DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss', // <input type="datetime-local" step="1" />
            DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS', // <input type="datetime-local" step="0.001" />
            DATE: 'YYYY-MM-DD', // <input type="date" />
            TIME: 'HH:mm', // <input type="time" />
            TIME_SECONDS: 'HH:mm:ss', // <input type="time" step="1" />
            TIME_MS: 'HH:mm:ss.SSS', // <input type="time" step="0.001" />
            WEEK: 'GGGG-[W]WW', // <input type="week" />
            MONTH: 'YYYY-MM', // <input type="month" />
        };

        return hooks;

    })));
    });

    /* src\components\Infolog.svelte generated by Svelte v3.31.2 */
    const file$1 = "src\\components\\Infolog.svelte";

    // (12:4) {#if time && message}
    function create_if_block(ctx) {
    	let div;
    	let t0;
    	let t1_value = moment(/*time*/ ctx[1]).format("hh:mm:ss") + "";
    	let t1;
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("[");
    			t1 = text(t1_value);
    			t2 = text("] ");
    			t3 = text(/*message*/ ctx[0]);
    			attr_dev(div, "id", "infoMessage");
    			add_location(div, file$1, 12, 4, 260);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			append_dev(div, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*time*/ 2 && t1_value !== (t1_value = moment(/*time*/ ctx[1]).format("hh:mm:ss") + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*message*/ 1) set_data_dev(t3, /*message*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(12:4) {#if time && message}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let if_block = /*time*/ ctx[1] && /*message*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "id", "infolog");
    			attr_dev(div, "class", "svelte-1xqhbsn");
    			add_location(div, file$1, 10, 0, 209);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*time*/ ctx[1] && /*message*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Infolog", slots, []);
    	let { message } = $$props;
    	let time;

    	onMount(() => {
    		$$invalidate(1, time = new Date());
    	});

    	const writable_props = ["message"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Infolog> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("message" in $$props) $$invalidate(0, message = $$props.message);
    	};

    	$$self.$capture_state = () => ({ onMount, moment, Control, message, time });

    	$$self.$inject_state = $$props => {
    		if ("message" in $$props) $$invalidate(0, message = $$props.message);
    		if ("time" in $$props) $$invalidate(1, time = $$props.time);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [message, time];
    }

    class Infolog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { message: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Infolog",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*message*/ ctx[0] === undefined && !("message" in props)) {
    			console.warn("<Infolog> was created without expected prop 'message'");
    		}
    	}

    	get message() {
    		throw new Error("<Infolog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error("<Infolog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\GitExplorer.svelte generated by Svelte v3.31.2 */
    const file$2 = "src\\components\\GitExplorer.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (81:4) {:else}
    function create_else_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(81:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (35:4) {#if currentContents && currentContents.type == "dir"}
    function create_if_block$1(ctx) {
    	let div;
    	let show_if = /*currentContents*/ ctx[0].depthLevel() >= 2;
    	let t0;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let tbody;
    	let t6;
    	let if_block0 = show_if && create_if_block_3(ctx);
    	let if_block1 = /*currentContents*/ ctx[0].path != ROOT_FOLDER && create_if_block_2(ctx);
    	let each_value = /*currentContents*/ ctx[0].dirList;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Name";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "Info";
    			t5 = space();
    			tbody = element("tbody");
    			if (if_block1) if_block1.c();
    			t6 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "id", "explorerControls");
    			attr_dev(div, "class", "svelte-g1l9fj");
    			add_location(div, file$2, 35, 8, 1318);
    			add_location(th0, file$2, 43, 20, 1587);
    			add_location(th1, file$2, 44, 20, 1615);
    			add_location(th2, file$2, 45, 20, 1650);
    			add_location(tr, file$2, 42, 16, 1561);
    			add_location(thead, file$2, 41, 12, 1536);
    			add_location(tbody, file$2, 48, 12, 1722);
    			attr_dev(table, "class", "svelte-g1l9fj");
    			add_location(table, file$2, 40, 8, 1515);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t1);
    			append_dev(tr, th1);
    			append_dev(tr, t3);
    			append_dev(tr, th2);
    			append_dev(table, t5);
    			append_dev(table, tbody);
    			if (if_block1) if_block1.m(tbody, null);
    			append_dev(tbody, t6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*currentContents*/ 1) show_if = /*currentContents*/ ctx[0].depthLevel() >= 2;

    			if (show_if) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(div, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*currentContents*/ ctx[0].path != ROOT_FOLDER) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(tbody, t6);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*Control, currentContents*/ 1) {
    				each_value = /*currentContents*/ ctx[0].dirList;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(table);
    			if (if_block1) if_block1.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(35:4) {#if currentContents && currentContents.type == \\\"dir\\\"}",
    		ctx
    	});

    	return block;
    }

    // (37:12) {#if currentContents.depthLevel() >= 2}
    function create_if_block_3(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "New file";
    			add_location(button, file$2, 37, 16, 1416);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*openNewFileDialog*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(37:12) {#if currentContents.depthLevel() >= 2}",
    		ctx
    	});

    	return block;
    }

    // (50:16) {#if currentContents.path != ROOT_FOLDER}
    function create_if_block_2(ctx) {
    	let tr;
    	let td0;
    	let i;
    	let t0;
    	let td1;
    	let t2;
    	let td2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			i = element("i");
    			t0 = space();
    			td1 = element("td");
    			td1.textContent = "...";
    			t2 = space();
    			td2 = element("td");
    			td2.textContent = "Root";
    			attr_dev(i, "class", "fa fa-folder svelte-g1l9fj");
    			add_location(i, file$2, 55, 28, 2015);
    			attr_dev(td0, "class", "svelte-g1l9fj");
    			add_location(td0, file$2, 55, 24, 2011);
    			attr_dev(td1, "class", "svelte-g1l9fj");
    			add_location(td1, file$2, 56, 24, 2072);
    			attr_dev(td2, "class", "svelte-g1l9fj");
    			add_location(td2, file$2, 57, 24, 2110);
    			add_location(tr, file$2, 50, 20, 1810);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, i);
    			append_dev(tr, t0);
    			append_dev(tr, td1);
    			append_dev(tr, t2);
    			append_dev(tr, td2);

    			if (!mounted) {
    				dispose = listen_dev(tr, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(50:16) {#if currentContents.path != ROOT_FOLDER}",
    		ctx
    	});

    	return block;
    }

    // (71:28) {:else}
    function create_else_block(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fa fa-folder svelte-g1l9fj");
    			add_location(i, file$2, 71, 32, 2647);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(71:28) {:else}",
    		ctx
    	});

    	return block;
    }

    // (69:28) {#if d.type == "file"}
    function create_if_block_1(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fa fa-file svelte-g1l9fj");
    			add_location(i, file$2, 69, 32, 2552);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(69:28) {#if d.type == \\\"file\\\"}",
    		ctx
    	});

    	return block;
    }

    // (62:16) {#each currentContents.dirList as d, idx}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let t0;
    	let td1;
    	let t1_value = /*d*/ ctx[4].name + "";
    	let t1;
    	let t2;
    	let td2;
    	let t3_value = /*d*/ ctx[4].type + "";
    	let t3;
    	let t4;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*d*/ ctx[4].type == "file") return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[3](/*idx*/ ctx[6], ...args);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			if_block.c();
    			t0 = space();
    			td1 = element("td");
    			t1 = text(t1_value);
    			t2 = space();
    			td2 = element("td");
    			t3 = text(t3_value);
    			t4 = space();
    			attr_dev(td0, "class", "svelte-g1l9fj");
    			add_location(td0, file$2, 67, 24, 2462);
    			attr_dev(td1, "class", "svelte-g1l9fj");
    			add_location(td1, file$2, 74, 24, 2765);
    			attr_dev(td2, "class", "svelte-g1l9fj");
    			add_location(td2, file$2, 75, 24, 2808);
    			add_location(tr, file$2, 62, 20, 2256);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			if_block.m(td0, null);
    			append_dev(tr, t0);
    			append_dev(tr, td1);
    			append_dev(td1, t1);
    			append_dev(tr, t2);
    			append_dev(tr, td2);
    			append_dev(td2, t3);
    			append_dev(tr, t4);

    			if (!mounted) {
    				dispose = listen_dev(tr, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(td0, null);
    				}
    			}

    			if (dirty & /*currentContents*/ 1 && t1_value !== (t1_value = /*d*/ ctx[4].name + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*currentContents*/ 1 && t3_value !== (t3_value = /*d*/ ctx[4].type + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(62:16) {#each currentContents.dirList as d, idx}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*currentContents*/ ctx[0] && /*currentContents*/ ctx[0].type == "dir") return create_if_block$1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "id", "explorer");
    			attr_dev(div, "class", "svelte-g1l9fj");
    			add_location(div, file$2, 33, 0, 1229);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GitExplorer", slots, []);
    	let { currentContents } = $$props;
    	

    	onMount(() => {
    		
    	});

    	function openNewFileDialog() {
    		Debug.log("Showing popup");

    		Control.showPopup("New file name (.html)", true, true, true, function (button, input) {
    			Debug.log("Closed popup with:", button, input);

    			if (!input) {
    				Control.showInfolog("File name can't be blank");
    			} else {
    				let fullName = input;

    				if (!fullName.toLowerCase().endsWith(".html")) {
    					fullName = `${fullName}.html`;
    				}

    				APIHelper.createNewFile(`${currentContents.path}/${fullName}`).then(file => {
    					Control.showInfolog("New file created: " + file.path);
    					currentContents.dirList.push(file);
    					$$invalidate(0, currentContents);
    				}).catch(reason => {
    					Control.showInfolog("ERROR creating new file: " + reason);
    				});
    			}
    		});
    	}

    	const writable_props = ["currentContents"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GitExplorer> was created with unknown prop '${key}'`);
    	});

    	const click_handler = x => {
    		Control.openPath(currentContents.parentPath());
    	};

    	const click_handler_1 = (idx, x) => {
    		Control.openPath(currentContents.dirList[idx].path);
    	};

    	$$self.$$set = $$props => {
    		if ("currentContents" in $$props) $$invalidate(0, currentContents = $$props.currentContents);
    	};

    	$$self.$capture_state = () => ({
    		currentContents,
    		onMount,
    		moment,
    		Control,
    		GitContents,
    		ROOT_FOLDER,
    		Debug,
    		APIHelper,
    		openNewFileDialog
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentContents" in $$props) $$invalidate(0, currentContents = $$props.currentContents);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentContents, openNewFileDialog, click_handler, click_handler_1];
    }

    class GitExplorer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { currentContents: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GitExplorer",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*currentContents*/ ctx[0] === undefined && !("currentContents" in props)) {
    			console.warn("<GitExplorer> was created without expected prop 'currentContents'");
    		}
    	}

    	get currentContents() {
    		throw new Error("<GitExplorer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentContents(value) {
    		throw new Error("<GitExplorer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var jodit_min = createCommonjsModule(function (module, exports) {
    /*!
     * jodit - Jodit is awesome and usefully wysiwyg editor with filebrowser
     * Author: Chupurnov <chupurnov@gmail.com> (https://xdsoft.net/)
     * Version: v3.5.4
     * Url: https://xdsoft.net/jodit/
     * License(s): MIT
     */


    !function(e,t){module.exports=t();}(self,(function(){return (()=>{var e=[(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Jodit=void 0,o(1),"undefined"!=typeof window&&o(2);var r=o(6),i=o(207),n=o(38),a=o(9),s=o(115),l=o(227),c=o(335),u=o(8);Object.keys(a).forEach((function(e){r.Jodit[e]=a[e];}));var d=function(e){return "__esModule"!==e};Object.keys(c).filter(d).forEach((function(e){s.Icon.set(e.replace("_","-"),c[e]);})),Object.keys(s).filter(d).forEach((function(e){r.Jodit.modules[e]=s[e];})),Object.keys(n).filter(d).forEach((function(e){r.Jodit.decorators[e]=n[e];})),["Confirm","Alert","Prompt"].forEach((function(e){r.Jodit[e]=s[e];})),Object.keys(l).filter(d).forEach((function(e){r.Jodit.plugins.add(e,l[e]);})),Object.keys(i.default).filter(d).forEach((function(e){r.Jodit.lang[e]=i.default[e];})),r.Jodit.defaultOptions=u.Config.defaultOptions,u.OptionsDefault.prototype=r.Jodit.defaultOptions,t.Jodit=r.Jodit;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),o(3),o(4),Array.from||(Array.from=function(e){if(e instanceof Set){var t=[];return e.forEach((function(e){return t.push(e)})),t}return [].slice.call(e)}),Array.prototype.includes||(Array.prototype.includes=function(e){return this.indexOf(e)>-1}),"function"!=typeof Object.assign&&Object.defineProperty(Object,"assign",{value:function(e,t){if(null==e)throw new TypeError("Cannot convert undefined or null to object");for(var o=Object(e),r=1;arguments.length>r;r++){var i=arguments[r];if(null!=i)for(var n in i)Object.prototype.hasOwnProperty.call(i,n)&&(o[n]=i[n]);}return o},writable:!0,configurable:!0}),Array.prototype.find||(Array.prototype.find=function(e){return this.indexOf(e)>-1?e:void 0});},()=>{"document"in window.self&&((!("classList"in document.createElement("_"))||document.createElementNS&&!("classList"in document.createElementNS("http://www.w3.org/2000/svg","g")))&&function(e){if("Element"in e){var t="classList",o=e.Element.prototype,r=Object,i=String.prototype.trim||function(){return this.replace(/^\s+|\s+$/g,"")},n=Array.prototype.indexOf||function(e){for(var t=0,o=this.length;o>t;t++)if(t in this&&this[t]===e)return t;return -1},a=function(e,t){this.name=e,this.code=DOMException[e],this.message=t;},s=function(e,t){if(""===t)throw new a("SYNTAX_ERR","An invalid or illegal string was specified");if(/\s/.test(t))throw new a("INVALID_CHARACTER_ERR","String contains an invalid character");return n.call(e,t)},l=function(e){for(var t=i.call(e.getAttribute("class")||""),o=t?t.split(/\s+/):[],r=0,n=o.length;n>r;r++)this.push(o[r]);this._updateClassName=function(){e.setAttribute("class",this.toString());};},c=l.prototype=[],u=function(){return new l(this)};if(a.prototype=Error.prototype,c.item=function(e){return this[e]||null},c.contains=function(e){return -1!==s(this,e+="")},c.add=function(){var e,t=arguments,o=0,r=t.length,i=!1;do{-1===s(this,e=t[o]+"")&&(this.push(e),i=!0);}while(++o<r);i&&this._updateClassName();},c.remove=function(){var e,t,o=arguments,r=0,i=o.length,n=!1;do{for(t=s(this,e=o[r]+"");-1!==t;)this.splice(t,1),n=!0,t=s(this,e);}while(++r<i);n&&this._updateClassName();},c.toggle=function(e,t){var o=this.contains(e+=""),r=o?!0!==t&&"remove":!1!==t&&"add";return r&&this[r](e),!0===t||!1===t?t:!o},c.toString=function(){return this.join(" ")},r.defineProperty){var d={get:u,enumerable:!0,configurable:!0};try{r.defineProperty(o,t,d);}catch(e){void 0!==e.number&&-2146823252!==e.number||(d.enumerable=!1,r.defineProperty(o,t,d));}}else r.prototype.__defineGetter__&&o.__defineGetter__(t,u);}}(window.self),function(){var e=document.createElement("_");if(e.classList.add("c1","c2"),!e.classList.contains("c2")){var t=function(e){var t=DOMTokenList.prototype[e];DOMTokenList.prototype[e]=function(e){var o,r=arguments.length;for(o=0;r>o;o++)t.call(this,e=arguments[o]);};};t("add"),t("remove");}if(e.classList.toggle("c3",!1),e.classList.contains("c3")){var o=DOMTokenList.prototype.toggle;DOMTokenList.prototype.toggle=function(e,t){return 1 in arguments&&!this.contains(e)==!t?t:o.call(this,e)};}e=null;}());},(e,t,o)=>{e.exports=o(5).polyfill();},function(e,t,o){e.exports=function(){function e(e){return "function"==typeof e}var t=Array.isArray?Array.isArray:function(e){return "[object Array]"===Object.prototype.toString.call(e)},r=0,i=void 0,n=void 0,a=function(e,t){f[r]=e,f[r+1]=t,2===(r+=2)&&(n?n(h):b());},s="undefined"!=typeof window?window:void 0,l=s||{},c=l.MutationObserver||l.WebKitMutationObserver,u="undefined"==typeof self&&"undefined"!=typeof process&&"[object process]"==={}.toString.call(process),d="undefined"!=typeof Uint8ClampedArray&&"undefined"!=typeof importScripts&&"undefined"!=typeof MessageChannel;function p(){var e=setTimeout;return function(){return e(h,1)}}var f=new Array(1e3);function h(){for(var e=0;r>e;e+=2)(0, f[e])(f[e+1]),f[e]=void 0,f[e+1]=void 0;r=0;}var m,v,g,y,b=void 0;function _(e,t){var o=this,r=new this.constructor(C);void 0===r[S]&&M(r);var i=o._state;if(i){var n=arguments[i-1];a((function(){return z(i,r,n,o._result)}));}else P(o,r,e,t);return r}function w(e){if(e&&"object"==typeof e&&e.constructor===this)return e;var t=new this(C);return E(t,e),t}b=u?function(){return process.nextTick(h)}:c?(v=0,g=new c(h),y=document.createTextNode(""),g.observe(y,{characterData:!0}),function(){y.data=v=++v%2;}):d?((m=new MessageChannel).port1.onmessage=h,function(){return m.port2.postMessage(0)}):void 0===s?function(){try{var e=Function("return this")().require("vertx");return void 0!==(i=e.runOnLoop||e.runOnContext)?function(){i(h);}:p()}catch(e){return p()}}():p();var S=Math.random().toString(36).substring(2);function C(){}var j=void 0;function k(t,o,r){o.constructor===t.constructor&&r===_&&o.constructor.resolve===w?function(e,t){1===t._state?x(e,t._result):2===t._state?T(e,t._result):P(t,void 0,(function(t){return E(e,t)}),(function(t){return T(e,t)}));}(t,o):void 0===r?x(t,o):e(r)?function(e,t,o){a((function(e){var r=!1,i=function(o,i,n,a){try{o.call(i,(function(o){r||(r=!0,t!==o?E(e,o):x(e,o));}),(function(t){r||(r=!0,T(e,t));}));}catch(e){return e}}(o,t);!r&&i&&(r=!0,T(e,i));}),e);}(t,o,r):x(t,o);}function E(e,t){if(e===t)T(e,new TypeError("You cannot resolve a promise with itself"));else if(i=typeof(r=t),null===r||"object"!==i&&"function"!==i)x(e,t);else {var o=void 0;try{o=t.then;}catch(t){return void T(e,t)}k(e,t,o);}var r,i;}function I(e){e._onerror&&e._onerror(e._result),D(e);}function x(e,t){e._state===j&&(e._result=t,e._state=1,0!==e._subscribers.length&&a(D,e));}function T(e,t){e._state===j&&(e._state=2,e._result=t,a(I,e));}function P(e,t,o,r){var i=e._subscribers,n=i.length;e._onerror=null,i[n]=t,i[n+1]=o,i[n+2]=r,0===n&&e._state&&a(D,e);}function D(e){var t=e._subscribers,o=e._state;if(0!==t.length){for(var r=void 0,i=void 0,n=e._result,a=0;t.length>a;a+=3)i=t[a+o],(r=t[a])?z(o,r,i,n):i(n);e._subscribers.length=0;}}function z(t,o,r,i){var n=e(r),a=void 0,s=void 0,l=!0;if(n){try{a=r(i);}catch(e){l=!1,s=e;}if(o===a)return void T(o,new TypeError("A promises callback cannot return that same promise."))}else a=i;o._state!==j||(n&&l?E(o,a):!1===l?T(o,s):1===t?x(o,a):2===t&&T(o,a));}var A=0;function M(e){e[S]=A++,e._state=void 0,e._result=void 0,e._subscribers=[];}var L=function(){function e(e,o){this._instanceConstructor=e,this.promise=new e(C),this.promise[S]||M(this.promise),t(o)?(this.length=o.length,this._remaining=o.length,this._result=new Array(this.length),0===this.length?x(this.promise,this._result):(this.length=this.length||0,this._enumerate(o),0===this._remaining&&x(this.promise,this._result))):T(this.promise,new Error("Array Methods must be provided an Array"));}return e.prototype._enumerate=function(e){for(var t=0;this._state===j&&e.length>t;t++)this._eachEntry(e[t],t);},e.prototype._eachEntry=function(e,t){var o=this._instanceConstructor,r=o.resolve;if(r===w){var i=void 0,n=void 0,a=!1;try{i=e.then;}catch(e){a=!0,n=e;}if(i===_&&e._state!==j)this._settledAt(e._state,t,e._result);else if("function"!=typeof i)this._remaining--,this._result[t]=e;else if(o===O){var s=new o(C);a?T(s,n):k(s,e,i),this._willSettleAt(s,t);}else this._willSettleAt(new o((function(t){return t(e)})),t);}else this._willSettleAt(r(e),t);},e.prototype._settledAt=function(e,t,o){var r=this.promise;r._state===j&&(this._remaining--,2===e?T(r,o):this._result[t]=o),0===this._remaining&&x(r,this._result);},e.prototype._willSettleAt=function(e,t){var o=this;P(e,void 0,(function(e){return o._settledAt(1,t,e)}),(function(e){return o._settledAt(2,t,e)}));},e}(),O=function(){function t(e){this[S]=A++,this._result=this._state=void 0,this._subscribers=[],C!==e&&("function"!=typeof e&&function(){throw new TypeError("You must pass a resolver function as the first argument to the promise constructor")}(),this instanceof t?function(e,t){try{t((function(t){E(e,t);}),(function(t){T(e,t);}));}catch(t){T(e,t);}}(this,e):function(){throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.")}());}return t.prototype.catch=function(e){return this.then(null,e)},t.prototype.finally=function(t){var o=this,r=o.constructor;return e(t)?o.then((function(e){return r.resolve(t()).then((function(){return e}))}),(function(e){return r.resolve(t()).then((function(){throw e}))})):o.then(t,t)},t}();return O.prototype.then=_,O.all=function(e){return new L(this,e).promise},O.race=function(e){var o=this;return t(e)?new o((function(t,r){for(var i=e.length,n=0;i>n;n++)o.resolve(e[n]).then(t,r);})):new o((function(e,t){return t(new TypeError("You must pass an array to race."))}))},O.resolve=w,O.reject=function(e){var t=new this(C);return T(t,e),t},O._setScheduler=function(e){n=e;},O._setAsap=function(e){a=e;},O._asap=a,O.polyfill=function(){var e=void 0;if(void 0!==o.g)e=o.g;else if("undefined"!=typeof self)e=self;else try{e=Function("return this")();}catch(e){throw new Error("polyfill failed because global object is unavailable in this environment")}var t=e.Promise;if(t){var r=null;try{r=Object.prototype.toString.call(t.resolve());}catch(e){}if("[object Promise]"===r&&!t.cast)return}e.Promise=O;},O.Promise=O,O}();},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Jodit=void 0;var r=o(7),i=o(8),n=o(9),a=o(115),s=o(10),l=o(142),c=o(139),u=o(31),d=o(38),Jodit=function(e){function Jodit(t,o){var r=e.call(this,o,!0)||this;r.isJodit=!0,r.__defaultStyleDisplayKey="data-jodit-default-style-display",r.__defaultClassesKey="data-jodit-default-classes",r.commands={},r.__selectionLocked=null,r.__wasReadOnly=!1,r.createInside=new a.Create((function(){return r.ed}),r.o.createAttributes),r.editorIsActive=!1,r.__mode=n.MODE_WYSIWYG,r.__callChangeCount=0,r.elementToPlace=new Map;try{s.resolveElement(t,r.o.shadowRoot||r.od);}catch(e){throw r.destruct(),e}r.setStatus(a.STATUSES.beforeInit),r.id=s.attr(s.resolveElement(t,r.o.shadowRoot||r.od),"id")||(new Date).getTime().toString(),u.instances[r.id]=r,r.storage=l.Storage.makeStorage(!0,r.id),r.attachEvents(r.o),r.e.on(r.ow,"resize",(function(){r.e&&r.e.fire("resize");})),r.e.on("prepareWYSIWYGEditor",r.prepareWYSIWYGEditor),r.selection=new a.Select(r);var i=r.beforeInitHook();return s.callPromise(i,(function(){r.e.fire("beforeInit",r);var e=u.pluginSystem.init(r);r.e.fire("afterPluginSystemInit",r),s.callPromise(e,(function(){r.e.on("changePlace",(function(){r.setReadOnly(r.o.readonly),r.setDisabled(r.o.disabled);})),r.places.length=0;var e=r.addPlace(t,o);u.instances[r.id]=r,s.callPromise(e,(function(){r.e&&r.e.fire("afterInit",r),r.afterInitHook(),r.setStatus(a.STATUSES.ready),r.e.fire("afterConstructor",r);}));}));})),r}return r.__extends(Jodit,e),Jodit.prototype.className=function(){return "Jodit"},Object.defineProperty(Jodit.prototype,"text",{get:function(){if(this.editor)return this.editor.innerText||"";var e=this.createInside.div();return e.innerHTML=this.getElementValue(),e.innerText||""},enumerable:!1,configurable:!0}),Object.defineProperty(Jodit.prototype,"value",{get:function(){return this.getEditorValue()},set:function(e){this.setEditorValue(e);},enumerable:!1,configurable:!0}),Object.defineProperty(Jodit.prototype,"defaultTimeout",{get:function(){return this.options&&this.o.observer?this.o.observer.timeout:i.Config.defaultOptions.observer.timeout},enumerable:!1,configurable:!0}),Jodit.Array=function(e){return s.JoditArray(e)},Jodit.Object=function(e){return s.JoditObject(e)},Jodit.atom=function(e){return s.markAsAtomic(e)},Jodit.make=function(e,t){return new Jodit(e,t)},Jodit.prototype.setPlaceField=function(e,t){this.currentPlace||(this.currentPlace={},this.places=[this.currentPlace]),this.currentPlace[e]=t;},Object.defineProperty(Jodit.prototype,"element",{get:function(){return this.currentPlace.element},enumerable:!1,configurable:!0}),Object.defineProperty(Jodit.prototype,"editor",{get:function(){return this.currentPlace.editor},set:function(e){this.setPlaceField("editor",e);},enumerable:!1,configurable:!0}),Object.defineProperty(Jodit.prototype,"container",{get:function(){return this.currentPlace.container},set:function(e){this.setPlaceField("container",e);},enumerable:!1,configurable:!0}),Object.defineProperty(Jodit.prototype,"workplace",{get:function(){return this.currentPlace.workplace},enumerable:!1,configurable:!0}),Object.defineProperty(Jodit.prototype,"statusbar",{get:function(){return this.currentPlace.statusbar},enumerable:!1,configurable:!0}),Object.defineProperty(Jodit.prototype,"iframe",{get:function(){return this.currentPlace.iframe},set:function(e){this.setPlaceField("iframe",e);},enumerable:!1,configurable:!0}),Object.defineProperty(Jodit.prototype,"observer",{get:function(){return this.currentPlace.observer},enumerable:!1,configurable:!0}),Object.defineProperty(Jodit.prototype,"editorWindow",{get:function(){return this.currentPlace.editorWindow},set:function(e){this.setPlaceField("editorWindow",e);},enumerable:!1,configurable:!0}),Object.defineProperty(Jodit.prototype,"ew",{get:function(){return this.editorWindow},enumerable:!1,configurable:!0}),Object.defineProperty(Jodit.prototype,"editorDocument",{get:function(){return this.currentPlace.editorWindow.document},enumerable:!1,configurable:!0}),Object.defineProperty(Jodit.prototype,"ed",{get:function(){return this.editorDocument},enumerable:!1,configurable:!0}),Object.defineProperty(Jodit.prototype,"options",{get:function(){return this.currentPlace.options},set:function(e){this.setPlaceField("options",e);},enumerable:!1,configurable:!0}),Object.defineProperty(Jodit.prototype,"s",{get:function(){return this.selection},enumerable:!1,configurable:!0}),Object.defineProperty(Jodit.prototype,"uploader",{get:function(){return this.getInstance("Uploader",this.o.uploader)},enumerable:!1,configurable:!0}),Object.defineProperty(Jodit.prototype,"filebrowser",{get:function(){var e=this,t=r.__assign({defaultTimeout:e.defaultTimeout,uploader:e.o.uploader,language:e.o.language,theme:e.o.theme,defaultCallback:function(t){t.files&&t.files.length&&t.files.forEach((function(o,r){var i=t.baseurl+o;t.isImages&&t.isImages[r]?e.s.insertImage(i,null,e.o.imageDefaultWidth):e.s.insertNode(e.createInside.fromHTML('<a href="'+i+'" title="'+i+'">'+i+"</a>"));}));}},this.o.filebrowser);return e.getInstance("FileBrowser",t)},enumerable:!1,configurable:!0}),Object.defineProperty(Jodit.prototype,"mode",{get:function(){return this.__mode},set:function(e){this.setMode(e);},enumerable:!1,configurable:!0}),Jodit.prototype.getNativeEditorValue=function(){var e=this.e.fire("beforeGetNativeEditorValue");return s.isString(e)?e:this.editor?this.editor.innerHTML:this.getElementValue()},Jodit.prototype.setNativeEditorValue=function(e){this.e.fire("beforeSetNativeEditorValue",e)||this.editor&&(this.editor.innerHTML=e);},Jodit.prototype.getEditorValue=function(e){var t;if(void 0===e&&(e=!0),void 0!==(t=this.e.fire("beforeGetValueFromEditor")))return t;t=this.getNativeEditorValue().replace(n.INVISIBLE_SPACE_REG_EXP(),""),e&&(t=t.replace(/<span[^>]+id="jodit-selection_marker_[^>]+><\/span>/g,"")),"<br>"===t&&(t="");var o={value:t};return this.e.fire("afterGetValueFromEditor",o),o.value},Jodit.prototype.setEditorValue=function(e){var t=this.e.fire("beforeSetValueToEditor",e);if(!1!==t)if(s.isString(t)&&(e=t),this.editor){if(!s.isString(e)&&!s.isVoid(e))throw s.error("value must be string");void 0!==e&&this.getNativeEditorValue()!==e&&this.setNativeEditorValue(e),this.e.fire("postProcessSetEditorValue");var o=this.getElementValue(),r=this.getEditorValue();if(o!==r&&n.SAFE_COUNT_CHANGE_CALL>this.__callChangeCount){this.setElementValue(r),this.__callChangeCount+=1;try{this.observer.upTick(),this.e.fire("change",r,o),this.e.fire(this.observer,"change",r,o);}finally{this.__callChangeCount=0;}}}else void 0!==e&&this.setElementValue(e);},Jodit.prototype.getElementValue=function(){return void 0!==this.element.value?this.element.value:this.element.innerHTML},Jodit.prototype.setElementValue=function(e){if(!s.isString(e)&&void 0!==e)throw s.error("value must be string");void 0!==e?this.element!==this.container&&(void 0!==this.element.value?this.element.value=e:this.element.innerHTML=e):e=this.getElementValue(),e!==this.getEditorValue()&&this.setEditorValue(e);},Jodit.prototype.registerCommand=function(e,t,o){var r=e.toLowerCase();if(void 0===this.commands[r]&&(this.commands[r]=[]),this.commands[r].push(t),!s.isFunction(t)){var i=this.o.commandToHotkeys[r]||this.o.commandToHotkeys[e]||t.hotkeys;i&&this.registerHotkeyToCommand(i,r,null==o?void 0:o.stopPropagation);}return this},Jodit.prototype.registerHotkeyToCommand=function(e,t,o){var r=this;void 0===o&&(o=!0);var i=s.asArray(e).map(s.normalizeKeyAliases).map((function(e){return e+".hotkey"})).join(" ");this.e.off(i).on(i,(function(e,i){return i.shouldStop=null==o||o,r.execCommand(t)}));},Jodit.prototype.execCommand=function(e,t,o){if(void 0===t&&(t=!1),void 0===o&&(o=null),!this.o.readonly||"selectall"===e){var r;if(e=e.toLowerCase(),!1!==(r=this.e.fire("beforeCommand",e,t,o))&&(r=this.execCustomCommands(e,t,o)),!1!==r)if(this.s.focus(),"selectall"===e)this.s.select(this.editor,!0);else try{r=this.ed.execCommand(e,t,o);}catch(e){}return this.e.fire("afterCommand",e,t,o),this.setEditorValue(),r}},Jodit.prototype.execCustomCommands=function(e,t,o){var r,i;if(void 0===t&&(t=!1),void 0===o&&(o=null),e=e.toLowerCase(),void 0!==this.commands[e]){for(var n,a=0;this.commands[e].length>a;a+=1)void 0!==(i=(s.isFunction(r=this.commands[e][a])?r:r.exec).call(this,e,t,o))&&(n=i);return n}},Jodit.prototype.lock=function(t){return void 0===t&&(t="any"),!!e.prototype.lock.call(this,t)&&(this.__selectionLocked=this.s.save(),this.s.clear(),this.editor.classList.add("jodit_disabled"),this.e.fire("lock",!0),!0)},Jodit.prototype.unlock=function(){return !!e.prototype.unlock.call(this)&&(this.editor.classList.remove("jodit_disabled"),this.__selectionLocked&&this.s.restore(this.__selectionLocked),this.e.fire("lock",!1),!0)},Jodit.prototype.getMode=function(){return this.mode},Jodit.prototype.isEditorMode=function(){return this.getRealMode()===n.MODE_WYSIWYG},Jodit.prototype.getRealMode=function(){if(this.getMode()!==n.MODE_SPLIT)return this.getMode();var e=this.od.activeElement;return e&&(e===this.iframe||a.Dom.isOrContains(this.editor,e)||a.Dom.isOrContains(this.toolbar.container,e))?n.MODE_WYSIWYG:n.MODE_SOURCE},Jodit.prototype.setMode=function(e){var t=this,o=this.getMode(),r={mode:parseInt(e.toString(),10)},i=["jodit-wysiwyg_mode","jodit-source__mode","jodit_split_mode"];!1!==this.e.fire("beforeSetMode",r)&&(this.__mode=[n.MODE_SOURCE,n.MODE_WYSIWYG,n.MODE_SPLIT].includes(r.mode)?r.mode:n.MODE_WYSIWYG,this.o.saveModeInStorage&&this.storage.set("jodit_default_mode",this.mode),i.forEach((function(e){t.container.classList.remove(e);})),this.container.classList.add(i[this.mode-1]),o!==this.getMode()&&this.e.fire("afterSetMode"));},Jodit.prototype.toggleMode=function(){var e=this.getMode();[n.MODE_SOURCE,n.MODE_WYSIWYG,this.o.useSplitMode?n.MODE_SPLIT:9].includes(e+1)?e+=1:e=n.MODE_WYSIWYG,this.setMode(e);},Jodit.prototype.setDisabled=function(e){this.o.disabled=e;var t=this.__wasReadOnly;this.setReadOnly(e||t),this.__wasReadOnly=t,this.editor&&(this.editor.setAttribute("aria-disabled",e.toString()),this.container.classList.toggle("jodit_disabled",e),this.e.fire("disabled",e));},Jodit.prototype.getDisabled=function(){return this.o.disabled},Jodit.prototype.setReadOnly=function(e){this.__wasReadOnly!==e&&(this.__wasReadOnly=e,this.o.readonly=e,e?this.editor&&this.editor.removeAttribute("contenteditable"):this.editor&&this.editor.setAttribute("contenteditable","true"),this.e&&this.e.fire("readonly",e));},Jodit.prototype.getReadOnly=function(){return this.o.readonly},Jodit.prototype.beforeInitHook=function(){},Jodit.prototype.afterInitHook=function(){},Jodit.prototype.initOptions=function(e){this.options=i.configFactory(e);},Jodit.prototype.initOwners=function(){this.editorWindow=this.o.ownerWindow,this.ownerWindow=this.o.ownerWindow;},Jodit.prototype.addPlace=function(e,t){var o=this,r=s.resolveElement(e,this.o.shadowRoot||this.od);this.attachEvents(t),r.attributes&&s.toArray(r.attributes).forEach((function(e){var r=e.name,i=e.value;void 0===Jodit.defaultOptions[r]||t&&void 0!==t[r]||(-1!==["readonly","disabled"].indexOf(r)&&(i=""===i||"true"===i),/^[0-9]+(\.)?([0-9]+)?$/.test(i.toString())&&(i=Number(i)),o.options[r]=i);}));var n=this.c.div("jodit-container");n.classList.add("jodit"),n.classList.add("jodit-container"),n.classList.add("jodit_theme_"+(this.o.theme||"default")),n.setAttribute("contenteditable","false");var l=null;this.o.inline&&(-1===["TEXTAREA","INPUT"].indexOf(r.nodeName)&&(n=r,r.setAttribute(this.__defaultClassesKey,r.className.toString()),l=n.innerHTML,n.innerHTML=""),n.classList.add("jodit_inline"),n.classList.add("jodit-container")),r!==n&&(r.style.display&&r.setAttribute(this.__defaultStyleDisplayKey,r.style.display),r.style.display="none");var c=this.c.div("jodit-workplace",{contenteditable:!1});n.appendChild(c);var u=new a.StatusBar(this,n);r.parentNode&&r!==n&&r.parentNode.insertBefore(n,r);var d=this.c.div("jodit-wysiwyg",{contenteditable:!0,"aria-disabled":!1,tabindex:this.o.tabIndex});c.appendChild(d);var p={editor:d,element:r,container:n,workplace:c,statusbar:u,options:this.isReady?i.configFactory(t):this.options,observer:new a.Observer(this),editorWindow:this.ow};this.elementToPlace.set(d,p),this.setCurrentPlace(p),this.places.push(p),this.setNativeEditorValue(this.getElementValue());var f=this.initEditor(l),h=this.options;return s.callPromise(f,(function(){h.enableDragAndDropFileToEditor&&h.uploader&&(h.uploader.url||h.uploader.insertImageAsBase64URI)&&o.uploader.bind(o.editor),o.elementToPlace.get(o.editor)||o.elementToPlace.set(o.editor,p),o.e.fire("afterAddPlace",p);}))},Jodit.prototype.setCurrentPlace=function(e){this.currentPlace!==e&&(this.isEditorMode()||this.setMode(n.MODE_WYSIWYG),this.currentPlace=e,this.buildToolbar(),this.isReady&&this.e.fire("changePlace",e));},Jodit.prototype.initEditor=function(e){var t=this,o=this.createEditor();return s.callPromise(o,(function(){if(!t.isInDestruct){t.element!==t.container?t.setElementValue():null!=e&&t.setEditorValue(e);var o=t.o.defaultMode;if(t.o.saveModeInStorage){var r=t.storage.get("jodit_default_mode");"string"==typeof r&&(o=parseInt(r,10));}t.setMode(o),t.o.readonly&&(t.__wasReadOnly=!1,t.setReadOnly(!0)),t.o.disabled&&t.setDisabled(!0);try{t.ed.execCommand("defaultParagraphSeparator",!1,t.o.enter.toLowerCase());}catch(e){}try{t.ed.execCommand("enableObjectResizing",!1,"false");}catch(e){}try{t.ed.execCommand("enableInlineTableEditing",!1,"false");}catch(e){}}}))},Jodit.prototype.createEditor=function(){var e=this,t=this.editor,o=this.e.fire("createEditor",this);return s.callPromise(o,(function(){if(!e.isInDestruct){if((!1===o||s.isPromise(o))&&a.Dom.safeRemove(t),e.o.editorCssClass&&e.editor.classList.add(e.o.editorCssClass),e.o.style&&s.css(e.editor,e.o.style),e.e.on("synchro",(function(){e.setEditorValue();})).on("focus",(function(){e.editorIsActive=!0;})).on("blur",(function(){return e.editorIsActive=!1})),e.prepareWYSIWYGEditor(),e.o.direction){var r="rtl"===e.o.direction.toLowerCase()?"rtl":"ltr";e.container.style.direction=r,e.container.setAttribute("dir",r),e.toolbar.setDirection(r);}e.o.triggerChangeEvent&&e.e.on("change",e.async.debounce((function(){e.e&&e.e.fire(e.element,"change");}),e.defaultTimeout));}}))},Jodit.prototype.attachEvents=function(e){var t=this,o=null==e?void 0:e.events;o&&Object.keys(o).forEach((function(e){return t.e.on(e,o[e])}));},Jodit.prototype.prepareWYSIWYGEditor=function(){var e=this,t=this.editor;if(this.o.spellcheck&&this.editor.setAttribute("spellcheck","true"),this.o.direction){var o="rtl"===this.o.direction.toLowerCase()?"rtl":"ltr";this.editor.style.direction=o,this.editor.setAttribute("dir",o);}this.e.on(t,"mousedown touchstart focus",(function(){var o=e.elementToPlace.get(t);o&&e.setCurrentPlace(o);})).on(t,"compositionend",(function(){e.setEditorValue();})).on(t,"selectionchange selectionstart keydown keyup keypress dblclick mousedown mouseup click copy cut dragstart drop dragover paste resize touchstart touchend focus blur",(function(t){if(!e.o.readonly&&!(t instanceof e.ew.KeyboardEvent&&t.isComposing)&&e.e&&e.e.fire){if(!1===e.e.fire(t.type,t))return !1;e.setEditorValue();}}));},Jodit.prototype.destruct=function(){var t=this;if(!this.isInDestruct&&(this.setStatus(a.STATUSES.beforeDestruct),this.elementToPlace.clear(),this.editor)){var o=this.getEditorValue();this.storage.clear(),this.buffer.clear(),this.commands={},this.__selectionLocked=null,this.e.off(this.ow,"resize"),this.e.off(this.ow),this.e.off(this.od),this.e.off(this.od.body),this.places.forEach((function(e){var r=e.container,i=e.workplace,n=e.statusbar,l=e.element,c=e.iframe,u=e.editor,d=e.observer;if(l!==r)if(l.hasAttribute(t.__defaultStyleDisplayKey)){var p=s.attr(l,t.__defaultStyleDisplayKey);p&&(l.style.display=p,l.removeAttribute(t.__defaultStyleDisplayKey));}else l.style.display="";else l.hasAttribute(t.__defaultClassesKey)&&(l.className=s.attr(l,t.__defaultClassesKey)||"",l.removeAttribute(t.__defaultClassesKey));l.hasAttribute("style")&&!s.attr(l,"style")&&l.removeAttribute("style"),!n.isInDestruct&&n.destruct(),t.e.off(r),t.e.off(l),t.e.off(u),a.Dom.safeRemove(i),a.Dom.safeRemove(u),r!==l&&a.Dom.safeRemove(r),a.Dom.safeRemove(c),r===l&&(l.innerHTML=o),!d.isInDestruct&&d.destruct();})),this.places.length=0,this.currentPlace={},delete u.instances[this.id],e.prototype.destruct.call(this);}},Jodit.plugins=u.pluginSystem,Jodit.modules=u.modules,Jodit.ns=u.modules,Jodit.decorators={},Jodit.instances=u.instances,Jodit.getContainer=u.getContainer,Jodit.lang=u.lang,Jodit.core={Plugin:a.Plugin},r.__decorate([d.cache],Jodit.prototype,"uploader",null),r.__decorate([d.cache],Jodit.prototype,"filebrowser",null),r.__decorate([d.autobind],Jodit.prototype,"prepareWYSIWYGEditor",null),Jodit}(c.ViewWithToolbar);t.Jodit=Jodit;},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.__classPrivateFieldSet=t.__classPrivateFieldGet=t.__importDefault=t.__importStar=t.__makeTemplateObject=t.__asyncValues=t.__asyncDelegator=t.__asyncGenerator=t.__await=t.__spreadArrays=t.__spread=t.__read=t.__values=t.__exportStar=t.__createBinding=t.__generator=t.__awaiter=t.__metadata=t.__param=t.__decorate=t.__rest=t.__assign=t.__extends=void 0;var o=function(e,t){return (o=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t;}||function(e,t){for(var o in t)Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o]);})(e,t)};function r(e){var t="function"==typeof Symbol&&Symbol.iterator,o=t&&e[t],r=0;if(o)return o.call(e);if(e&&"number"==typeof e.length)return {next:function(){return e&&r>=e.length&&(e=void 0),{value:e&&e[r++],done:!e}}};throw new TypeError(t?"Object is not iterable.":"Symbol.iterator is not defined.")}function i(e,t){var o="function"==typeof Symbol&&e[Symbol.iterator];if(!o)return e;var r,i,n=o.call(e),a=[];try{for(;(void 0===t||t-- >0)&&!(r=n.next()).done;)a.push(r.value);}catch(e){i={error:e};}finally{try{r&&!r.done&&(o=n.return)&&o.call(n);}finally{if(i)throw i.error}}return a}function n(e){return this instanceof n?(this.v=e,this):new n(e)}t.__extends=function(e,t){function r(){this.constructor=e;}o(e,t),e.prototype=null===t?Object.create(t):(r.prototype=t.prototype,new r);},t.__assign=function(){return t.__assign=Object.assign||function(e){for(var t,o=1,r=arguments.length;r>o;o++)for(var i in t=arguments[o])Object.prototype.hasOwnProperty.call(t,i)&&(e[i]=t[i]);return e},t.__assign.apply(this,arguments)},t.__rest=function(e,t){var o={};for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&0>t.indexOf(r)&&(o[r]=e[r]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var i=0;for(r=Object.getOwnPropertySymbols(e);r.length>i;i++)0>t.indexOf(r[i])&&Object.prototype.propertyIsEnumerable.call(e,r[i])&&(o[r[i]]=e[r[i]]);}return o},t.__decorate=function(e,t,o,r){var i,n=arguments.length,a=3>n?t:null===r?r=Object.getOwnPropertyDescriptor(t,o):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,o,r);else for(var s=e.length-1;s>=0;s--)(i=e[s])&&(a=(3>n?i(a):n>3?i(t,o,a):i(t,o))||a);return n>3&&a&&Object.defineProperty(t,o,a),a},t.__param=function(e,t){return function(o,r){t(o,r,e);}},t.__metadata=function(e,t){if("object"==typeof Reflect&&"function"==typeof Reflect.metadata)return Reflect.metadata(e,t)},t.__awaiter=function(e,t,o,r){return new(o||(o=Promise))((function(i,n){function a(e){try{l(r.next(e));}catch(e){n(e);}}function s(e){try{l(r.throw(e));}catch(e){n(e);}}function l(e){var t;e.done?i(e.value):(t=e.value,t instanceof o?t:new o((function(e){e(t);}))).then(a,s);}l((r=r.apply(e,t||[])).next());}))},t.__generator=function(e,t){var o,r,i,n,a={label:0,sent:function(){if(1&i[0])throw i[1];return i[1]},trys:[],ops:[]};return n={next:s(0),throw:s(1),return:s(2)},"function"==typeof Symbol&&(n[Symbol.iterator]=function(){return this}),n;function s(n){return function(s){return function(n){if(o)throw new TypeError("Generator is already executing.");for(;a;)try{if(o=1,r&&(i=2&n[0]?r.return:n[0]?r.throw||((i=r.return)&&i.call(r),0):r.next)&&!(i=i.call(r,n[1])).done)return i;switch(r=0,i&&(n=[2&n[0],i.value]),n[0]){case 0:case 1:i=n;break;case 4:return a.label++,{value:n[1],done:!1};case 5:a.label++,r=n[1],n=[0];continue;case 7:n=a.ops.pop(),a.trys.pop();continue;default:if(!((i=(i=a.trys).length>0&&i[i.length-1])||6!==n[0]&&2!==n[0])){a=0;continue}if(3===n[0]&&(!i||n[1]>i[0]&&i[3]>n[1])){a.label=n[1];break}if(6===n[0]&&i[1]>a.label){a.label=i[1],i=n;break}if(i&&i[2]>a.label){a.label=i[2],a.ops.push(n);break}i[2]&&a.ops.pop(),a.trys.pop();continue}n=t.call(e,a);}catch(e){n=[6,e],r=0;}finally{o=i=0;}if(5&n[0])throw n[1];return {value:n[0]?n[1]:void 0,done:!0}}([n,s])}}},t.__createBinding=Object.create?function(e,t,o,r){void 0===r&&(r=o),Object.defineProperty(e,r,{enumerable:!0,get:function(){return t[o]}});}:function(e,t,o,r){void 0===r&&(r=o),e[r]=t[o];},t.__exportStar=function(e,o){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(o,r)||t.__createBinding(o,e,r);},t.__values=r,t.__read=i,t.__spread=function(){for(var e=[],t=0;arguments.length>t;t++)e=e.concat(i(arguments[t]));return e},t.__spreadArrays=function(){for(var e=0,t=0,o=arguments.length;o>t;t++)e+=arguments[t].length;var r=Array(e),i=0;for(t=0;o>t;t++)for(var n=arguments[t],a=0,s=n.length;s>a;a++,i++)r[i]=n[a];return r},t.__await=n,t.__asyncGenerator=function(e,t,o){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var r,i=o.apply(e,t||[]),a=[];return r={},s("next"),s("throw"),s("return"),r[Symbol.asyncIterator]=function(){return this},r;function s(e){i[e]&&(r[e]=function(t){return new Promise((function(o,r){a.push([e,t,o,r])>1||l(e,t);}))});}function l(e,t){try{(o=i[e](t)).value instanceof n?Promise.resolve(o.value.v).then(c,u):d(a[0][2],o);}catch(e){d(a[0][3],e);}var o;}function c(e){l("next",e);}function u(e){l("throw",e);}function d(e,t){e(t),a.shift(),a.length&&l(a[0][0],a[0][1]);}},t.__asyncDelegator=function(e){var t,o;return t={},r("next"),r("throw",(function(e){throw e})),r("return"),t[Symbol.iterator]=function(){return this},t;function r(r,i){t[r]=e[r]?function(t){return (o=!o)?{value:n(e[r](t)),done:"return"===r}:i?i(t):t}:i;}},t.__asyncValues=function(e){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var t,o=e[Symbol.asyncIterator];return o?o.call(e):(e=r(e),t={},i("next"),i("throw"),i("return"),t[Symbol.asyncIterator]=function(){return this},t);function i(o){t[o]=e[o]&&function(t){return new Promise((function(r,i){!function(e,t,o,r){Promise.resolve(r).then((function(t){e({value:t,done:o});}),t);}(r,i,(t=e[o](t)).done,t.value);}))};}},t.__makeTemplateObject=function(e,t){return Object.defineProperty?Object.defineProperty(e,"raw",{value:t}):e.raw=t,e};var a=Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t});}:function(e,t){e.default=t;};t.__importStar=function(e){if(e&&e.__esModule)return e;var o={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&t.__createBinding(o,e,r);return a(o,e),o},t.__importDefault=function(e){return e&&e.__esModule?e:{default:e}},t.__classPrivateFieldGet=function(e,t){if(!t.has(e))throw new TypeError("attempted to get private field on non-instance");return t.get(e)},t.__classPrivateFieldSet=function(e,t,o){if(!t.has(e))throw new TypeError("attempted to set private field on non-instance");return t.set(e,o),o};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.configFactory=t.OptionsDefault=t.Config=void 0;var r=o(9),i=o(10),n=function(){function e(){this.iframe=!1,this.license="",this.preset="custom",this.presets={inline:{inline:!0,toolbar:!1,toolbarInline:!0,toolbarInlineForSelection:!0,showXPathInStatusbar:!1,showCharsCounter:!1,showWordsCounter:!1,showPlaceholder:!1}},this.ownerDocument="undefined"!=typeof document?document:null,this.ownerWindow="undefined"!=typeof window?window:null,this.shadowRoot=null,this.zIndex=0,this.readonly=!1,this.disabled=!1,this.activeButtonsInReadOnly=["source","fullsize","print","about","dots","selectall"],this.toolbarButtonSize="middle",this.allowTabNavigation=!1,this.inline=!1,this.theme="default",this.saveModeInStorage=!1,this.spellcheck=!0,this.editorCssClass=!1,this.style=!1,this.triggerChangeEvent=!0,this.direction="",this.language="auto",this.debugLanguage=!1,this.i18n=!1,this.tabIndex=-1,this.toolbar=!0,this.statusbar=!0,this.showTooltip=!0,this.showTooltipDelay=1e3,this.useNativeTooltip=!1,this.enter=r.PARAGRAPH,this.enterBlock="br"!==this.enter?this.enter:r.PARAGRAPH,this.defaultMode=r.MODE_WYSIWYG,this.useSplitMode=!1,this.colors={greyscale:["#000000","#434343","#666666","#999999","#B7B7B7","#CCCCCC","#D9D9D9","#EFEFEF","#F3F3F3","#FFFFFF"],palette:["#980000","#FF0000","#FF9900","#FFFF00","#00F0F0","#00FFFF","#4A86E8","#0000FF","#9900FF","#FF00FF"],full:["#E6B8AF","#F4CCCC","#FCE5CD","#FFF2CC","#D9EAD3","#D0E0E3","#C9DAF8","#CFE2F3","#D9D2E9","#EAD1DC","#DD7E6B","#EA9999","#F9CB9C","#FFE599","#B6D7A8","#A2C4C9","#A4C2F4","#9FC5E8","#B4A7D6","#D5A6BD","#CC4125","#E06666","#F6B26B","#FFD966","#93C47D","#76A5AF","#6D9EEB","#6FA8DC","#8E7CC3","#C27BA0","#A61C00","#CC0000","#E69138","#F1C232","#6AA84F","#45818E","#3C78D8","#3D85C6","#674EA7","#A64D79","#85200C","#990000","#B45F06","#BF9000","#38761D","#134F5C","#1155CC","#0B5394","#351C75","#733554","#5B0F00","#660000","#783F04","#7F6000","#274E13","#0C343D","#1C4587","#073763","#20124D","#4C1130"]},this.colorPickerDefaultTab="background",this.imageDefaultWidth=300,this.removeButtons=[],this.disablePlugins=[],this.extraPlugins=[],this.extraButtons=[],this.extraIcons={},this.createAttributes={},this.sizeLG=900,this.sizeMD=700,this.sizeSM=400,this.buttons=[{group:"source",buttons:[]},{group:"font-style",buttons:[]},{group:"script",buttons:[]},{group:"list",buttons:["ul","ol"]},{group:"indent",buttons:[]},{group:"font",buttons:[]},{group:"color",buttons:[]},{group:"media",buttons:[]},"\n",{group:"state",buttons:[]},{group:"clipboard",buttons:[]},{group:"insert",buttons:[]},{group:"history",buttons:[]},{group:"search",buttons:[]},{group:"other",buttons:[]},{group:"info",buttons:[]}],this.buttonsMD=["source","|","bold","italic","|","ul","ol","eraser","|","font","fontsize","brush","paragraph","|","image","table","link","|","align","\n","undo","redo","|","hr","copyformat","fullsize","dots"],this.buttonsSM=["source","|","bold","italic","|","ul","ol","eraser","|","fontsize","brush","paragraph","|","image","table","\n","link","|","align","|","undo","redo","|","copyformat","fullsize","dots"],this.buttonsXS=["bold","image","|","brush","paragraph","eraser","\n","align","|","undo","redo","|","dots"],this.events={},this.textIcons=!1,this.showBrowserColorPicker=!0;}return Object.defineProperty(e,"defaultOptions",{get:function(){return e.__defaultOptions||(e.__defaultOptions=new e),e.__defaultOptions},enumerable:!1,configurable:!0}),e}();t.Config=n,t.OptionsDefault=function(e,t){var o=this;void 0===t&&(t=n.defaultOptions);var r=this;if(r.plainOptions=e,void 0!==e&&"object"==typeof e){var a=function(e,n){if("preset"===n&&void 0!==t.presets[e.preset]){var s=t.presets[e.preset];Object.keys(s).forEach(a.bind(o,s));}var l=t[n],c=e[n],u="object"==typeof l&&null!=l;r[n]=i.isAtom(c)||!u||["ownerWindow","ownerDocument"].includes(n)||i.isArray(l)?c:i.extend(!0,{},l,c);};Object.keys(e).forEach(a.bind(this,e));}},n.prototype.controls={},t.configFactory=function(e){return new t.OptionsDefault(e)};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.BASE_PATH=t.KEY_ALIASES=t.IS_MAC=t.SAFE_COUNT_CHANGE_CALL=t.INSERT_ONLY_TEXT=t.INSERT_AS_TEXT=t.INSERT_CLEAR_HTML=t.INSERT_AS_HTML=t.EMULATE_DBLCLICK_TIMEOUT=t.MARKER_CLASS=t.TEXT_HTML=t.TEXT_PLAIN=t.IS_IE=t.MODE_SPLIT=t.MODE_SOURCE=t.MODE_WYSIWYG=t.PARAGRAPH=t.BR=t.COMMAND_KEYS=t.ACCURACY=t.NEARBY=t.KEY_F3=t.KEY_DELETE=t.KEY_DOWN=t.KEY_RIGHT=t.KEY_UP=t.KEY_LEFT=t.KEY_ESC=t.KEY_ENTER=t.KEY_TAB=t.KEY_BACKSPACE=t.MAY_BE_REMOVED_WITH_KEY=t.INSEPARABLE_TAGS=t.IS_INLINE=t.IS_BLOCK=t.SPACE_REG_EXP_END=t.SPACE_REG_EXP_START=t.SPACE_REG_EXP=t.INVISIBLE_SPACE_REG_EXP_START=t.INVISIBLE_SPACE_REG_EXP_END=t.INVISIBLE_SPACE_REG_EXP=t.NBSP_SPACE=t.INVISIBLE_SPACE=void 0,t.INVISIBLE_SPACE="\ufeff",t.NBSP_SPACE=" ",t.INVISIBLE_SPACE_REG_EXP=function(){return /[\uFEFF]/g},t.INVISIBLE_SPACE_REG_EXP_END=function(){return /[\uFEFF]+$/g},t.INVISIBLE_SPACE_REG_EXP_START=function(){return /^[\uFEFF]+/g},t.SPACE_REG_EXP=function(){return /[\s\n\t\r\uFEFF\u200b]+/g},t.SPACE_REG_EXP_START=function(){return /^[\s\n\t\r\uFEFF\u200b]+/g},t.SPACE_REG_EXP_END=function(){return /[\s\n\t\r\uFEFF\u200b]+$/g},t.IS_BLOCK=/^(ARTICLE|SCRIPT|IFRAME|JODIT|JODIT-MEDIA|PRE|DIV|P|LI|UL|OL|H[1-6]|BLOCKQUOTE|TR|TD|TH|TBODY|THEAD|TABLE|BODY|HTML|FIGCAPTION|FIGURE|DT|DD|DL|DFN)$/i,t.IS_INLINE=/^(STRONG|SPAN|I|EM|B|SUP|SUB)$/i,t.INSEPARABLE_TAGS=["img","br","video","iframe","script","input","textarea","hr","link","jodit","jodit-media"],t.MAY_BE_REMOVED_WITH_KEY=RegExp("^"+t.INSEPARABLE_TAGS.join("|")+"$","i"),t.KEY_BACKSPACE="Backspace",t.KEY_TAB="Tab",t.KEY_ENTER="Enter",t.KEY_ESC="Escape",t.KEY_LEFT="ArrowLeft",t.KEY_UP="ArrowUp",t.KEY_RIGHT="ArrowRight",t.KEY_DOWN="ArrowDown",t.KEY_DELETE="Delete",t.KEY_F3="F3",t.NEARBY=5,t.ACCURACY=10,t.COMMAND_KEYS=[t.KEY_BACKSPACE,t.KEY_DELETE,t.KEY_UP,t.KEY_DOWN,t.KEY_RIGHT,t.KEY_LEFT,t.KEY_ENTER,t.KEY_ESC,t.KEY_F3,t.KEY_TAB],t.BR="br",t.PARAGRAPH="p",t.MODE_WYSIWYG=1,t.MODE_SOURCE=2,t.MODE_SPLIT=3,t.IS_IE="undefined"!=typeof navigator&&(-1!==navigator.userAgent.indexOf("MSIE")||/rv:11.0/i.test(navigator.userAgent)),t.TEXT_PLAIN=t.IS_IE?"text":"text/plain",t.TEXT_HTML=t.IS_IE?"html":"text/html",t.MARKER_CLASS="jodit-selection_marker",t.EMULATE_DBLCLICK_TIMEOUT=300,t.INSERT_AS_HTML="insert_as_html",t.INSERT_CLEAR_HTML="insert_clear_html",t.INSERT_AS_TEXT="insert_as_text",t.INSERT_ONLY_TEXT="insert_only_text",t.SAFE_COUNT_CHANGE_CALL=10,t.IS_MAC="undefined"!=typeof window&&/Mac|iPod|iPhone|iPad/.test(window.navigator.platform),t.KEY_ALIASES={add:"+",break:"pause",cmd:"meta",command:"meta",ctl:"control",ctrl:"control",del:"delete",down:"arrowdown",esc:"escape",ins:"insert",left:"arrowleft",mod:t.IS_MAC?"meta":"control",opt:"alt",option:"alt",return:"enter",right:"arrowright",space:" ",spacebar:" ",up:"arrowup",win:"meta",windows:"meta"},t.BASE_PATH=function(){if("undefined"==typeof document)return "";var e=document.currentScript,t=function(e){return e.replace(/\/[^/]+.js$/,"/")};if(e)return t(e.src);var o=document.querySelectorAll("script[src]");return o&&o.length?t(o[o.length-1].src):window.location.href}();},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(11),t),r.__exportStar(o(72),t),r.__exportStar(o(76),t),r.__exportStar(o(18),t),r.__exportStar(o(14),t),r.__exportStar(o(78),t),r.__exportStar(o(80),t),r.__exportStar(o(87),t),r.__exportStar(o(97),t),r.__exportStar(o(23),t),r.__exportStar(o(102),t),r.__exportStar(o(104),t),r.__exportStar(o(105),t),r.__exportStar(o(107),t),r.__exportStar(o(108),t),r.__exportStar(o(109),t),r.__exportStar(o(30),t),r.__exportStar(o(110),t),r.__exportStar(o(103),t),r.__exportStar(o(111),t),r.__exportStar(o(17),t),r.__exportStar(o(19),t),r.__exportStar(o(106),t),r.__exportStar(o(112),t),r.__exportStar(o(113),t),r.__exportStar(o(82),t),r.__exportStar(o(20),t),r.__exportStar(o(114),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(12),t),r.__exportStar(o(13),t),r.__exportStar(o(69),t),r.__exportStar(o(70),t),r.__exportStar(o(71),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.markDeprecated=t.cns=void 0;var r=o(7);t.cns=console,t.markDeprecated=function(e,o,i){return void 0===o&&(o=[""]),void 0===i&&(i=null),function(){for(var n=[],a=0;arguments.length>a;a++)n[a]=arguments[a];return t.cns.warn('Method "'+o[0]+'" deprecated.'+(o[1]?' Use "'+o[1]+'" instead':"")),e.call.apply(e,r.__spreadArrays([i],n))}};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.reset=t.callPromise=t.markOwner=t.attr=t.call=void 0;var r=o(14),i=o(69);function n(e,t,o){if(!e||!r.isFunction(e.getAttribute))return null;if(/^-/.test(t)){var i=n(e,"data"+t);if(i)return i;t=t.substr(1);}if(void 0!==o){if(null!=o)return e.setAttribute(t,o.toString()),o.toString();e.hasAttribute(t)&&e.removeAttribute(t);}return e.getAttribute(t)}t.call=function(e){for(var t=[],o=1;arguments.length>o;o++)t[o-1]=arguments[o];return e.apply(void 0,t)},t.attr=n,t.markOwner=function(e,t){n(t,"data-editor_id",e.id),!t.component&&Object.defineProperty(t,"jodit",{value:e});},t.callPromise=function(e,t){return r.isPromise(e)?e.finally(t):t()};var a={};t.reset=function(e){var t,o;if(!(e in a)){var n=document.createElement("iframe");try{if(n.src="about:blank",document.body.appendChild(n),!n.contentWindow)return null;var s=i.get(e,n.contentWindow),l=i.get(e.split(".").slice(0,-1).join("."),n.contentWindow);r.isFunction(s)&&(a[e]=s.bind(l));}catch(e){}finally{null===(t=n.parentNode)||void 0===t||t.removeChild(n);}}return null!==(o=a[e])&&void 0!==o?o:null};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(15),t),r.__exportStar(o(16),t),r.__exportStar(o(21),t),r.__exportStar(o(22),t),r.__exportStar(o(52),t),r.__exportStar(o(53),t),r.__exportStar(o(55),t),r.__exportStar(o(56),t),r.__exportStar(o(58),t),r.__exportStar(o(60),t),r.__exportStar(o(61),t),r.__exportStar(o(62),t),r.__exportStar(o(63),t),r.__exportStar(o(59),t),r.__exportStar(o(64),t),r.__exportStar(o(66),t),r.__exportStar(o(54),t),r.__exportStar(o(67),t),r.__exportStar(o(68),t),r.__exportStar(o(57),t),r.__exportStar(o(65),t);},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.hasBrowserColorPicker=void 0,t.hasBrowserColorPicker=function(){var e=!0;try{var t=document.createElement("input");t.type="color",e="color"===t.type&&"number"!=typeof t.selectionStart;}catch(t){e=!1;}return e};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isArray=void 0;var r=o(17);t.isArray=function(e){return Array.isArray(e)||e instanceof r.JoditArray};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.JoditArray=void 0;var r=o(18);o(20),t.JoditArray=function(e){return r.markAsAtomic(e),e};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.markAsAtomic=t.isAtom=t.extend=void 0;var r=o(19),i=o(17),n=o(14);function a(e){return e&&e.isAtom}t.extend=function e(){for(var t=[],o=0;arguments.length>o;o++)t[o]=arguments[o];var s,l,c,u,d,p,f,h=t.length,m=t[0]||{},v=1,g=!1;for("boolean"==typeof m&&(g=m,m=t[v]||{},v+=1),"object"!=typeof m&&n.isFunction(m)&&(m={}),v===h&&(m=this,v+=1);h>v;v+=1)if(null!=(s=t[v]))for(f=Object.keys(s),p=0;f.length>p;p+=1)c=m[l=f[p]],m!==(u=s[l])&&(g&&u&&(n.isPlainObject(u)&&!(u instanceof r.JoditObject)||n.isArray(u)&&!(u instanceof i.JoditArray))?(d=n.isArray(u)?c&&n.isArray(c)?c:[]:c&&n.isPlainObject(c)?c:{},m[l]=a(u)?u:a(d)?d:e(g,d,u)):void 0!==u&&(m[l]=u));return m},t.isAtom=a,t.markAsAtomic=function(e){return Object.defineProperty(e,"isAtom",{enumerable:!1,value:!0,configurable:!1}),e};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.JoditObject=void 0,o(20);var r=o(18);t.JoditObject=function(e){return r.markAsAtomic(e),e};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.error=t.type=t.hasOwn=void 0;var o={},r=o.toString;t.hasOwn=o.hasOwnProperty,["Boolean","Number","String","Function","Array","Date","RegExp","Object","Error","Symbol","HTMLDocument","Window","HTMLElement","HTMLBodyElement","Text","DocumentFragment","DOMStringList","HTMLCollection"].forEach((function(e){o["[object "+e+"]"]=e.toLowerCase();})),t.type=function(e){return null===e?"null":"object"==typeof e||"function"==typeof e?o[r.call(e)]||"object":typeof e},t.error=function(e){return new TypeError(e)};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isBoolean=void 0,t.isBoolean=function(e){return "boolean"==typeof e};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isFastEqual=t.isEqual=void 0;var r=o(23);t.isEqual=function(e,t){return e===t||r.stringify(e)===r.stringify(t)},t.isFastEqual=function(e,t){return e===t};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(24),t),r.__exportStar(o(25),t),r.__exportStar(o(26),t),r.__exportStar(o(27),t),r.__exportStar(o(28),t),r.__exportStar(o(29),t);},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.camelCase=void 0,t.camelCase=function(e){return e.replace(/([-_])(.)/g,(function(e,t,o){return o.toUpperCase()}))};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.stringify=void 0,t.stringify=function(e,t){if(void 0===t&&(t={}),"object"!=typeof e)return e.toString?e.toString():e;var o=new Set(t.excludeKeys),r=new WeakMap;return JSON.stringify(e,(function(e,t){if(!o.has(e)){if("object"==typeof t&&null!=t){if(r.get(t))return "[refObject]";r.set(t,!0);}return t}}),t.prettify)};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.kebabCase=void 0,t.kebabCase=function(e){return e.replace(/([A-Z])([A-Z])([a-z])/g,"$1-$2$3").replace(/([a-z])([A-Z])/g,"$1-$2").replace(/[\s_]+/g,"-").toLowerCase()};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.trimInv=t.trim=void 0;var r=o(9);t.trim=function(e){return e.replace(r.SPACE_REG_EXP_END(),"").replace(r.SPACE_REG_EXP_START(),"")},t.trimInv=function(e){return e.replace(r.INVISIBLE_SPACE_REG_EXP_END(),"").replace(r.INVISIBLE_SPACE_REG_EXP_START(),"")};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ucfirst=void 0,t.ucfirst=function(e){return e.length?e[0].toUpperCase()+e.substr(1):""};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.i18n=t.sprintf=void 0;var r=o(8),i=o(30),n=o(10),a=o(31);t.sprintf=function(e,t){if(!t||!t.length)return e;for(var o=/%([sd])/g,r=o.exec(e),i=e,n=0;r&&void 0!==t[n];)i=i.replace(r[0],t[n].toString()),n+=1,r=o.exec(e);return i},t.i18n=function(e,o,s){if(!n.isString(e))throw n.error("i18n: Need string in first argument");if(!e.length)return e;var l,c=Boolean(void 0!==s&&s.debugLanguage),u=function(e){return o&&o.length?t.sprintf(e,o):e},d=i.defaultLanguage(r.Config.defaultOptions.language,r.Config.defaultOptions.language),p=i.defaultLanguage(null==s?void 0:s.language,d),f=function(t){if(t){if(n.isString(t[e]))return u(t[e]);var o=e.toLowerCase();if(n.isString(t[o]))return u(t[o]);var r=n.ucfirst(e);return n.isString(t[r])?u(t[r]):void 0}};l=void 0!==a.lang[p]?a.lang[p]:void 0!==a.lang[d]?a.lang[d]:a.lang.en;var h=null==s?void 0:s.i18n;if(h&&h[p]){var m=f(h[p]);if(m)return m}return f(l)||(a.lang.en&&n.isString(a.lang.en[e])&&a.lang.en[e]?u(a.lang.en[e]):c?"{"+e+"}":u(e))};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.defaultLanguage=void 0;var r=o(14);t.defaultLanguage=function(e,t){return void 0===t&&(t="en"),"auto"!==e&&r.isString(e)?e:document.documentElement&&document.documentElement.lang?document.documentElement.lang:navigator.language?navigator.language.substr(0,2):t};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.eventEmitter=t.getContainer=t.lang=t.modules=t.pluginSystem=t.uniqueUid=t.instances=void 0;var r=o(32),i=o(33),n=o(10),a=o(34);t.instances={};var s=1;t.uniqueUid=function(){return s+=10*(Math.random()+1),Math.round(s).toString(16)},t.pluginSystem=new r.PluginSystem,t.modules={},t.lang={};var l=new WeakMap;t.getContainer=function(e,t,o,r){void 0===o&&(o="div"),void 0===r&&(r=!1);var a=n.getClassName(t.prototype),s=l.get(e)||{},c=a+o;if(!s[c]){var u=n.isViewObject(e)?e:e.j,d=u.c,p=e.od.body;r&&n.isJoditObject(e)&&e.od!==e.ed&&(d=e.createInside,p="style"===o?e.ed.head:e.ed.body);var f=d.element(o,{className:"jodit jodit-"+n.kebabCase(a)+"-container jodit-box"});f.classList.add("jodit_theme_"+(u.o.theme||"default")),p.appendChild(f),s[c]=f,e.hookStatus("beforeDestruct",(function(){i.Dom.safeRemove(f),delete s[c],Object.keys(s).length&&l.delete(e);})),l.set(e,s);}return s[c]},t.eventEmitter=new a.EventsNative;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.PluginSystem=void 0;var r=o(10),i=function(){function e(){this.items=new Map;}return e.prototype.normalizeName=function(e){return r.kebabCase(e).toLowerCase()},e.prototype.add=function(e,t){this.items.set(this.normalizeName(e),t);},e.prototype.get=function(e){return this.items.get(this.normalizeName(e))},e.prototype.remove=function(e){this.items.delete(this.normalizeName(e));},e.prototype.init=function(t){var o=this,i=t.o.extraPlugins.map((function(e){return r.isString(e)?{name:e}:e})),n=r.splitArray(t.o.disablePlugins).map((function(e){return o.normalizeName(e)})),a=[],s={},l=[],c={},u=function(i,u){var d;if(!(n.includes(u)||a.includes(u)||s[u])){var p=null===(d=i)||void 0===d?void 0:d.requires;if(!(p&&r.isArray(p)&&o.hasDisabledRequires(n,p))){var f=e.makePluginInstance(t,i);o.initOrWait(t,u,f,a,s),l.push(f),c[u]=f;}}},d=this.loadExtras(t,i);return r.callPromise(d,(function(){t.isInDestruct||(o.items.forEach(u),o.addListenerOnBeforeDestruct(t,l),t.__plugins=c);}))},e.prototype.hasDisabledRequires=function(e,t){return Boolean((null==t?void 0:t.length)&&e.some((function(e){return t.includes(e)})))},e.makePluginInstance=function(e,t){return r.isFunction(t)?new t(e):t},e.prototype.initOrWait=function(t,o,i,n,a){var s=function(o,i){if(i.hasStyle&&e.loadStyle(t,o),r.isInitable(i)){var s=i.requires;if((null==s?void 0:s.length)&&!s.every((function(e){return n.includes(e)})))return a[o]=i,!1;i.init(t),n.push(o);}else n.push(o);return !0};s(o,i),Object.keys(a).forEach((function(e){a[e]&&s(e,i)&&(a[e]=void 0,delete a[e]);}));},e.prototype.addListenerOnBeforeDestruct=function(e,t){e.e.on("beforeDestruct",(function(){t.forEach((function(t){r.isDestructable(t)&&t.destruct(e);})),t.length=0,delete e.__plugins;}));},e.prototype.load=function(t,o){return Promise.all(o.map((function(o){var i=o.url||e.getFullUrl(t,o.name,!0);return r.appendScriptAsync(t,i).then((function(e){return {v:e,status:"fulfilled"}}),(function(e){return {e:e,status:"rejected"}}))})))},e.loadStyle=function(t,o){return r.appendStyleAsync(t,e.getFullUrl(t,o,!1))},e.getFullUrl=function(e,t,o){return t=r.kebabCase(t),e.basePath+"plugins/"+t+"/"+t+"."+(o?"js":"css")},e.prototype.loadExtras=function(e,t){var o=this;if(t&&t.length)try{var r=t.filter((function(e){return !o.items.has(o.normalizeName(e.name))}));if(r.length)return this.load(e,r)}catch(e){}},e}();t.PluginSystem=i;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Dom=void 0;var r=o(9),i=o(10),n=function(){function e(){}return e.detach=function(e){for(;e.firstChild;)e.removeChild(e.firstChild);},e.wrapInline=function(t,o,r){var n,a=t,s=t,l=r.s.save(),c=!1;do{c=!1,(n=a.previousSibling)&&!e.isBlock(n,r.ew)&&(c=!0,a=n);}while(c);do{c=!1,(n=s.nextSibling)&&!e.isBlock(n,r.ew)&&(c=!0,s=n);}while(c);var u=i.isString(o)?r.createInside.element(o):o;a.parentNode&&a.parentNode.insertBefore(u,a);for(var d=a;d&&(d=a.nextSibling,u.appendChild(a),a!==s&&d);)a=d;return r.s.restore(l),u},e.wrap=function(e,t,o){var r=o.s.save(),n=i.isString(t)?o.createInside.element(t):t;return e.parentNode?(e.parentNode.insertBefore(n,e),n.appendChild(e),o.s.restore(r),n):null},e.unwrap=function(t){var o=t.parentNode;if(o){for(;t.firstChild;)o.insertBefore(t.firstChild,t);e.safeRemove(t);}},e.each=function(t,o){var r=t.firstChild;if(r)for(;r;){var i=e.next(r,Boolean,t);if(!1===o(r))return !1;if(r.parentNode&&!e.each(r,o))return !1;r=i;}return !0},e.between=function(e,t,o){for(var r=e;r&&r!==t&&(e===r||!o(r));){var i=r.firstChild||r.nextSibling;if(!i){for(;r&&!r.nextSibling;)r=r.parentNode;i=null==r?void 0:r.nextSibling;}r=i;}},e.replace=function(e,t,o,r,n){void 0===r&&(r=!1),void 0===n&&(n=!1);var a=i.isString(t)?o.element(t):t;if(!n)for(;e.firstChild;)a.appendChild(e.firstChild);return r&&i.toArray(e.attributes).forEach((function(e){a.setAttribute(e.name,e.value);})),e.parentNode&&e.parentNode.replaceChild(a,e),a},e.isEmptyTextNode=function(t){return e.isText(t)&&(!t.nodeValue||0===t.nodeValue.replace(r.INVISIBLE_SPACE_REG_EXP(),"").length)},e.isEmpty=function(t,o){return void 0===o&&(o=/^(img|svg|canvas|input|textarea|form)$/),!t||(e.isText(t)?null==t.nodeValue||0===i.trim(t.nodeValue).length:!o.test(t.nodeName.toLowerCase())&&e.each(t,(function(t){if(e.isText(t)&&null!=t.nodeValue&&0!==i.trim(t.nodeValue).length||e.isElement(t)&&o.test(t.nodeName.toLowerCase()))return !1})))},e.isNode=function(e,t){return !!e&&!("object"!=typeof t||!t||"function"!=typeof t.Node&&"object"!=typeof t.Node)&&e instanceof t.Node},e.isCell=function(t,o){return e.isNode(t,o)&&/^(td|th)$/i.test(t.nodeName)},e.isImage=function(t,o){return e.isNode(t,o)&&/^(img|svg|picture|canvas)$/i.test(t.nodeName)},e.isBlock=function(t,o){return !i.isVoid(t)&&"object"==typeof t&&e.isNode(t,o)&&r.IS_BLOCK.test(t.nodeName)},e.isText=function(e){return Boolean(e&&e.nodeType===Node.TEXT_NODE)},e.isElement=function(e){return Boolean(e&&e.nodeType===Node.ELEMENT_NODE)},e.isHTMLElement=function(t,o){return e.isNode(t,o)&&t instanceof o.HTMLElement},e.isInlineBlock=function(t){return e.isElement(t)&&!/^(BR|HR)$/i.test(t.tagName)&&-1!==["inline","inline-block"].indexOf(i.css(t,"display").toString())},e.canSplitBlock=function(t,o){return !i.isVoid(t)&&t instanceof o.HTMLElement&&e.isBlock(t,o)&&!/^(TD|TH|CAPTION|FORM)$/.test(t.nodeName)&&void 0!==t.style&&!/^(fixed|absolute)/i.test(t.style.position)},e.prev=function(t,o,r,i){return void 0===i&&(i=!0),e.find(t,o,r,!1,"previousSibling",!!i&&"lastChild")},e.next=function(t,o,r,i){return void 0===i&&(i=!0),e.find(t,o,r,void 0,void 0,!!i&&"firstChild")},e.prevWithClass=function(t,o){return e.prev(t,(function(t){return e.isElement(t)&&t.classList.contains(o)}),t.parentNode)},e.nextWithClass=function(t,o){return e.next(t,(function(t){return e.isElement(t)&&t.classList.contains(o)}),t.parentNode)},e.find=function(t,o,r,i,n,a){if(void 0===i&&(i=!1),void 0===n&&(n="nextSibling"),void 0===a&&(a="firstChild"),i&&o(t))return t;var s,l=t;do{if(o(s=l[n]))return s||null;if(a&&s&&s[a]){var c=e.find(s[a],o,s,!0,n,a);if(c)return c}s||(s=l.parentNode),l=s;}while(l&&l!==r);return null},e.findWithCurrent=function(t,o,r,i,n){void 0===i&&(i="nextSibling"),void 0===n&&(n="firstChild");var a=t;do{if(o(a))return a||null;if(n&&a&&a[n]){var s=e.findWithCurrent(a[n],o,a,i,n);if(s)return s}for(;a&&!a[i]&&a!==r;)a=a.parentNode;a&&a[i]&&a!==r&&(a=a[i]);}while(a&&a!==r);return null},e.findSibling=function(t,o,r){void 0===o&&(o=!0),void 0===r&&(r=function(t){return !e.isEmptyTextNode(t)});for(var i=function(e){return o?e.previousSibling:e.nextSibling},n=i(t);n&&!r(n);)n=i(n);return n&&r(n)?n:null},e.up=function(e,t,o,r){void 0===r&&(r=!1);var i=e;if(!i)return null;do{if(t(i))return i;if(i===o||!i.parentNode)break;i=i.parentNode;}while(i&&i!==o);return i===o&&r&&t(i)?i:null},e.closest=function(t,o,r){var n;return n=i.isFunction(o)?o:i.isArray(o)?function(e){return e&&o.includes(e.nodeName.toLowerCase())}:function(e){return e&&o===e.nodeName.toLowerCase()},e.up(t,n,r)},e.furthest=function(e,t,o){for(var r=null,i=null==e?void 0:e.parentElement;i&&i!==o&&t(i);)r=i,i=null==i?void 0:i.parentElement;return r},e.appendChildFirst=function(e,t){var o=e.firstChild;o?o!==t&&e.insertBefore(t,o):e.appendChild(t);},e.after=function(e,t){var o=e.parentNode;o&&(o.lastChild===e?o.appendChild(t):o.insertBefore(t,e.nextSibling));},e.before=function(e,t){var o=e.parentNode;o&&o.insertBefore(t,e);},e.prepend=function(e,t){e.insertBefore(t,e.firstChild);},e.append=function(e,t){var o=this;i.isArray(t)?t.forEach((function(t){o.append(e,t);})):e.appendChild(t);},e.moveContent=function(e,t,o){void 0===o&&(o=!1);var r=(e.ownerDocument||document).createDocumentFragment();i.toArray(e.childNodes).forEach((function(e){r.appendChild(e);})),o&&t.firstChild?t.insertBefore(r,t.firstChild):t.appendChild(r);},e.all=function(t,o,r){void 0===r&&(r=!1);var n=t.childNodes?i.toArray(t.childNodes):[];return o(t)?t:(r&&(n=n.reverse()),n.forEach((function(t){e.all(t,o,r);})),null)},e.isOrContains=function(e,t,o){return void 0===o&&(o=!1),e===t?!o:Boolean(t&&e&&this.up(t,(function(t){return t===e}),e,!0))},e.safeRemove=function(e){e&&e.parentNode&&e.parentNode.removeChild(e);},e.hide=function(e){e&&(i.dataBind(e,"__old_display",e.style.display),e.style.display="none");},e.show=function(e){if(e){var t=i.dataBind(e,"__old_display");"none"===e.style.display&&(e.style.display=t||"");}},e.isTag=function(e,t){for(var o=i.asArray(t).map(String),r=0;o.length>r;r+=1)if(this.isElement(e)&&e.tagName.toLowerCase()===o[r].toLowerCase())return !0;return !1},e}();t.Dom=n;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(35),t),r.__exportStar(o(37),t),r.__exportStar(o(36),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.EventsNative=void 0;var r=o(7),i=o(36),n=o(10),a=function(){function e(e){var t=this;this.__key="__JoditEventsNativeNamespaces",this.doc=document,this.prepareEvent=function(e){e.cancelBubble||(e.type.match(/^touch/)&&e.changedTouches&&e.changedTouches.length&&["clientX","clientY","pageX","pageY"].forEach((function(t){Object.defineProperty(e,t,{value:e.changedTouches[0][t],configurable:!0,enumerable:!0});})),e.originalEvent||(e.originalEvent=e),"paste"===e.type&&void 0===e.clipboardData&&t.doc.defaultView.clipboardData&&Object.defineProperty(e,"clipboardData",{get:function(){return t.doc.defaultView.clipboardData},configurable:!0,enumerable:!0}));},this.currents=[],this.__stopped=[],this.isDestructed=!1,e&&(this.doc=e),this.__key+=(new Date).getTime();}return e.prototype.eachEvent=function(e,t){var o=this;e.split(/[\s,]+/).forEach((function(e){var r=e.split(".");t.call(o,r[0],r[1]||i.defaultNameSpace);}));},e.prototype.getStore=function(e){if(!e)throw n.error("Need subject");if(void 0===e[this.__key]){var t=new i.EventHandlersStore;Object.defineProperty(e,this.__key,{enumerable:!1,configurable:!0,value:t});}return e[this.__key]},e.prototype.clearStore=function(e){void 0!==e[this.__key]&&delete e[this.__key];},e.prototype.triggerNativeEvent=function(e,t){var o=this.doc.createEvent("HTMLEvents");"string"==typeof t?o.initEvent(t,!0,!0):(o.initEvent(t.type,t.bubbles,t.cancelable),["screenX","screenY","clientX","clientY","target","srcElement","currentTarget","timeStamp","which","keyCode"].forEach((function(e){Object.defineProperty(o,e,{value:t[e],enumerable:!0});})),Object.defineProperty(o,"originalEvent",{value:t,enumerable:!0})),e.dispatchEvent(o);},Object.defineProperty(e.prototype,"current",{get:function(){return this.currents[this.currents.length-1]},enumerable:!1,configurable:!0}),e.prototype.on=function(e,t,o,i){var a=this;void 0===i&&(i=!1);var s=n.isString(e)?this:e,l=n.isString(t)?t:e,c=o;void 0===c&&n.isFunction(t)&&(c=t);var u=this.getStore(s);if(!n.isString(l)||""===l)throw n.error("Need events names");if(!n.isFunction(c))throw n.error("Need event handler");if(n.isArray(s))return s.forEach((function(e){a.on(e,l,c,i);})),this;var d=n.isFunction(s.addEventListener),p=this,f=function(e){for(var t=[],o=1;arguments.length>o;o++)t[o-1]=arguments[o];return c&&c.call.apply(c,r.__spreadArrays([this,e],t))};return d&&(f=function(e){if(p.prepareEvent(e),c&&!1===c.call(this,e))return e.preventDefault(),e.stopImmediatePropagation(),!1}),this.eachEvent(l,(function(e,t){if(""===e)throw n.error("Need event name");if(!1===u.indexOf(e,t,c)&&(u.set(e,t,{event:e,originalCallback:c,syntheticCallback:f},i),d)){var o=!!["touchstart","touchend","scroll","mousewheel","mousemove","touchmove"].includes(e)&&{passive:!0};s.addEventListener(e,f,o);}})),this},e.prototype.one=function(e,t,o,r){var i=this;void 0===r&&(r=!1);var a=n.isString(e)?this:e,s=n.isString(t)?t:e,l=o;void 0===l&&n.isFunction(t)&&(l=t);var c=function(){for(var e=[],t=0;arguments.length>t;t++)e[t]=arguments[t];i.off(a,s,c),l.apply(void 0,e);};return this.on(a,s,c,r),this},e.prototype.off=function(e,t,o){var r=this,a=n.isString(e)?this:e,s=n.isString(t)?t:e,l=this.getStore(a),c=o;if(!n.isString(s)||!s)return l.namespaces().forEach((function(e){r.off(a,"."+e);})),this.clearStore(a),this;void 0===c&&n.isFunction(t)&&(c=t);var u=n.isFunction(a.removeEventListener),d=function(e){u&&a.removeEventListener(e.event,e.syntheticCallback,!1);},p=function(e,t){if(""!==e){var o=l.get(e,t);if(o&&o.length)if(n.isFunction(c)){var r=l.indexOf(e,t,c);!1!==r&&(d(o[r]),o.splice(r,1));}else o.forEach(d),o.length=0;}else l.events(t).forEach((function(e){""!==e&&p(e,t);}));};return this.eachEvent(s,(function(e,t){t===i.defaultNameSpace?l.namespaces().forEach((function(t){p(e,t);})):p(e,t);})),this},e.prototype.stopPropagation=function(e,t){var o=this,r=n.isString(e)?this:e,a=n.isString(e)?e:t;if("string"!=typeof a)throw n.error("Need event names");var s=this.getStore(r);this.eachEvent(a,(function(e,t){var n=s.get(e,t);n&&o.__stopped.push(n),t===i.defaultNameSpace&&s.namespaces(!0).forEach((function(t){return o.stopPropagation(r,e+"."+t)}));}));},e.prototype.removeStop=function(e){if(e){var t=this.__stopped.indexOf(e);-1!==t&&this.__stopped.splice(0,t+1);}},e.prototype.isStopped=function(e){return void 0!==e&&-1!==this.__stopped.indexOf(e)},e.prototype.fire=function(e,t){for(var o,a,s=this,l=[],c=2;arguments.length>c;c++)l[c-2]=arguments[c];var u=n.isString(e)?this:e,d=n.isString(e)?e:t,p=n.isString(e)?r.__spreadArrays([t],l):l,f=n.isFunction(u.dispatchEvent);if(!f&&!n.isString(d))throw n.error("Need events names");var h=this.getStore(u);return !n.isString(d)&&f?this.triggerNativeEvent(u,t):this.eachEvent(d,(function(e,t){if(f)s.triggerNativeEvent(u,e);else {var n=h.get(e,t);if(n)try{r.__spreadArrays(n).every((function(t){return !s.isStopped(n)&&(s.currents.push(e),a=t.syntheticCallback.apply(u,p),s.currents.pop(),void 0!==a&&(o=a),!0)}));}finally{s.removeStop(n);}t!==i.defaultNameSpace||f||h.namespaces().filter((function(e){return e!==t})).forEach((function(t){var i=s.fire.apply(s,r.__spreadArrays([u,e+"."+t],p));void 0!==i&&(o=i);}));}})),o},e.prototype.destruct=function(){this.isDestructed&&(this.isDestructed=!0,this.off(this),this.getStore(this).clear(),delete this[this.__key]);},e}();t.EventsNative=a;},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.EventHandlersStore=t.defaultNameSpace=void 0,t.defaultNameSpace="JoditEventDefaultNamespace";var o=function(){function e(){this.__store={};}return e.prototype.get=function(e,t){if(void 0!==this.__store[t])return this.__store[t][e]},e.prototype.indexOf=function(e,t,o){var r=this.get(e,t);if(r)for(var i=0;r.length>i;i+=1)if(r[i].originalCallback===o)return i;return !1},e.prototype.namespaces=function(e){void 0===e&&(e=!1);var o=Object.keys(this.__store);return e?o.filter((function(e){return e!==t.defaultNameSpace})):o},e.prototype.events=function(e){return this.__store[e]?Object.keys(this.__store[e]):[]},e.prototype.set=function(e,t,o,r){void 0===r&&(r=!1),void 0===this.__store[t]&&(this.__store[t]={}),void 0===this.__store[t][e]&&(this.__store[t][e]=[]),r?this.__store[t][e].unshift(o):this.__store[t][e].push(o);},e.prototype.clear=function(){this.__store={};},e}();t.EventHandlersStore=o;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ObserveObject=void 0;var r=o(7),i=o(10),n=o(38),a=function(){function e(t,o,n){var a=this;void 0===o&&(o=[]),void 0===n&&(n={}),this.__lockEvent={},this.__data=t,this.__prefix=o,this.__onEvents=n,Object.keys(t).forEach((function(o){var n=a.__prefix.concat(o).filter((function(e){return e.length}));Object.defineProperty(a,o,{set:function(s){var l=t[o];if(!i.isFastEqual(l,s)){a.fire(["beforeChange","beforeChange."+n.join(".")],o,s),i.isPlainObject(s)&&(s=new e(s,n,a.__onEvents)),t[o]=s;var c=[];a.fire(r.__spreadArrays(["change"],n.reduce((function(e,t){return c.push(t),e.push("change."+c.join(".")),e}),[])),n.join("."),l,s.valueOf?s.valueOf():s);}},get:function(){return t[o]},enumerable:!0,configurable:!0}),i.isPlainObject(t[o])&&(t[o]=new e(t[o],n,a.__onEvents));}));}return e.prototype.valueOf=function(){return this.__data},e.prototype.toString=function(){return JSON.stringify(this.valueOf())},e.prototype.on=function(e,t){var o=this;return i.isArray(e)?(e.map((function(e){return o.on(e,t)})),this):(this.__onEvents[e]||(this.__onEvents[e]=[]),this.__onEvents[e].push(t),this)},e.prototype.fire=function(e){for(var t=this,o=[],n=1;arguments.length>n;n++)o[n-1]=arguments[n];if(i.isArray(e))e.map((function(e){return t.fire.apply(t,r.__spreadArrays([e],o))}));else try{!this.__lockEvent[e]&&this.__onEvents[e]&&(this.__lockEvent[e]=!0,this.__onEvents[e].forEach((function(e){return e.call.apply(e,r.__spreadArrays([t],o))})));}finally{this.__lockEvent[e]=!1;}},e.create=function(t,o){return void 0===o&&(o=[]),t instanceof e?t:new e(t,o)},r.__decorate([n.nonenumerable],e.prototype,"__data",void 0),r.__decorate([n.nonenumerable],e.prototype,"__prefix",void 0),r.__decorate([n.nonenumerable],e.prototype,"__onEvents",void 0),r.__decorate([n.nonenumerable],e.prototype,"__lockEvent",void 0),e}();t.ObserveObject=a;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.autobind=void 0;var r=o(7);r.__exportStar(o(39),t),r.__exportStar(o(40),t),r.__exportStar(o(41),t),r.__exportStar(o(46),t),r.__exportStar(o(47),t),r.__exportStar(o(48),t),r.__exportStar(o(49),t),r.__exportStar(o(50),t);var i=o(51);Object.defineProperty(t,"autobind",{enumerable:!0,get:function(){return i.default}});},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.cache=void 0;var r=o(10);t.cache=function(e,t,o){var i=o.get;if(!i)throw r.error("Getter property descriptor expected");o.get=function(){var e=i.call(this);return Object.defineProperty(this,t,{configurable:o.configurable,enumerable:o.enumerable,writable:!1,value:e}),e};};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.component=void 0;var r=o(7);t.component=function(e){var t=function(e){function t(){for(var o=[],r=0;arguments.length>r;r++)o[r]=arguments[r];var i=e.apply(this,o)||this;return Object.getPrototypeOf(i)===t.prototype&&i.setStatus("ready"),i}return r.__extends(t,e),t}(e);return t.prototype.constructor=e,t};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.throttle=t.debounce=void 0;var r=o(10),i=o(42);function n(e,t,o){return void 0===t&&(t=!1),void 0===o&&(o="debounce"),function(n,a){if(!r.isFunction(n[a]))throw r.error("Handler must be a Function");n.hookStatus(i.STATUSES.ready,(function(i){var n=r.isViewObject(i)?i:i.jodit,s=r.isFunction(e)?e(i):e;i[a]=n.async[o](i[a].bind(i),r.isNumber(s)?s:n.defaultTimeout,t);}));}}t.debounce=n,t.throttle=function(e,t){return void 0===t&&(t=!1),n(e,t,"throttle")};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(43),t),r.__exportStar(o(44),t),r.__exportStar(o(45),t);},(e,t)=>{var o;Object.defineProperty(t,"__esModule",{value:!0}),t.STATUSES=void 0,(o=t.STATUSES||(t.STATUSES={})).beforeInit="beforeInit",o.ready="ready",o.beforeDestruct="beforeDestruct",o.destructed="destructed";},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Component=void 0;var r=o(10),i=o(31),n=o(43),a=new Map,s=function(){function e(){this.ownerWindow=window,this.__componentStatus=n.STATUSES.beforeInit,this.componentName="jodit-"+r.kebabCase(this.className()||r.getClassName(this)),this.uid="jodit-uid-"+i.uniqueUid();}return Object.defineProperty(e.prototype,"ownerDocument",{get:function(){return this.ow.document},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"od",{get:function(){return this.ownerDocument},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"ow",{get:function(){return this.ownerWindow},enumerable:!1,configurable:!0}),e.prototype.get=function(e,t){return r.get(e,t||this)},Object.defineProperty(e.prototype,"isReady",{get:function(){return this.componentStatus===n.STATUSES.ready},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"isDestructed",{get:function(){return this.componentStatus===n.STATUSES.destructed},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"isInDestruct",{get:function(){return n.STATUSES.beforeDestruct===this.componentStatus||n.STATUSES.destructed===this.componentStatus},enumerable:!1,configurable:!0}),e.prototype.bindDestruct=function(e){var t=this,o=function(){!t.isInDestruct&&t.destruct();};return e.e&&e.e.on(n.STATUSES.beforeDestruct,o),this.hookStatus(n.STATUSES.beforeDestruct,(function(){e.e&&e.e.off(n.STATUSES.beforeDestruct,o);})),this},e.prototype.destruct=function(){this.setStatus(n.STATUSES.destructed),a.get(this)&&a.delete(this);},Object.defineProperty(e.prototype,"componentStatus",{get:function(){return this.__componentStatus},set:function(e){this.setStatus(e);},enumerable:!1,configurable:!0}),e.prototype.setStatus=function(e){return this.setStatusComponent(e,this)},e.prototype.setStatusComponent=function(e,t){if(e!==this.__componentStatus){var o=Object.getPrototypeOf(this);o&&r.isFunction(o.setStatusComponent)&&o.setStatusComponent(e,t);var i=a.get(this),n=null==i?void 0:i[e];n&&n.length&&n.forEach((function(e){return e(t)})),t===this&&(this.__componentStatus=e);}},e.prototype.hookStatus=function(e,t){var o=a.get(this);o||a.set(this,o={}),o[e]||(o[e]=[]),o[e].push(t);},e.STATUSES=n.STATUSES,e}();t.Component=s;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ViewComponent=void 0;var r=o(7),i=function(e){function t(t){var o=e.call(this)||this;return o.setParentView(t),o}return r.__extends(t,e),Object.defineProperty(t.prototype,"defaultTimeout",{get:function(){return this.j.defaultTimeout},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"j",{get:function(){return this.jodit},enumerable:!1,configurable:!0}),t.prototype.setParentView=function(e){return this.jodit=e,e.components.add(this),this},t.prototype.destruct=function(){return this.j.components.delete(this),e.prototype.destruct.call(this)},t}(o(44).Component);t.ViewComponent=i;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.hook=void 0;var r=o(10);t.hook=function(e){return function(t,o){if(!r.isFunction(t[o]))throw r.error("Handler must be a Function");t.hookStatus(e,(function(e){t[o].call(e);}));}};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.nonenumerable=void 0,t.nonenumerable=function(e,t){!1!==(Object.getOwnPropertyDescriptor(e,t)||{}).enumerable&&Object.defineProperty(e,t,{enumerable:!1,set:function(e){Object.defineProperty(this,t,{enumerable:!1,writable:!0,value:e});}});};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.persistent=void 0;var r=o(42);t.persistent=function(e,t){e.hookStatus(r.STATUSES.ready,(function(e){var o=e.jodit,r=e.componentName+"_prop_"+t,i=e[t];Object.defineProperty(e,t,{get:function(){var e;return null!==(e=o.storage.get(r))&&void 0!==e?e:i},set:function(e){o.storage.set(r,e);}});}));};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.wait=void 0;var r=o(10),i=o(42);t.wait=function(e){return function(t,o){if(!r.isFunction(t[o]))throw r.error("Handler must be a Function");t.hookStatus(i.STATUSES.ready,(function(t){var i=r.isViewObject(t)?t.async:t.j.async,n=t[o],a=0;t[o]=function o(){for(var r=[],s=0;arguments.length>s;s++)r[s]=arguments[s];i.clearTimeout(a),e(t)?n.apply(t,r):a=i.setTimeout((function(){return o.apply(void 0,r)}),10);};}));}};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.watch=t.getPropertyDescriptor=void 0;var r=o(7),i=o(10),n=o(34),a=o(42);function s(e,t){var o;do{o=Object.getOwnPropertyDescriptor(e,t),e=Object.getPrototypeOf(e);}while(!o&&e);return o}function l(e){return function(t,o){if(!i.isFunction(t[o]))throw i.error("Handler must be a Function");var l=function(a){var l=function(e){for(var t=[],i=1;arguments.length>i;i++)t[i-1]=arguments[i];a.isInDestruct||a[o].apply(a,r.__spreadArrays([e],t));};i.splitArray(e).forEach((function(e){if(/^:/.test(e))(i.isViewObject(a)?a:a.jodit).events.on(a,e.substr(1),l);else {var o=e.split("."),r=o[0],c=a[r];if(c instanceof n.ObserveObject)c.on("change."+e,l);else if(i.isPlainObject(c)&&o.length>1)a[r]=n.ObserveObject.create(c,[r]),a[r].on("change."+e,l);else {var u=s(t,r);Object.defineProperty(a,r,{configurable:!0,set:function(t){var o=c;o!==t&&(c=t,u&&u.set&&u.set.call(a,t),i.isPlainObject(c)&&(c=n.ObserveObject.create(c,[r])).on("change."+e,l),l(r,o,c));},get:function(){return u&&u.get?u.get.call(a):c}});}}}));};i.isFunction(t.hookStatus)?t.hookStatus(a.STATUSES.ready,l):l(t);}}t.getPropertyDescriptor=s,t.watch=l,t.default=l;},(e,t)=>{function o(e){return (o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function r(e,t,r){var i=r.value;if("function"!=typeof i)throw new TypeError("@boundMethod decorator can only be applied to methods not: ".concat(o(i)));var n=!1;return {configurable:!0,get:function(){if(n||this===e.prototype||this.hasOwnProperty(t)||"function"!=typeof i)return i;var o=i.bind(this);return n=!0,Object.defineProperty(this,t,{configurable:!0,get:function(){return o},set:function(e){i=e,delete this[t];}}),n=!1,o},set:function(e){i=e;}}}function i(e){var t;return "undefined"!=typeof Reflect&&"function"==typeof Reflect.ownKeys?t=Reflect.ownKeys(e.prototype):(t=Object.getOwnPropertyNames(e.prototype),"function"==typeof Object.getOwnPropertySymbols&&(t=t.concat(Object.getOwnPropertySymbols(e.prototype)))),t.forEach((function(t){if("constructor"!==t){var o=Object.getOwnPropertyDescriptor(e.prototype,t);"function"==typeof o.value&&Object.defineProperty(e.prototype,t,r(e,t,o));}})),e}Object.defineProperty(t,"__esModule",{value:!0}),t.boundClass=t.boundMethod=void 0,t.boundMethod=r,t.boundClass=i,t.default=function(){return 1===arguments.length?i.apply(void 0,arguments):r.apply(void 0,arguments)};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isFunction=void 0,t.isFunction=function(e){return "function"==typeof e};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isHTML=void 0;var r=o(54);t.isHTML=function(e){return r.isString(e)&&/<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/m.test(e)};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isString=void 0,t.isString=function(e){return "string"==typeof e};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isHtmlFromWord=void 0,t.isHtmlFromWord=function(e){return -1!==e.search(/<meta.*?Microsoft Excel\s[\d].*?>/)||-1!==e.search(/<meta.*?Microsoft Word\s[\d].*?>/)||-1!==e.search(/style="[^"]*mso-/)&&-1!==e.search(/<font/)};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.hasContainer=t.isDestructable=t.isInitable=void 0;var r=o(52),i=o(33),n=o(57);t.isInitable=function(e){return !n.isVoid(e)&&r.isFunction(e.init)},t.isDestructable=function(e){return !n.isVoid(e)&&r.isFunction(e.destruct)},t.hasContainer=function(e){return !n.isVoid(e)&&i.Dom.isElement(e.container)};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isVoid=void 0,t.isVoid=function(e){return null==e};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isInt=void 0;var r=o(59),i=o(54);t.isInt=function(e){return i.isString(e)&&r.isNumeric(e)&&(e=parseFloat(e)),"number"==typeof e&&Number.isFinite(e)&&!(e%1)};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isNumeric=void 0;var r=o(54);t.isNumeric=function(e){if(r.isString(e)){if(!e.match(/^([+-])?[0-9]+(\.?)([0-9]+)?(e[0-9]+)?$/))return !1;e=parseFloat(e);}return "number"==typeof e&&!isNaN(e)&&isFinite(e)};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isViewObject=t.isJoditObject=void 0;var r=o(52),i=o(31);t.isJoditObject=function(e){return Boolean(e&&e instanceof Object&&r.isFunction(e.constructor)&&("undefined"!=typeof Jodit&&e instanceof Jodit||e.isJodit))},t.isViewObject=function(e){return Boolean(e&&e instanceof Object&&r.isFunction(e.constructor)&&(e instanceof i.modules.View||e.isView))};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isLicense=void 0;var r=o(54);t.isLicense=function(e){return r.isString(e)&&23===e.length&&/^[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}$/i.test(e)};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isNativeFunction=void 0,t.isNativeFunction=function(e){return Boolean(e)&&"function"===(typeof e).toLowerCase()&&(e===Function.prototype||/^\s*function\s*(\b[a-z$_][a-z0-9$_]*\b)*\s*\((|([a-z$_][a-z0-9$_]*)(\s*,[a-z$_][a-z0-9$_]*)*)\)\s*{\s*\[native code]\s*}\s*$/i.test(String(e)))};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isNumber=void 0,t.isNumber=function(e){return "number"==typeof e&&!isNaN(e)&&isFinite(e)};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isPlainObject=void 0;var r=o(65),i=o(20);t.isPlainObject=function(e){return !(!e||"object"!=typeof e||e.nodeType||r.isWindow(e)||e.constructor&&!i.hasOwn.call(e.constructor.prototype,"isPrototypeOf"))};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isWindow=void 0,t.isWindow=function(e){return null!=e&&e===e.window};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isPromise=void 0,t.isPromise=function(e){return e&&"function"==typeof e.then};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isURL=void 0,t.isURL=function(e){return new RegExp("^(https?:\\/\\/)((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*(\\?[;&a-z\\d%_.~+=-]*)?(\\#[-a-z\\d_]*)?$","i").test(e)};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isValidName=void 0,t.isValidName=function(e){return !!e.length&&!/[^0-9A-Za-zа-яА-ЯЁё\w\-_.]/.test(e)};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.get=void 0;var r=o(14);t.get=function(e,t){if(!r.isString(e)||!e.length)return null;for(var o=t,i=0,n=e.split(".");n.length>i;i++){var a=n[i];if(r.isVoid(o[a]))return null;o=o[a];}return r.isVoid(o)?null:o};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.getClassName=t.keepNames=void 0;var r=o(14);t.keepNames=new Map,t.getClassName=function(e){var o;if(r.isFunction(e.className))return e.className();var i=(null===(o=e.constructor)||void 0===o?void 0:o.originalConstructor)||e.constructor;if(t.keepNames.has(i))return t.keepNames.get(i);if(i.name)return i.name;var n=new RegExp(/^\s*function\s*(\S*)\s*\(/),a=i.toString().match(n);return a?a[1]:""};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.LimitedStack=void 0;var o=function(){function e(e){this.limit=e,this.stack=[];}return e.prototype.push=function(e){return this.stack.push(e),this.stack.length>this.limit&&this.stack.shift(),this},e.prototype.pop=function(){return this.stack.pop()},e.prototype.find=function(e){return this.stack.find(e)},e}();t.LimitedStack=o;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.toArray=t.splitArray=t.asArray=void 0;var r=o(73);Object.defineProperty(t,"asArray",{enumerable:!0,get:function(){return r.asArray}});var i=o(74);Object.defineProperty(t,"splitArray",{enumerable:!0,get:function(){return i.splitArray}});var n=o(75);Object.defineProperty(t,"toArray",{enumerable:!0,get:function(){return n.toArray}});},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.asArray=void 0;var r=o(14);t.asArray=function(e){return r.isArray(e)?e:[e]};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.splitArray=void 0;var r=o(14);t.splitArray=function(e){return r.isString(e)?e.split(/[,\s]+/):e};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.toArray=void 0;var r=o(11),i=o(14);t.toArray=function(){for(var e,t=[],o=0;arguments.length>o;o++)t[o]=arguments[o];var n=i.isNativeFunction(Array.from)?Array.from:null!==(e=r.reset("Array.from"))&&void 0!==e?e:Array.from;return n.apply(Array,t)};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),o(7).__exportStar(o(77),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.clearTimeout=t.setTimeout=void 0;var r=o(7);t.setTimeout=function(e,t){for(var o=[],i=2;arguments.length>i;i++)o[i-2]=arguments[i];return t?window.setTimeout.apply(window,r.__spreadArrays([e,t],o)):(e.call.apply(e,r.__spreadArrays([null],o)),0)},t.clearTimeout=function(e){window.clearTimeout(e);};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),o(7).__exportStar(o(79),t);},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.colorToHex=void 0,t.colorToHex=function(e){if("rgba(0, 0, 0, 0)"===e||""===e)return !1;if(!e)return "#000000";if("#"===e.substr(0,1))return e;var t=/([\s\n\t\r]*?)rgb\((\d+), (\d+), (\d+)\)/.exec(e)||/([\s\n\t\r]*?)rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/.exec(e);if(!t)return "#000000";for(var o=parseInt(t[2],10),r=parseInt(t[3],10),i=(parseInt(t[4],10)|r<<8|o<<16).toString(16).toUpperCase();6>i.length;)i="0"+i;return t[1]+"#"+i};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(81),t),r.__exportStar(o(83),t),r.__exportStar(o(84),t),r.__exportStar(o(85),t),r.__exportStar(o(86),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.applyStyles=void 0;var r=o(33),i=o(82),n=o(23);function a(e){return e.replace(/mso-[a-z-]+:[\s]*[^;]+;/gi,"").replace(/mso-[a-z-]+:[\s]*[^";]+$/gi,"").replace(/border[a-z-]*:[\s]*[^;]+;/gi,"").replace(/([0-9.]+)(pt|cm)/gi,(function(e,t,o){switch(o.toLowerCase()){case"pt":return (1.328*parseFloat(t)).toFixed(0)+"px";case"cm":return (.02645833*parseFloat(t)).toFixed(0)+"px"}return e}))}t.applyStyles=function(e){if(-1===e.indexOf("<html "))return e;e=(e=e.substring(e.indexOf("<html "),e.length)).substring(0,e.lastIndexOf("</html>")+"</html>".length);var t=document.createElement("iframe");t.style.display="none",document.body.appendChild(t);var o="",s=[];try{var l=t.contentDocument||(t.contentWindow?t.contentWindow.document:null);if(l){l.open(),l.write(e),l.close(),l.styleSheets.length&&(s=l.styleSheets[l.styleSheets.length-1].cssRules);for(var c=function(e){if(""===s[e].selectorText)return "continue";i.$$(s[e].selectorText,l.body).forEach((function(t){t.style.cssText=a(s[e].style.cssText+";"+t.style.cssText);}));},u=0;s.length>u;u+=1)c(u);r.Dom.each(l.body,(function(e){if(r.Dom.isElement(e)){var t=e,o=t.style.cssText;o&&(t.style.cssText=a(o)),t.hasAttribute("lang")&&t.removeAttribute("lang");}})),o=l.firstChild?n.trim(l.body.innerHTML):"";}}catch(e){}finally{r.Dom.safeRemove(t);}return o&&(e=o),n.trim(e.replace(/<(\/)?(html|colgroup|col|o:p)[^>]*>/g,"").replace(/<!--[^>]*>/g,""))};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.resolveElement=t.cssPath=t.refs=t.getXPathByElement=t.$$=void 0;var r=o(9),i=o(14),n=o(11),a=o(20),s=o(33),l=o(23),c=o(72),u=1;function d(e,t){var o;if(!/:scope/.test(e)||!r.IS_IE||t&&t.nodeType===Node.DOCUMENT_NODE)o=t.querySelectorAll(e);else {var i=t.id,n=i||"_selector_id_"+String(Math.random()).slice(2)+ ++u;e=e.replace(/:scope/g,"#"+n),!i&&t.setAttribute("id",n),o=t.parentNode.querySelectorAll(e),i||t.removeAttribute("id");}return [].slice.call(o)}t.$$=d,t.getXPathByElement=function(e,o){if(!e||e.nodeType!==Node.ELEMENT_NODE)return "";if(!e.parentNode||o===e)return "";if(e.id)return "//*[@id='"+e.id+"']";var r=[].filter.call(e.parentNode.childNodes,(function(t){return t.nodeName===e.nodeName}));return t.getXPathByElement(e.parentNode,o)+"/"+e.nodeName.toLowerCase()+(r.length>1?"["+(c.toArray(r).indexOf(e)+1)+"]":"")},t.refs=function(e){return d("[ref],[data-ref]",e).reduce((function(e,t){var o=n.attr(t,"-ref");return o&&i.isString(o)&&(e[l.camelCase(o)]=t,e[o]=t),e}),{})},t.cssPath=function(e){if(!s.Dom.isElement(e))return null;for(var t=[],o=e;o&&o.nodeType===Node.ELEMENT_NODE;){var r=o.nodeName.toLowerCase();if(o.id){t.unshift(r+="#"+o.id);break}var i=o,n=1;do{(i=i.previousElementSibling)&&i.nodeName.toLowerCase()===r&&n++;}while(i);t.unshift(r+=":nth-of-type("+n+")"),o=o.parentNode;}return t.join(" > ")},t.resolveElement=function(e,t){var o=e;if(i.isString(e))try{o=t.querySelector(e);}catch(t){throw a.error('String "'+e+'" should be valid HTML selector')}if(!o||"object"!=typeof o||!s.Dom.isElement(o)||!o.cloneNode)throw a.error('Element "'+e+'" should be string or HTMLElement instance');return o};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.cleanFromWord=void 0;var r=o(33),i=o(23),n=o(72);t.cleanFromWord=function(e){-1!==e.indexOf("<html ")&&(e=(e=e.substring(e.indexOf("<html "),e.length)).substring(0,e.lastIndexOf("</html>")+"</html>".length));var t="";try{var o=document.createElement("div");o.innerHTML=e;var a=[];o.firstChild&&r.Dom.all(o,(function(e){if(e)switch(e.nodeType){case Node.ELEMENT_NODE:switch(e.nodeName){case"STYLE":case"LINK":case"META":a.push(e);break;case"W:SDT":case"W:SDTPR":case"FONT":r.Dom.unwrap(e);break;default:n.toArray(e.attributes).forEach((function(t){-1===["src","href","rel","content"].indexOf(t.name.toLowerCase())&&e.removeAttribute(t.name);}));}break;case Node.TEXT_NODE:break;default:a.push(e);}})),a.forEach(r.Dom.safeRemove),t=o.innerHTML;}catch(e){}return t&&(e=t),(e=e.split(/(\n)/).filter(i.trim).join("\n")).replace(/<(\/)?(html|colgroup|col|o:p)[^>]*>/g,"").replace(/<!--[^>]*>/g,"")};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.htmlspecialchars=void 0,t.htmlspecialchars=function(e){var t=document.createElement("div");return t.textContent=e,t.innerHTML};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.stripTags=void 0;var r=o(14),i=o(82),n=o(23),a=o(33);t.stripTags=function(e,t){void 0===t&&(t=document);var o=t.createElement("div");return r.isString(e)?o.innerHTML=e:o.appendChild(e),i.$$("DIV, P, BR, H1, H2, H3, H4, H5, H6, HR",o).forEach((function(e){var o=e.parentNode;if(o){var r=e.nextSibling;a.Dom.isText(r)&&/^\s/.test(r.nodeValue||"")||r&&o.insertBefore(t.createTextNode(" "),r);}})),n.trim(o.innerText)||""};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.nl2br=void 0,t.nl2br=function(e){return e.replace(/([^>])([\n\r]+)/g,"$1<br/>$2")};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(88),t),r.__exportStar(o(89),t),r.__exportStar(o(90),t),r.__exportStar(o(91),t),r.__exportStar(o(92),t),r.__exportStar(o(93),t),r.__exportStar(o(94),t),r.__exportStar(o(95),t),r.__exportStar(o(96),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.normalizeKeyAliases=void 0;var r=o(23),i=o(9);t.normalizeKeyAliases=function(e){var t={};return e.replace(/\+\+/g,"+add").split(/[\s]*\+[\s]*/).map((function(e){return r.trim(e.toLowerCase())})).map((function(e){return i.KEY_ALIASES[e]||e})).sort().filter((function(e){return !t[e]&&""!==e&&(t[e]=!0)})).join("+")};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.normalizeLicense=void 0,t.normalizeLicense=function(e,t){void 0===t&&(t=8);for(var o=[];e.length;)o.push(e.substr(0,t)),e=e.substr(t);return o[1]=o[1].replace(/./g,"*"),o[2]=o[2].replace(/./g,"*"),o.join("-")};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.normalizeNode=void 0;var r=o(9),i=o(33);t.normalizeNode=function(e){if(e){if(i.Dom.isText(e)&&null!=e.nodeValue&&e.parentNode)for(;i.Dom.isText(e.nextSibling);)null!=e.nextSibling.nodeValue&&(e.nodeValue+=e.nextSibling.nodeValue),e.nodeValue=e.nodeValue.replace(r.INVISIBLE_SPACE_REG_EXP(),""),i.Dom.safeRemove(e.nextSibling);else t.normalizeNode(e.firstChild);t.normalizeNode(e.nextSibling);}};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.normalizePath=void 0;var r=o(23);t.normalizePath=function(){for(var e=[],t=0;arguments.length>t;t++)e[t]=arguments[t];return e.filter((function(e){return r.trim(e).length})).map((function(t,o){return t=t.replace(/([^:])[\\/]+/g,"$1/"),o&&(t=t.replace(/^\//,"")),o!==e.length-1&&(t=t.replace(/\/$/,"")),t})).join("/")};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.normalizeRelativePath=void 0,t.normalizeRelativePath=function(e){return e.split("/").reduce((function(e,t){switch(t){case"":case".":break;case"..":e.pop();break;default:e.push(t);}return e}),[]).join("/")+(e.endsWith("/")?"/":"")};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.normalizeSize=void 0,t.normalizeSize=function(e){return /^[0-9]+$/.test(e.toString())?e+"px":e.toString()};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.normalizeUrl=void 0,t.normalizeUrl=function(){for(var e=[],t=0;arguments.length>t;t++)e[t]=arguments[t];return e.filter((function(e){return e.length})).map((function(e){return e.replace(/\/$/,"")})).join("/").replace(/([^:])[\\/]+/g,"$1/")};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.normalizeCssValue=void 0;var r=o(14),i=o(23),n=o(78);t.normalizeCssValue=function(e,t){switch(i.kebabCase(e)){case"font-weight":switch(t.toString().toLowerCase()){case"700":case"bold":return 700;case"400":case"normal":return 400;case"900":case"heavy":return 900}return r.isNumeric(t)?Number(t):t}return /color/i.test(e)&&/^rgb/i.test(t.toString())&&n.colorToHex(t.toString())||t};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.normalizeColor=void 0;var r=o(78),i=o(23);t.normalizeColor=function(e){var t=["#"],o=r.colorToHex(e);if(!o)return !1;if(3===(o=(o=i.trim(o.toUpperCase())).substr(1)).length){for(var n=0;3>n;n+=1)t.push(o[n]),t.push(o[n]);return t.join("")}return o.length>6&&(o=o.substr(0,6)),"#"+o};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(98),t),r.__exportStar(o(99),t),r.__exportStar(o(100),t),r.__exportStar(o(101),t);},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.getContentWidth=void 0,t.getContentWidth=function(e,t){var o=function(e){return parseInt(e,10)},r=t.getComputedStyle(e);return e.offsetWidth-o(r.getPropertyValue("padding-left")||"0")-o(r.getPropertyValue("padding-right")||"0")};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.innerWidth=void 0,t.innerWidth=function(e,t){var o=t.getComputedStyle(e);return e.clientWidth-(parseFloat(o.paddingLeft||"0")+parseFloat(o.paddingRight||"0"))};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.offset=void 0,t.offset=function(e,o,r,i){var n;void 0===i&&(i=!1);try{n=e.getBoundingClientRect();}catch(e){n={top:0,bottom:0,left:0,right:0,width:0,height:0};}var a,s,l=r.body,c=r.documentElement||{clientTop:0,clientLeft:0,scrollTop:0,scrollLeft:0},u=r.defaultView||r.parentWindow,d=u.pageYOffset||c.scrollTop||l.scrollTop,p=u.pageXOffset||c.scrollLeft||l.scrollLeft,f=c.clientTop||l.clientTop||0,h=c.clientLeft||l.clientLeft||0,m=o.iframe;if(!i&&o&&o.options&&o.o.iframe&&m){var v=t.offset(m,o,o.od,!0);a=n.top+v.top,s=n.left+v.left;}else a=n.top+d-f,s=n.left+p-h;return {top:Math.round(a),left:Math.round(s),width:n.width,height:n.height}};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.position=void 0;var r=o(14);t.position=function e(t,o,i){void 0===i&&(i=!1);var n=t.getBoundingClientRect(),a=n.left,s=n.top;if(r.isJoditObject(o)&&o.iframe&&!i){var l=e(o.iframe,o,!0);a+=l.left,s+=l.top;}return {left:Math.round(a),top:Math.round(s),width:Math.round(t.offsetWidth),height:Math.round(t.offsetHeight)}};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.loadNext=t.appendStyleAsync=t.appendScriptAsync=t.appendScript=void 0;var r=o(7),i=o(103),n=o(14),a=new Map,s=function(e){return function(t,o){return r.__awaiter(void 0,void 0,Promise,(function(){var i;return r.__generator(this,(function(r){return a.has(o)?[2,a.get(o)]:(i=e(t,o),a.set(o,i),[2,i])}))}))}};t.appendScript=function(e,t,o){var r=e.c.element("script");return r.type="text/javascript",n.isFunction(o)&&!e.isInDestruct&&e.e.on(r,"load",o),r.src||(r.src=i.completeUrl(t)),e.od.body.appendChild(r),{callback:o,element:r}},t.appendScriptAsync=s((function(e,o){return new Promise((function(r,i){var n=t.appendScript(e,o,r).element;!e.isInDestruct&&e.e.on(n,"error",i);}))})),t.appendStyleAsync=s((function(e,t){return new Promise((function(o,r){var n=e.c.element("link");n.rel="stylesheet",n.media="all",n.crossOrigin="anonymous",!e.isInDestruct&&e.e.on(n,"load",(function(){return o(n)})).on(n,"error",r),n.href=i.completeUrl(t),e.o.shadowRoot?e.o.shadowRoot.appendChild(n):e.od.body.appendChild(n);}))})),t.loadNext=function(e,o,r){return void 0===r&&(r=0),n.isString(o[r])?t.appendScriptAsync(e,o[r]).then((function(){return t.loadNext(e,o,r+1)})):Promise.resolve()};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.completeUrl=void 0,t.completeUrl=function(e){return "file:"===window.location.protocol&&/^\/\//.test(e)&&(e="https:"+e),e};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.browser=void 0,t.browser=function(e){var t=navigator.userAgent.toLowerCase(),o=/(firefox)[\s/]([\w.]+)/.exec(t)||/(chrome)[\s/]([\w.]+)/.exec(t)||/(webkit)[\s/]([\w.]+)/.exec(t)||/(opera)(?:.*version)[\s/]([\w.]+)/.exec(t)||/(msie)[\s]([\w.]+)/.exec(t)||/(trident)\/([\w.]+)/.exec(t)||0>t.indexOf("compatible")||[];return "version"===e?o[2]:"webkit"===e?"chrome"===o[1]||"webkit"===o[1]:"ff"===e?"firefox"===o[1]:"msie"===e?"trident"===o[1]||"msie"===o[1]:o[1]===e};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.convertMediaUrlToVideoEmbed=void 0;var r=o(14),i=o(106);t.convertMediaUrlToVideoEmbed=function(e,t,o){if(void 0===t&&(t=400),void 0===o&&(o=345),!r.isURL(e))return e;var n=document.createElement("a"),a=/(?:http?s?:\/\/)?(?:www\.)?(?:vimeo\.com)\/?(.+)/g;n.href=e,t||(t=400),o||(o=345);var s=n.protocol||"";switch(n.hostname){case"www.vimeo.com":case"vimeo.com":return a.test(e)?e.replace(a,'<iframe width="'+t+'" height="'+o+'" src="'+s+'//player.vimeo.com/video/$1" frameborder="0" allowfullscreen></iframe>'):e;case"youtube.com":case"www.youtube.com":case"youtu.be":case"www.youtu.be":var l=n.search?i.parseQuery(n.search):{v:n.pathname.substr(1)};return l.v?'<iframe width="'+t+'" height="'+o+'" src="'+s+"//www.youtube.com/embed/"+l.v+'" frameborder="0" allowfullscreen></iframe>':e}return e};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.parseQuery=void 0,t.parseQuery=function(e){for(var t={},o=e.substr(1).split("&"),r=0;o.length>r;r+=1){var i=o[r].split("=");t[decodeURIComponent(i[0])]=decodeURIComponent(i[1]||"");}return t};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.clearCenterAlign=t.css=void 0;var r=o(14),i=o(87),n=o(23);t.css=function(e,o,a,s){void 0===s&&(s=!1);var l=/^left|top|bottom|right|width|min|max|height|margin|padding|fontsize|font-size/i;if(r.isPlainObject(o)||void 0!==a){var c=function(e,o,n){!r.isVoid(n)&&l.test(o)&&r.isNumeric(n.toString())&&(n=parseInt(n.toString(),10)+"px"),void 0===n||null!=n&&t.css(e,o,void 0,!0)===i.normalizeCssValue(o,n)||(e.style[o]=n);};if(r.isPlainObject(o))for(var u=Object.keys(o),d=0;u.length>d;d+=1)c(e,n.camelCase(u[d]),o[u[d]]);else c(e,n.camelCase(o),a);return ""}var p=n.kebabCase(o),f=e.ownerDocument||document,h=!!f&&(f.defaultView||f.parentWindow),m=e.style[o],v="";return void 0!==m&&""!==m?v=m:h&&!s&&(v=h.getComputedStyle(e).getPropertyValue(p)),l.test(o)&&/^[-+]?[0-9.]+px$/.test(v.toString())&&(v=parseInt(v.toString(),10)),i.normalizeCssValue(o,v)},t.clearCenterAlign=function(e){"block"===t.css(e,"display")&&t.css(e,"display",""),"auto"===e.style.marginLeft&&"auto"===e.style.marginRight&&(e.style.marginLeft="",e.style.marginRight="");};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ctrlKey=void 0,t.ctrlKey=function(e){if("undefined"!=typeof navigator&&-1!==navigator.userAgent.indexOf("Mac OS X")){if(e.metaKey&&!e.altKey)return !0}else if(e.ctrlKey&&!e.altKey)return !0;return !1};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.dataBind=void 0;var r=o(42),i=o(14),n=new WeakMap;t.dataBind=function(e,t,o){var a=n.get(e);if(!a){n.set(e,a={});var s=null;e instanceof r.ViewComponent&&(s=e.j.e),i.isViewObject(e)&&(s=e.e),s&&s.on("beforeDestruct",(function(){n.delete(e);}));}return void 0===o?a[t]:(a[t]=o,o)};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.each=void 0;var r=o(14);t.each=function(e,t){var o,i,n;if(r.isArray(e)){for(o=e.length,n=0;o>n;n+=1)if(!1===t.call(e[n],n,e[n]))return !1}else for(i=Object.keys(e),n=0;i.length>n;n+=1)if(!1===t.call(e[i[n]],i[n],e[i[n]]))return !1;return !0};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.humanSizeToBytes=void 0,t.humanSizeToBytes=function(e){if(/^[0-9.]+$/.test(e.toString()))return parseFloat(e);var t=e.substr(-2,2).toUpperCase(),o=["KB","MB","GB","TB"],r=parseFloat(e.substr(0,e.length-2));return -1!==o.indexOf(t)?r*Math.pow(1024,o.indexOf(t)+1):parseInt(e,10)};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.buildQuery=void 0;var r=o(14);t.buildQuery=function(e,o){var i=[],n=encodeURIComponent;for(var a in e)if(Object.prototype.hasOwnProperty.call(e,a)){var s=o?o+"["+a+"]":a,l=e[a];i.push(r.isPlainObject(l)?t.buildQuery(l,s):n(s)+"="+n(l));}return i.join("&")};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.scrollIntoView=t.inView=void 0,t.inView=function(e,t,o){var r=e.getBoundingClientRect(),i=e,n=r.top,a=r.height;do{if(i&&i.parentNode){if((r=(i=i.parentNode).getBoundingClientRect()).bottom<n)return !1;if(r.top>=n+a)return !1}}while(i&&i!==t&&i.parentNode);return (o.documentElement&&o.documentElement.clientHeight||0)>=n},t.scrollIntoView=function(e,o,r){t.inView(e,o,r)||(o.clientHeight!==o.scrollHeight&&(o.scrollTop=e.offsetTop),t.inView(e,o,r)||e.scrollIntoView());};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.val=void 0,t.val=function(e,t,o){var r=e.querySelector(t);return r?(o&&(r.value=o),r.value):""};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.PluginSystem=t.Uploader=t.ToolbarCollection=t.ToolbarEditorCollection=t.Table=t.StatusBar=t.Snapshot=t.Style=t.Select=t.ProgressBar=t.Observer=t.ImageEditor=t.Helpers=t.FileBrowser=t.ViewWithToolbar=t.View=t.Icon=t.UIBlock=t.UICheckbox=t.UITextArea=t.UIInput=t.UIForm=t.UIList=t.UIGroup=t.UISeparator=t.Popup=t.UIButton=t.UIElement=t.Create=t.Plugin=t.Dom=t.Dialog=t.Prompt=t.Confirm=t.Alert=t.ContextMenu=t.STATUSES=t.ViewComponent=t.Component=t.Ajax=t.Async=void 0;var r=o(7);r.__exportStar(o(34),t);var i=o(116);Object.defineProperty(t,"Async",{enumerable:!0,get:function(){return i.Async}});var n=o(117);Object.defineProperty(t,"Ajax",{enumerable:!0,get:function(){return n.Ajax}});var a=o(42);Object.defineProperty(t,"Component",{enumerable:!0,get:function(){return a.Component}}),Object.defineProperty(t,"ViewComponent",{enumerable:!0,get:function(){return a.ViewComponent}}),Object.defineProperty(t,"STATUSES",{enumerable:!0,get:function(){return a.STATUSES}});var s=o(118);Object.defineProperty(t,"ContextMenu",{enumerable:!0,get:function(){return s.ContextMenu}});var l=o(136);Object.defineProperty(t,"Alert",{enumerable:!0,get:function(){return l.Alert}}),Object.defineProperty(t,"Confirm",{enumerable:!0,get:function(){return l.Confirm}}),Object.defineProperty(t,"Prompt",{enumerable:!0,get:function(){return l.Prompt}}),Object.defineProperty(t,"Dialog",{enumerable:!0,get:function(){return l.Dialog}});var c=o(33);Object.defineProperty(t,"Dom",{enumerable:!0,get:function(){return c.Dom}});var u=o(175);Object.defineProperty(t,"Plugin",{enumerable:!0,get:function(){return u.Plugin}});var d=o(176);Object.defineProperty(t,"Create",{enumerable:!0,get:function(){return d.Create}});var p=o(149);Object.defineProperty(t,"UIElement",{enumerable:!0,get:function(){return p.UIElement}}),Object.defineProperty(t,"UIButton",{enumerable:!0,get:function(){return p.UIButton}}),Object.defineProperty(t,"Popup",{enumerable:!0,get:function(){return p.Popup}}),Object.defineProperty(t,"UISeparator",{enumerable:!0,get:function(){return p.UISeparator}}),Object.defineProperty(t,"UIGroup",{enumerable:!0,get:function(){return p.UIGroup}}),Object.defineProperty(t,"UIList",{enumerable:!0,get:function(){return p.UIList}}),Object.defineProperty(t,"UIForm",{enumerable:!0,get:function(){return p.UIForm}}),Object.defineProperty(t,"UIInput",{enumerable:!0,get:function(){return p.UIInput}}),Object.defineProperty(t,"UITextArea",{enumerable:!0,get:function(){return p.UITextArea}}),Object.defineProperty(t,"UICheckbox",{enumerable:!0,get:function(){return p.UICheckbox}}),Object.defineProperty(t,"UIBlock",{enumerable:!0,get:function(){return p.UIBlock}}),Object.defineProperty(t,"Icon",{enumerable:!0,get:function(){return p.Icon}});var f=o(141);Object.defineProperty(t,"View",{enumerable:!0,get:function(){return f.View}});var h=o(139);Object.defineProperty(t,"ViewWithToolbar",{enumerable:!0,get:function(){return h.ViewWithToolbar}});var m=o(177);Object.defineProperty(t,"FileBrowser",{enumerable:!0,get:function(){return m.FileBrowser}});var v=o(10);t.Helpers=v;var g=o(188);Object.defineProperty(t,"ImageEditor",{enumerable:!0,get:function(){return g.ImageEditor}});var y=o(191);Object.defineProperty(t,"Observer",{enumerable:!0,get:function(){return y.Observer}});var b=o(195);Object.defineProperty(t,"ProgressBar",{enumerable:!0,get:function(){return b.ProgressBar}});var _=o(197);Object.defineProperty(t,"Select",{enumerable:!0,get:function(){return _.Select}}),Object.defineProperty(t,"Style",{enumerable:!0,get:function(){return _.Style}});var w=o(192);Object.defineProperty(t,"Snapshot",{enumerable:!0,get:function(){return w.Snapshot}});var S=o(201);Object.defineProperty(t,"StatusBar",{enumerable:!0,get:function(){return S.StatusBar}});var C=o(203);Object.defineProperty(t,"Table",{enumerable:!0,get:function(){return C.Table}});var j=o(167);Object.defineProperty(t,"ToolbarEditorCollection",{enumerable:!0,get:function(){return j.ToolbarEditorCollection}});var k=o(147);Object.defineProperty(t,"ToolbarCollection",{enumerable:!0,get:function(){return k.ToolbarCollection}}),r.__exportStar(o(204),t);var E=o(205);Object.defineProperty(t,"Uploader",{enumerable:!0,get:function(){return E.Uploader}});var I=o(32);Object.defineProperty(t,"PluginSystem",{enumerable:!0,get:function(){return I.PluginSystem}});},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Async=void 0;var r=o(7),i=o(10),n=function(){function e(){var e,t,o,r,i=this;this.timers=new Map,this.promisesRejections=new Set,this.requestsIdle=new Set,this.requestIdleCallbackNative=null!==(t=null===(e=window.requestIdleCallback)||void 0===e?void 0:e.bind(window))&&void 0!==t?t:function(e){var t=Date.now();return i.setTimeout((function(){e({didTimeout:!1,timeRemaining:function(){return Math.max(0,50-(Date.now()-t))}});}),1)},this.cancelIdleCallbackNative=null!==(r=null===(o=window.cancelIdleCallback)||void 0===o?void 0:o.bind(window))&&void 0!==r?r:function(e){i.clearTimeout(e);},this.isDestructed=!1;}return e.prototype.setTimeout=function(e,t){for(var o=[],n=2;arguments.length>n;n++)o[n-2]=arguments[n];if(this.isDestructed)return 0;var a={};"number"!=typeof t&&(t=(a=t).timeout||0),a.label&&this.timers.has(a.label)&&(i.clearTimeout(this.timers.get(a.label)),this.timers.delete(a.label));var s=i.setTimeout.apply(void 0,r.__spreadArrays([e,t],o)),l=a.label||s;return this.timers.set(l,s),s},e.prototype.clearTimeout=function(e){i.clearTimeout(e),this.timers.delete(e);},e.prototype.debounce=function(e,t,o){var r=this;void 0===o&&(o=!1);var n=0,a=!1,s=function(){for(var t=[],o=0;arguments.length>o;o++)t[o]=arguments[o];a||(n=0,e.apply(void 0,t),a=!0);};return function(){for(var l=[],c=0;arguments.length>c;c++)l[c]=arguments[c];a=!1,t?(!n&&o&&s.apply(void 0,l),i.clearTimeout(n),n=r.setTimeout((function(){return s.apply(void 0,l)}),i.isFunction(t)?t():t),r.timers.set(e,n)):s.apply(void 0,l);}},e.prototype.throttle=function(e,t){var o,r,n,a=this,s=null;return function(){for(var l=[],c=0;arguments.length>c;c++)l[c]=arguments[c];o=!0,n=l,t?s||(r=function(){o?(e.apply(void 0,n),o=!1,s=a.setTimeout(r,i.isFunction(t)?t():t),a.timers.set(r,s)):s=null;})():e.apply(void 0,n);}},e.prototype.promise=function(e){var t=this,o=function(){},r=new Promise((function(r,i){return t.promisesRejections.add(i),o=i,e(r,i)}));return r.finally((function(){t.promisesRejections.delete(o);})),r},e.prototype.promiseState=function(e){var t=this;if(e.status)return e.status;if(!Promise.race)return new Promise((function(o){e.then((function(e){return o("fulfilled"),e}),(function(e){throw o("rejected"),e})),t.setTimeout((function(){o("pending");}),100);}));var o={};return Promise.race([e,o]).then((function(e){return e===o?"pending":"fulfilled"}),(function(){return "rejected"}))},e.prototype.requestIdleCallback=function(e){var t=this.requestIdleCallbackNative(e);return this.requestsIdle.add(t),t},e.prototype.cancelIdleCallback=function(e){return this.requestsIdle.delete(e),this.cancelIdleCallbackNative(e)},e.prototype.clear=function(){var e=this;this.requestsIdle.forEach((function(t){e.cancelIdleCallback(t);})),this.timers.forEach((function(t){i.clearTimeout(e.timers.get(t));})),this.timers.clear(),this.promisesRejections.forEach((function(e){e();})),this.promisesRejections.clear();},e.prototype.destruct=function(){this.clear(),this.isDestructed=!0;},e}();t.Async=n;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Ajax=void 0;var r=o(7),i=o(8),n=o(10);i.Config.prototype.defaultAjaxOptions={dataType:"json",method:"GET",url:"",data:null,contentType:"application/x-www-form-urlencoded; charset=UTF-8",headers:{"X-REQUESTED-WITH":"XMLHttpRequest"},withCredentials:!1,xhr:function(){return new XMLHttpRequest}};var a=function(){function e(e,t){var o=this;this.jodit=e,this.success_response_codes=[200,201,202],this.resolved=!1,this.activated=!1,this.options=n.extend(!0,{},i.Config.prototype.defaultAjaxOptions,t),this.o.xhr&&(this.xhr=this.o.xhr()),e&&e.events&&e.e.on("beforeDestruct",(function(){o.abort();}));}return e.prototype.__buildParams=function(e,t){return n.isFunction(this.o.queryBuild)?this.o.queryBuild.call(this,e,t):n.isString(e)||this.j.ow.FormData&&e instanceof this.j.ow.FormData?e:n.buildQuery(e)},Object.defineProperty(e.prototype,"o",{get:function(){return this.options},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"j",{get:function(){return this.jodit},enumerable:!1,configurable:!0}),e.prototype.abort=function(){try{this.xhr.abort();}catch(e){}return this},e.prototype.send=function(){var e=this;return this.activated=!0,new Promise((function(t,o){var r=function(t){var o=null;if("json"===e.o.dataType&&(o=JSON.parse(t)),!o)throw n.error("No JSON format");return o};e.xhr.onabort=function(){o(n.error(e.xhr.statusText));},e.xhr.onerror=function(){o(n.error(e.xhr.statusText));},e.xhr.ontimeout=function(){o(n.error(e.xhr.statusText));},e.xhr.onload=function(){e.response=e.xhr.responseText,e.status=e.xhr.status,e.resolved=!0,t.call(e.xhr,r(e.response)||{});},e.xhr.onreadystatechange=function(){if(e.xhr.readyState===XMLHttpRequest.DONE){var i=e.xhr.responseText;e.response=i,e.status=e.xhr.status,e.resolved=!0,e.success_response_codes.indexOf(e.xhr.status)>-1?t.call(e.xhr,r(i)):o.call(e.xhr,n.error(e.xhr.statusText||e.j.i18n("Connection error!")));}},e.xhr.withCredentials=e.o.withCredentials||!1;var i=e.prepareRequest(),a=i.data;e.xhr.open(i.method,i.url,!0),e.o.contentType&&e.xhr.setRequestHeader&&e.xhr.setRequestHeader("Content-type",e.o.contentType),e.o.headers&&e.xhr.setRequestHeader&&n.each(e.o.headers,(function(t,o){e.xhr.setRequestHeader(t,o);})),setTimeout((function(){e.xhr.send(a?e.__buildParams(a):void 0);}),0);}))},e.prototype.prepareRequest=function(){if(!this.o.url)throw n.error("Need URL for AJAX request");var t=this.o.url,o=this.o.data,i=(this.o.method||"get").toLowerCase();if("get"===i&&o&&n.isPlainObject(o)){var a=t.indexOf("?");if(-1!==a){var s=n.parseQuery(t);t=t.substr(0,a)+"?"+n.buildQuery(r.__assign(r.__assign({},s),o));}else t+="?"+n.buildQuery(this.o.data);}var l={url:t,method:i,data:o};return e.log.splice(100),e.log.push(l),l},e.prototype.destruct=function(){this.activated&&!this.resolved&&(this.abort(),this.resolved=!0);},e.log=[],e}();t.Ajax=a;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ContextMenu=void 0;var r=o(7);o(119);var i=o(120),n=o(124),a=o(14),s=function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return r.__extends(t,e),t.prototype.className=function(){return "ContextMenu"},t.prototype.show=function(t,o,r){var i=this,s=this,l=this.j.c.div("jodit-context-menu__actions");a.isArray(r)&&(r.forEach((function(e){if(e){var t=n.Button(i.jodit,e.icon||"empty",e.title);i.jodit&&t.setParentView(i.jodit),t.setMod("context","menu"),t.onAction((function(t){var o;return null===(o=e.exec)||void 0===o||o.call(s,t),s.close(),!1})),l.appendChild(t.container);}})),e.prototype.setContent.call(this,l).open((function(){return {left:t,top:o,width:0,height:0}}),!0));},t}(i.Popup);t.ContextMenu=s;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),o(7).__exportStar(o(121),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Popup=void 0;var r=o(7);o(122);var i=o(33),n=o(10),a=o(31),s=o(123),l=o(38),c=function(e){function t(t){var o=e.call(this,t)||this;return o.isOpened=!1,o.strategy="leftBottom",o.viewBound=function(){return {left:0,top:0,width:o.ow.innerWidth,height:o.ow.innerHeight}},o.childrenPopups=new Set,n.attr(o.container,"role","popup"),o}return r.__extends(t,e),t.prototype.className=function(){return "Popup"},t.prototype.updateParentElement=function(o){var r=this;return o!==this&&o instanceof t&&(this.childrenPopups.forEach((function(e){!o.closest(e)&&e.isOpened&&e.close();})),this.childrenPopups.has(o)||this.j.e.on(o,"beforeClose",(function(){r.childrenPopups.delete(o);})),this.childrenPopups.add(o)),e.prototype.updateParentElement.call(this,o)},t.prototype.setContent=function(e){i.Dom.detach(this.container);var t,o=this.j.c.div(this.componentName+"__content");return e instanceof s.UIElement?(t=e.container,e.parentElement=this):t=n.isString(e)?this.j.c.fromHTML(e):e,o.appendChild(t),this.container.appendChild(o),this.updatePosition(),this},t.prototype.open=function(e,o){void 0===o&&(o=!1),n.markOwner(this.jodit,this.container),this.isOpened=!0,this.addGlobalListeners(),this.targetBound=o?this.getKeepBound(e):e;var r=a.getContainer(this.jodit,t);return r!==this.container.parentElement&&r.appendChild(this.container),this.updatePosition(),this.j.e.fire(this,"afterOpen"),this},t.prototype.getKeepBound=function(e){var t=this,o=e(),a=this.od.elementFromPoint(o.left,o.top);if(!a)return e;var s=i.Dom.isHTMLElement(a,this.ow)?a:a.parentElement,l=n.position(s,this.j);return function(){var o=e(),i=n.position(s,t.j);return r.__assign(r.__assign({},o),{top:o.top+(i.top-l.top),left:o.left+(i.left-l.left)})}},t.prototype.updatePosition=function(){if(!this.isOpened)return this;var e=this.calculatePosition(this.targetBound(),this.viewBound(),n.position(this.container,this.j)),t=e[0];return this.setMod("strategy",e[1]),n.css(this.container,{left:t.left,top:t.top}),this.childrenPopups.forEach((function(e){return e.updatePosition()})),this},t.prototype.calculatePosition=function(e,o,r,i){void 0===i&&(i=this.strategy);var a={left:e.left,right:e.left-(r.width-e.width)},s={bottom:e.top+e.height,top:e.top-r.height},l=Object.keys(a).reduce((function(e,t){return e.concat(Object.keys(s).map((function(e){return ""+t+n.ucfirst(e)})))}),[]),c=function(e){var t=n.kebabCase(e).split("-");return {left:a[t[0]],top:s[t[1]],width:r.width,height:r.height}},u=function(e){return t.boxInView(c(i),e)?i:l.find((function(o){if(t.boxInView(c(o),e))return o}))||null},d=u(n.position(this.j.container,this.j));return d&&t.boxInView(c(d),o)||(d=u(o)||d||i),[c(d),d]},t.boxInView=function(e,t){return !(-2>e.top-t.top||-2>e.left-t.left||-2>t.top+t.height-(e.top+e.height)||-2>t.left+t.width-(e.left+e.width))},t.prototype.close=function(){return this.isOpened?(this.isOpened=!1,this.childrenPopups.forEach((function(e){return e.close()})),this.j.e.fire(this,"beforeClose"),this.j.e.fire("beforePopupClose",this),this.removeGlobalListeners(),i.Dom.safeRemove(this.container),this):this},t.prototype.closeOnOutsideClick=function(e){if(this.isOpened)if(e.target){var o=s.UIElement.closestElement(e.target,t);o&&(this===o||o.closest(this))||this.close();}else this.close();},t.prototype.addGlobalListeners=function(){var e=this.updatePosition,t=this.ow;a.eventEmitter.on("closeAllPopups",this.close),this.j.e.on("closeAllPopups",this.close).on("escape",this.close).on("resize",e).on(this.container,"scroll mousewheel",e).on("mousedown touchstart",this.closeOnOutsideClick).on(t,"mousedown touchstart",this.closeOnOutsideClick).on(t,"scroll",e).on(t,"resize",e);},t.prototype.removeGlobalListeners=function(){var e=this.updatePosition,t=this.ow;a.eventEmitter.off("closeAllPopups",this.close),this.j.e.off("closeAllPopups",this.close).off("escape",this.close).off("resize",e).off(this.container,"scroll mousewheel",e).off("mousedown touchstart",this.closeOnOutsideClick).off(t,"mousedown touchstart",this.closeOnOutsideClick).off(t,"scroll",e).off(t,"resize",e);},t.prototype.setZIndex=function(e){this.container.style.zIndex=e.toString();},t.prototype.destruct=function(){return this.close(),e.prototype.destruct.call(this)},r.__decorate([l.autobind],t.prototype,"updatePosition",null),r.__decorate([l.autobind],t.prototype,"close",null),r.__decorate([l.autobind],t.prototype,"closeOnOutsideClick",null),t}(s.UIElement);t.Popup=c;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.UIElement=void 0;var r=o(7),i=o(42),n=o(33),a=o(72),s=function(e){function t(t,o){var r=e.call(this,t)||this;return r.__parentElement=null,r.mods={},r.container=r.createContainer(o),Object.defineProperty(r.container,"component",{value:r}),r}return r.__extends(t,e),Object.defineProperty(t.prototype,"parentElement",{get:function(){return this.__parentElement},set:function(e){var t=this;this.__parentElement=e,e&&e.hookStatus("beforeDestruct",(function(){return t.destruct()})),this.updateParentElement(this);},enumerable:!1,configurable:!0}),t.prototype.updateParentElement=function(e){var t;return null===(t=this.__parentElement)||void 0===t||t.updateParentElement(e),this},t.prototype.closest=function(e){for(var o="object"==typeof e?function(t){return t===e}:function(t){return t instanceof e},r=this.__parentElement;r;){if(o(r))return r;r=!r.parentElement&&r.container.parentElement?t.closestElement(r.container.parentElement,t):r.parentElement;}return null},t.closestElement=function(e,t){var o=n.Dom.up(e,(function(e){if(e){var o=e.component;return o&&o instanceof t}return !1}));return o?null==o?void 0:o.component:null},t.prototype.setMod=function(e,t,o){if(void 0===o&&(o=this.container),e=e.toLowerCase(),this.mods[e]===t)return this;var r=this.componentName+"_"+e,i=o.classList;return a.toArray(i).forEach((function(e){0===e.indexOf(r)&&i.remove(e);})),null!=t&&""!==t&&i.add(r+"_"+t.toString().toLowerCase()),this.mods[e]=t,this},t.prototype.getFullElName=function(e){return this.componentName+"__"+e},t.prototype.getElm=function(e){return this.container.querySelector("."+this.getFullElName(e))},t.prototype.getElms=function(e){return a.toArray(this.container.querySelectorAll("."+this.getFullElName(e)))},t.prototype.update=function(){},t.prototype.appendTo=function(e){return e.appendChild(this.container),this},t.prototype.clearName=function(e){return e.replace(/[^a-zA-Z0-9]/g,"_")},t.prototype.makeContainer=function(e){return this.j.c.div(this.componentName)},t.prototype.createContainer=function(e){return this.makeContainer(e)},t.prototype.destruct=function(){return n.Dom.safeRemove(this.container),this.parentElement=null,e.prototype.destruct.call(this)},t}(i.ViewComponent);t.UIElement=s;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),o(7).__exportStar(o(125),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Button=t.UIButton=t.UIButtonState=void 0;var r=o(7);o(126);var i=o(123),n=o(50),a=o(33),s=o(10),l=o(127),c=o(128),u=o(38),d=o(42);t.UIButtonState=function(){return {size:"middle",type:"button",name:"",status:"",disabled:!1,activated:!1,icon:{name:"empty",fill:"",iconURL:""},tooltip:"",text:"",tabIndex:void 0}};var p=function(e){function o(o,r){var i=e.call(this,o)||this;return i.isButton=!0,i.state=t.UIButtonState(),i.actionHandlers=[],i.updateSize(),i.onChangeSize(),i.onChangeStatus(),r&&i.hookStatus(d.STATUSES.ready,(function(){i.setState(r);})),i}return r.__extends(o,e),o.prototype.className=function(){return "UIButton"},o.prototype.setState=function(e){return Object.assign(this.state,e),this},o.prototype.onChangeSize=function(){this.setMod("size",this.state.size);},o.prototype.onChangeType=function(){s.attr(this.container,"type",this.state.type);},o.prototype.updateSize=function(){var e=this.closest(c.UIList);e&&(this.state.size=e.buttonSize);},o.prototype.onChangeStatus=function(){this.setMod("status",this.state.status);},o.prototype.onChangeText=function(){this.text.textContent=this.jodit.i18n(this.state.text);},o.prototype.onChangeTextSetMode=function(){this.setMod("text-icons",Boolean(this.state.text.trim().length));},o.prototype.onChangeDisabled=function(){s.attr(this.container,"disabled",this.state.disabled||null);},o.prototype.onChangeActivated=function(){s.attr(this.container,"aria-pressed",this.state.activated);},o.prototype.onChangeName=function(){this.container.classList.add(this.componentName+"_"+this.clearName(this.state.name)),s.attr(this.container,"data-ref",this.state.name),s.attr(this.container,"ref",this.state.name);},o.prototype.onChangeTooltip=function(){this.get("j.o.useNativeTooltip")&&s.attr(this.container,"title",this.state.tooltip),s.attr(this.container,"aria-label",this.state.tooltip);},o.prototype.onChangeTabIndex=function(){s.attr(this.container,"tabIndex",this.state.tabIndex);},o.prototype.onChangeIcon=function(){var e=this.get("j.o.textIcons");if(!(!0===e||s.isFunction(e)&&e(this.state.name))){a.Dom.detach(this.icon);var t=l.Icon.makeIcon(this.j,this.state.icon);t&&this.icon.appendChild(t);}},o.prototype.focus=function(){this.container.focus();},o.prototype.isFocused=function(){var e=this.od.activeElement;return Boolean(e&&a.Dom.isOrContains(this.container,e))},o.prototype.createContainer=function(){var e=this.componentName,t=this.j.c.element("button",{class:e,type:"button",role:"button",ariaPressed:!1});return this.icon=this.j.c.span(e+"__icon"),this.text=this.j.c.span(e+"__text"),t.appendChild(this.icon),t.appendChild(this.text),this.j.e.on(t,"click",this.onActionFire),t},o.prototype.destruct=function(){return this.j.e.off(this.container),e.prototype.destruct.call(this)},o.prototype.onAction=function(e){return this.actionHandlers.push(e),this},o.prototype.onActionFire=function(e){var t=this;e.buffer={actionTrigger:this},this.actionHandlers.forEach((function(o){return o.call(t,e)}));},r.__decorate([n.default("state.size")],o.prototype,"onChangeSize",null),r.__decorate([n.default("state.type")],o.prototype,"onChangeType",null),r.__decorate([n.default("parentElement")],o.prototype,"updateSize",null),r.__decorate([n.default("state.status")],o.prototype,"onChangeStatus",null),r.__decorate([n.default("state.text")],o.prototype,"onChangeText",null),r.__decorate([n.default("state.text")],o.prototype,"onChangeTextSetMode",null),r.__decorate([n.default("state.disabled")],o.prototype,"onChangeDisabled",null),r.__decorate([n.default("state.activated")],o.prototype,"onChangeActivated",null),r.__decorate([n.default("state.name")],o.prototype,"onChangeName",null),r.__decorate([n.default("state.tooltip")],o.prototype,"onChangeTooltip",null),r.__decorate([n.default("state.tabIndex")],o.prototype,"onChangeTabIndex",null),r.__decorate([n.default("state.icon")],o.prototype,"onChangeIcon",null),r.__decorate([u.autobind],o.prototype,"onActionFire",null),r.__decorate([u.component],o)}(i.UIElement);t.UIButton=p,t.Button=function(e,t,o,r){var i=new p(e);return i.state.tabIndex=e.o.allowTabNavigation?0:-1,s.isString(t)?(i.state.icon.name=t,i.state.name=t,r&&(i.state.status=r),o&&(i.state.text=o)):i.setState(t),i};},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Icon=void 0;var r=o(107),i=function(){function e(){}return e.getIcon=function(t){return /^<svg/i.test(t)?t:e.icons[t]||e.icons[t.replace(/-/g,"_")]||e.icons[t.toLowerCase()]},e.exists=function(e){return void 0!==this.getIcon(e)},e.get=function(e,t){return void 0===t&&(t="<span></span>"),this.getIcon(e)||t},e.set=function(e,t){this.icons[e.replace("_","-")]=t;},e.makeIcon=function(t,o){var i,n;if(o){var a=o.name.replace(/[^a-zA-Z0-9]/g,"_");if(o.iconURL)n=t.c.span(),r.css(n,"backgroundImage","url("+o.iconURL.replace("{basePath}",(null==t?void 0:t.basePath)||"")+")");else {var s=t.e.fire("getIcon",o.name,o,a)||e.get(o.name,"")||(null===(i=t.o.extraIcons)||void 0===i?void 0:i[o.name]);s&&(n=t.c.fromHTML(s.trim()),/^<svg/i.test(o.name)||n.classList.add("jodit-icon_"+a));}}return n&&(n.classList.add("jodit-icon"),n.style.fill=o.fill),n},e.icons={},e}();t.Icon=i;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.UIList=void 0;var r=o(7);o(129);var i=o(124),n=o(130),a=o(38),s=o(132),l=o(134),c=o(135),u=o(131),d=function(e){function t(t){var o=e.call(this,t)||this;return o.mode="horizontal",o.removeButtons=[],o.onChangeMode(),o}return r.__extends(t,e),t.prototype.className=function(){return "UIList"},t.prototype.onChangeMode=function(){this.setMod("mode",this.mode);},t.prototype.makeGroup=function(){return new s.UIGroup(this.jodit)},Object.defineProperty(t.prototype,"buttons",{get:function(){return this.allChildren.filter((function(e){return e instanceof i.UIButton}))},enumerable:!1,configurable:!0}),t.prototype.getButtonsNames=function(){return this.buttons.map((function(e){return e instanceof i.UIButton&&e.state.name||""})).filter((function(e){return ""!==e}))},t.prototype.setRemoveButtons=function(e){return this.removeButtons=e||[],this},t.prototype.build=function(e,t){var o=this;void 0===t&&(t=null),this.clear();var r,i=!1,a=this.makeGroup();this.append(a);var s=function(e){var n=null;switch(e.name){case"\n":a=o.makeGroup(),r=o.makeGroup(),a.append(r),o.append(a);break;case"|":i||(i=!0,n=new l.UISeparator(o.j));break;default:i=!1,n=o.makeButton(e,t);}n&&(r||(r=o.makeGroup(),a.append(r)),r.append(n));},d=function(e){return !o.removeButtons.includes(e.name)};return e.forEach((function(e){if(c.isButtonGroup(e)){var t=e.buttons.filter((function(e){return e}));t.length&&(r=o.makeGroup(),a.append(r),r.setMod("separated",!0).setMod("group",e.group),n.getStrongControlTypes(t,o.j.o.controls).filter(d).forEach(s));}else {var i=u.getControlType(e,o.j.o.controls);d(i)&&s(i);}})),this.update(),this},t.prototype.makeButton=function(e,t){return new i.UIButton(this.j)},r.__decorate([a.watch("mode")],t.prototype,"onChangeMode",null),r.__decorate([a.component],t)}(s.UIGroup);t.UIList=d;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.getStrongControlTypes=void 0;var r=o(7),i=o(131),n=o(8),a=o(14);t.getStrongControlTypes=function(e,t){return (a.isArray(e)?e:Object.keys(e).map((function(t){return r.__assign({name:t},e[t]||{})}))).map((function(e){return i.getControlType(e,t||n.Config.defaultOptions.controls)}))};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.findControlType=t.getControlType=void 0;var r=o(7),i=o(10),n=o(8);function a(e,t){var o=e.split(/\./),i=o[0],n=o[1],a=t;return null!=n?void 0!==t[i]&&(a=t[i]):n=i,a[n]?r.__assign({name:n},a[n]):void 0}t.getControlType=function(e,t){var o;return t||(t=n.Config.defaultOptions.controls),i.isString(e)?o=a(e,t)||{name:e,command:e,tooltip:e}:void 0!==t[(o=r.__assign({name:"empty"},e)).name]&&(o=r.__assign(r.__assign({},t[o.name]),o)),o},t.findControlType=a;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.UIGroup=void 0;var r=o(7);o(133);var i=o(123),n=o(38),a=o(10),s=function(e){function t(t,o){var r=e.call(this,t)||this;return r.elements=[],r.buttonSize="middle",null==o||o.forEach((function(e){return e&&r.append(e)})),r}var o;return r.__extends(t,e),o=t,t.prototype.className=function(){return "UIGroup"},Object.defineProperty(t.prototype,"allChildren",{get:function(){for(var e=[],t=r.__spreadArrays(this.elements);t.length;){var i=t.pop();a.isArray(i)?t.push.apply(t,i):i instanceof o?t.push.apply(t,i.elements.reverse()):i&&e.push(i);}return e},enumerable:!1,configurable:!0}),t.prototype.update=function(){this.elements.forEach((function(e){return e.update()})),this.setMod("size",this.buttonSize);},t.prototype.append=function(e){this.elements.push(e),this.container.appendChild(e.container),e.parentElement=this,e.update();},t.prototype.clear=function(){this.elements.forEach((function(e){return e.destruct()})),this.elements.length=0;},t.prototype.destruct=function(){return this.clear(),e.prototype.destruct.call(this)},r.__decorate([n.watch("buttonSize")],t.prototype,"update",null),o=r.__decorate([n.component],t)}(i.UIElement);t.UIGroup=s;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.UISeparator=void 0;var r=o(7),i=o(123),n=o(38),a=function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return r.__extends(t,e),t.prototype.className=function(){return "UISeparator"},r.__decorate([n.component],t)}(i.UIElement);t.UISeparator=a;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.flatButtonsSet=t.isButtonGroup=void 0;var r=o(14);t.isButtonGroup=function(e){return r.isArray(e.buttons)},t.flatButtonsSet=function(e){return new Set(e.reduce((function(e,o){return t.isButtonGroup(o)?e.push.apply(e,o.buttons):e.push(o),e}),[]))};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Confirm=t.Prompt=t.Alert=t.Dialog=void 0;var r=o(137);Object.defineProperty(t,"Dialog",{enumerable:!0,get:function(){return r.Dialog}});var i=o(172);Object.defineProperty(t,"Alert",{enumerable:!0,get:function(){return i.Alert}});var n=o(173);Object.defineProperty(t,"Prompt",{enumerable:!0,get:function(){return n.Prompt}});var a=o(174);Object.defineProperty(t,"Confirm",{enumerable:!0,get:function(){return a.Confirm}});},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Dialog=void 0;var r=o(7);o(138);var i=o(8),n=o(9),a=o(10),s=o(139),l=o(33),c=o(42),u=o(31),d=o(38);i.Config.prototype.dialog={extraButtons:[],resizable:!0,draggable:!0,buttons:["dialog.close"],removeButtons:[]},i.Config.prototype.controls.dialog={close:{icon:"cancel",exec:function(e){e.close(),e.toggleFullSizeBox(!1);}}};var p=function(e){function t(t){var o=e.call(this,t)||this;o.destination=document.body,o.destroyAfterClose=!1,o.moved=!1,o.iSetMaximization=!1,o.resizable=!1,o.draggable=!1,o.startX=0,o.startY=0,o.startPoint={x:0,y:0,w:0,h:0},o.lockSelect=function(){o.container.classList.add("jodit-dialog__box-moved");},o.unlockSelect=function(){o.container.classList.remove("jodit-dialog__box-moved");},o.onResize=function(){o.options&&o.o.resizable&&!o.moved&&o.isOpened&&!o.offsetX&&!o.offsetY&&o.setPosition();},o.isModal=!1,o.isOpened=!1;var r=o;r.options=new i.OptionsDefault(a.extend(!0,{toolbarButtonSize:"middle"},i.Config.prototype.dialog,t)),l.Dom.safeRemove(r.container),r.container=o.c.fromHTML('<div style="z-index:'+r.o.zIndex+'" class="jodit jodit-dialog__box"><div class="jodit-dialog__overlay"></div><div class="jodit-dialog"><div class="jodit-dialog__header non-selected"><div class="jodit-dialog__header-title"></div><div class="jodit-dialog__header-toolbar"></div></div><div class="jodit-dialog__content"></div><div class="jodit-dialog__footer"></div>'+(r.o.resizable?'<div class="jodit-dialog__resizer"></div>':"")+"</div></div>"),a.attr(r.container,"role","dialog"),Object.defineProperty(r.container,"component",{value:o}),r.container.classList.add("jodit_theme_"+(o.o.theme||"default")),r.dialog=r.container.querySelector(".jodit-dialog"),a.css(r.dialog,{maxWidth:r.options.maxWidth,minHeight:r.options.minHeight,minWidth:r.options.minWidth}),r.resizer=r.container.querySelector(".jodit-dialog__resizer"),r.dialogbox_header=r.container.querySelector(".jodit-dialog__header>.jodit-dialog__header-title"),r.dialogbox_content=r.container.querySelector(".jodit-dialog__content"),r.dialogbox_footer=r.container.querySelector(".jodit-dialog__footer"),r.dialogbox_toolbar=r.container.querySelector(".jodit-dialog__header>.jodit-dialog__header-toolbar"),r.o.buttons&&r.toolbar.build(a.splitArray(r.o.buttons)).appendTo(r.dialogbox_toolbar);var n=r.container.querySelector(".jodit-dialog__header");n&&r.e.on(n,"mousedown",r.onHeaderMouseDown),r.o.resizable&&r.e.on(r.resizer,"mousedown",r.onResizerMouseDown);var s=u.pluginSystem.get("fullsize");return a.isFunction(s)&&s(r),o.e.on(r.container,"close_dialog",r.close).on(o.ow,"keydown",o.onEsc).on(o.ow,"resize",o.onResize),o}return r.__extends(t,e),t.prototype.className=function(){return "Dialog"},t.prototype.setElements=function(e,t){var o=this,r=[];a.asArray(t).forEach((function(t){if(a.isArray(t)){var i=o.c.div("jodit-dialog__column");return r.push(i),e.appendChild(i),o.setElements(i,t)}var n;n=a.isString(t)?o.c.fromHTML(t):a.hasContainer(t)?t.container:t,r.push(n),n.parentNode!==e&&e.appendChild(n);})),a.toArray(e.childNodes).forEach((function(t){-1===r.indexOf(t)&&e.removeChild(t);}));},t.prototype.onMouseUp=function(){(this.draggable||this.resizable)&&(this.e.off(this.ow,"mousemove",this.onMouseMove),this.draggable=!1,this.resizable=!1,this.unlockSelect(),this.e&&(this.removeGlobalResizeListeners(),this.e.fire(this,"endResize endMove")));},t.prototype.onHeaderMouseDown=function(e){var t=e.target;!this.o.draggable||t&&t.nodeName.match(/^(INPUT|SELECT)$/)||(this.draggable=!0,this.startX=e.clientX,this.startY=e.clientY,this.startPoint.x=a.css(this.dialog,"left"),this.startPoint.y=a.css(this.dialog,"top"),this.setMaxZIndex(),e.preventDefault(),this.lockSelect(),this.addGlobalResizeListeners(),this.e&&this.e.fire(this,"startMove"));},t.prototype.onMouseMove=function(e){this.draggable&&this.o.draggable&&(this.setPosition(this.startPoint.x+e.clientX-this.startX,this.startPoint.y+e.clientY-this.startY),this.e&&this.e.fire(this,"move",e.clientX-this.startX,e.clientY-this.startY),e.stopImmediatePropagation(),e.preventDefault()),this.resizable&&this.o.resizable&&(this.setSize(this.startPoint.w+e.clientX-this.startX,this.startPoint.h+e.clientY-this.startY),this.e&&this.e.fire(this,"resizeDialog",e.clientX-this.startX,e.clientY-this.startY));},t.prototype.onEsc=function(e){if(this.isOpened&&e.key===n.KEY_ESC){var t=this.getMaxZIndexDialog();t?t.close():this.close(),e.stopImmediatePropagation();}},t.prototype.onResizerMouseDown=function(e){this.resizable=!0,this.startX=e.clientX,this.startY=e.clientY,this.startPoint.w=this.dialog.offsetWidth,this.startPoint.h=this.dialog.offsetHeight,this.lockSelect(),this.addGlobalResizeListeners(),this.e&&this.e.fire(this,"startResize");},t.prototype.addGlobalResizeListeners=function(){var e=this;e.e.on(e.ow,"mousemove",e.onMouseMove).on(e.ow,"mouseup",e.onMouseUp);},t.prototype.removeGlobalResizeListeners=function(){var e=this;e.e.off(e.ow,"mousemove",e.onMouseMove).off(e.ow,"mouseup",e.onMouseUp);},t.prototype.setSize=function(e,t){return null==e&&(e=this.dialog.offsetWidth),null==t&&(t=this.dialog.offsetHeight),a.css(this.dialog,{width:e,height:t}),this},t.prototype.calcAutoSize=function(){return this.setSize("auto","auto"),this.setSize(),this},t.prototype.setPosition=function(e,t){var o=this.ow.innerWidth/2-this.dialog.offsetWidth/2,r=this.ow.innerHeight/2-this.dialog.offsetHeight/2;return 0>o&&(o=0),0>r&&(r=0),void 0!==e&&void 0!==t&&(this.offsetX=e,this.offsetY=t,this.moved=Math.abs(e-o)>100||Math.abs(t-r)>100),this.dialog.style.left=(e||o)+"px",this.dialog.style.top=(t||r)+"px",this},t.prototype.setHeader=function(e){return this.setElements(this.dialogbox_header,e),this},t.prototype.setContent=function(e){return this.setElements(this.dialogbox_content,e),this},t.prototype.setFooter=function(e){return this.setElements(this.dialogbox_footer,e),this.dialog.classList.toggle("jodit-dialog_footer_true",Boolean(e)),this},t.prototype.getZIndex=function(){return parseInt(a.css(this.container,"zIndex"),10)||0},t.prototype.getMaxZIndexDialog=function(){var e,t,o=0,r=this;return a.$$(".jodit-dialog__box",this.destination).forEach((function(i){e=i.component,t=parseInt(a.css(i,"zIndex"),10),e.isOpened&&!isNaN(t)&&t>o&&(r=e,o=t);})),r},t.prototype.setMaxZIndex=function(){var e=20000004,t=0;a.$$(".jodit-dialog__box",this.destination).forEach((function(o){t=parseInt(a.css(o,"zIndex"),10),e=Math.max(isNaN(t)?0:t,e);})),this.container.style.zIndex=(e+1).toString();},t.prototype.maximization=function(e){return "boolean"!=typeof e&&(e=!this.container.classList.contains("jodit-dialog__box_fullsize")),this.container.classList.toggle("jodit-dialog__box_fullsize",e),this.toggleFullSizeBox(e),this.iSetMaximization=e,e},t.prototype.toggleFullSizeBox=function(e){[this.destination,this.destination.parentNode].forEach((function(t){t&&t.classList&&t.classList.toggle("jodit_fullsize-box_true",e);}));},t.prototype.open=function(e,t,o,r){if(u.eventEmitter.fire("closeAllPopups hideHelpers"),!1===this.e.fire(this,"beforeOpen"))return this;a.isBoolean(e)&&(o=e),a.isBoolean(t)&&(r=t),this.destroyAfterClose=!0===o;var i=a.isBoolean(e)?void 0:e,n=a.isBoolean(t)?void 0:t;return void 0!==n&&this.setHeader(n),i&&this.setContent(i),this.container.classList.add("jodit-dialog_active"),this.isOpened=!0,this.setModal(r),this.destination.appendChild(this.container),this.setPosition(this.offsetX,this.offsetY),this.setMaxZIndex(),this.o.fullsize&&this.maximization(!0),this.e.fire("afterOpen",this),this},t.prototype.setModal=function(e){return this.isModal=Boolean(e),this.container.classList.toggle("jodit-modal",this.isModal),this},t.prototype.close=function(e){var t,o,r;return this.isDestructed||!this.isOpened||(e&&(e.stopImmediatePropagation(),e.preventDefault()),this.e&&this.e.fire("beforeClose",this),l.Dom.safeRemove(this.container),null===(t=null==this?void 0:this.container)||void 0===t||t.classList.remove("jodit-dialog_active"),this.isOpened=!1,this.iSetMaximization&&this.maximization(!1),this.removeGlobalResizeListeners(),this.destroyAfterClose&&this.destruct(),null===(o=this.e)||void 0===o||o.fire(this,"afterClose"),null===(r=this.e)||void 0===r||r.fire(this.ow,"joditCloseDialog")),this},t.prototype.destruct=function(){this.isInDestruct||(this.setStatus(c.STATUSES.beforeDestruct),this.isOpened&&this.close(),this.events&&(this.removeGlobalResizeListeners(),this.events.off(this.container,"close_dialog",self.close).off(this.ow,"keydown",this.onEsc).off(this.ow,"resize",this.onResize)),e.prototype.destruct.call(this));},r.__decorate([d.autobind],t.prototype,"onMouseUp",null),r.__decorate([d.autobind],t.prototype,"onHeaderMouseDown",null),r.__decorate([d.autobind],t.prototype,"onMouseMove",null),r.__decorate([d.autobind],t.prototype,"onEsc",null),r.__decorate([d.autobind],t.prototype,"onResizerMouseDown",null),r.__decorate([d.autobind],t.prototype,"close",null),r.__decorate([d.component],t)}(s.ViewWithToolbar);t.Dialog=p;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ViewWithToolbar=void 0;var r=o(7);o(140);var i=o(141),n=o(10),a=o(33),s=o(146),l=o(42),c=o(135),u=o(38),d=function(e){function t(t,o){void 0===o&&(o=!1);var r=e.call(this,t,o)||this;return r.isJodit=o,r.toolbar=s.makeCollection(r),r.defaultToolbarContainer=r.c.div("jodit-toolbar__box"),r.registeredButtons=new Set,r.groupToButtons={},r.e.on("beforeToolbarBuild",r.beforeToolbarBuild),r}return r.__extends(t,e),Object.defineProperty(t.prototype,"toolbarContainer",{get:function(){return this.o.fullsize||!n.isString(this.o.toolbar)&&!a.Dom.isHTMLElement(this.o.toolbar,this.ow)?(this.o.toolbar&&a.Dom.appendChildFirst(this.container,this.defaultToolbarContainer),this.defaultToolbarContainer):n.resolveElement(this.o.toolbar,this.o.shadowRoot||this.od)},enumerable:!1,configurable:!0}),t.prototype.setPanel=function(e){this.o.toolbar=e,this.buildToolbar();},t.prototype.buildToolbar=function(){if(this.o.toolbar){var e=this.o.buttons?n.splitArray(this.o.buttons):[];this.toolbar.setRemoveButtons(this.o.removeButtons).build(e.concat(this.o.extraButtons||[])).appendTo(this.toolbarContainer);}},t.prototype.registerButton=function(e){var t;this.registeredButtons.add(e);var o=null!==(t=e.group)&&void 0!==t?t:"other";return this.groupToButtons[o]||(this.groupToButtons[o]=[]),null!=e.position?this.groupToButtons[o][e.position]=e.name:this.groupToButtons[o].push(e.name),this},t.prototype.unregisterButton=function(e){var t;this.registeredButtons.delete(e);var o=null!==(t=e.group)&&void 0!==t?t:"other",r=this.groupToButtons[o];if(r){var i=r.indexOf(e.name);-1!==i&&r.splice(i,1),0===r.length&&delete this.groupToButtons[o];}return this},t.prototype.beforeToolbarBuild=function(e){var t=this;if(Object.keys(this.groupToButtons).length)return e.map((function(e){return c.isButtonGroup(e)&&e.group&&t.groupToButtons[e.group]?{group:e.group,buttons:r.__spreadArrays(e.buttons,t.groupToButtons[e.group])}:e}))},t.prototype.destruct=function(){this.isDestructed||(this.setStatus(l.STATUSES.beforeDestruct),this.e.off("beforeToolbarBuild",this.beforeToolbarBuild),this.toolbar.destruct(),e.prototype.destruct.call(this));},r.__decorate([u.autobind],t.prototype,"beforeToolbarBuild",null),t}(i.View);t.ViewWithToolbar=d;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.View=void 0;var r=o(7),i=o(142),n=o(10),a=o(9),s=o(115),l=o(116),c=o(31),u=o(38),d=function(e){function t(o,r){void 0===r&&(r=!1);var n=e.call(this)||this;return n.isJodit=r,n.isView=!0,n.components=new Set,n.version="3.5.4",n.async=new l.Async,n.buffer=i.Storage.makeStorage(),n.OPTIONS=t.defaultOptions,n.__isFullSize=!1,n.__whoLocked="",n.isLockedNotBy=function(e){return n.isLocked&&n.__whoLocked!==e},n.__modulesInstances=new Map,n.id=(new Date).getTime().toString(),n.buffer=i.Storage.makeStorage(),n.initOptions(o),n.initOwners(),n.events=new s.EventsNative(n.od),n.create=new s.Create(n.od),n.container=n.c.div(),n.container.classList.add("jodit"),n.progressbar=new s.ProgressBar(n),n}return r.__extends(t,e),Object.defineProperty(t.prototype,"basePath",{get:function(){return this.o.basePath?this.o.basePath:a.BASE_PATH},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"defaultTimeout",{get:function(){return n.isVoid(this.o.defaultTimeout)?100:this.o.defaultTimeout},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"c",{get:function(){return this.create},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"container",{get:function(){return this.__container},set:function(e){this.__container=e;},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"e",{get:function(){return this.events},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"options",{get:function(){return this.__options},set:function(e){this.__options=e;},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"o",{get:function(){return this.options},enumerable:!1,configurable:!0}),t.prototype.i18n=function(e){for(var t=[],o=1;arguments.length>o;o++)t[o-1]=arguments[o];return n.i18n(e,t,this.options)},t.prototype.toggleFullSize=function(e){void 0===e&&(e=!this.__isFullSize),e!==this.__isFullSize&&(this.__isFullSize=e,this.events&&this.e.fire("toggleFullSize",e));},Object.defineProperty(t.prototype,"isLocked",{get:function(){return ""!==this.__whoLocked},enumerable:!1,configurable:!0}),t.prototype.lock=function(e){return void 0===e&&(e="any"),!this.isLocked&&(this.__whoLocked=e,!0)},t.prototype.unlock=function(){return !!this.isLocked&&(this.__whoLocked="",!0)},Object.defineProperty(t.prototype,"isFullSize",{get:function(){return this.__isFullSize},enumerable:!1,configurable:!0}),t.prototype.getVersion=function(){return this.version},t.prototype.initOptions=function(e){this.options=r.__assign(r.__assign(r.__assign({},this.options||{}),t.defaultOptions),e);},t.prototype.initOwners=function(){},t.prototype.getInstance=function(e,t){var o=c.modules[e],r=this.__modulesInstances;if(!n.isFunction(o))throw n.error("Need real module name");if(!r.has(e)){var i=o.prototype instanceof s.ViewComponent?new o(this,t):new o(t);this.components.add(i),r.set(e,i);}return r.get(e)},t.prototype.beforeDestruct=function(){this.e.fire(s.STATUSES.beforeDestruct,this),this.components.forEach((function(e){n.isDestructable(e)&&!e.isInDestruct&&e.destruct();})),this.components.clear();},t.prototype.destruct=function(){this.isDestructed||(this.async&&this.async.destruct(),this.events&&this.e.destruct(),this.buffer&&this.buffer.clear(),s.Dom.safeRemove(this.container),e.prototype.destruct.call(this));},r.__decorate([u.hook(s.STATUSES.beforeDestruct)],t.prototype,"beforeDestruct",null),t}(s.Component);t.View=d,d.defaultOptions={extraButtons:[],textIcons:!1,removeButtons:[],zIndex:100002,defaultTimeout:100,fullsize:!1,showTooltip:!0,useNativeTooltip:!1,buttons:[],globalFullSize:!0};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(143),t),r.__exportStar(o(144),t),r.__exportStar(o(145),t);},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.MemoryStorageProvider=void 0;var o=function(){function e(){this.data=new Map;}return e.prototype.set=function(e,t){this.data.set(e,t);},e.prototype.delete=function(e){this.data.delete(e);},e.prototype.get=function(e){return this.data.get(e)},e.prototype.exists=function(e){return this.data.has(e)},e.prototype.clear=function(){this.data.clear();},e}();t.MemoryStorageProvider=o;},(e,t)=>{var o;Object.defineProperty(t,"__esModule",{value:!0}),t.LocalStorageProvider=t.canUsePersistentStorage=void 0,t.canUsePersistentStorage=function(){return void 0===o&&(o=function(){var e="___Jodit___"+Math.random().toString();try{localStorage.setItem(e,"1");var t="1"===localStorage.getItem(e);return localStorage.removeItem(e),t}catch(e){}return !1}()),o};var r=function(){function e(e){this.rootKey=e;}return e.prototype.set=function(e,t){try{var o=localStorage.getItem(this.rootKey),r=o?JSON.parse(o):{};r[e]=t,localStorage.setItem(this.rootKey,JSON.stringify(r));}catch(e){}},e.prototype.delete=function(e){try{localStorage.removeItem(this.rootKey);}catch(e){}},e.prototype.get=function(e){try{var t=localStorage.getItem(this.rootKey),o=t?JSON.parse(t):{};return void 0!==o[e]?o[e]:null}catch(e){}},e.prototype.exists=function(e){return null!=this.get(e)},e.prototype.clear=function(){try{localStorage.removeItem(this.rootKey);}catch(e){}},e}();t.LocalStorageProvider=r;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Storage=t.StorageKey=void 0;var r=o(10),i=o(144),n=o(143);t.StorageKey="Jodit_";var a=function(){function e(e,o){this.provider=e,this.prefix=t.StorageKey,o&&(this.prefix+=o);}return e.prototype.set=function(e,t){this.provider.set(r.camelCase(this.prefix+e),t);},e.prototype.delete=function(e){this.provider.delete(r.camelCase(this.prefix+e));},e.prototype.get=function(e){return this.provider.get(r.camelCase(this.prefix+e))},e.prototype.exists=function(e){return this.provider.exists(r.camelCase(this.prefix+e))},e.prototype.clear=function(){return this.provider.clear()},e.makeStorage=function(o,r){var a;return void 0===o&&(o=!1),o&&i.canUsePersistentStorage()&&(a=new i.LocalStorageProvider(t.StorageKey+r)),a||(a=new n.MemoryStorageProvider),new e(a,r)},e}();t.Storage=a;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.makeButton=t.makeCollection=void 0;var r=o(10),i=o(147),n=o(167),a=o(168),s=o(170);t.makeCollection=function(e,t){var o=r.isJoditObject(e)?new n.ToolbarEditorCollection(e):new i.ToolbarCollection(e);return e.o.textIcons&&o.container.classList.add("jodit_text_icons"),t&&(o.parentElement=t),e.o.toolbarButtonSize&&(o.buttonSize=e.o.toolbarButtonSize),o},t.makeButton=function(e,t,o){if(void 0===o&&(o=null),r.isFunction(t.getContent))return new s.ToolbarContent(e,t,o);var i=new a.ToolbarButton(e,t,o);return i.state.tabIndex=e.o.allowTabNavigation?0:-1,i};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ToolbarCollection=void 0;var r=o(7);o(148);var i=o(10),n=o(149),a=o(146),s=o(38),l=function(e){function t(t){var o=e.call(this,t)||this;return o.listenEvents="updateToolbar changeStack mousedown mouseup keydown change afterInit readonly afterResize selectionchange changeSelection focus afterSetMode touchstart focus blur",o.update=o.j.async.debounce(o.immediateUpdate,(function(){return o.j.defaultTimeout})),o.initEvents(),o}return r.__extends(t,e),t.prototype.className=function(){return "ToolbarCollection"},Object.defineProperty(t.prototype,"firstButton",{get:function(){return this.buttons[0]||null},enumerable:!1,configurable:!0}),t.prototype.makeButton=function(e,t){return void 0===t&&(t=null),a.makeButton(this.j,e,t)},t.prototype.shouldBeActive=function(e){return !(i.isJoditObject(this.j)&&!this.j.editorIsActive)&&(i.isFunction(e.control.isActive)?e.control.isActive(this.j,e.control,e):void 0)},t.prototype.shouldBeDisabled=function(e){return !!this.j.o.disabled||!(!this.j.o.readonly||this.j.o.activeButtonsInReadOnly&&this.j.o.activeButtonsInReadOnly.includes(e.control.name))||(i.isFunction(e.control.isDisabled)&&(t=e.control.isDisabled(this.j,e.control,e)),t);var t;},t.prototype.getTarget=function(e){return e.target||null},t.prototype.immediateUpdate=function(){this.isDestructed||this.j.isLocked||(e.prototype.update.call(this),this.j.e.fire("afterUpdateToolbar"));},t.prototype.setDirection=function(e){this.container.style.direction=e,this.container.setAttribute("dir",e);},t.prototype.initEvents=function(){this.j.e.on(this.listenEvents,this.update).on("afterSetMode focus",this.immediateUpdate);},t.prototype.build=function(t,o){void 0===o&&(o=null);var r=this.j.e.fire("beforeToolbarBuild",t);return r&&(t=r),e.prototype.build.call(this,t,o),this},t.prototype.destruct=function(){this.isDestructed||(this.j.e.off(this.listenEvents,this.update).off("afterSetMode focus",this.immediateUpdate),e.prototype.destruct.call(this));},r.__decorate([s.autobind],t.prototype,"immediateUpdate",null),r.__decorate([s.component],t)}(n.UIList);t.ToolbarCollection=l;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(123),t),r.__exportStar(o(124),t),r.__exportStar(o(120),t),r.__exportStar(o(134),t),r.__exportStar(o(132),t),r.__exportStar(o(128),t),r.__exportStar(o(150),t),r.__exportStar(o(127),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(151),t),r.__exportStar(o(152),t),r.__exportStar(o(165),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.UIForm=void 0;var r=o(7),i=o(132),n=o(152),a=o(11),s=o(38),l=function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return r.__extends(t,e),t.prototype.className=function(){return "UIForm"},t.prototype.submit=function(){this.j.e.fire(this.container,"submit");},t.prototype.validate=function(){for(var e=0,t=this.allChildren.filter((function(e){return e instanceof n.UIInput}));t.length>e;e++)if(!t[e].validate())return !1;for(var o=0,r=this.allChildren.filter((function(e){return e instanceof n.UISelect}));r.length>o;o++)if(!r[o].validate())return !1;return !0},t.prototype.onSubmit=function(e){var t=this;this.j.e.on(this.container,"submit",(function(){var o=t.allChildren.filter((function(e){return e instanceof n.UIInput}));return !!t.validate()&&(e(o.reduce((function(e,t){return e[t.state.name]=t.value,e}),{})),!1)}));},t.prototype.createContainer=function(){var e=this.j.c.element("form");return e.classList.add(this.componentName),a.attr(e,"dir",this.j.o.direction||"auto"),e},r.__decorate([s.component],t)}(i.UIGroup);t.UIForm=l;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(153),t),r.__exportStar(o(159),t),r.__exportStar(o(161),t),r.__exportStar(o(163),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.UIInput=void 0;var r=o(7);o(154);var i=o(123),n=o(10),a=o(33),s=o(38),l=o(127),c=o(155),u=function(e){function t(t,i){var n=e.call(this,t,i)||this;return n.validator=new c.KeyValidator,n.label=n.j.c.span(n.getFullElName("label")),n.icon=n.j.c.span(n.getFullElName("icon")),n.clearButton=n.j.c.span(n.getFullElName("clear"),l.Icon.get("cancel")),n.state=r.__assign({},o.defaultState),n.__errorBox=n.j.c.span(n.getFullElName("error")),n.validators=new Set([]),Object.assign(n.state,i),void 0!==n.state.clearButton&&(n.j.e.on(n.clearButton,"click",(function(e){e.preventDefault(),n.nativeInput.value="",n.j.e.fire(n.nativeInput,"input"),n.focus();})).on(n.nativeInput,"input",(function(){n.state.clearButton=Boolean(n.value.length);})),n.state.clearButton=Boolean(n.value.length)),n.j.e.on(n.nativeInput,"input change",(function(){n.j.e.fire(n,"change",n.value);})).on(n.nativeInput,"keydown",(function(e){return n.validator.validateInput(e,n.nativeInput)})),n.onChangeState(),n.onChangeClassName(),n}var o;return r.__extends(t,e),o=t,t.prototype.className=function(){return "UIInput"},t.prototype.onChangeClear=function(){this.state.clearButton?a.Dom.after(this.nativeInput,this.clearButton):a.Dom.safeRemove(this.clearButton);},t.prototype.onChangeClassName=function(e,t){t&&this.container.classList.remove(t),this.state.className&&this.container.classList.add(this.state.className);},t.prototype.onChangeState=function(){var e=this,t=this.nativeInput,o=this.state,r=o.name,i=o.icon,s=o.type,u=o.ref,d=o.required,p=o.placeholder,f=o.validators,h=o.autocomplete,m=o.label;n.attr(t,"name",r),n.attr(t,"type",s),n.attr(t,"data-ref",u||r),n.attr(t,"ref",u||r),n.attr(t,"required",d||null),n.attr(t,"autocomplete",h?null:"off"),n.attr(t,"placeholder",p?this.j.i18n(p):""),i&&l.Icon.exists(i)?(a.Dom.before(t,this.icon),this.icon.innerHTML=l.Icon.get(i)):a.Dom.safeRemove(this.icon),m?(a.Dom.before(this.wrapper,this.label),this.label.innerText=this.j.i18n(m)):a.Dom.safeRemove(this.label),this.validators.clear(),d&&this.validators.add(c.inputValidators.required),null==f||f.forEach((function(t){var o=c.inputValidators[t];o&&e.validators.add(o);}));},Object.defineProperty(t.prototype,"error",{set:function(e){this.setMod("has-error",Boolean(e)),e?(this.__errorBox.innerText=this.j.i18n(e,this.j.i18n(this.state.label||"")),this.container.appendChild(this.__errorBox)):a.Dom.safeRemove(this.__errorBox);},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"value",{get:function(){return this.nativeInput.value},set:function(e){this.nativeInput.value=e,this.j.e.fire(this,"change",e);},enumerable:!1,configurable:!0}),t.prototype.validate=function(){var e=this;return this.error="",n.toArray(this.validators).every((function(t){return t(e)}))},t.prototype.createContainer=function(t){var o=e.prototype.createContainer.call(this);return this.wrapper=this.j.c.div(this.getFullElName("wrapper")),this.nativeInput||(this.nativeInput=this.j.create.element("input")),this.nativeInput.classList.add(this.getFullElName("input")),this.wrapper.appendChild(this.nativeInput),o.appendChild(this.wrapper),n.attr(this.nativeInput,"dir",this.j.o.direction||"auto"),o},t.prototype.focus=function(){this.nativeInput.focus();},Object.defineProperty(t.prototype,"isFocused",{get:function(){return this.nativeInput===this.j.od.activeElement},enumerable:!1,configurable:!0}),t.defaultState={className:"",autocomplete:!0,name:"",icon:"",label:"",ref:"",type:"text",placeholder:"",required:!1,validators:[]},r.__decorate([s.watch("state.clearButton")],t.prototype,"onChangeClear",null),r.__decorate([s.watch("state.className")],t.prototype,"onChangeClassName",null),r.__decorate([s.watch(["state.name","state.type","state.label","state.placeholder","state.autocomplete","state.icon"]),s.debounce()],t.prototype,"onChangeState",null),o=r.__decorate([s.component],t)}(i.UIElement);t.UIInput=u;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.selectValidators=t.inputValidators=void 0;var r=o(7);t.inputValidators=o(156),t.selectValidators=o(157),r.__exportStar(o(158),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.url=t.required=void 0;var r=o(10);t.required=function(e){return !!r.trim(e.value).length||(e.error="Please fill out this field",!1)},t.url=function(e){return !!r.isURL(r.trim(e.value))||(e.error="Please enter a web address",!1)};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.required=void 0;var r=o(10);t.required=function(e){return !!r.trim(e.value).length||(e.error="Please fill out this field",!1)};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.KeyValidator=void 0;var r=o(9),i=function(){function e(){this.enterValidators=[];}return e.prototype.addInputValidator=function(e){return this.enterValidators.push(e),this},e.prototype.validateInput=function(e,t){var o,i,n=this;if(!this.enterValidators.length||[r.KEY_UP,r.KEY_DOWN,r.KEY_LEFT,r.KEY_RIGHT].includes(e.key))return !0;var a=t.value,s=e.key,l=null!==(o=t.selectionStart)&&void 0!==o?o:0,c=null!==(i=t.selectionEnd)&&void 0!==i?i:0,u=function(e){return n.enterValidators.every((function(t){return t(e,l,c)}))};return !!u(this.calculateValue(s,a,l,c))||!(l!==c||!u(this.calculateValue(s,a,l,c+1)))&&(t.selectionEnd=c+1,!0)},e.prototype.calculateValue=function(e,t,o,i){var n=o===i?1:0;if(1===e.length)return t.substr(0,o)+e+t.substr(i);switch(e){case r.KEY_BACKSPACE:return t.substr(0,o-n)+t.substr(i);case r.KEY_DELETE:return t.substr(0,o)+t.substr(i+n)}return t},e}();t.KeyValidator=i;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.UITextArea=void 0;var r=o(7);o(160);var i=o(153),n=o(38),a=function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return r.__extends(t,e),t.prototype.className=function(){return "UITextArea"},t.prototype.createContainer=function(t){return this.nativeInput=this.j.create.element("textarea"),e.prototype.createContainer.call(this,t)},r.__decorate([n.component],t)}(i.UIInput);t.UITextArea=a;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.UICheckbox=void 0;var r=o(7);o(162);var i=o(153),n=o(38),a=function(e){function t(t,o){return e.call(this,t,r.__assign(r.__assign({},o),{type:"checkbox"}))||this}return r.__extends(t,e),t.prototype.className=function(){return "UICheckbox"},t.prototype.makeContainer=function(e){return this.j.c.element("label",{className:this.componentName})},r.__decorate([n.component],t)}(i.UIInput);t.UICheckbox=a;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.UISelect=void 0;var r=o(7);o(164);var i=o(123),n=o(10),a=o(33),s=o(155),l=o(38),c=function(e){function t(t,o){var r,i=e.call(this,t,o)||this;return i.options=o,i.__errorBox=i.j.c.span(i.getFullElName("error")),i.validators=[],i.options.required&&i.validators.push(s.selectValidators.required),null===(r=o.validators)||void 0===r||r.forEach((function(e){var t=s.selectValidators[e];t&&i.validators.push(t);})),i}return r.__extends(t,e),t.prototype.className=function(){return "UISelect"},Object.defineProperty(t.prototype,"error",{set:function(e){this.setMod("has-error",Boolean(e)),e?(this.__errorBox.innerText=this.j.i18n(e,this.j.i18n(this.options.label||"")),this.container.appendChild(this.__errorBox)):a.Dom.safeRemove(this.__errorBox);},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"value",{get:function(){return this.nativeInput.value},enumerable:!1,configurable:!0}),t.prototype.validate=function(){var e=this;return this.error="",this.validators.every((function(t){return t(e)}))},t.prototype.createContainer=function(t){var o=this,r=e.prototype.createContainer.call(this);if(this.nativeInput||(this.nativeInput=this.j.create.element("select")),this.nativeInput.classList.add(this.getFullElName("select")),t.label){var i=this.j.c.span(this.getFullElName("label"));r.appendChild(i),i.innerText=this.j.i18n(t.label);}if(void 0!==t.placeholder){var a=this.j.create.element("option");a.value="",a.text=t.placeholder,this.nativeInput.add(a);}return t.options.forEach((function(e){var t=o.j.create.element("option");t.value=e.value,t.text=e.text,o.nativeInput.add(t);})),r.appendChild(this.nativeInput),n.attr(this.nativeInput,"name",t.name),n.attr(this.nativeInput,"dir",this.j.o.direction||"auto"),n.attr(this.nativeInput,"data-ref",t.ref||t.name),n.attr(this.nativeInput,"ref",t.ref||t.name),t.size&&t.size>0&&n.attr(this.nativeInput,"size",t.size),t.multiple&&n.attr(this.nativeInput,"multiple",""),r},t.prototype.focus=function(){this.nativeInput.focus();},r.__decorate([l.component],t)}(i.UIElement);t.UISelect=c;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.UIBlock=void 0;var r=o(7);o(166);var i=o(132),n=o(11),a=o(38),s=function(e){function t(t,o,r){void 0===r&&(r={align:"left"});var i=e.call(this,t,o)||this;return i.options=r,i.setMod("align",i.options.align||"left"),i.setMod("width",i.options.width||""),n.attr(i.container,"data-ref",r.ref),n.attr(i.container,"ref",r.ref),i}return r.__extends(t,e),t.prototype.className=function(){return "UIBlock"},r.__decorate([a.component],t)}(i.UIGroup);t.UIBlock=s;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ToolbarEditorCollection=void 0;var r=o(7),i=o(147),n=o(9),a=o(33),s=o(10),l=o(38),c=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.checkActiveStatus=function(e,o){var r=0,i=0;return Object.keys(e).forEach((function(n){var a=e[n];s.isFunction(a)?a(t.j,s.css(o,n).toString())&&(r+=1):-1!==a.indexOf(s.css(o,n).toString())&&(r+=1),i+=1;})),i===r},t}return r.__extends(t,e),t.prototype.className=function(){return "ToolbarEditorCollection"},t.prototype.shouldBeDisabled=function(t){var o=e.prototype.shouldBeDisabled.call(this,t);if(void 0!==o)return o;var r=void 0===t.control.mode?n.MODE_WYSIWYG:t.control.mode;return !(r===n.MODE_SPLIT||r===this.j.getRealMode())},t.prototype.shouldBeActive=function(t){var o=this,r=e.prototype.shouldBeActive.call(this,t);if(void 0!==r)return r;var i=this.j.selection?this.j.s.current():null;if(!i)return !1;if(t.control.tags){var n=t.control.tags;if(a.Dom.up(i,(function(e){if(e&&-1!==n.indexOf(e.nodeName.toLowerCase()))return !0}),this.j.editor))return !0}if(t.control.css){var s=t.control.css;if(a.Dom.up(i,(function(e){if(e&&!a.Dom.isText(e))return o.checkActiveStatus(s,e)}),this.j.editor))return !0}return !1},t.prototype.getTarget=function(e){return e.target||this.j.s.current()||null},r.__decorate([l.component],t)}(i.ToolbarCollection);t.ToolbarEditorCollection=c;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ToolbarButton=void 0;var r=o(7);o(169);var i=o(124),n=o(38),a=o(33),s=o(120),l=o(146),c=o(10),u=o(149),d=o(147),p=o(42),f=o(131),h=function(e){function t(t,o,n){void 0===n&&(n=null);var a=e.call(this,t)||this;return a.control=o,a.target=n,a.state=r.__assign(r.__assign({},i.UIButtonState()),{theme:"toolbar",currentValue:"",hasTrigger:!1}),t.e.on([a.button,a.trigger],"mousedown",(function(e){return e.preventDefault()})),a.onAction(a.onClick),a.hookStatus(p.STATUSES.ready,(function(){a.initFromControl(),a.initTooltip(),a.update();})),a}return r.__extends(t,e),t.prototype.className=function(){return "ToolbarButton"},Object.defineProperty(t.prototype,"toolbar",{get:function(){return this.closest(d.ToolbarCollection)},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"button",{get:function(){return this.container.querySelector("button."+this.componentName+"__button")},enumerable:!1,configurable:!0}),t.prototype.update=function(){var t=this.control,o=this.state,r=this.closest(d.ToolbarCollection);r&&(o.disabled=Boolean(r.shouldBeDisabled(this)),o.activated=Boolean(r.shouldBeActive(this))),c.isFunction(t.update)&&t.update(this),e.prototype.update.call(this);},t.prototype.onChangeActivated=function(){c.attr(this.button,"aria-pressed",this.state.activated),e.prototype.onChangeActivated.call(this);},t.prototype.onChangeText=function(){c.isFunction(this.control.template)?this.text.innerHTML=this.control.template(this.j,this.control.name,this.j.i18n(this.state.text)):e.prototype.onChangeText.call(this),this.setMod("text-icons",Boolean(this.text.innerText.trim().length));},t.prototype.onChangeTabIndex=function(){c.attr(this.button,"tabIndex",this.state.tabIndex);},t.prototype.createContainer=function(){var t=this.componentName,o=this.j.c.span(t),r=e.prototype.createContainer.call(this);return c.attr(o,"role","listitem"),r.classList.remove(t),r.classList.add(t+"__button"),Object.defineProperty(r,"component",{value:this}),o.appendChild(r),this.trigger=this.j.c.fromHTML('<span role="trigger" class="'+t+'__trigger">'+u.Icon.get("chevron")+"</span>"),this.j.e.on(this.trigger,"click",this.onTriggerClick.bind(this)),o},t.prototype.focus=function(){var e;null===(e=this.container.querySelector("button"))||void 0===e||e.focus();},t.prototype.onChangeHasTrigger=function(){this.state.hasTrigger?this.container.appendChild(this.trigger):a.Dom.safeRemove(this.trigger),this.setMod("with-trigger",this.state.hasTrigger||null);},t.prototype.onChangeDisabled=function(){var e=this.state.disabled?"disabled":null;c.attr(this.trigger,"disabled",e),c.attr(this.button,"disabled",e),c.attr(this.container,"disabled",e);},t.prototype.initTooltip=function(){var e=this;this.j.o.textIcons||!this.j.o.showTooltip||this.j.o.useNativeTooltip||this.j.e.off(this.container,"mouseenter mouseleave").on(this.container,"mousemove",(function(t){e.state.tooltip&&!e.state.disabled&&e.j.e.fire("delayShowTooltip",(function(){return {x:t.clientX+10,y:t.clientY+10}}),e.state.tooltip);})).on(this.container,"mouseleave",(function(){e.j.e.fire("hideTooltip");}));},t.prototype.initFromControl=function(){var e,t=this.control,o=this.state;this.updateSize(),o.name=t.name;var r=this.j.o.textIcons;if(!0===r||c.isFunction(r)&&r(t.name)||t.template)o.icon=i.UIButtonState().icon,o.text=t.text||t.name;else {if(t.iconURL)o.icon.iconURL=t.iconURL;else {var n=t.icon||t.name;o.icon.name=u.Icon.exists(n)||(null===(e=this.j.o.extraIcons)||void 0===e?void 0:e[n])?n:"";}t.iconURL||o.icon.name||(o.text=t.text||t.name);}t.tooltip&&(o.tooltip=this.j.i18n(t.tooltip)),o.hasTrigger=Boolean(t.list||t.popup&&t.exec);},t.prototype.onTriggerClick=function(e){var t,o,r,i=this,n=this.control;if(e.buffer={actionTrigger:this},n.list)return this.openControlList(n);if(c.isFunction(n.popup)){var a=new s.Popup(this.j);if(a.parentElement=this,!1!==this.j.e.fire(c.camelCase("before-"+n.name+"-open-popup"),this.target,n,a)){var l=null!==(r=null!==(o=null===(t=this.toolbar)||void 0===t?void 0:t.getTarget(this))&&void 0!==o?o:this.target)&&void 0!==r?r:null,u=n.popup(this.j,l,n,a.close,this);u&&a.setContent(c.isString(u)?this.j.c.fromHTML(u):u).open((function(){return c.position(i.container)}));}this.j.e.fire(c.camelCase("after-"+n.name+"-open-popup"),a.container);}},t.prototype.openControlList=function(e){var t,o=this,i=null!==(t=this.jodit.options.controls)&&void 0!==t?t:{},n=function(e){return f.findControlType(e,i)},a=e.list,u=new s.Popup(this.j),d=l.makeCollection(this.j);u.parentElement=this,d.parentElement=u,d.mode="vertical";var p=function(t,o){if(c.isString(o)&&n(o))return r.__assign({name:o.toString()},n(o));if(c.isString(t)&&n(t))return r.__assign(r.__assign({name:t.toString()},n(t)),"object"==typeof o?o:{});var i={name:t.toString(),template:e.childTemplate,exec:e.exec,data:e.data,command:e.command,isActive:e.isChildActive,isDisabled:e.isChildDisabled,mode:e.mode,args:r.__spreadArrays(e.args?e.args:[],[t,o])};return c.isString(o)&&(i.text=o),i};d.build(c.isArray(a)?a.map(p):Object.keys(a).map((function(e){return p(e,a[e])})),this.target),u.setContent(d.container).open((function(){return c.position(o.container)})),this.state.activated=!0,this.j.e.on(u,"afterClose",(function(){o.state.activated=!1;}));},t.prototype.onClick=function(e){var t,o,r,i,n,a,s,l=this.control;if(c.isFunction(l.exec)){var u=null!==(r=null!==(o=null===(t=this.toolbar)||void 0===t?void 0:t.getTarget(this))&&void 0!==o?o:this.target)&&void 0!==r?r:null;if(!1!==l.exec(this.j,u,{control:l,originalEvent:e,button:this}))return null===(n=null===(i=this.j)||void 0===i?void 0:i.e)||void 0===n||n.fire("synchro"),this.parentElement&&this.parentElement.update(),void(null===(s=null===(a=this.j)||void 0===a?void 0:a.e)||void 0===s||s.fire("closeAllPopups afterExec"))}return l.list?this.openControlList(l):c.isFunction(l.popup)?this.onTriggerClick(e):void((l.command||l.name)&&(c.call(c.isJoditObject(this.j)?this.j.execCommand.bind(this.j):this.j.od.execCommand.bind(this.j.od),l.command||l.name,!1,l.args&&l.args[0]),this.j.e.fire("closeAllPopups")))},r.__decorate([n.watch("state.hasTrigger")],t.prototype,"onChangeHasTrigger",null),r.__decorate([n.component],t)}(i.UIButton);t.ToolbarButton=h;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ToolbarContent=void 0;var r=o(7);o(171);var i=o(124),n=o(33),a=o(10),s=o(38),l=function(e){function t(t,o,r){void 0===r&&(r=null);var i=e.call(this,t)||this;return i.control=o,i.target=r,i.container.classList.add(i.componentName+"_"+i.clearName(o.name)),a.attr(i.container,"role","content"),i}return r.__extends(t,e),t.prototype.className=function(){return "ToolbarContent"},t.prototype.update=function(){var t=this.control.getContent(this.j,this.control,this);(a.isString(t)||t.parentNode!==this.container)&&(n.Dom.detach(this.container),this.container.appendChild(a.isString(t)?this.j.create.fromHTML(t):t)),e.prototype.update.call(this);},t.prototype.createContainer=function(){return this.j.c.span(this.componentName)},r.__decorate([s.component],t)}(i.UIButton);t.ToolbarContent=l;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Alert=void 0;var r=o(137),i=o(10),n=o(33),a=o(149);t.Alert=function(e,t,o,s){void 0===s&&(s="jodit-dialog_alert"),i.isFunction(t)&&(o=t,t=void 0);var l=new r.Dialog,c=l.c.div(s),u=a.Button(l,"ok","Ok");return i.asArray(e).forEach((function(e){c.appendChild(n.Dom.isNode(e,l.ow)?e:l.c.fromHTML(e));})),u.onAction((function(){o&&i.isFunction(o)&&!1===o(l)||l.close();})),l.setFooter([u]),l.open(c,t||"&nbsp;",!0,!0),u.focus(),l};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Prompt=void 0;var r=o(137),i=o(149),n=o(10);t.Prompt=function(e,t,o,a,s){var l=new r.Dialog,c=i.Button(l,"cancel","Cancel"),u=i.Button(l,"ok","Ok"),d=l.c.element("form",{class:"jodit-dialog_prompt"}),p=l.c.element("input",{autofocus:!0,class:"jodit-input"}),f=l.c.element("label");n.isFunction(t)&&(o=t,t=void 0),a&&n.attr(p,"placeholder",a),f.appendChild(l.c.text(e)),d.appendChild(f),d.appendChild(p),c.onAction(l.close);var h=function(){o&&n.isFunction(o)&&!1===o(p.value)||l.close();};return u.onAction(h),l.e.on(d,"submit",(function(){return h(),!1})),l.setFooter([u,c]),l.open(d,t||"&nbsp;",!0,!0),p.focus(),void 0!==s&&s.length&&(p.value=s,p.select()),l};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Confirm=void 0;var r=o(137),i=o(10),n=o(149);t.Confirm=function(e,t,o){var a=new r.Dialog,s=a.c.fromHTML('<form class="jodit-dialog_prompt"></form>'),l=a.c.element("label");i.isFunction(t)&&(o=t,t=void 0),l.appendChild(a.c.fromHTML(e)),s.appendChild(l);var c=n.Button(a,"cancel","Cancel");c.onAction((function(){o&&o(!1),a.close();}));var u=function(){o&&o(!0),a.close();},d=n.Button(a,"ok","Yes");return d.onAction(u),a.e.on(s,"submit",(function(){return u(),!1})),a.setFooter([d,c]),a.open(s,t||"&nbsp;",!0,!0),d.focus(),a};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Plugin=void 0;var r=o(7),i=o(42),n=o(38),a=function(e){function t(t){var o=e.call(this,t)||this;return o.buttons=[],t.e.on("afterPluginSystemInit",(function(){var e;null===(e=o.buttons)||void 0===e||e.forEach((function(e){t.registerButton(e);}));})).on("afterInit",(function(){o.setStatus(i.STATUSES.ready),o.afterInit(t);})).on("beforeDestruct",o.destruct),o}return r.__extends(t,e),t.prototype.className=function(){return ""},t.prototype.init=function(e){},t.prototype.destruct=function(){var t,o,r,n=this;this.isInDestruct||(this.setStatus(i.STATUSES.beforeDestruct),null===(t=this.buttons)||void 0===t||t.forEach((function(e){var t;null===(t=n.j)||void 0===t||t.unregisterButton(e);})),null===(r=null===(o=this.j)||void 0===o?void 0:o.events)||void 0===r||r.off("beforeDestruct",this.destruct),this.beforeDestruct(this.j),e.prototype.destruct.call(this));},r.__decorate([n.autobind],t.prototype,"destruct",null),t}(i.ViewComponent);t.Plugin=a;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Create=void 0;var r=o(10),i=o(33),n=o(9),a=function(){function e(e,t){this.document=e,this.createAttributes=t,this.applyAttributes=function(e,t){r.each(t,(function(t,o){r.isPlainObject(o)&&"style"===t?r.css(e,o):("className"===t&&(t="class"),e.setAttribute(r.kebabCase(t),o.toString()));}));};}return Object.defineProperty(e.prototype,"doc",{get:function(){return r.isFunction(this.document)?this.document():this.document},enumerable:!1,configurable:!0}),e.prototype.element=function(e,t,o){var i=this,n=this.doc.createElement(e.toLowerCase());return this.applyCreateAttributes(n),t&&(r.isPlainObject(t)?this.applyAttributes(n,t):o=t),o&&r.asArray(o).forEach((function(e){return n.appendChild("string"==typeof e?i.fromHTML(e):e)})),n},e.prototype.div=function(e,t,o){var r=this.element("div",t,o);return e&&(r.className=e),r},e.prototype.span=function(e,t,o){var r=this.element("span",t,o);return e&&(r.className=e),r},e.prototype.a=function(e,t,o){var r=this.element("a",t,o);return e&&(r.className=e),r},e.prototype.text=function(e){return this.doc.createTextNode(e)},e.prototype.fake=function(){return this.text(n.INVISIBLE_SPACE)},e.prototype.fragment=function(){return this.doc.createDocumentFragment()},e.prototype.fromHTML=function(e,t){var o=this.div();o.innerHTML=e.toString();var n=o.firstChild===o.lastChild&&o.firstChild?o.firstChild:o;if(i.Dom.safeRemove(n),t){var a=r.refs(n);Object.keys(t).forEach((function(e){var o=a[e];o&&!1===t[e]&&i.Dom.hide(o);}));}return n},e.prototype.applyCreateAttributes=function(e){if(this.createAttributes){var t=this.createAttributes;if(t&&t[e.tagName.toLowerCase()]){var o=t[e.tagName.toLowerCase()];r.isFunction(o)?o(e):r.isPlainObject(o)&&this.applyAttributes(e,o);}}},e}();t.Create=a;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.FileBrowser=void 0;var r=o(7);o(178);var i=o(8),n=o(9),a=o(136),s=o(142),l=o(10),c=o(139);o(179);var u=o(33),d=o(34),p=o(181),f=o(180),h=o(182),m=o(184),v=o(185),g=o(187),y=o(183),b=o(38),_=function(e){function t(t){var o=e.call(this,t)||this;o.loader=o.c.div(f.F_CLASS+"__loader",f.ICON_LOADER),o.browser=o.c.div(f.F_CLASS+" non-selected"),o.status_line=o.c.div(f.F_CLASS+"__status"),o.tree=o.c.div(f.F_CLASS+"__tree"),o.files=o.c.div(f.F_CLASS+"__files"),o.state=d.ObserveObject.create({currentPath:"",currentSource:y.DEFAULT_SOURCE_NAME,currentBaseUrl:"",activeElements:[],elements:[],sources:{},view:"tiles",sortBy:"changed-desc",filterWord:"",onlyImages:!1}),o.errorHandler=function(e){e instanceof Error?o.status(o.i18n(e.message)):o.status(o.o.getMessage(e));},o.close=function(){o.dialog.close();},o.openImageEditor=function(e,t,r,i,n,a){return o.getInstance("ImageEditor",o.o).open(e,(function(e,s,c,u){("resize"===s.action?o.dataProvider.resize(r,i,t,e,s.box):o.dataProvider.crop(r,i,t,e,s.box)).then((function(e){o.o.isSuccess(e)?o.loadTree().then((function(){c(),n&&n();})):(u(l.error(o.o.getMessage(e))),a&&a(l.error(o.o.getMessage(e))));})).catch((function(e){u(e),a&&a(e);}));}))},o.elementsMap={};var r=o;r.options=new i.OptionsDefault(l.extend(!0,{},r.options,i.Config.defaultOptions.filebrowser,t)),r.storage=s.Storage.makeStorage(o.o.filebrowser.saveStateInStorage),r.dataProvider=h.makeDataProvider(r,r.options),r.dialog=new a.Dialog({fullsize:r.o.fullsize,theme:r.o.theme,globalFullSize:r.o.globalFullSize,language:o.o.language,minWidth:Math.min(700,screen.width),minHeight:300,buttons:["fullsize","dialog.close"]}),r.o.showFoldersPanel&&r.browser.appendChild(r.tree),r.browser.appendChild(r.files),r.browser.appendChild(r.status_line),g.selfListeners.call(r),v.nativeListeners.call(r),m.stateListeners.call(r),r.dialog.setSize(r.o.width,r.o.height),["getLocalFileByUrl","crop","resize","create","fileMove","folderMove","fileRename","folderRename","fileRemove","folderRemove","folder","items","permissions"].forEach((function(e){null!=o.options[e]&&(o.options[e]=l.extend(!0,{},o.o.ajax,o.options[e]));}));var n=o.storage.get(f.F_CLASS+"_view");r.state.view=n&&null==o.o.view?"list"===n?"list":"tiles":"list"===r.o.view?"list":"tiles",o.state.fire("change.view");var c=r.storage.get(f.F_CLASS+"_sortby");if(c){var u=c.split("-");r.state.sortBy=["changed","name","size"].includes(u[0])?c:"changed-desc";}else r.state.sortBy=r.o.sortBy||"changed-desc";return r.initUploader(r),o}return r.__extends(t,e),t.prototype.className=function(){return "FileBrowser"},t.prototype.loadItems=function(){return r.__awaiter(this,void 0,Promise,(function(){var e=this;return r.__generator(this,(function(t){return this.files.classList.add("jodit-filebrowser_active"),this.files.appendChild(this.loader.cloneNode(!0)),[2,this.dataProvider.items(this.state.currentPath,this.state.currentSource).then((function(t){var o=e.o.items.process;if(o||(o=e.o.ajax.process),o){var r=o.call(self,t);e.generateItemsList(r.data.sources),e.state.activeElements=[];}})).catch((function(t){a.Alert(t.message).bindDestruct(e),e.errorHandler(t);}))]}))}))},t.prototype.loadTree=function(){return r.__awaiter(this,void 0,Promise,(function(){var e,t,o,i=this;return r.__generator(this,(function(r){return e=function(e){throw e instanceof Error?e:l.error(e)},this.uploader&&(this.uploader.setPath(this.state.currentPath),this.uploader.setSource(this.state.currentSource)),this.tree.classList.add("jodit-filebrowser_active"),u.Dom.detach(this.tree),this.tree.appendChild(this.loader.cloneNode(!0)),t=this.loadItems(),this.o.showFoldersPanel?(o=this.dataProvider.tree(this.state.currentPath,this.state.currentSource).then((function(e){var t=i.o.folder.process;if(t||(t=i.o.ajax.process),t){var o=t.call(self,e);i.state.sources=o.data.sources;}})).catch((function(t){i.errorHandler(e(i.i18n("Error on load folders"))),e(t);})),[2,Promise.all([o,t]).catch(l.error)]):(this.tree.classList.remove("jodit-filebrowser_active"),[2,t.catch(l.error)])}))}))},t.prototype.deleteFile=function(e,t){return r.__awaiter(this,void 0,Promise,(function(){var o=this;return r.__generator(this,(function(r){return [2,this.dataProvider.fileRemove(this.state.currentPath,e,t).then((function(t){if(o.o.remove&&o.o.remove.process&&(t=o.o.remove.process.call(o,t)),!o.o.isSuccess(t))throw l.error(o.o.getMessage(t));o.status(o.o.getMessage(t)||o.i18n('File "%s" was deleted',e),!0);})).catch(this.status)]}))}))},t.prototype.generateItemsList=function(e){var t=this,o=[],i=this.state;l.each(e,(function(e,n){n.files&&n.files.length&&("function"==typeof t.o.sort&&n.files.sort((function(e,o){return t.o.sort(e,o,i.sortBy)})),n.files.forEach((function(a){(function(e){return !i.filterWord.length||void 0===t.o.filter||t.o.filter(e,i.filterWord)})(a)&&function(e){return !t.state.onlyImages||void 0===e.isImage||e.isImage}(a)&&o.push(p.FileBrowserItem.create(r.__assign(r.__assign({},a),{sourceName:e,source:n})));})));})),this.state.elements=o;},t.prototype.onSelect=function(e){var t=this;return function(){if(t.state.activeElements.length){var o=[],r=[];t.state.activeElements.forEach((function(e){var t=e.fileURL;t&&(o.push(t),r.push(e.isImage||!1));})),t.close();var i={baseurl:"",files:o,isImages:r};l.isFunction(e)&&e(i),t.close();}return !1}},t.prototype.isOpened=function(){return this.dialog.isOpened&&"none"!==this.browser.style.display},t.prototype.status=function(e,t){var o=this;l.isString(e)||(e=e.message),this.status_line.classList.remove("jodit-filebrowser_success"),this.status_line.classList.add("jodit-filebrowser_active");var r=this.c.div();r.textContent=e,this.status_line.appendChild(r),t&&this.status_line.classList.add("jodit-filebrowser_success"),this.async.setTimeout((function(){o.status_line.classList.remove("jodit-filebrowser_active"),u.Dom.detach(o.status_line);}),{timeout:this.o.howLongShowMsg,label:"fileBrowser.status"});},t.prototype.open=function(e,t){var o=this;return void 0===e&&(e=this.o.defaultCallback),void 0===t&&(t=!1),this.state.onlyImages=t,this.async.promise((function(t,r){if(!o.o.items||!o.o.items.url)throw l.error("Need set options.filebrowser.ajax.url");var i=0;o.e.off(o.files,"dblclick").on(o.files,"dblclick",o.onSelect(e)).on(o.files,"touchstart",(function(){var t=(new Date).getTime();n.EMULATE_DBLCLICK_TIMEOUT>t-i&&o.onSelect(e)(),i=t;})).off("select.filebrowser").on("select.filebrowser",o.onSelect(e));var a=o.c.div();o.toolbar.build(o.o.buttons).appendTo(a),o.dialog.open(o.browser,a),o.e.fire("sort.filebrowser",o.state.sortBy),o.loadTree().then(t,r);}))},t.prototype.initUploader=function(e){var t,o=this,n=this,a=l.extend(!0,{},i.Config.defaultOptions.uploader,n.o.uploader,r.__assign({},null===(t=null==e?void 0:e.options)||void 0===t?void 0:t.uploader)),s=function(){return o.loadItems()};n.uploader=n.getInstance("Uploader",a),n.uploader.setPath(n.state.currentPath),n.uploader.setSource(n.state.currentSource),n.uploader.bind(n.browser,s,n.errorHandler),n.e.on("bindUploader.filebrowser",(function(e){n.uploader.bind(e,s,n.errorHandler);}));},t.prototype.destruct=function(){this.isInDestruct||(this.dialog.destruct(),this.events&&this.e.off(".filebrowser"),this.uploader&&this.uploader.destruct(),e.prototype.destruct.call(this));},r.__decorate([b.autobind],t.prototype,"status",null),r.__decorate([b.autobind],t.prototype,"open",null),t}(c.ViewWithToolbar);t.FileBrowser=_;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(8),i=o(10),n=o(180),a=o(149);r.Config.prototype.filebrowser={extraButtons:[],filter:function(e,t){return t=t.toLowerCase(),i.isString(e)?-1!==e.toLowerCase().indexOf(t):i.isString(e.name)?-1!==e.name.toLowerCase().indexOf(t):!i.isString(e.file)||-1!==e.file.toLowerCase().indexOf(t)},sortBy:"changed-desc",sort:function(e,t,o){var r=o.toLowerCase().split("-"),n=r[0],a="asc"===r[1],s=function(e,t){return t>e?a?-1:1:e>t?a?1:-1:0};if(i.isString(e))return s(e.toLowerCase(),t.toLowerCase());if(void 0===e[n]||"name"===n)return i.isString(e.name)?s(e.name.toLowerCase(),t.name.toLowerCase()):i.isString(e.file)?s(e.file.toLowerCase(),t.file.toLowerCase()):0;switch(n){case"changed":var l=new Date(e.changed).getTime(),c=new Date(t.changed).getTime();return a?l-c:c-l;case"size":return l=i.humanSizeToBytes(e.size),c=i.humanSizeToBytes(t.size),a?l-c:c-l}return 0},editImage:!0,preview:!0,showPreviewNavigation:!0,showSelectButtonInPreview:!0,contextMenu:!0,howLongShowMsg:3e3,createNewFolder:!0,deleteFolder:!0,renameFolder:!0,moveFolder:!0,moveFile:!0,showFoldersPanel:!0,width:859,height:400,buttons:["filebrowser.upload","filebrowser.remove","filebrowser.update","filebrowser.select","filebrowser.edit","|","filebrowser.tiles","filebrowser.list","|","filebrowser.filter","|","filebrowser.sort"],removeButtons:[],fullsize:!1,showTooltip:!0,view:null,isSuccess:function(e){return e.success},getMessage:function(e){return void 0!==e.data.messages&&i.isArray(e.data.messages)?e.data.messages.join(" "):""},showFileName:!0,showFileSize:!0,showFileChangeTime:!0,saveStateInStorage:!0,getThumbTemplate:function(e,t,o){var r=this.options,i=r.showFileName,a=r.showFileSize&&e.size,s=r.showFileChangeTime&&e.time,l="";return void 0!==e.file&&(l=e.file),'<a\n\t\t\tdata-jodit-filebrowser-item="true"\n\t\t\tdata-is-file="'+(e.isImage?0:1)+'"\n\t\t\tdraggable="true"\n\t\t\tclass="'+n.ITEM_CLASS+'"\n\t\t\thref="'+e.fileURL+'"\n\t\t\tdata-source="'+o+'"\n\t\t\tdata-path="'+e.path+'"\n\t\t\tdata-name="'+l+'"\n\t\t\ttitle="'+l+'"\n\t\t\tdata-url="'+e.fileURL+'">\n\t\t\t\t<img\n\t\t\t\t\tdata-is-file="'+(e.isImage?0:1)+'"\n\t\t\t\t\tdata-src="'+e.fileURL+'"\n\t\t\t\t\tsrc="'+e.imageURL+'"\n\t\t\t\t\talt="'+l+'"\n\t\t\t\t\tloading="lazy"\n\t\t\t\t/>\n\t\t\t\t'+(i||a||s?'<div class="'+n.ITEM_CLASS+'-info">'+(i?'<span class="'+n.ITEM_CLASS+'-info-filename">'+l+"</span>":"")+(a?'<span class="'+n.ITEM_CLASS+'-info-filesize">'+e.size+"</span>":"")+(s?'<span class="'+n.ITEM_CLASS+'-info-filechanged">'+s+"</span>":"")+"</div>":"")+"\n\t\t\t</a>"},ajax:{url:"",async:!0,data:{},cache:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",method:"POST",processData:!0,dataType:"json",headers:{},prepareData:function(e){return e},process:function(e){return e}},create:{data:{action:"folderCreate"}},getLocalFileByUrl:{data:{action:"getLocalFileByUrl"}},resize:{data:{action:"imageResize"}},crop:{data:{action:"imageCrop"}},fileMove:{data:{action:"fileMove"}},folderMove:{data:{action:"folderMove"}},fileRename:{data:{action:"fileRename"}},folderRename:{data:{action:"folderRename"}},fileRemove:{data:{action:"fileRemove"}},folderRemove:{data:{action:"folderRemove"}},items:{data:{action:"files"}},folder:{data:{action:"folders"}},permissions:{data:{action:"permissions"}}},r.Config.prototype.controls.filebrowser={upload:{icon:"plus",isInput:!0,isDisabled:function(e){return !e.dataProvider.canI("FileUpload")},getContent:function(e,t){var o=e.c.fromHTML('<span class="jodit-ui-button jodit__upload-button">\n\t\t\t\t\t\t'+a.Icon.get("plus")+'\n\t\t\t\t\t\t<input\n\t\t\t\t\t\t\ttype="file"\n\t\t\t\t\t\t\taccept="'+(e.state.onlyImages?"image/*":"*")+'"\n\t\t\t\t\t\t\ttabindex="-1"\n\t\t\t\t\t\t\tdir="auto"\n\t\t\t\t\t\t\tmultiple=""\n\t\t\t\t\t\t\t'+(t.isDisabled&&t.isDisabled(e,t)?'disabled="disabled"':"")+"\n\t\t\t\t\t\t/>\n\t\t\t\t\t\t</span>");return e.e.fire("bindUploader.filebrowser",o),o}},remove:{icon:"bin",isDisabled:function(e){return !e.state.activeElements.length||!e.dataProvider.canI("FileRemove")},exec:function(e){e.e.fire("fileRemove.filebrowser");}},update:{exec:function(e){e.e.fire("update.filebrowser");}},select:{icon:"check",isDisabled:function(e){return !e.state.activeElements.length},exec:function(e){e.e.fire("select.filebrowser");}},edit:{icon:"pencil",isDisabled:function(e){var t=e.state.activeElements;return 1!==t.length||!t[0].isImage||!(e.dataProvider.canI("ImageCrop")||e.dataProvider.canI("ImageResize"))},exec:function(e){e.e.fire("edit.filebrowser");}},tiles:{icon:"th",isActive:function(e){return "tiles"===e.state.view},exec:function(e){e.e.fire("view.filebrowser","tiles");}},list:{icon:"th-list",isActive:function(e){return "list"===e.state.view},exec:function(e){e.e.fire("view.filebrowser","list");}},filter:{isInput:!0,getContent:function(e,t,o){var r=o.container.querySelector(".jodit-input");if(r)return r;var i=e.c.element("input",{class:"jodit-input",placeholder:e.i18n("Filter")});return i.value=e.state.filterWord,e.e.on(i,"keydown mousedown",e.async.debounce((function(){e.e.fire("filter.filebrowser",i.value);}),e.defaultTimeout)),i}},sort:{isInput:!0,getContent:function(e){var t=e.c.fromHTML('<select class="jodit-input jodit-select"><option value="changed-asc">'+e.i18n("Sort by changed")+' (⬆)</option><option value="changed-desc">'+e.i18n("Sort by changed")+' (⬇)</option><option value="name-asc">'+e.i18n("Sort by name")+' (⬆)</option><option value="name-desc">'+e.i18n("Sort by name")+' (⬇)</option><option value="size-asc">'+e.i18n("Sort by size")+' (⬆)</option><option value="size-desc">'+e.i18n("Sort by size")+" (⬇)</option></select>");return t.value=e.state.sortBy,e.e.on("sort.filebrowser",(function(e){t.value!==e&&(t.value=e);})).on(t,"change",(function(){e.e.fire("sort.filebrowser",t.value);})),t}}};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ICON_LOADER=t.ITEM_CLASS=t.F_CLASS=void 0,t.F_CLASS="jodit-filebrowser",t.ITEM_CLASS=t.F_CLASS+"__files-item",t.ICON_LOADER='<i class="jodit-icon_loader"></i>';},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.FileBrowserItem=void 0;var r=o(10),i=function(){function e(e){this.data=e,r.extend(this,e);}return e.create=function(t){return new e(t)},Object.defineProperty(e.prototype,"path",{get:function(){return r.normalizePath(this.data.source.path?this.data.source.path+"/":"/")},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"imageURL",{get:function(){var e=(new Date).getTime().toString(),t=this.data,o=t.source,i=t.thumb||t.file;return t.thumbIsAbsolute&&i?i:r.normalizeUrl(o.baseurl,o.path,i||"")+"?_tmst="+e},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"fileURL",{get:function(){var e=this.data.name,t=this.data,o=t.file,i=t.source;return void 0!==o&&(e=o),t.fileIsAbsolute&&e?e:r.normalizeUrl(i.baseurl,i.path,e||"")},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"time",{get:function(){var e=this.data.changed;return e&&("number"==typeof e?new Date(e).toLocaleString():e)||""},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"uniqueHashKey",{get:function(){var e=this.data;return [e.sourceName,e.name,e.file,this.time,e.thumb].join("_").toLowerCase().replace(/[^0-9a-z\-.]/g,"-")},enumerable:!1,configurable:!0}),e}();t.FileBrowserItem=i;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.makeContextMenu=t.makeDataProvider=void 0;var r=o(183),i=o(118);t.makeDataProvider=function(e,t){return new r.default(e,t)},t.makeContextMenu=function(e){return new i.ContextMenu(e)};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.DEFAULT_SOURCE_NAME=void 0;var r=o(7),i=o(10),n=o(117);t.DEFAULT_SOURCE_NAME="default";var a=function(){function e(e,t){var o=this;this.parent=e,this.options=t,this.__currentPermissions=null,this.ajaxInstances=[],this.getPathByUrl=function(e,t,r){var n="getLocalFileByUrl";return o.options[n].data.url=e,o.get(n,(function(e){o.o.isSuccess(e)?t(e.data.path,e.data.name,e.data.source):r(i.error(o.o.getMessage(e)));}),r)};}return e.prototype.canI=function(e){var t="allow"+e;return null==this.__currentPermissions||void 0===this.__currentPermissions[t]||this.__currentPermissions[t]},Object.defineProperty(e.prototype,"o",{get:function(){return this.options},enumerable:!1,configurable:!0}),e.prototype.get=function(e,t,o){var r=i.extend(!0,{},this.o.ajax,void 0!==this.options[e]?this.options[e]:this.o.ajax);r.prepareData&&(r.data=r.prepareData.call(this,r.data));var a=new n.Ajax(this.parent,r),s=a.send();return this.ajaxInstances.push(a),t&&s.then(t),o&&s.catch(o),s},e.prototype.permissions=function(e,t){return r.__awaiter(this,void 0,Promise,(function(){var o=this;return r.__generator(this,(function(r){return this.o.permissions?(this.o.permissions.data.path=e,this.o.permissions.data.source=t,this.o.permissions.url?[2,this.get("permissions").then((function(e){var t=o.o.permissions.process;if(t||(t=o.o.ajax.process),t){var r=t.call(self,e);r.data.permissions&&(o.__currentPermissions=r.data.permissions);}}))]:[2,Promise.resolve()]):[2,Promise.resolve()]}))}))},e.prototype.items=function(e,t){return r.__awaiter(this,void 0,Promise,(function(){var o;return r.__generator(this,(function(r){return (o=this.options).items?(o.items.data.path=e,o.items.data.source=t,[2,this.get("items")]):[2,Promise.reject("Set Items api options")]}))}))},e.prototype.tree=function(e,t){return r.__awaiter(this,void 0,Promise,(function(){return r.__generator(this,(function(o){switch(o.label){case 0:return e=i.normalizeRelativePath(e),[4,this.permissions(e,t)];case 1:return o.sent(),this.o.folder?(this.o.folder.data.path=e,this.o.folder.data.source=t,[2,this.get("folder")]):[2,Promise.reject("Set Folder Api options")]}}))}))},e.prototype.createFolder=function(e,t,o){var r=this.o.create;return r?(r.data.source=o,r.data.path=t,r.data.name=e,this.get("create")):Promise.reject("Set Create api options")},e.prototype.move=function(e,t,o,r){var i=r?"fileMove":"folderMove",n=this.options[i];return n?(n.data.from=e,n.data.path=t,n.data.source=o,this.get(i)):Promise.reject("Set Move api options")},e.prototype.fileRemove=function(e,t,o){return this.o.fileRemove?(this.o.fileRemove.data.path=e,this.o.fileRemove.data.name=t,this.o.fileRemove.data.source=o,this.get("fileRemove")):Promise.reject("Set fileRemove api options")},e.prototype.folderRemove=function(e,t,o){return this.o.folderRemove?(this.o.folderRemove.data.path=e,this.o.folderRemove.data.name=t,this.o.folderRemove.data.source=o,this.get("folderRemove")):Promise.reject("Set folderRemove api options")},e.prototype.folderRename=function(e,t,o,r){return this.o.folderRename?(this.o.folderRename.data.path=e,this.o.folderRename.data.name=t,this.o.folderRename.data.newname=o,this.o.folderRename.data.source=r,this.get("folderRename")):Promise.reject("Set folderRename api options")},e.prototype.fileRename=function(e,t,o,r){return this.o.fileRename?(this.o.fileRename.data.path=e,this.o.fileRename.data.name=t,this.o.fileRename.data.newname=o,this.o.fileRename.data.source=r,this.get("fileRename")):Promise.reject("Set fileRename api options")},e.prototype.crop=function(e,t,o,r,i){return this.o.crop||(this.o.crop={data:{}}),void 0===this.o.crop.data&&(this.o.crop.data={action:"crop"}),this.o.crop.data.newname=r||o,i&&(this.o.crop.data.box=i),this.o.crop.data.path=e,this.o.crop.data.name=o,this.o.crop.data.source=t,this.get("crop")},e.prototype.resize=function(e,t,o,r,i){return this.o.resize||(this.o.resize={data:{}}),void 0===this.o.resize.data&&(this.o.resize.data={action:"resize"}),this.o.resize.data.newname=r||o,i&&(this.o.resize.data.box=i),this.o.resize.data.path=e,this.o.resize.data.name=o,this.o.resize.data.source=t,this.get("resize")},e.prototype.destruct=function(){this.ajaxInstances.forEach((function(e){return e.destruct()})),this.ajaxInstances.length=0;},e}();t.default=a;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.stateListeners=void 0;var r=o(180),i=o(33),n=o(87),a=o(149),s=r.ITEM_CLASS+"_active_true";t.stateListeners=function(){var e=this,t=this,o=t.state,l=t.files,c=t.create,u=t.options;o.on(["change.currentPath","change.currentSource"],this.async.debounce((function(){e.loadTree();}),this.defaultTimeout)).on("beforeChange.activeElements",(function(){o.activeElements.forEach((function(t){var o=e.elementsMap[t.uniqueHashKey].elm;o&&o.classList.remove(s);}));})).on("change.activeElements",(function(){e.e.fire("changeSelection"),o.activeElements.forEach((function(t){var o=e.elementsMap[t.uniqueHashKey].elm;o&&o.classList.add(s);}));})).on("change.view",(function(){l.classList.remove(r.F_CLASS+"__files_view_tiles"),l.classList.remove(r.F_CLASS+"__files_view_list"),l.classList.add(r.F_CLASS+"__files_view_"+o.view),e.storage.set(r.F_CLASS+"_view",o.view);})).on("change.sortBy",(function(){e.storage.set(r.F_CLASS+"_sortby",o.sortBy);})).on("change.elements",this.async.debounce((function(){i.Dom.detach(l),o.elements.length?o.elements.forEach((function(t){e.files.appendChild(function(t){var o=t.uniqueHashKey;if(e.elementsMap[o])return e.elementsMap[o].elm;var r=c.fromHTML(u.getThumbTemplate.call(e,t,t.source,t.sourceName.toString()));return r.dataset.key=o,e.elementsMap[o]={item:t,elm:r},e.elementsMap[o].elm}(t));})):l.appendChild(c.div(r.F_CLASS+"_no_files",e.i18n("There are no files")));}),this.defaultTimeout)).on("change.sources",this.async.debounce((function(){i.Dom.detach(e.tree),Object.keys(o.sources).forEach((function(t){var i=o.sources[t];if(t&&"default"!==t&&e.tree.appendChild(c.div(r.F_CLASS+"__source-title",t)),i.folders.forEach((function(o){var s,l=c.a(r.F_CLASS+"__tree-item",{draggable:"draggable",href:"javascript:void(0)","data-path":n.normalizePath(i.path,o+"/"),"data-name":o,"data-source":t,"data-source-path":i.path},c.span(r.F_CLASS+"__tree-item-title",o)),d=function(r){return function(a){e.e.fire(r+".filebrowser",{name:o,path:n.normalizePath(i.path+"/"),source:t}),a.stopPropagation();}};e.e.on(l,"click",d("openFolder")),e.tree.appendChild(l),".."!==o&&"."!==o&&(u.renameFolder&&e.dataProvider.canI("FolderRename")&&((s=a.Button(e,{icon:{name:"pencil"},name:"rename",tooltip:"Rename",size:"tiny"})).onAction(d("renameFolder")),l.appendChild(s.container)),u.deleteFolder&&e.dataProvider.canI("FolderRemove")&&((s=a.Button(e,{icon:{name:"cancel"},name:"remove",tooltip:"Delete",size:"tiny"})).onAction(d("removeFolder")),l.appendChild(s.container)));})),u.createNewFolder&&e.dataProvider.canI("FolderCreate")){var s=a.Button(e,"plus","Add folder","secondary");s.onAction((function(){e.e.fire("addFolder",{path:n.normalizePath(i.path+"/"),source:t});})),e.tree.appendChild(s.container);}}));}),this.defaultTimeout));};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.nativeListeners=t.getItem=void 0;var r=o(7),i=o(10),n=o(180),a=o(186),s=o(33);t.getItem=function(e,t,o){return void 0===o&&(o="a"),s.Dom.closest(e,(function(e){return s.Dom.isElement(e)&&s.Dom.isTag(e,o)}),t)},t.nativeListeners=function(){var e=this,o=!1,s=this;s.e.on(s.tree,"dragstart",(function(e){var r=t.getItem(e.target,s.dialog.container);r&&s.o.moveFolder&&(o=r);})).on(s.tree,"drop",(function(e){if((s.o.moveFile||s.o.moveFolder)&&o){var r=i.attr(o,"-path")||"";if(!s.o.moveFolder&&o.classList.contains(n.F_CLASS+"__tree-item"))return !1;if(o.classList.contains(n.ITEM_CLASS)&&(r+=i.attr(o,"-name"),!s.o.moveFile))return !1;var a=t.getItem(e.target,s.dialog.container);if(!a)return;s.dataProvider.move(r,i.attr(a,"-path")||"",i.attr(a,"-source")||"",o.classList.contains(n.ITEM_CLASS)).then((function(e){s.o.isSuccess(e)?s.loadTree():s.status(s.o.getMessage(e));}),s.status),o=!1;}})).on(s.files,"contextmenu",a.default(s)).on(s.files,"click",(function(t){i.ctrlKey(t)||(e.state.activeElements=[]);})).on(s.files,"click",(function(e){var o=t.getItem(e.target,s.dialog.container);if(o){var n=s.elementsMap[o.dataset.key||""].item;if(n)return s.state.activeElements=i.ctrlKey(e)?r.__spreadArrays(s.state.activeElements,[n]):[n],e.stopPropagation(),!1}})).on(s.files,"dragstart",(function(e){if(s.o.moveFile){var r=t.getItem(e.target,s.dialog.container);if(!r)return;o=r;}})).on(s.dialog.container,"drop",(function(e){return e.preventDefault()}));};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7),i=o(136),n=o(33),a=o(180),s=o(10),l=o(182),c=o(149),u=o(185),d=a.F_CLASS+"_preview_",p=function(e,t){return void 0===e&&(e="next"),void 0===t&&(t="right"),'<a href="javascript:void(0)" class="'+d+"navigation "+d+"navigation-"+e+'">'+c.Icon.get("angle-"+t)+"</a>"};t.default=function(e){if(!e.o.contextMenu)return function(){};var t=l.makeContextMenu(e);return function(o){var l=u.getItem(o.target,e.dialog.container);if(l){var c=l,f=e.options,h=function(e){return s.attr(c,e)||""};return e.async.setTimeout((function(){t.show(o.clientX,o.clientY,[!("1"===h("data-is-file")||!f.editImage||!e.dataProvider.canI("ImageResize")&&!e.dataProvider.canI("ImageCrop"))&&{icon:"pencil",title:"Edit",exec:function(){return e.openImageEditor(h("href"),h("data-name"),h("data-path"),h("data-source"))}},!!e.dataProvider.canI("FileRename")&&{icon:"italic",title:"Rename",exec:function(){return r.__awaiter(void 0,void 0,void 0,(function(){return r.__generator(this,(function(t){return e.e.fire("fileRename.filebrowser",h("data-name"),h("data-path"),h("data-source")),[2]}))}))}},!!e.dataProvider.canI("FileRemove")&&{icon:"bin",title:"Delete",exec:function(){return r.__awaiter(void 0,void 0,void 0,(function(){return r.__generator(this,(function(t){switch(t.label){case 0:return [4,e.deleteFile(h("data-name"),h("data-source"))];case 1:return t.sent(),e.state.activeElements=[],[4,e.loadTree()];case 2:return t.sent(),[2]}}))}))}},!!f.preview&&{icon:"eye",title:"Preview",exec:function(){var t=new i.Dialog({fullsize:e.o.fullsize,language:e.o.language,buttons:["fullsize","dialog.close"]}),o=e.c.div(a.F_CLASS+"_preview",a.ICON_LOADER),r=e.c.div(a.F_CLASS+"_preview_box"),l=e.c.fromHTML(p()),u=e.c.fromHTML(p("prev","left")),m=function(i){var s=e.c.element("img");s.setAttribute("src",i);var d=function(){var i;e.isInDestruct||(e.e.off(s,"load"),n.Dom.detach(o),f.showPreviewNavigation&&(n.Dom.prevWithClass(c,a.ITEM_CLASS)&&o.appendChild(u),n.Dom.nextWithClass(c,a.ITEM_CLASS)&&o.appendChild(l)),o.appendChild(r),r.appendChild(s),t.setPosition(),null===(i=null==e?void 0:e.events)||void 0===i||i.fire("previewOpenedAndLoaded"));};e.e.on(s,"load",d),s.complete&&d();};e.e.on([l,u],"click",(function(){if(!(c=this.classList.contains(d+"navigation-next")?n.Dom.nextWithClass(c,a.ITEM_CLASS):n.Dom.prevWithClass(c,a.ITEM_CLASS)))throw s.error("Need element");n.Dom.detach(o),n.Dom.detach(r),o.innerHTML=a.ICON_LOADER,m(h("href"));})),e.e.on("beforeDestruct",(function(){t.destruct();})),t.container.classList.add(a.F_CLASS+"_preview_dialog"),t.setContent(o),t.setPosition(),t.open(),m(h("href")),e.events.on("beforeDestruct",(function(){t.destruct();})).fire("previewOpened");}},{icon:"upload",title:"Download",exec:function(){var t=h("href");t&&e.ow.open(t);}}]);}),e.defaultTimeout),null==e||e.e.on("beforeDestruct",(function(){t.destruct();})),o.stopPropagation(),o.preventDefault(),!1}}};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.selfListeners=void 0;var r=o(136),i=o(14),n=o(10),a=o(183);t.selfListeners=function(){var e=this,t=this.state,o=this;o.e.on("view.filebrowser",(function(e){e!==t.view&&(t.view=e);})).on("sort.filebrowser",(function(e){e!==t.sortBy&&(t.sortBy=e,o.loadItems());})).on("filter.filebrowser",(function(e){e!==t.filterWord&&(t.filterWord=e,o.loadItems());})).on("openFolder.filebrowser",(function(e){var t;t=".."===e.name?e.path.split("/").filter((function(e){return e.length})).slice(0,-1).join("/"):n.normalizePath(e.path,e.name),o.state.currentPath=t,o.state.currentSource="."===e.name?a.DEFAULT_SOURCE_NAME:e.source;})).on("removeFolder.filebrowser",(function(e){r.Confirm(o.i18n("Are you sure?"),o.i18n("Delete"),(function(t){t&&o.dataProvider.folderRemove(e.path,e.name,e.source).then((function(e){var t;if((null===(t=o.o.folderRemove)||void 0===t?void 0:t.process)&&(e=o.o.folderRemove.process.call(o,e)),!o.o.isSuccess(e))throw n.error(o.o.getMessage(e));o.state.activeElements=[],o.status(o.o.getMessage(e),!0),o.loadTree();})).catch(o.status);})).bindDestruct(o);})).on("renameFolder.filebrowser",(function(e){r.Prompt(o.i18n("Enter new name"),o.i18n("Rename"),(function(t){if(!i.isValidName(t))return o.status(o.i18n("Enter new name")),!1;o.dataProvider.folderRename(e.path,e.name,t,e.source).then((function(e){if(o.o.folderRename&&o.o.folderRename.process&&(e=o.o.folderRename.process.call(o,e)),!o.o.isSuccess(e))throw n.error(o.o.getMessage(e));o.state.activeElements=[],o.status(o.o.getMessage(e),!0),o.loadTree();})).catch(o.status);}),o.i18n("type name"),e.name).bindDestruct(o);})).on("addFolder.filebrowser",(function(e){r.Prompt(o.i18n("Enter Directory name"),o.i18n("Create directory"),(function(t){o.dataProvider.createFolder(t,e.path,e.source).then((function(e){return o.o.isSuccess(e)?o.loadTree():o.status(o.o.getMessage(e)),e}),o.status);}),o.i18n("type name")).bindDestruct(o);})).on("fileRemove.filebrowser",(function(){o.state.activeElements.length&&r.Confirm(o.i18n("Are you sure?"),"",(function(e){if(e){var t=[];o.state.activeElements.forEach((function(e){t.push(o.deleteFile(e.file||e.name||"",e.sourceName));})),o.state.activeElements=[],Promise.all(t).then((function(){return o.loadTree()}));}})).bindDestruct(o);})).on("edit.filebrowser",(function(){if(1===o.state.activeElements.length){var t=e.state.activeElements[0];o.openImageEditor(t.fileURL,t.file||"",t.path,t.sourceName);}})).on("fileRename.filebrowser",(function(t,a,s){1===o.state.activeElements.length&&r.Prompt(o.i18n("Enter new name"),o.i18n("Rename"),(function(e){if(!i.isValidName(e))return o.status(o.i18n("Enter new name")),!1;o.dataProvider.fileRename(a,t,e,s).then((function(e){if(o.o.fileRename&&o.o.fileRename.process&&(e=o.o.fileRename.process.call(o,e)),!o.o.isSuccess(e))throw n.error(o.o.getMessage(e));o.state.activeElements=[],o.status(o.o.getMessage(e),!0),o.loadItems();})).catch(o.status);}),o.i18n("type name"),t).bindDestruct(e);})).on("update.filebrowser",(function(){o.loadTree();}));};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ImageEditor=void 0;var r=o(7);o(189);var i=o(8),n=o(42),a=o(136),s=o(10),l=o(33),c=o(124),u=o(190),d=o(38);i.Config.prototype.imageeditor={min_width:20,min_height:20,closeAfterSave:!1,width:"85%",height:"85%",crop:!0,resize:!0,resizeUseRatio:!0,resizeMinWidth:20,resizeMinHeight:20,cropUseRatio:!0,cropDefaultWidth:"70%",cropDefaultHeight:"70%"};var p="jodit-image-editor",f="resize",h="crop",m=function(e){function t(t){var r=e.call(this,t)||this;r.resizeUseRatio=!0,r.cropUseRatio=!0,r.clicked=!1,r.start_x=0,r.start_y=0,r.top_x=0,r.top_y=0,r.width=0,r.height=0,r.activeTab=f,r.naturalWidth=0,r.naturalHeight=0,r.ratio=0,r.new_h=0,r.new_w=0,r.diff_x=0,r.diff_y=0,r.cropBox={x:0,y:0,w:0,h:0},r.resizeBox={w:0,h:0},r.calcCropBox=function(){var e=r.crop_box.parentNode,t=.8*e.offsetWidth,o=.8*e.offsetHeight,i=t,n=o,a=r.naturalWidth,l=r.naturalHeight;t>a&&o>l?(i=a,n=l):r.ratio>t/o?(i=t,n=l*(t/a)):(i=a*(o/l),n=o),s.css(r.crop_box,{width:i,height:n});},r.showCrop=function(){if(r.cropImage){r.calcCropBox();var e=r.cropImage.offsetWidth||r.image.offsetWidth||r.image.naturalWidth;r.new_w=o.calcValueByPercent(e,r.o.cropDefaultWidth);var t=r.cropImage.offsetHeight||r.image.offsetHeight||r.image.naturalHeight;r.new_h=r.cropUseRatio?r.new_w/r.ratio:o.calcValueByPercent(t,r.o.cropDefaultHeight),s.css(r.cropHandler,{backgroundImage:"url("+s.attr(r.cropImage,"src")+")",width:r.new_w,height:r.new_h,left:e/2-r.new_w/2,top:t/2-r.new_h/2}),r.j.e.fire(r.cropHandler,"updatesize");}},r.updateCropBox=function(){if(r.cropImage){var e=r.cropImage.offsetWidth/r.naturalWidth,t=r.cropImage.offsetHeight/r.naturalHeight;r.cropBox.x=s.css(r.cropHandler,"left")/e,r.cropBox.y=s.css(r.cropHandler,"top")/t,r.cropBox.w=r.cropHandler.offsetWidth/e,r.cropBox.h=r.cropHandler.offsetHeight/t,r.sizes.textContent=r.cropBox.w.toFixed(0)+"x"+r.cropBox.h.toFixed(0);}},r.updateResizeBox=function(){r.resizeBox.w=r.image.offsetWidth||r.naturalWidth,r.resizeBox.h=r.image.offsetHeight||r.naturalHeight;},r.setHandlers=function(){var e=r,t=s.refs(r.editor),o=t.widthInput,i=t.heightInput;e.j.e.on([e.editor.querySelector(".jodit_bottomright"),e.cropHandler],"mousedown."+p,r.onResizeHandleMouseDown).on(r.j.ow,"resize."+p,(function(){r.j.e.fire(e.resizeHandler,"updatesize"),e.showCrop(),r.j.e.fire(e.cropHandler,"updatesize");})),s.$$(".jodit-button-group",e.editor).forEach((function(t){var o=t.querySelector("input");e.j.e.on(t,"click",(function(){o.checked=!o.checked,e.j.e.fire(o,"change");}));})),e.j.e.on(s.toArray(r.editor.querySelectorAll("."+p+"__slider-title")),"click",r.onTitleModeClick).on([o,i],"input",r.onChangeSizeInput);var n=s.refs(r.editor),l=n.keepAspectRatioResize,c=n.keepAspectRatioCrop;l&&l.addEventListener("change",(function(){r.resizeUseRatio=l.checked;})),c&&c.addEventListener("change",(function(){r.cropUseRatio=c.checked;})),e.j.e.on(e.resizeHandler,"updatesize",(function(){s.css(e.resizeHandler,{top:0,left:0,width:e.image.offsetWidth||e.naturalWidth,height:e.image.offsetHeight||e.naturalHeight}),r.updateResizeBox();})).on(e.cropHandler,"updatesize",(function(){if(e.cropImage){var t=s.css(e.cropHandler,"left"),o=s.css(e.cropHandler,"top"),r=e.cropHandler.offsetWidth,i=e.cropHandler.offsetHeight;0>t&&(t=0),0>o&&(o=0),t+r>e.cropImage.offsetWidth&&(r=e.cropImage.offsetWidth-t,e.cropUseRatio&&(i=r/e.ratio)),o+i>e.cropImage.offsetHeight&&(i=e.cropImage.offsetHeight-o,e.cropUseRatio&&(r=i*e.ratio)),s.css(e.cropHandler,{width:r,height:i,left:t,top:o,backgroundPosition:-t-1+"px "+(-o-1)+"px",backgroundSize:e.cropImage.offsetWidth+"px "+e.cropImage.offsetHeight+"px"}),e.updateCropBox();}})),Object.values(e.buttons).forEach((function(t){t.onAction((function(){var n={action:e.activeTab,box:e.activeTab===f?e.resizeBox:e.cropBox};switch(t){case e.buttons.saveas:a.Prompt(e.j.i18n("Enter new name"),e.j.i18n("Save in new file"),(function(t){if(!s.trim(t))return a.Alert(e.j.i18n("The name should not be empty")).bindDestruct(r.j),!1;e.onSave(t,n,e.hide,(function(t){a.Alert(t.message).bindDestruct(e.j);}));})).bindDestruct(r.j);break;case e.buttons.save:e.onSave(void 0,n,e.hide,(function(t){a.Alert(t.message).bindDestruct(e.j);}));break;case e.buttons.reset:e.activeTab===f?(s.css(e.image,{width:null,height:null}),o.value=e.naturalWidth.toString(),i.value=e.naturalHeight.toString(),e.j.e.fire(e.resizeHandler,"updatesize")):e.showCrop();}}));}));},r.options=t&&t.o&&t.o.imageeditor?t.o.imageeditor:i.Config.defaultOptions.imageeditor;var n=r.options;r.resizeUseRatio=n.resizeUseRatio,r.cropUseRatio=n.cropUseRatio,r.buttons={reset:c.Button(r.j,"update","Reset"),save:c.Button(r.j,"save","Save"),saveas:c.Button(r.j,"save","Save as ...")},r.activeTab=n.resize?f:h,r.editor=u.form(r.j,r.options);var l=s.refs(r.editor),d=l.cropBox;return r.resize_box=l.resizeBox,r.crop_box=d,r.sizes=r.editor.querySelector("."+p+"__area."+p+"__area_crop .jodit-image-editor__sizes"),r.resizeHandler=r.editor.querySelector("."+p+"__resizer"),r.cropHandler=r.editor.querySelector("."+p+"__croper"),r.dialog=new a.Dialog({fullsize:r.j.o.fullsize,globalFullSize:r.j.o.globalFullSize,language:r.j.o.language,buttons:["fullsize","dialog.close"]}),r.dialog.setContent(r.editor),r.dialog.setSize(r.o.width,r.o.height),r.dialog.setHeader([r.buttons.reset,r.buttons.save,r.buttons.saveas]),r.setHandlers(),r}var o;return r.__extends(t,e),o=t,t.prototype.className=function(){return "ImageEditor"},t.prototype.onTitleModeClick=function(e){var t=this,o=e.target,r=null==o?void 0:o.parentElement;if(r){s.$$("."+p+"__slider,."+p+"__area",t.editor).forEach((function(e){return e.classList.remove(p+"_active")})),r.classList.add(p+"_active"),t.activeTab=s.attr(r,"-area")||f;var i=t.editor.querySelector("."+p+"__area."+p+"__area_"+t.activeTab);i&&i.classList.add(p+"_active"),t.activeTab===h&&t.showCrop();}},t.prototype.onChangeSizeInput=function(e){var t,o=this,r=e.target,i=s.refs(this.editor),n=i.widthInput,a=i.heightInput,l="widthInput"===s.attr(r,"data-ref"),c=parseInt(r.value,10),u=l?o.o.min_height:o.o.min_width;c>(l?o.o.min_width:o.o.min_height)&&(s.css(o.image,l?"width":"height",c),o.resizeUseRatio&&(t=l?Math.round(c/o.ratio):Math.round(c*o.ratio))>u&&(s.css(o.image,l?"height":"width",t),l?a.value=t.toString():n.value=t.toString())),this.j.e.fire(o.resizeHandler,"updatesize");},t.prototype.onResizeHandleMouseDown=function(e){var t=this;t.target=e.target,e.preventDefault(),e.stopImmediatePropagation(),t.clicked=!0,t.start_x=e.clientX,t.start_y=e.clientY,t.activeTab===h?(t.top_x=s.css(t.cropHandler,"left"),t.top_y=s.css(t.cropHandler,"top"),t.width=t.cropHandler.offsetWidth,t.height=t.cropHandler.offsetHeight):(t.width=t.image.offsetWidth,t.height=t.image.offsetHeight),t.j.e.on(this.j.ow,"mousemove",this.onGlobalMouseMove).one(this.j.ow,"mouseup",this.onGlobalMouseUp);},t.prototype.onGlobalMouseUp=function(e){this.clicked&&(this.clicked=!1,e.stopImmediatePropagation(),this.j.e.off(this.j.ow,"mousemove",this.onGlobalMouseMove));},t.prototype.onGlobalMouseMove=function(e){var t=this;if(t.clicked){var o=s.refs(this.editor),r=o.widthInput,i=o.heightInput;t.diff_x=e.clientX-t.start_x,t.diff_y=e.clientY-t.start_y,t.activeTab===f&&t.resizeUseRatio||t.activeTab===h&&t.cropUseRatio?t.diff_x?(t.new_w=t.width+t.diff_x,t.new_h=Math.round(t.new_w/t.ratio)):(t.new_h=t.height+t.diff_y,t.new_w=Math.round(t.new_h*t.ratio)):(t.new_w=t.width+t.diff_x,t.new_h=t.height+t.diff_y),t.activeTab===f?(t.new_w>t.o.resizeMinWidth&&(s.css(t.image,"width",t.new_w+"px"),r.value=t.new_w.toString()),t.new_h>t.o.resizeMinHeight&&(s.css(t.image,"height",t.new_h+"px"),i.value=t.new_h.toString()),this.j.e.fire(t.resizeHandler,"updatesize")):(t.target!==t.cropHandler?(t.top_x+t.new_w>t.cropImage.offsetWidth&&(t.new_w=t.cropImage.offsetWidth-t.top_x),t.top_y+t.new_h>t.cropImage.offsetHeight&&(t.new_h=t.cropImage.offsetHeight-t.top_y),s.css(t.cropHandler,{width:t.new_w,height:t.new_h})):(t.top_x+t.diff_x+t.cropHandler.offsetWidth>t.cropImage.offsetWidth&&(t.diff_x=t.cropImage.offsetWidth-t.top_x-t.cropHandler.offsetWidth),s.css(t.cropHandler,"left",t.top_x+t.diff_x),t.top_y+t.diff_y+t.cropHandler.offsetHeight>t.cropImage.offsetHeight&&(t.diff_y=t.cropImage.offsetHeight-t.top_y-t.cropHandler.offsetHeight),s.css(t.cropHandler,"top",t.top_y+t.diff_y)),this.j.e.fire(t.cropHandler,"updatesize"));}},Object.defineProperty(t.prototype,"o",{get:function(){return this.options},enumerable:!1,configurable:!0}),t.prototype.hide=function(){this.dialog.close();},t.prototype.open=function(e,t){var o=this;return this.j.async.promise((function(r){var i=(new Date).getTime();o.image=o.j.c.element("img"),s.$$("img,.jodit-icon_loader",o.resize_box).forEach(l.Dom.safeRemove),s.$$("img,.jodit-icon_loader",o.crop_box).forEach(l.Dom.safeRemove),s.css(o.cropHandler,"background","transparent"),o.onSave=t,o.resize_box.appendChild(o.j.c.element("i",{class:"jodit-icon_loader"})),o.crop_box.appendChild(o.j.c.element("i",{class:"jodit-icon_loader"})),/\?/.test(e)?e+="&_tst="+i:e+="?_tst="+i,o.image.setAttribute("src",e),o.dialog.open();var n=s.refs(o.editor),a=n.widthInput,c=n.heightInput,u=function(){o.isDestructed||(o.image.removeEventListener("load",u),o.naturalWidth=o.image.naturalWidth,o.naturalHeight=o.image.naturalHeight,a.value=o.naturalWidth.toString(),c.value=o.naturalHeight.toString(),o.ratio=o.naturalWidth/o.naturalHeight,o.resize_box.appendChild(o.image),o.cropImage=o.image.cloneNode(!0),o.crop_box.appendChild(o.cropImage),s.$$(".jodit-icon_loader",o.editor).forEach(l.Dom.safeRemove),o.activeTab===h&&o.showCrop(),o.j.e.fire(o.resizeHandler,"updatesize"),o.j.e.fire(o.cropHandler,"updatesize"),o.dialog.setPosition(),o.j.e.fire("afterImageEditor"),r(o.dialog));};o.image.addEventListener("load",u),o.image.complete&&u();}))},t.prototype.destruct=function(){this.isDestructed||(this.dialog&&!this.dialog.isInDestruct&&this.dialog.destruct(),l.Dom.safeRemove(this.editor),this.j.e&&this.j.e.off(this.j.ow,"mousemove",this.onGlobalMouseMove).off(this.j.ow,"mouseup",this.onGlobalMouseUp).off(this.ow,"."+p).off("."+p),e.prototype.destruct.call(this));},t.calcValueByPercent=function(e,t){var o,r=t.toString(),i=parseFloat(e.toString());return (o=/^[-+]?[0-9]+(px)?$/.exec(r))?parseInt(r,10):(o=/^([-+]?[0-9.]+)%$/.exec(r))?Math.round(i*(parseFloat(o[1])/100)):i||0},r.__decorate([d.autobind],t.prototype,"onTitleModeClick",null),r.__decorate([d.debounce()],t.prototype,"onChangeSizeInput",null),r.__decorate([d.autobind],t.prototype,"onResizeHandleMouseDown",null),r.__decorate([d.autobind],t.prototype,"onGlobalMouseUp",null),r.__decorate([d.throttle(10)],t.prototype,"onGlobalMouseMove",null),r.__decorate([d.autobind],t.prototype,"hide",null),r.__decorate([d.autobind],t.prototype,"open",null),o=r.__decorate([d.component],t)}(n.ViewComponent);t.ImageEditor=m;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.form=void 0;var r=o(149),i="jodit-image-editor",n=r.Icon.get.bind(r.Icon),a=function(e,t){return void 0===t&&(t="jodti-image-editor_active"),e?t:""};t.form=function(e,t){var o=e.i18n.bind(e),r=function(e,t,r){return void 0===r&&(r=!0),'<div class="jodit-form__group">\n\t\t<label>'+o(e)+'</label>\n\t\t<div class="jodit-button-group jodit-button_radio_group">\n\t\t\t<input '+a(r,"checked")+' data-ref="'+t+'" type="checkbox" class="jodit-input"/>\n\n\t\t\t<button type="button" data-yes="1" class="jodit-ui-button jodit-ui-button_status_success">'+o("Yes")+'</button>\n\n\t\t\t<button type="button" class="jodit-ui-button jodit-ui-button_status_danger">'+o("No")+"</button>\n\t\t</div>\n\t</div>"};return e.create.fromHTML('<form class="'+i+' jodit-properties">\n\t\t<div class="jodit-grid jodit-grid_xs-column">\n\t\t\t<div class="jodit_col-lg-3-4 jodit_col-sm-5-5">\n\t\t\t'+(t.resize?'<div class="'+i+"__area "+i+"__area_resize "+i+'_active">\n\t\t\t\t\t\t\t<div data-ref="resizeBox" class="'+i+'__box"></div>\n\t\t\t\t\t\t\t<div class="'+i+'__resizer">\n\t\t\t\t\t\t\t\t<i class="jodit_bottomright"></i>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>':"")+"\n\t\t\t"+(t.crop?'<div class="'+i+"__area "+i+"__area_crop "+a(!t.resize)+'">\n\t\t\t\t\t\t\t<div data-ref="cropBox" class="'+i+'__box">\n\t\t\t\t\t\t\t\t<div class="'+i+'__croper">\n\t\t\t\t\t\t\t\t\t<i class="jodit_bottomright"></i>\n\t\t\t\t\t\t\t\t\t<i class="'+i+'__sizes"></i>\n\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>':"")+'\n\t\t\t</div>\n\t\t\t<div class="jodit_col-lg-1-4 jodit_col-sm-5-5">\n\t\t\t'+(t.resize?'<div data-area="resize" class="'+i+"__slider "+i+'_active">\n\t\t\t\t\t\t\t<div class="'+i+'__slider-title">\n\t\t\t\t\t\t\t\t'+n("resize")+"\n\t\t\t\t\t\t\t\t"+o("Resize")+'\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t<div class="'+i+'__slider-content">\n\t\t\t\t\t\t\t\t<div class="jodit-form__group">\n\t\t\t\t\t\t\t\t\t<label>\n\t\t\t\t\t\t\t\t\t\t'+o("Width")+'\n\t\t\t\t\t\t\t\t\t</label>\n\t\t\t\t\t\t\t\t\t<input type="number" data-ref="widthInput" class="jodit-input"/>\n\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t\t<div class="jodit-form__group">\n\t\t\t\t\t\t\t\t\t<label>\n\t\t\t\t\t\t\t\t\t\t'+o("Height")+'\n\t\t\t\t\t\t\t\t\t</label>\n\t\t\t\t\t\t\t\t\t<input type="number" data-ref="heightInput" class="jodit-input"/>\n\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t\t'+r("Keep Aspect Ratio","keepAspectRatioResize")+"\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>":"")+"\n\t\t\t"+(t.crop?'<div data-area="crop" class="'+i+"__slider "+a(!t.resize)+'\'">\n\t\t\t\t\t\t\t<div class="'+i+'__slider-title">\n\t\t\t\t\t\t\t\t'+n("crop")+"\n\t\t\t\t\t\t\t\t"+o("Crop")+'\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t<div class="'+i+'__slider-content">\n\t\t\t\t\t\t\t\t'+r("Keep Aspect Ratio","keepAspectRatioCrop")+"\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>":"")+"\n\t\t\t</div>\n\t\t</div>\n\t</form>")};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Observer=void 0;var r=o(7),i=o(8),n=o(42),a=o(192),s=o(193),l=o(194),c=o(38);i.Config.prototype.observer={maxHistoryLength:1/0,timeout:100};var u=function(e){function t(t){var o=e.call(this,t)||this;return o.stack=new s.Stack(o.j.o.observer.maxHistoryLength),o.snapshot=new a.Snapshot(o.j),o.updateTick=0,t.e.on("afterAddPlace.observer",(function(){o.isInDestruct||(o.startValue=o.snapshot.make(),t.events.on("internalChange",(function(){o.startValue=o.snapshot.make();})).on(t.editor,["changeSelection","selectionstart","selectionchange","mousedown","mouseup","keydown","keyup"].map((function(e){return e+".observer"})).join(" "),(function(){o.startValue.html===o.j.getNativeEditorValue()&&(o.startValue=o.snapshot.make());})).on(o,"change.observer",o.onChange));})),o}return r.__extends(t,e),t.prototype.className=function(){return "Observer"},Object.defineProperty(t.prototype,"startValue",{get:function(){return this.__startValue},set:function(e){this.__startValue=e;},enumerable:!1,configurable:!0}),t.prototype.upTick=function(){this.updateTick+=1;},t.prototype.onChange=function(){this.snapshot.isBlocked||this.updateStack();},t.prototype.updateStack=function(e){void 0===e&&(e=!1);var t=this.snapshot.make();if(!a.Snapshot.equal(t,this.startValue)){var o=new l.Command(this.startValue,t,this,this.updateTick);if(e){var r=this.stack.current();r&&this.updateTick===r.tick&&this.stack.replace(o);}else this.stack.push(o);this.startValue=t,this.fireChangeStack();}},t.prototype.redo=function(){this.stack.redo()&&(this.startValue=this.snapshot.make(),this.fireChangeStack());},t.prototype.undo=function(){this.stack.undo()&&(this.startValue=this.snapshot.make(),this.fireChangeStack());},t.prototype.clear=function(){this.startValue=this.snapshot.make(),this.stack.clear(),this.fireChangeStack();},t.prototype.replaceSnapshot=function(){this.updateStack(!0);},t.prototype.fireChangeStack=function(){var e;this.j&&!this.j.isInDestruct&&(null===(e=this.j.events)||void 0===e||e.fire("changeStack"));},t.prototype.destruct=function(){this.j.events&&this.j.e.off(".observer"),this.snapshot.destruct(),e.prototype.destruct.call(this);},r.__decorate([c.debounce()],t.prototype,"onChange",null),t}(n.ViewComponent);t.Observer=u;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Snapshot=void 0;var r=o(7),i=o(42),n=o(33),a=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.isBlocked=!1,t}return r.__extends(t,e),t.prototype.className=function(){return "Snapshot"},t.equal=function(e,t){return e.html===t.html&&JSON.stringify(e.range)===JSON.stringify(t.range)},t.countNodesBeforeInParent=function(e){if(!e.parentNode)return 0;var t,o=e.parentNode.childNodes,r=0,i=null;for(t=0;o.length>t;t+=1){if(!i||n.Dom.isText(o[t])&&""===o[t].textContent||n.Dom.isText(i)&&n.Dom.isText(o[t])||(r+=1),o[t]===e)return r;i=o[t];}return 0},t.strokeOffset=function(e,t){for(;n.Dom.isText(e);)n.Dom.isText(e=e.previousSibling)&&null!=e.textContent&&(t+=e.textContent.length);return t},t.prototype.calcHierarchyLadder=function(e){var o=[];if(!e||!e.parentNode||!n.Dom.isOrContains(this.j.editor,e))return [];for(;e&&e!==this.j.editor;)e&&o.push(t.countNodesBeforeInParent(e)),e=e.parentNode;return o.reverse()},t.prototype.getElementByLadder=function(e){var t,o=this.j.editor;for(t=0;o&&e.length>t;t+=1)o=o.childNodes[e[t]];return o},t.prototype.make=function(){var e={html:"",range:{startContainer:[],startOffset:0,endContainer:[],endOffset:0}};e.html=this.j.getNativeEditorValue();var o=this.j.s.sel;if(o&&o.rangeCount){var r=o.getRangeAt(0),i=this.calcHierarchyLadder(r.startContainer),n=this.calcHierarchyLadder(r.endContainer),a=t.strokeOffset(r.startContainer,r.startOffset),s=t.strokeOffset(r.endContainer,r.endOffset);i.length||r.startContainer===this.j.editor||(a=0),n.length||r.endContainer===this.j.editor||(s=0),e.range={startContainer:i,startOffset:a,endContainer:n,endOffset:s};}return e},t.prototype.restore=function(e){this.isBlocked=!0;var t=this.storeScrollState();this.j.getNativeEditorValue()!==e.html&&this.j.setEditorValue(e.html),this.restoreOnlySelection(e),this.restoreScrollState(t),this.isBlocked=!1;},t.prototype.storeScrollState=function(){return [window.scrollY,this.j.editor.scrollTop]},t.prototype.restoreScrollState=function(e){window.scrollTo(window.scrollX,e[0]),this.j.editor.scrollTop=e[1];},t.prototype.restoreOnlySelection=function(e){try{if(e.range){var t=this.j.ed.createRange();t.setStart(this.getElementByLadder(e.range.startContainer),e.range.startOffset),t.setEnd(this.getElementByLadder(e.range.endContainer),e.range.endOffset),this.j.s.selectRange(t);}}catch(e){this.j.editor.lastChild&&this.j.s.setCursorAfter(this.j.editor.lastChild);}},t.prototype.destruct=function(){this.isBlocked=!1,e.prototype.destruct.call(this);},t}(i.ViewComponent);t.Snapshot=a;},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Stack=void 0;var o=function(){function e(e){this.size=e,this.commands=[],this.stackPosition=-1;}return Object.defineProperty(e.prototype,"length",{get:function(){return this.commands.length},enumerable:!1,configurable:!0}),e.prototype.clearRedo=function(){this.commands.length=this.stackPosition+1;},e.prototype.clear=function(){this.commands.length=0,this.stackPosition=-1;},e.prototype.push=function(e){this.clearRedo(),this.commands.push(e),this.stackPosition+=1,this.commands.length>this.size&&(this.commands.shift(),this.stackPosition-=1);},e.prototype.replace=function(e){this.commands[this.stackPosition]=e;},e.prototype.current=function(){return this.commands[this.stackPosition]},e.prototype.undo=function(){return !!this.canUndo()&&(this.commands[this.stackPosition]&&this.commands[this.stackPosition].undo(),this.stackPosition-=1,!0)},e.prototype.redo=function(){return !!this.canRedo()&&(this.stackPosition+=1,this.commands[this.stackPosition]&&this.commands[this.stackPosition].redo(),!0)},e.prototype.canUndo=function(){return this.stackPosition>=0},e.prototype.canRedo=function(){return this.commands.length-1>this.stackPosition},e}();t.Stack=o;},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Command=void 0;var o=function(){function e(e,t,o,r){this.oldValue=e,this.newValue=t,this.observer=o,this.tick=r;}return e.prototype.undo=function(){this.observer.snapshot.restore(this.oldValue);},e.prototype.redo=function(){this.observer.snapshot.restore(this.newValue);},e}();t.Command=o;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ProgressBar=void 0;var r=o(7);o(196);var i=o(42),n=o(33),a=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.progressBar=t.j.c.div("jodit-progressbar",t.j.c.div()),t}return r.__extends(t,e),t.prototype.className=function(){return "ProgressBar"},t.prototype.show=function(){return (this.j.workplace||this.j.container).appendChild(this.progressBar),this},t.prototype.hide=function(){return n.Dom.safeRemove(this.progressBar),this},t.prototype.progress=function(e){return this.progressBar.style.width=e.toFixed(2)+"%",this},t.prototype.destruct=function(){return this.hide(),e.prototype.destruct.call(this)},t}(i.ViewComponent);t.ProgressBar=a;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(198),t),r.__exportStar(o(200),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Style=void 0;var r=o(9),i=o(199),n=function(){function e(e){this.options=e;}return Object.defineProperty(e.prototype,"element",{get:function(){return this.options.element||this.defaultTag},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"elementIsBlock",{get:function(){return Boolean(this.options.element&&r.IS_BLOCK.test(this.options.element))},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"defaultTag",{get:function(){return this.options.defaultTag?this.options.defaultTag:this.elementIsBlock?"p":"span"},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"elementIsDefault",{get:function(){return this.element===this.defaultTag},enumerable:!1,configurable:!0}),e.prototype.apply=function(e){new i.ApplyStyle(e,this).apply();},e}();t.Style=n;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ApplyStyle=void 0;var r,i=o(7),n=o(14),a=o(33),s=o(10),l=o(38);!function(e){e.UNWRAP="UNWRAP",e.WRAP="WRAP";}(r||(r={}));var c=function(){function e(e,t){this.jodit=e,this.style=t;}return e.prototype.apply=function(){var e=this.jodit.selection,t=[];if(e.isCollapsed()){var o=this.jodit.createInside.element("font");e.insertNode(o,!1,!1),e.setCursorIn(o),t=e.save(),this.applyToElement(o),a.Dom.unwrap(o);}else t=e.save(),s.normalizeNode(e.area.firstChild),e.wrapInTag(this.applyToElement);e.restore(t);},e.prototype.applyToElement=function(e){var t=this,o=this.jodit.selection.area;if(!(this.checkSuitableParent(e)||this.checkSuitableChild(e)||this.checkClosestWrapper(e)||this.unwrapChildren(e))&&(this.mode||(this.mode=r.WRAP),this.mode===r.WRAP)){var i=e;if(this.style.elementIsBlock){var n=/^(ul|ol|li|td|th|tr|tbody|table)$/i;i=a.Dom.up(e,(function(e){return !(!e||!a.Dom.isBlock(e,t.jodit.s.win)||!n.test(t.style.element)&&n.test(e.nodeName))}),o)||this.wrapUnwrappedText(e);}var l=a.Dom.replace(i,this.style.element,this.jodit.createInside);this.style.elementIsBlock&&this.postProcessListElement(l),this.style.options.style&&this.style.elementIsDefault&&s.css(l,this.style.options.style);}},e.prototype.checkSuitableParent=function(e){var t=e.parentNode;return !(!t||a.Dom.next(e,this.isNormalNode,t)||a.Dom.prev(e,this.isNormalNode,t)||!this.isSuitableElement(t,!1)||t===this.jodit.s.area||a.Dom.isBlock(t,this.jodit.ew)&&!this.style.elementIsBlock||(this.toggleStyles(t),0))},e.prototype.checkSuitableChild=function(e){var t=e.firstChild;return t&&this.jodit.s.isMarker(t)&&(t=t.nextSibling),!(!t||a.Dom.next(t,this.isNormalNode,e)||a.Dom.prev(t,this.isNormalNode,e)||!this.isSuitableElement(t,!1)||(this.toggleStyles(t),0))},e.prototype.checkClosestWrapper=function(e){var t=a.Dom.closest(e,this.isSuitableElement,this.jodit.editor);if(t){if(this.style.elementIsBlock)return this.toggleStyles(t),!0;var o=this.jodit.s.createRange();o.setStartBefore(t),o.setEndBefore(e);var r=o.extractContents();r.textContent&&s.trim(r.textContent).length||!r.firstChild||a.Dom.unwrap(r.firstChild),t.parentNode&&t.parentNode.insertBefore(r,t),o.setStartAfter(e),o.setEndAfter(t);var i=o.extractContents();return i.textContent&&s.trim(i.textContent).length||!i.firstChild||a.Dom.unwrap(i.firstChild),a.Dom.after(t,i),this.toggleStyles(t),!0}return !1},e.prototype.elementHasSameStyle=function(e,t){return Boolean(n.isPlainObject(t)&&!a.Dom.isTag(e,"font")&&a.Dom.isHTMLElement(e,this.jodit.ew)&&s.each(t,(function(t,o){var r=s.css(e,t,void 0,!0);return !n.isVoid(r)&&""!==r&&!n.isVoid(o)&&s.normalizeCssValue(t,o).toString().toLowerCase()===r.toString().toLowerCase()})))},e.prototype.isSuitableElement=function(e,t){if(void 0===t&&(t=!0),!e)return !1;var o=this.style,r=o.element,i=o.elementIsDefault,n=this.elementHasSameStyle(e,o.options.style),a=e.nodeName.toLowerCase()===r;return (!i||!t)&&a||n&&this.isNormalNode(e)},e.prototype.isNormalNode=function(e){return Boolean(null!=e&&!a.Dom.isEmptyTextNode(e)&&!this.jodit.s.isMarker(e))},e.prototype.toggleStyles=function(e){var t=this,o=this.style.options.style;o&&e.nodeName.toLowerCase()===this.style.defaultTag&&Object.keys(o).forEach((function(i){t.mode===r.UNWRAP||s.css(e,i)===s.normalizeCssValue(i,o[i])?(s.css(e,i,""),void 0===t.mode&&(t.mode=r.UNWRAP)):(s.css(e,i,o[i]),void 0===t.mode&&(t.mode=r.WRAP));}));var i=a.Dom.isBlock(e,this.jodit.ew),n=!(i||s.attr(e,"style")&&e.nodeName.toLowerCase()===this.style.defaultTag),l=!n&&i&&e.nodeName.toLowerCase()===this.style.element;(n||l)&&(a.Dom.unwrap(e),void 0===this.mode&&(this.mode=r.UNWRAP));},e.prototype.unwrapChildren=function(e){var t,o=this,r=[];return e.firstChild&&a.Dom.find(e.firstChild,(function(e){return e&&o.isSuitableElement(e)?(void 0===t&&(t=!0),r.push(e)):void 0===t&&(t=!1),!1}),e,!0),r.forEach(a.Dom.unwrap),Boolean(t)},e.prototype.wrapUnwrappedText=function(e){var t=this.jodit.selection,o=t.area,r=t.win,i=function(e,t){void 0===t&&(t="previousSibling");for(var i=e,n=e;n&&(i=n,n=n[t]?n[t]:n.parentNode&&!a.Dom.isBlock(n.parentNode,r)&&n.parentNode!==o?n.parentNode:null,!a.Dom.isBlock(n,r)););return i},n=i(e),s=i(e,"nextSibling"),l=this.jodit.s.createRange();l.setStartBefore(n),l.setEndAfter(s);var c=l.extractContents(),u=this.jodit.createInside.element(this.style.element);return u.appendChild(c),l.insertNode(u),this.style.elementIsBlock&&(this.postProcessListElement(u),a.Dom.isEmpty(u)&&!a.Dom.isTag(u.firstElementChild,"br")&&u.appendChild(this.jodit.createInside.element("br"))),u},e.prototype.postProcessListElement=function(e){if(/^(OL|UL)$/i.test(this.style.element)&&!a.Dom.isTag(e.firstElementChild,"li")){var t=a.Dom.replace(e,"li",this.jodit.createInside),o=a.Dom.wrap(t,this.style.element,this.jodit);o&&(e=o);}},i.__decorate([l.autobind],e.prototype,"applyToElement",null),i.__decorate([l.autobind],e.prototype,"isSuitableElement",null),i.__decorate([l.autobind],e.prototype,"isNormalNode",null),e}();t.ApplyStyle=c;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Select=void 0;var r=o(7),i=o(9),n=o(9),a=o(33),s=o(10),l=o(198),c=o(38),u=function(){function e(e){var t=this;this.jodit=e,this.isMarker=function(e){return a.Dom.isNode(e,t.win)&&a.Dom.isElement(e)&&a.Dom.isTag(e,"span")&&e.hasAttribute("data-"+i.MARKER_CLASS)},this.eachSelection=function(e){var o=t.sel;if(o&&o.rangeCount){var r=o.getRangeAt(0),i=[],l=r.startOffset,c=t.area.childNodes.length,u=r.startContainer===t.area?t.area.childNodes[c>l?l:c-1]:r.startContainer,d=r.endContainer===t.area?t.area.childNodes[r.endOffset-1]:r.endContainer;a.Dom.find(u,(function(e){return !e||e===t.area||a.Dom.isEmptyTextNode(e)||t.isMarker(e)||i.push(e),e===d||e&&e.contains&&e.contains(d)}),t.area,!0,"nextSibling",!1);var p=function(o){if(a.Dom.isOrContains(t.j.editor,o,!0)){if(o.nodeName.match(/^(UL|OL)$/))return s.toArray(o.childNodes).forEach(p);if(a.Dom.isTag(o,"li"))if(o.firstChild)o=o.firstChild;else {var r=t.j.createInside.text(n.INVISIBLE_SPACE);o.appendChild(r),o=r;}e(o);}};0===i.length&&a.Dom.isEmptyTextNode(u)&&i.push(u),i.forEach(p);}},e.e.on("removeMarkers",(function(){t.removeMarkers();}));}return Object.defineProperty(e.prototype,"j",{get:function(){return this.jodit},enumerable:!1,configurable:!0}),e.prototype.errorNode=function(e){if(!a.Dom.isNode(e,this.win))throw s.error("Parameter node must be instance of Node")},Object.defineProperty(e.prototype,"area",{get:function(){return this.j.editor},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"win",{get:function(){return this.j.ew},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"doc",{get:function(){return this.j.ed},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"sel",{get:function(){return this.j.o.shadowRoot?this.j.o.shadowRoot.getSelection():this.win.getSelection()},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"range",{get:function(){var e=this.sel;return e&&e.rangeCount?e.getRangeAt(0):this.createRange()},enumerable:!1,configurable:!0}),e.prototype.createRange=function(e){void 0===e&&(e=!1);var t=this.doc.createRange();return e&&this.selectRange(t),t},e.prototype.remove=function(){var e=this.sel,t=this.current();if(e&&t)for(var o=0;e.rangeCount>o;o+=1)e.getRangeAt(o).deleteContents(),e.getRangeAt(o).collapse(!0);},e.prototype.clear=function(){var e,t;(null===(e=this.sel)||void 0===e?void 0:e.rangeCount)&&(null===(t=this.sel)||void 0===t||t.removeAllRanges());},e.prototype.removeNode=function(e){if(!a.Dom.isOrContains(this.j.editor,e,!0))throw s.error("Selection.removeNode can remove only editor's children");a.Dom.safeRemove(e),this.j.e.fire("afterRemoveNode",e);},e.prototype.insertCursorAtPoint=function(e,t){var o=this;this.removeMarkers();try{var r=this.createRange();return function(){if(o.doc.caretPositionFromPoint&&(i=o.doc.caretPositionFromPoint(e,t)))r.setStart(i.offsetNode,i.offset);else if(o.doc.caretRangeFromPoint){var i=o.doc.caretRangeFromPoint(e,t);r.setStart(i.startContainer,i.startOffset);}}(),r.collapse(!0),this.selectRange(r),!0}catch(e){}return !1},e.prototype.removeMarkers=function(){s.$$("span[data-"+i.MARKER_CLASS+"]",this.area).forEach(a.Dom.safeRemove);},e.prototype.marker=function(e,t){void 0===e&&(e=!1);var o=null;t&&(o=t.cloneRange()).collapse(e);var r=this.j.createInside.span();return r.id=i.MARKER_CLASS+"_"+Number(new Date)+"_"+String(Math.random()).slice(2),r.style.lineHeight="0",r.style.display="none",r.setAttribute("data-"+i.MARKER_CLASS,e?"start":"end"),r.appendChild(this.j.createInside.text(i.INVISIBLE_SPACE)),o&&a.Dom.isOrContains(this.area,e?o.startContainer:o.endContainer)&&o.insertNode(r),r},e.prototype.restore=function(e){var t=this;if(void 0===e&&(e=[]),s.isArray(e)){var o=!1;e.forEach((function(e){var r=t.area.querySelector("#"+e.endId),i=t.area.querySelector("#"+e.startId);if(i)if(o=t.createRange(),e.collapsed||!r){var n=i.previousSibling;a.Dom.isText(n)?o.setStart(n,n.nodeValue?n.nodeValue.length:0):o.setStartBefore(i),a.Dom.safeRemove(i),o.collapse(!0);}else o.setStartAfter(i),a.Dom.safeRemove(i),o.setEndBefore(r),a.Dom.safeRemove(r);})),o&&this.selectRange(o);}},e.prototype.save=function(){var e=this.sel;if(!e||!e.rangeCount)return [];var t,o,r,i=[],n=e.rangeCount,a=[];for(t=0;n>t;t+=1)a[t]=e.getRangeAt(t),a[t].collapsed?(o=this.marker(!0,a[t]),i[t]={startId:o.id,collapsed:!0,startMarker:o.outerHTML}):(o=this.marker(!0,a[t]),r=this.marker(!1,a[t]),i[t]={startId:o.id,endId:r.id,collapsed:!1,startMarker:o.outerHTML,endMarker:r.outerHTML});for(e.removeAllRanges(),t=n-1;t>=0;--t){var s=this.doc.getElementById(i[t].startId);if(s)if(i[t].collapsed)a[t].setStartAfter(s),a[t].collapse(!0);else if(a[t].setStartBefore(s),i[t].endId){var l=this.doc.getElementById(i[t].endId);l&&a[t].setEndAfter(l);}try{e.addRange(a[t].cloneRange());}catch(e){}}return i},e.prototype.focus=function(){var e,t;if(!this.isFocused()){this.j.iframe&&"complete"===this.doc.readyState&&this.j.iframe.focus(),this.win.focus(),this.area.focus();var o=this.sel,r=(null==o?void 0:o.rangeCount)?null==o?void 0:o.getRangeAt(0):null;if(!r||!a.Dom.isOrContains(this.area,r.startContainer)){var i=this.createRange();i.setStart(this.area,0),i.collapse(!0),this.selectRange(i,!1);}return this.j.editorIsActive||null===(t=null===(e=this.j)||void 0===e?void 0:e.events)||void 0===t||t.fire("focus"),!0}return !1},e.prototype.isCollapsed=function(){for(var e=this.sel,t=0;e&&e.rangeCount>t;t+=1)if(!e.getRangeAt(t).collapsed)return !1;return !0},e.prototype.isFocused=function(){return this.doc.hasFocus&&this.doc.hasFocus()&&this.area===this.doc.activeElement},e.prototype.current=function(e){if(void 0===e&&(e=!0),this.j.getRealMode()===i.MODE_WYSIWYG){var t=this.sel;if(!t||0===t.rangeCount)return null;var o=t.getRangeAt(0),r=o.startContainer,n=!1,s=function(e){return n?e.lastChild:e.firstChild};if(a.Dom.isTag(r,"br")&&t.isCollapsed)return r;if(!a.Dom.isText(r)){if((r=o.startContainer.childNodes[o.startOffset])||(r=o.startContainer.childNodes[o.startOffset-1],n=!0),r&&t.isCollapsed&&!a.Dom.isText(r))if(!n&&a.Dom.isText(r.previousSibling))r=r.previousSibling;else if(e)for(var l=s(r);l;){if(l&&a.Dom.isText(l)){r=l;break}l=s(l);}if(r&&!t.isCollapsed&&!a.Dom.isText(r)){var c=r,u=r;do{c=c.firstChild,u=u.lastChild;}while(c&&u&&!a.Dom.isText(c));c===u&&c&&a.Dom.isText(c)&&(r=c);}}if(r&&a.Dom.isOrContains(this.area,r))return r}return null},e.prototype.insertNode=function(e,t,o){var r;void 0===t&&(t=!0),void 0===o&&(o=!0),this.errorNode(e),!this.isFocused()&&this.j.isEditorMode()&&this.focus();var i=this.sel;if(this.isCollapsed()||this.j.execCommand("Delete"),i&&i.rangeCount){var s=i.getRangeAt(0);a.Dom.isOrContains(this.area,s.commonAncestorContainer)?a.Dom.isTag(s.startContainer,n.INSEPARABLE_TAGS)&&s.collapsed?null===(r=s.startContainer.parentNode)||void 0===r||r.insertBefore(e,s.startContainer):(s.deleteContents(),s.insertNode(e)):this.area.appendChild(e);}else this.area.appendChild(e);t&&(e.nodeType===Node.DOCUMENT_FRAGMENT_NODE?e.lastChild&&this.setCursorAfter(e.lastChild):this.setCursorAfter(e)),o&&this.j.events&&this.j.e.fire("synchro"),this.j.events&&this.j.e.fire("afterInsertNode",e);},e.prototype.insertHTML=function(e){if(""!==e){var t,o=this.j.createInside.div(),r=this.j.createInside.fragment();if(!this.isFocused()&&this.j.isEditorMode()&&this.focus(),a.Dom.isNode(e,this.win)?o.appendChild(e):o.innerHTML=e.toString(),(this.j.isEditorMode()||!1!==this.j.e.fire("insertHTML",o.innerHTML))&&(t=o.lastChild)){for(;o.firstChild;)t=o.firstChild,r.appendChild(o.firstChild);this.insertNode(r,!1,!1),t?this.setCursorAfter(t):this.setCursorIn(r),this.j.e&&this.j.e.fire("synchro");}}},e.prototype.insertImage=function(e,t,o){void 0===t&&(t=null),void 0===o&&(o=null);var r=s.isString(e)?this.j.createInside.element("img"):e;if(s.isString(e)&&r.setAttribute("src",e),null!=o){var i=o.toString();i&&"auto"!==i&&0>String(i).indexOf("px")&&0>String(i).indexOf("%")&&(i+="px"),s.css(r,"width",i);}t&&"object"==typeof t&&s.css(r,t);var n=function(){(r.offsetHeight>r.naturalHeight||r.offsetWidth>r.naturalWidth)&&(r.style.width="",r.style.height=""),r.removeEventListener("load",n);};this.j.e.on(r,"load",n),r.complete&&n();var a=this.insertNode(r);return this.j.e.fire("afterInsertImage",r),a},e.prototype.cursorInTheEdge=function(e,t){var o,r,i=!e,l=null===(o=this.sel)||void 0===o?void 0:o.getRangeAt(0),c=this.current(!1);if(!l||!c||!a.Dom.isOrContains(t,c,!0))return null;var u=e?l.startContainer:l.endContainer,d=e?l.startOffset:l.endOffset,p=function(e){return e&&!a.Dom.isTag(e,"br")&&!a.Dom.isEmptyTextNode(e)};if(a.Dom.isText(u)){var f=(null===(r=u.nodeValue)||void 0===r?void 0:r.length)?u.nodeValue:"";if(i&&f.replace(n.INVISIBLE_SPACE_REG_EXP_END(),"").length>d)return !1;var h=n.INVISIBLE_SPACE_REG_EXP_START().exec(f);if(e&&(h&&d>h[0].length||!h&&d>0))return !1}else {var m=s.toArray(u.childNodes);if(i){if(m.slice(d).some(p))return !1}else if(m.slice(0,d).some(p))return !1}return !s.call(e?a.Dom.prev:a.Dom.next,c,p,t)},e.prototype.cursorOnTheLeft=function(e){return this.cursorInTheEdge(!0,e)},e.prototype.cursorOnTheRight=function(e){return this.cursorInTheEdge(!1,e)},e.prototype.setCursorAfter=function(e){return this.setCursorNearWith(e,!1)},e.prototype.setCursorBefore=function(e){return this.setCursorNearWith(e,!0)},e.prototype.setCursorNearWith=function(e,t){var o,r,n=this;if(this.errorNode(e),!a.Dom.up(e,(function(e){return e===n.area||e&&e.parentNode===n.area}),this.area))throw s.error("Node element must be in editor");var l=this.createRange(),c=null;return a.Dom.isText(e)?t?l.setStart(e,0):l.setEnd(e,null!==(r=null===(o=e.nodeValue)||void 0===o?void 0:o.length)&&void 0!==r?r:0):(c=this.j.createInside.text(i.INVISIBLE_SPACE),t?l.setStartBefore(e):l.setEndAfter(e),l.collapse(t),l.insertNode(c),l.selectNode(c)),l.collapse(t),this.selectRange(l),c},e.prototype.setCursorIn=function(e,t){var o=this;if(void 0===t&&(t=!1),this.errorNode(e),!a.Dom.up(e,(function(e){return e===o.area||e&&e.parentNode===o.area}),this.area))throw s.error("Node element must be in editor");var r=this.createRange(),n=e,l=e;do{if(a.Dom.isText(n))break;l=n,n=t?n.firstChild:n.lastChild;}while(n);if(!n){var c=this.j.createInside.text(i.INVISIBLE_SPACE);/^(img|br|input)$/i.test(l.nodeName)?n=l:(l.appendChild(c),l=c);}return r.selectNodeContents(n||l),r.collapse(t),this.selectRange(r),l},e.prototype.selectRange=function(e,t){void 0===t&&(t=!0);var o=this.sel;t&&!this.isFocused()&&this.focus(),o&&(o.removeAllRanges(),o.addRange(e)),this.j.e.fire("changeSelection");},e.prototype.select=function(e,t){var o=this;if(void 0===t&&(t=!1),this.errorNode(e),!a.Dom.up(e,(function(e){return e===o.area||e&&e.parentNode===o.area}),this.area))throw s.error("Node element must be in editor");var r=this.createRange();r[t?"selectNodeContents":"selectNode"](e),this.selectRange(r);},Object.defineProperty(e.prototype,"html",{get:function(){var e=this.sel;if(e&&e.rangeCount>0){var t=e.getRangeAt(0).cloneContents(),o=this.j.createInside.div();return o.appendChild(t),o.innerHTML}return ""},enumerable:!1,configurable:!0}),e.prototype.wrapInTag=function(e){var t=this;if(s.$$("*[style*=font-size]",this.area).forEach((function(e){e.style&&e.style.fontSize&&e.setAttribute("data-font-size",e.style.fontSize.toString());})),this.isCollapsed()){var o=this.j.createInside.element("font");s.attr(o,"size",7),this.insertNode(o,!1,!1);}else this.doc.execCommand("fontsize",!1,"7");s.$$("*[data-font-size]",this.area).forEach((function(e){var t=s.attr(e,"data-font-size");e.style&&t&&(e.style.fontSize=t,e.removeAttribute("data-font-size"));}));var r=[];return s.$$('font[size="7"]',this.area).forEach((function(o){try{if(o.firstChild&&o.firstChild===o.lastChild&&t.isMarker(o.firstChild))return;s.isFunction(e)?e(o):r.push(a.Dom.replace(o,e,t.j.createInside));}finally{o.parentNode&&a.Dom.unwrap(o);}})),r},e.prototype.applyStyle=function(e,t){void 0===t&&(t={}),new l.Style({style:e,element:t.element,defaultTag:t.defaultTag}).apply(this.j);},e.prototype.splitSelection=function(e){if(!this.isCollapsed())return null;var t=this.createRange(),o=this.range;t.setStartBefore(e);var r=this.cursorOnTheRight(e),i=this.cursorOnTheLeft(e),s=this.j.createInside.element("br"),l=this.j.createInside.text(n.INVISIBLE_SPACE),c=l.cloneNode();try{if(r||i){o.insertNode(s);var u=function(e,t){for(var o=t(e);o;){var r=t(o);if(!o||!a.Dom.isTag(o,"br")&&!a.Dom.isEmptyTextNode(o))break;a.Dom.safeRemove(o),o=r;}};u(s,(function(e){return e.nextSibling})),u(s,(function(e){return e.previousSibling})),a.Dom.after(s,c),a.Dom.before(s,l),r?(t.setEndBefore(s),o.setEndBefore(s)):(t.setEndAfter(s),o.setEndAfter(s));}else t.setEnd(o.startContainer,o.startOffset);var d=t.extractContents();if(e.parentNode)try{if(e.parentNode.insertBefore(d,e),r&&(null==s?void 0:s.parentNode)){var p=this.createRange();p.setStartBefore(s),this.selectRange(p);}}catch(e){}var f=function(e){var t,o,r;(null===(t=null==e?void 0:e.parentNode)||void 0===t?void 0:t.firstChild)===(null===(o=null==e?void 0:e.parentNode)||void 0===o?void 0:o.lastChild)&&(null===(r=null==e?void 0:e.parentNode)||void 0===r||r.appendChild(s.cloneNode()));};f(l),f(c);}finally{a.Dom.safeRemove(l),a.Dom.safeRemove(c);}return e.previousElementSibling},r.__decorate([c.autobind],e.prototype,"focus",null),r.__decorate([c.autobind],e.prototype,"setCursorAfter",null),r.__decorate([c.autobind],e.prototype,"setCursorBefore",null),r.__decorate([c.autobind],e.prototype,"setCursorIn",null),e}();t.Select=u;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.StatusBar=void 0;var r=o(7);o(202);var i=o(42),n=o(33),a=function(e){function t(t,o){var r=e.call(this,t)||this;return r.target=o,r.container=t.c.div("jodit-status-bar"),o.appendChild(r.container),r.hide(),r}return r.__extends(t,e),t.prototype.className=function(){return "StatusBar"},t.prototype.hide=function(){this.container.classList.add("jodit_hidden");},t.prototype.show=function(){this.container.classList.remove("jodit_hidden");},Object.defineProperty(t.prototype,"isShown",{get:function(){return !this.container.classList.contains("jodit_hidden")},enumerable:!1,configurable:!0}),t.prototype.getHeight=function(){var e,t;return null!==(t=null===(e=this.container)||void 0===e?void 0:e.offsetHeight)&&void 0!==t?t:0},t.prototype.findEmpty=function(e){var t;void 0===e&&(e=!1);var o=null===(t=this.container)||void 0===t?void 0:t.querySelectorAll(".jodit-status-bar__item"+(e?".jodit-status-bar__item-right":""));if(o)for(var r=0;o.length>r;r+=1)if(!o[r].innerHTML.trim().length)return o[r]},t.prototype.append=function(e,t){var o;void 0===t&&(t=!1);var r=this.findEmpty(t)||this.j.c.div("jodit-status-bar__item");t&&r.classList.add("jodit-status-bar__item-right"),r.appendChild(e),null===(o=this.container)||void 0===o||o.appendChild(r),this.j.o.statusbar&&this.show(),this.j.e.fire("resize");},t.prototype.destruct=function(){this.setStatus(i.STATUSES.beforeDestruct),n.Dom.safeRemove(this.container),e.prototype.destruct.call(this);},t}(i.ViewComponent);t.StatusBar=a;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Table=void 0;var r=o(7),i=o(9),n=o(33),a=o(10),s=o(42),l=o(31),c=o(38),u=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.selected=new Set,t}return r.__extends(t,e),t.prototype.className=function(){return "Table"},t.prototype.recalculateStyles=function(){var e=l.getContainer(this.j,t,"style",!0),o=[];this.selected.forEach((function(e){var t=a.cssPath(e);t&&o.push(t);})),e.innerHTML=o.length?o.join(",")+"{"+this.jodit.options.table.selectionCellStyle+"}":"";},t.prototype.addSelection=function(e){this.selected.add(e),this.recalculateStyles();var o=n.Dom.closest(e,"table",this.j.editor);if(o){var r=t.selectedByTable.get(o)||new Set;r.add(e),t.selectedByTable.set(o,r);}},t.prototype.removeSelection=function(e){this.selected.delete(e),this.recalculateStyles();var o=n.Dom.closest(e,"table",this.j.editor);if(o){var r=t.selectedByTable.get(o);r&&(r.delete(e),r.size||t.selectedByTable.delete(o));}},t.prototype.getAllSelectedCells=function(){return a.toArray(this.selected)},t.getSelectedCellsByTable=function(e){var o=t.selectedByTable.get(e);return o?a.toArray(o):[]},t.prototype.destruct=function(){return this.selected.clear(),e.prototype.destruct.call(this)},t.getRowsCount=function(e){return e.rows.length},t.getColumnsCount=function(e){return t.formalMatrix(e).reduce((function(e,t){return Math.max(e,t.length)}),0)},t.formalMatrix=function(e,t){for(var o=[[]],r=a.toArray(e.rows),i=function(e,r){void 0===o[r]&&(o[r]=[]);for(var i,n,a=e.colSpan,s=e.rowSpan,l=0;o[r][l];)l+=1;for(n=0;s>n;n+=1)for(i=0;a>i;i+=1){if(void 0===o[r+n]&&(o[r+n]=[]),t&&!1===t(e,r+n,l+i,a,s))return !1;o[r+n][l+i]=e;}},n=0;r.length>n;n+=1)for(var s=a.toArray(r[n].cells),l=0;s.length>l;l+=1)if(!1===i(s[l],n))return o;return o},t.formalCoordinate=function(e,o,r){void 0===r&&(r=!1);var i=0,n=0,a=1,s=1;return t.formalMatrix(e,(function(e,t,l,c,u){if(o===e)return i=t,n=l,a=c||1,s=u||1,r&&(n+=(c||1)-1,i+=(u||1)-1),!1})),[i,n,a,s]},t.appendRow=function(e,o,r,i){var n;if(o)n=o.cloneNode(!0),a.$$("td,th",o).forEach((function(e){var t=a.attr(e,"rowspan");if(t&&parseInt(t,10)>1){var o=parseInt(t,10)-1;a.attr(e,"rowspan",o>1?o:null);}})),a.$$("td,th",n).forEach((function(e){e.innerHTML="";}));else {var s=t.getColumnsCount(e);n=i.element("tr");for(var l=0;s>l;l+=1)n.appendChild(i.element("td"));}r&&o&&o.nextSibling?o.parentNode&&o.parentNode.insertBefore(n,o.nextSibling):!r&&o?o.parentNode&&o.parentNode.insertBefore(n,o):(a.$$(":scope>tbody",e)[0]||e).appendChild(n);},t.removeRow=function(e,o){var r,i=t.formalMatrix(e),s=e.rows[o];a.each(i[o],(function(t,l){if(r=!1,0>o-1||i[o-1][t]!==l)if(i[o+1]&&i[o+1][t]===l){if(l.parentNode===s&&l.parentNode.nextSibling){r=!0;for(var c=t+1;i[o+1][c]===l;)c+=1;var u=n.Dom.next(l.parentNode,(function(e){return n.Dom.isTag(e,"tr")}),e);i[o+1][c]?u.insertBefore(l,i[o+1][c]):u.appendChild(l);}}else n.Dom.safeRemove(l);else r=!0;if(r&&(l.parentNode===s||l!==i[o][t-1])){var d=l.rowSpan;a.attr(l,"rowspan",d-1>1?(d-1).toString():null);}})),n.Dom.safeRemove(s);},t.appendColumn=function(e,o,r,i){var n,s=t.formalMatrix(e);for((void 0===o||0>o)&&(o=t.getColumnsCount(e)-1),n=0;s.length>n;n+=1){var l=i.element("td"),c=s[n][o],u=!1;r?(s[n]&&c&&o+1>=s[n].length||c!==s[n][o+1])&&(c.nextSibling?c.parentNode&&c.parentNode.insertBefore(l,c.nextSibling):c.parentNode&&c.parentNode.appendChild(l),u=!0):(0>o-1||s[n][o]!==s[n][o-1]&&s[n][o].parentNode)&&(c.parentNode&&c.parentNode.insertBefore(l,s[n][o]),u=!0),u||s[n][o].setAttribute("colspan",(parseInt(a.attr(s[n][o],"colspan")||"1",10)+1).toString());}},t.removeColumn=function(e,o){var r,i=t.formalMatrix(e);a.each(i,(function(e,t){var s=t[o];if(r=!1,0>o-1||i[e][o-1]!==s?t.length>o+1&&i[e][o+1]===s?r=!0:n.Dom.safeRemove(s):r=!0,r&&(0>e-1||s!==i[e-1][o])){var l=s.colSpan;a.attr(s,"colspan",l-1>1?(l-1).toString():null);}}));},t.getSelectedBound=function(e,o){var r,i,n,a=[[1/0,1/0],[0,0]],s=t.formalMatrix(e);for(r=0;s.length>r;r+=1)for(i=0;s[r]&&s[r].length>i;i+=1)o.includes(s[r][i])&&(a[0][0]=Math.min(r,a[0][0]),a[0][1]=Math.min(i,a[0][1]),a[1][0]=Math.max(r,a[1][0]),a[1][1]=Math.max(i,a[1][1]));for(r=a[0][0];a[1][0]>=r;r+=1)for(n=1,i=a[0][1];a[1][1]>=i;i+=1){for(;s[r]&&s[r][i-n]&&s[r][i]===s[r][i-n];)a[0][1]=Math.min(i-n,a[0][1]),a[1][1]=Math.max(i-n,a[1][1]),n+=1;for(n=1;s[r]&&s[r][i+n]&&s[r][i]===s[r][i+n];)a[0][1]=Math.min(i+n,a[0][1]),a[1][1]=Math.max(i+n,a[1][1]),n+=1;for(n=1;s[r-n]&&s[r][i]===s[r-n][i];)a[0][0]=Math.min(r-n,a[0][0]),a[1][0]=Math.max(r-n,a[1][0]),n+=1;for(n=1;s[r+n]&&s[r][i]===s[r+n][i];)a[0][0]=Math.min(r+n,a[0][0]),a[1][0]=Math.max(r+n,a[1][0]),n+=1;}return a},t.normalizeTable=function(e){var o,r,i,n,s=[],l=t.formalMatrix(e);for(r=0;l[0].length>r;r+=1){for(i=1e6,n=!1,o=0;l.length>o;o+=1)if(void 0!==l[o][r]){if(2>l[o][r].colSpan){n=!0;break}i=Math.min(i,l[o][r].colSpan);}if(!n)for(o=0;l.length>o;o+=1)void 0!==l[o][r]&&t.__mark(l[o][r],"colspan",l[o][r].colSpan-i+1,s);}for(o=0;l.length>o;o+=1){for(i=1e6,n=!1,r=0;l[o].length>r;r+=1)if(void 0!==l[o][r]){if(2>l[o][r].rowSpan){n=!0;break}i=Math.min(i,l[o][r].rowSpan);}if(!n)for(r=0;l[o].length>r;r+=1)void 0!==l[o][r]&&t.__mark(l[o][r],"rowspan",l[o][r].rowSpan-i+1,s);}for(o=0;l.length>o;o+=1)for(r=0;l[o].length>r;r+=1)void 0!==l[o][r]&&(l[o][r].hasAttribute("rowspan")&&1===l[o][r].rowSpan&&l[o][r].removeAttribute("rowspan"),l[o][r].hasAttribute("colspan")&&1===l[o][r].colSpan&&l[o][r].removeAttribute("colspan"),l[o][r].hasAttribute("class")&&!a.attr(l[o][r],"class")&&l[o][r].removeAttribute("class"));t.__unmark(s);},t.mergeSelected=function(e,o){var r,s=[],l=t.getSelectedBound(e,t.getSelectedCellsByTable(e)),c=0,u=null,p=0,f=0,h=0,m=[];l&&(l[0][0]-l[1][0]||l[0][1]-l[1][1])&&(t.formalMatrix(e,(function(e,i,n,v,g){if(!(l[0][0]>i||i>l[1][0]||l[0][1]>n||n>l[1][1])){if((r=e).__i_am_already_was)return;r.__i_am_already_was=!0,i===l[0][0]&&r.style.width&&(c+=r.offsetWidth),""!==a.trim(e.innerHTML.replace(/<br(\/)?>/g,""))&&s.push(e.innerHTML),v>1&&(f+=v-1),g>1&&(h+=g-1),u?(t.__mark(r,"remove",1,m),d(o).removeSelection(r)):(u=e,p=n);}})),f=l[1][1]-l[0][1]+1,h=l[1][0]-l[0][0]+1,u&&(f>1&&t.__mark(u,"colspan",f,m),h>1&&t.__mark(u,"rowspan",h,m),c&&(t.__mark(u,"width",(c/e.offsetWidth*100).toFixed(i.ACCURACY)+"%",m),p&&t.setColumnWidthByDelta(e,p,0,!0,m)),u.innerHTML=s.join("<br/>"),d(o).addSelection(u),delete u.__i_am_already_was,t.__unmark(m),t.normalizeTable(e),a.each(a.toArray(e.rows),(function(e,t){t.cells.length||n.Dom.safeRemove(t);}))));},t.splitHorizontal=function(e,o){var r,i,a,s,l,c=[];t.getSelectedCellsByTable(e).forEach((function(u){(i=o.createInside.element("td")).appendChild(o.createInside.element("br")),a=o.createInside.element("tr"),r=t.formalCoordinate(e,u),2>u.rowSpan?(t.formalMatrix(e,(function(e,o,i){r[0]===o&&r[1]!==i&&e!==u&&t.__mark(e,"rowspan",e.rowSpan+1,c);})),n.Dom.after(n.Dom.closest(u,"tr",e),a),a.appendChild(i)):(t.__mark(u,"rowspan",u.rowSpan-1,c),t.formalMatrix(e,(function(t,o,i){o>r[0]&&r[0]+u.rowSpan>o&&r[1]>i&&t.parentNode.rowIndex===o&&(l=t),o>r[0]&&t===u&&(s=e.rows[o]);})),l?n.Dom.after(l,i):s.insertBefore(i,s.firstChild)),u.colSpan>1&&t.__mark(i,"colspan",u.colSpan,c),t.__unmark(c),d(o).removeSelection(u);})),this.normalizeTable(e);},t.splitVertical=function(e,o){var r,a,s,l=[];t.getSelectedCellsByTable(e).forEach((function(c){r=t.formalCoordinate(e,c),2>c.colSpan?t.formalMatrix(e,(function(e,o,i){r[1]===i&&r[0]!==o&&e!==c&&t.__mark(e,"colspan",e.colSpan+1,l);})):t.__mark(c,"colspan",c.colSpan-1,l),(a=o.createInside.element("td")).appendChild(o.createInside.element("br")),c.rowSpan>1&&t.__mark(a,"rowspan",c.rowSpan,l);var u=c.offsetWidth;n.Dom.after(c,a),t.__mark(c,"width",(100*(s=u/e.offsetWidth/2)).toFixed(i.ACCURACY)+"%",l),t.__mark(a,"width",(100*s).toFixed(i.ACCURACY)+"%",l),t.__unmark(l),d(o).removeSelection(c);})),t.normalizeTable(e);},t.setColumnWidthByDelta=function(e,o,r,n,a){var s,l=t.formalMatrix(e);for(s=0;l.length>s;s+=1)t.__mark(l[s][o],"width",((l[s][o].offsetWidth+r)/e.offsetWidth*100).toFixed(i.ACCURACY)+"%",a);n||t.__unmark(a);},t.__mark=function(e,t,o,r){r.push(e),e.__marked_value||(e.__marked_value={}),e.__marked_value[t]=void 0===o?1:o;},t.__unmark=function(e){e.forEach((function(e){e.__marked_value&&(a.each(e.__marked_value,(function(t,o){switch(t){case"remove":n.Dom.safeRemove(e);break;case"rowspan":o>1?e.setAttribute("rowspan",o.toString()):e.removeAttribute("rowspan");break;case"colspan":o>1?e.setAttribute("colspan",o.toString()):e.removeAttribute("colspan");break;case"width":e.style.width=o.toString();}delete e.__marked_value[t];})),delete e.__marked_value);}));},t.selectedByTable=new WeakMap,r.__decorate([c.debounce()],t.prototype,"recalculateStyles",null),t}(s.ViewComponent);t.Table=u;var d=function(e){return e.getInstance("Table",e.o)};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(168),t),r.__exportStar(o(170),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Uploader=void 0;var r=o(7);o(206);var i=o(8),n=o(9),a=o(117),s=o(10),l=o(33),c=o(42),u=o(31);i.Config.prototype.enableDragAndDropFileToEditor=!0,i.Config.prototype.uploader={url:"",insertImageAsBase64URI:!1,imagesExtensions:["jpg","png","jpeg","gif"],headers:null,data:null,filesVariableName:function(e){return "files["+e+"]"},withCredentials:!1,pathVariableName:"path",format:"json",method:"POST",prepareData:function(e){return e},isSuccess:function(e){return e.success},getMessage:function(e){return void 0!==e.data.messages&&s.isArray(e.data.messages)?e.data.messages.join(" "):""},process:function(e){return e.data},error:function(e){this.j.e.fire("errorMessage",e.message,"error",4e3);},defaultHandlerSuccess:function(e){var t=this.j||this;s.isJoditObject(t)&&e.files&&e.files.length&&e.files.forEach((function(o,r){var i=e.isImages&&e.isImages[r]?["img","src"]:["a","href"],n=i[0],a=i[1],s=t.createInside.element(n);s.setAttribute(a,e.baseurl+o),"a"===n&&(s.textContent=e.baseurl+o),"img"===n?t.s.insertImage(s,null,t.o.imageDefaultWidth):t.s.insertNode(s);}));},defaultHandlerError:function(e){this.j.e.fire("errorMessage",e.message);},contentType:function(e){return (void 0===this.j.ow.FormData||"string"==typeof e)&&"application/x-www-form-urlencoded; charset=UTF-8"}};var d=function(e){function t(t,o){var r=e.call(this,t)||this;return r.path="",r.source="default",r.ajaxInstances=[],r.options=s.extend(!0,{},i.Config.defaultOptions.uploader,s.isJoditObject(t)?t.o.uploader:null,o),r}return r.__extends(t,e),t.prototype.className=function(){return "Uploader"},t.dataURItoBlob=function(e){for(var t=atob(e.split(",")[1]),o=e.split(",")[0].split(":")[1].split(";")[0],r=new ArrayBuffer(t.length),i=new Uint8Array(r),n=0;t.length>n;n+=1)i[n]=t.charCodeAt(n);return new Blob([i],{type:o})},Object.defineProperty(t.prototype,"o",{get:function(){return this.options},enumerable:!1,configurable:!0}),t.prototype.buildData=function(e){if(this.o.buildData&&"function"==typeof this.o.buildData)return this.o.buildData.call(this,e);var t=this.j.ow.FormData;if(void 0!==t){if(e instanceof t)return e;if("string"==typeof e)return e;var o=new t;return Object.keys(e).forEach((function(t){o.append(t,e[t]);})),o}return e},t.prototype.send=function(e,t){var o=this,r=this.buildData(e),i=function(e){var r=new a.Ajax(o.j||o,{xhr:function(){var e=new XMLHttpRequest;return void 0!==o.j.ow.FormData&&e.upload?e.upload.addEventListener("progress",(function(e){if(e.lengthComputable){var t=e.loaded/e.total;t*=100,o.j.progressbar.show().progress(t),100>t||o.j.progressbar.hide();}}),!1):o.j.progressbar.hide(),e},method:o.o.method||"POST",data:e,url:o.o.url,headers:o.o.headers,queryBuild:o.o.queryBuild,contentType:o.o.contentType.call(o,e),dataType:o.o.format||"json",withCredentials:o.o.withCredentials||!1});o.ajaxInstances.push(r);var i=function(){var e=o.ajaxInstances.indexOf(r);-1!==e&&o.ajaxInstances.splice(e,1);};return r.send().then((function(e){i(),t.call(o,e);})).catch((function(e){i(),o.o.error.call(o,e);}))};return r instanceof Promise?r.then(i).catch((function(e){o.o.error.call(o,e);})):i(r)},t.prototype.sendFiles=function(e,t,o,r){var i=this;if(!e)return Promise.reject(s.error("Need files"));var n=this,a=s.toArray(e);if(!a.length)return Promise.reject(s.error("Need files"));var l=[];if(this.o.insertImageAsBase64URI){var c,u=void 0,d=function(){if((c=a[u])&&c.type){var e=c.type.match(/\/([a-z0-9]+)/i),o=e[1]?e[1].toLowerCase():"";if(p.o.imagesExtensions.includes(o)){var r=new FileReader;l.push(new Promise((function(e,o){r.onerror=o,r.onloadend=function(){var o={baseurl:"",files:[r.result],isImages:[!0]};"function"==typeof(t||n.options.defaultHandlerSuccess)&&(t||n.options.defaultHandlerSuccess).call(n,o),e(o);},r.readAsDataURL(c);}))),a[u]=null;}}},p=this;for(u=0;a.length>u;u+=1)d();}if((a=a.filter((function(e){return e}))).length){var f=new FormData;f.append(this.o.pathVariableName,n.path),f.append("source",n.source);var h=void 0;for(u=0;a.length>u;u+=1)if(h=a[u]){var m=h.type.match(/\/([a-z0-9]+)/i),v=m&&m[1]?m[1].toLowerCase():"",g=a[u].name||Math.random().toString().replace(".","");if(v){var y=v;["jpeg","jpg"].includes(y)&&(y="jpeg|jpg"),new RegExp(".("+y+")$","i").test(g)||(g+="."+v);}f.append(this.o.filesVariableName(u),a[u],g);}r&&r(f),n.o.data&&s.isPlainObject(n.o.data)&&Object.keys(n.o.data).forEach((function(e){f.append(e,n.o.data[e]);})),n.o.prepareData.call(this,f),l.push(n.send(f,(function(e){if(i.o.isSuccess.call(n,e))"function"==typeof(t||n.o.defaultHandlerSuccess)&&(t||n.options.defaultHandlerSuccess).call(n,n.o.process.call(n,e));else if(s.isFunction(o||n.o.defaultHandlerError))return void(o||n.options.defaultHandlerError).call(n,s.error(n.o.getMessage.call(n,e)))})).then((function(){i.j.events&&i.j.e.fire("filesWereUploaded");})));}return Promise.all(l)},t.prototype.setPath=function(e){this.path=e;},t.prototype.setSource=function(e){this.source=e;},t.prototype.bind=function(e,o,r){var i=this,a=this,c=function(e){var c,d,p,f=e.clipboardData,h=function(e){d&&(e.append("extension",p),e.append("mimetype",d.type));};if(f&&f.files&&f.files.length)return i.sendFiles(f.files,o,r),!1;if(n.IS_IE){if(f&&(!f.types.length||f.types[0]!==n.TEXT_PLAIN)){var m=i.j.c.div("",{tabindex:-1,style:"left: -9999px; top: 0; width: 0; height: 100%;line-height: 140%; overflow: hidden; position: fixed; z-index: 2147483647; word-break: break-all;",contenteditable:!0});u.getContainer(i.j,t).appendChild(m);var v=s.isJoditObject(i.j)?i.j.s.save():null;m.focus(),i.j.async.setTimeout((function(){var e=m.firstChild;if(l.Dom.safeRemove(m),e&&e.hasAttribute("src")){var n=s.attr(e,"src")||"";v&&s.isJoditObject(i.j)&&i.j.s.restore(v),a.sendFiles([t.dataURItoBlob(n)],o,r);}}),i.j.defaultTimeout);}}else if(f&&f.items&&f.items.length){var g=f.items;for(c=0;g.length>c;c+=1)if("file"===g[c].kind&&"image/png"===g[c].type){if(d=g[c].getAsFile()){var y=d.type.match(/\/([a-z0-9]+)/i);p=y[1]?y[1].toLowerCase():"",i.sendFiles([d],o,r,h);}e.preventDefault();break}}};this.j&&this.j.editor!==e?a.j.e.on(e,"paste",c):a.j.e.on("beforePaste",c);var d=function(e){return Boolean(e.dataTransfer&&e.dataTransfer.files&&0!==e.dataTransfer.files.length)};a.j.e.on(e,"dragend dragover dragenter dragleave drop",(function(e){e.preventDefault();})).on(e,"dragover",(function(t){d(t)&&(e.classList.contains("jodit_draghover")||e.classList.add("jodit_draghover"),t.preventDefault());})).on(e,"dragend",(function(t){d(t)&&(e.classList.contains("jodit_draghover")&&e.classList.remove("jodit_draghover"),t.preventDefault());})).on(e,"drop",(function(t){e.classList.remove("jodit_draghover"),d(t)&&t.dataTransfer&&t.dataTransfer.files&&(t.preventDefault(),t.stopImmediatePropagation(),i.sendFiles(t.dataTransfer.files,o,r));}));var p=e.querySelector("input[type=file]");p&&a.j.e.on(p,"change",(function(){a.sendFiles(this.files,o,r).then((function(){p.value="",/safari/i.test(navigator.userAgent)||(p.type="",p.type="file");}));}));},t.prototype.uploadRemoteImage=function(e,t,o){var r=this,i=this;i.send({action:"fileUploadRemote",url:e},(function(e){if(i.o.isSuccess.call(i,e))"function"==typeof t?t.call(i,r.o.process.call(r,e)):r.o.defaultHandlerSuccess.call(i,r.o.process.call(r,e));else if("function"==typeof(o||i.o.defaultHandlerError))return void(o||r.o.defaultHandlerError).call(i,s.error(i.o.getMessage.call(r,e)))}));},t.prototype.destruct=function(){this.setStatus(c.STATUSES.beforeDestruct),this.ajaxInstances.forEach((function(e){try{e.destruct();}catch(e){}})),e.prototype.destruct.call(this);},t}(c.ViewComponent);t.Uploader=d;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(14),i=o(208),n=o(209),a=o(210),s=o(211),l={ar:i,cs_cz:n,de:a,en:s,es:o(212),fr:o(213),he:o(214),hu:o(215),id:o(216),it:o(217),ja:o(218),ko:o(219),nl:o(220),pl:o(221),pt_br:o(222),ru:o(223),tr:o(224),zh_cn:o(225),zh_tw:o(226)},c=function(e){return e.default||e},u={};r.isArray(c(s))&&c(s).forEach((function(e,t){u[t]=e;})),Object.keys(l).forEach((function(e){var t=c(l[e]);r.isArray(t)&&(l[e]={},t.forEach((function(t,o){l[e][u[o]]=t;})));})),t.default=l;},e=>{e.exports={"Type something":"إبدأ في الكتابة...","About Jodit":"حول جوديت","Jodit Editor":"محرر جوديت","Jodit User's Guide":"دليل مستخدم جوديت","contains detailed help for using":"يحتوي على مساعدة مفصلة للاستخدام","For information about the license, please go to our website:":"للحصول على معلومات حول الترخيص، يرجى الذهاب لموقعنا:","Buy full version":"شراء النسخة الكاملة","Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.":"حقوق الطبع والنشر © XDSoft.net - Chupurnov Valeriy. كل الحقوق محفوظة.",Anchor:"مِرْساة","Open in new tab":"فتح في نافذة جديدة","Open editor in fullsize":"فتح المحرر في الحجم الكامل","Clear Formatting":"مسح التنسيق","Fill color or set the text color":"ملء اللون أو تعيين لون النص",Redo:"إعادة",Undo:"تراجع",Bold:"عريض",Italic:"مائل","Insert Unordered List":"إدراج قائمة غير مرتبة","Insert Ordered List":"إدراج قائمة مرتبة","Align Center":"محاذاة للوسط","Align Justify":"محاذاة مثبتة","Align Left":"محاذاة لليسار","Align Right":"محاذاة لليمين","Insert Horizontal Line":"إدراج خط أفقي","Insert Image":"إدراج صورة","Insert file":"ادخال الملف","Insert youtube/vimeo video":"إدراج فيديو يوتيوب/فيميو ","Insert link":"إدراج رابط","Font size":"حجم الخط","Font family":"نوع الخط","Insert format block":"إدراج كتلة تنسيق",Normal:"عادي","Heading 1":"عنوان 1","Heading 2":"عنوان 2","Heading 3":"عنوان 3","Heading 4":"عنوان 4",Quote:"إقتباس",Code:"كود",Insert:"إدراج","Insert table":"إدراج جدول","Decrease Indent":"تقليل المسافة البادئة","Increase Indent":"زيادة المسافة البادئة","Select Special Character":"تحديد أحرف خاصة","Insert Special Character":"إدراج حرف خاص","Paint format":"تنسيق الرسم","Change mode":"تغيير الوضع",Margins:"هوامش",top:"أعلى",right:"يمين",bottom:"أسفل",left:"يسار",Styles:"الأنماط",Classes:"الطبقات",Align:"محاذاة",Right:"اليمين",Center:"الوسط",Left:"اليسار","--Not Set--":"--غير مضبوط--",Src:"Src",Title:"العنوان",Alternative:"العنوان البديل",Link:"الرابط","Open link in new tab":"افتح الرابط في نافذة جديدة",Image:"الصورة",file:"ملف",Advanced:"متقدم","Image properties":"خصائص الصورة",Cancel:"إلغاء",Ok:"حسنا","File Browser":"متصفح الملفات","Error on load list":"حدث خطأ في تحميل القائمة ","Error on load folders":"حدث خطأ في تحميل المجلدات","Are you sure?":"هل أنت واثق؟","Enter Directory name":"أدخل اسم المجلد","Create directory":"إنشاء مجلد","type name":"أكتب إسم","Drop image":"إسقاط صورة","Drop file":"إسقاط الملف","or click":"أو أنقر","Alternative text":"النص البديل",Upload:"رفع",Browse:"تصفح",Background:"الخلفية",Text:"نص",Top:"أعلى",Middle:"الوسط",Bottom:"الأسفل","Insert column before":"إدراج عمود قبل","Insert column after":"إدراج عمود بعد","Insert row above":"إدراج صف أعلى","Insert row below":"إدراج صف أسفل","Delete table":"حذف الجدول","Delete row":"حذف الصف","Delete column":"حذف العمود","Empty cell":"خلية فارغة","Chars: %d":"%d حرف","Words: %d":"%d كلام","Strike through":"اضرب من خلال",Underline:"أكد",superscript:"حرف فوقي",subscript:"مخطوطة","Cut selection":"قطع الاختيار","Select all":"اختر الكل",Break:"استراحة","Search for":"البحث عن","Replace with":"استبدل ب",Replace:"محل",Paste:"معجون","Choose Content to Paste":"اختر محتوى للصق",source:"مصدر",bold:"بالخط العريض",italic:"مائل",brush:"شغل",link:"صلة",undo:"إلغاء",redo:"كرر",table:"طاولة",image:"صورة",eraser:"نظيف",paragraph:"فقرة",fontsize:"حجم الخط",video:"فيديو",font:"الخط",about:"حول المحرر",print:"طباعة",symbol:"رمز",underline:"أكد",strikethrough:"شطب",indent:"المسافة البادئة",outdent:"نتوء",fullsize:"ملء الشاشة",shrink:"الحجم التقليدي",copyformat:"نسخ التنسيق",hr:"الخط",ul:"قائمة",ol:"قائمة مرقمة",cut:"قطع",selectall:"اختر الكل","Embed code":"قانون","Open link":"فتح الرابط","Edit link":"تعديل الرابط","No follow":"سمة Nofollow",Unlink:"إزالة الرابط",Update:"تحديث",pencil:"لتحرير",Eye:"مراجعة"," URL":"URL",Edit:"تحرير","Horizontal align":"محاذاة أفقية",Filter:"فلتر","Sort by changed":"عن طريق التغيير","Sort by name":"بالاسم","Sort by size":"حسب الحجم","Add folder":"إضافة مجلد",Reset:"إعادة",Save:"احتفظ","Save as ...":"حفظ باسم",Resize:"تغيير الحجم",Crop:"حجم القطع",Width:"عرض",Height:"ارتفاع","Keep Aspect Ratio":"حافظ على النسب",Yes:"أن",No:"لا",Remove:"حذف",Select:"تميز","Select %s":"تميز %s","Vertical align":"محاذاة عمودية",Split:"انشق، مزق",Merge:"اذهب","Add column":"أضف العمود","Add row":"اضف سطر","License: %s":"رخصة %s",Delete:"حذف","Split vertical":"انقسام عمودي","Split horizontal":"تقسيم أفقي",Border:"الحدود","Your code is similar to HTML. Keep as HTML?":"يشبه الكود الخاص بك HTML. تبقي كما HTML؟","Paste as HTML":"الصق ك HTML",Keep:"احتفظ","Insert as Text":"إدراج كنص","Insert only Text":"إدراج النص فقط","You can only edit your own images. Download this image on the host?":"يمكنك فقط تحرير صورك الخاصة. تحميل هذه الصورة على المضيف؟","The image has been successfully uploaded to the host!":"تم تحميل الصورة بنجاح على الخادم!",palette:"لوحة","There are no files":"لا توجد ملفات في هذا الدليل.",Rename:"إعادة تسمية","Enter new name":"أدخل اسم جديد",preview:"معاينة",download:"تحميل","Paste from clipboard":"لصق من الحافظة","Your browser doesn't support direct access to the clipboard.":"متصفحك لا يدعم إمكانية الوصول المباشر إلى الحافظة.","Copy selection":"نسخ التحديد",copy:"نسخ","Border radius":"دائرة نصف قطرها الحدود","Show all":"عرض كل",Apply:"تطبيق","Please fill out this field":"يرجى ملء هذا المجال","Please enter a web address":"يرجى إدخال عنوان ويب",Default:"الافتراضي",Circle:"دائرة",Dot:"نقطة",Quadrate:"المربعة",Find:"البحث","Find Previous":"تجد السابقة","Find Next":"تجد التالي","The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?":"للصق المحتوى قادم من Microsoft Word/Excel الوثيقة. هل تريد أن تبقي شكل أو تنظيفه ؟ ","Word Paste Detected":"كلمة لصق الكشف عن",Clean:"نظيفة"};},e=>{e.exports={"Type something":"Napiš něco","About Jodit":"O Jodit","Jodit Editor":"Editor Jodit","Free Non-commercial Version":"Verze pro nekomerční použití","Jodit User's Guide":"Jodit Uživatelská příručka","contains detailed help for using":"obsahuje detailní nápovědu","For information about the license, please go to our website:":"Pro informace o licenci, prosím, přejděte na naši stránku:","Buy full version":"Koupit plnou verzi","Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.":"Copyright © XDSoft.net - Chupurnov Valeriy. Všechna práva vyhrazena.",Anchor:"Anchor","Open in new tab":"Otevřít v nové záložce","Open editor in fullsize":"Otevřít v celoobrazovkovém režimu","Clear Formatting":"Vyčistit formátování","Fill color or set the text color":"Barva výplně a písma",Redo:"Vpřed",Undo:"Zpět",Bold:"Tučné",Italic:"Kurzíva","Insert Unordered List":"Odrážky","Insert Ordered List":"Číslovaný seznam","Align Center":"Zarovnat na střed","Align Justify":"Zarovnat do bloku","Align Left":"Zarovnat vlevo","Align Right":"Zarovnat vpravo","Insert Horizontal Line":"Vložit horizontální linku","Insert Image":"Vložit obrázek","Insert file":"Vložit soubor","Insert youtube/vimeo video":"Vložit video (YT/Vimeo)","Insert link":"Vložit odkaz","Font size":"Velikost písma","Font family":"Typ písma","Insert format block":"Formátovat blok",Normal:"Normální text","Heading 1":"Nadpis 1","Heading 2":"Nadpis 2","Heading 3":"Nadpis 3","Heading 4":"Nadpis 4",Quote:"Citát",Code:"Kód",Insert:"Vložit","Insert table":"Vložit tabulku","Decrease Indent":"Zmenšit odsazení","Increase Indent":"Zvětšit odsazení","Select Special Character":"Vybrat speciální symbol","Insert Special Character":"Vložit speciální symbol","Paint format":"Použít formát","Change mode":"Změnit mód",Margins:"Okraje",top:"horní",right:"pravý",bottom:"spodní",left:"levý",Styles:"Styly",Classes:"Třídy",Align:"Zarovnání",Right:"Vpravo",Center:"Na střed",Left:"Vlevo","--Not Set--":"--nenastaveno--",Src:"src",Title:"Titulek",Alternative:"Alternativní text (alt)",Link:"Link","Open link in new tab":"Otevřít link v nové záložce",Image:"Obrázek",file:"soubor",Advanced:"Rozšířené","Image properties":"Vlastnosti obrázku",Cancel:"Zpět",Ok:"Ok","Your code is similar to HTML. Keep as HTML?":"Váš text se podobá HTML. Vložit ho jako HTML?","Paste as HTML":"Vložit jako HTML",Keep:"Ponechat originál",Clean:"Vyčistit","Insert as Text":"Vložit jako TEXT","Insert only Text":"Vložit pouze TEXT","Word Paste Detected":"Detekován fragment z Wordu nebo Excelu","The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?":"Obsah, který vkládáte, je pravděpodobně z Microsoft Word / Excel. Chcete ponechat formát nebo vložit pouze text?","File Browser":"Prohlížeč souborů","Error on load list":"Chyba při načítání seznamu souborů","Error on load folders":"Chyba při načítání složek","Are you sure?":"Jste si jistý(á)?","Enter Directory name":"Název složky","Create directory":"Vytvořit složku","type name":"název","Drop image":"Přetáhněte sem obrázek","Drop file":"Přetáhněte sem soubor","or click":"nebo klikněte","Alternative text":"Alternativní text",Browse:"Server",Upload:"Nahrát",Background:"Pozadí",Text:"Text",Top:"Nahoru",Middle:"Na střed",Bottom:"Dolu","Insert column before":"Vložit sloupec před","Insert column after":"Vložit sloupec za","Insert row above":"Vložit řádek nad","Insert row below":"Vložit řádek pod","Delete table":"Vymazat tabulku","Delete row":"Vymazat řádku","Delete column":"Vymazat sloupec","Empty cell":"Vyčistit buňku",source:"HTML",bold:"tučně",italic:"kurzíva",brush:"štětec",link:"odkaz",undo:"zpět",redo:"vpřed",table:"tabulka",image:"obrázek",eraser:"guma",paragraph:"odstavec",fontsize:"velikost písma",video:"video",font:"písmo",about:"о editoru",print:"tisk",symbol:"symbol",underline:"podtrženo",strikethrough:"přeškrtnuto",indent:"zvětšit odsazení",outdent:"zmenšit odsazení",fullsize:"celoobrazovkový režim",shrink:"smrsknout",copyformat:"Kopírovat formát",hr:"Linka",ul:"Odrážka",ol:"Číslovaný seznam",cut:"Vyjmout",selectall:"Označit vše","Embed code":"Kód","Open link":"Otevřít odkaz","Edit link":"Upravit odkaz","No follow":"Atribut no-follow",Unlink:"Odstranit odkaz",Eye:"Zobrazit",pencil:"Chcete-li upravit",Update:"Aktualizovat"," URL":"URL",Edit:"Editovat","Horizontal align":"Horizontální zarovnání",Filter:"Filtr","Sort by changed":"Dle poslední změny","Sort by name":"Dle názvu","Sort by size":"Dle velikosti","Add folder":"Přidat složku",Reset:"Reset",Save:"Uložit","Save as ...":"Uložit jako...",Resize:"Změnit rozměr",Crop:"Ořezat",Width:"Šířka",Height:"Výška","Keep Aspect Ratio":"Ponechat poměr",Yes:"Ano",No:"Ne",Remove:"Vyjmout",Select:"Označit","Chars: %d":"Znaky: %d","Words: %d":"Slova: %d",All:"Vše","Select %s":"Označit %s","Select all":"Označit vše","Vertical align":"Vertikální zarovnání",Split:"Rozdělit","Split vertical":"Rozdělit vertikálně","Split horizontal":"Rozdělit horizontálně",Merge:"Spojit","Add column":"Přidat sloupec","Add row":"Přidat řádek",Delete:"Vymazat",Border:"Okraj","License: %s":"Licence: %s","Strike through":"Přeškrtnuto",Underline:"Podtrženo",superscript:"Horní index",subscript:"Dolní index","Cut selection":"Vyjmout označené",Break:"Zalomení","Search for":"Najdi","Replace with":"Nahradit za",Replace:"Vyměňte",Paste:"Vložit","Choose Content to Paste":"Vyber obsah pro vložení","You can only edit your own images. Download this image on the host?":"Můžete upravovat pouze své obrázky. Načíst obrázek?","The image has been successfully uploaded to the host!":"Obrázek byl úspěšně nahrán!",palette:"paleta","There are no files":"V tomto adresáři nejsou žádné soubory.",Rename:"přejmenovat","Enter new name":"Zadejte nový název",preview:"náhled",download:"Stažení","Paste from clipboard":"Vložit ze schránky","Your browser doesn't support direct access to the clipboard.":"Váš prohlížeč nepodporuje přímý přístup do schránky.","Copy selection":"Kopírovat výběr",copy:"kopírování","Border radius":"Border radius","Show all":"Zobrazit všechny",Apply:"Platí","Please fill out this field":"Prosím, vyplňte toto pole","Please enter a web address":"Prosím, zadejte webovou adresu",Default:"Výchozí",Circle:"Kruh",Dot:"Dot",Quadrate:"Quadrate",Find:"Najít","Find Previous":"Najít Předchozí","Find Next":"Najít Další"};},e=>{e.exports={"Type something":"Bitte geben Sie einen Text ein",Advanced:"Fortgeschritten","About Jodit":"Über Jodit","Jodit Editor":"Jodit Editor","Jodit User's Guide":"Das Jodit Benutzerhandbuch","contains detailed help for using":"beinhaltet ausführliche Informationen wie Sie den Editor verwenden können.","For information about the license, please go to our website:":"Für Lizenz-Informationen, besuchen Sie bitte unsere Webseite:","Buy full version":"Vollversion kaufen","Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.":"Copyright © XDSoft.net - Chupurnov Valeriy. Alle Rechte vorbehalten.",Anchor:"Anker","Open in new tab":"In neuer Registerkarte öffnen","Open editor in fullsize":"Editor in voller Größe öffnen","Clear Formatting":"Formatierung löschen","Fill color or set the text color":"Füllfarbe oder Textfarbe ändern",Redo:"Wiederholen",Undo:"Rückgängig machen",Bold:"Fett",Italic:"Kursiv","Insert Unordered List":"Ungeordnete Liste einfügen","Insert Ordered List":"Sortierte Liste einfügen","Align Center":"Mittig ausrichten","Align Justify":"Blocksatz","Align Left":"Links ausrichten","Align Right":"Rechts ausrichten","Insert Horizontal Line":"Horizontale Linie einfügen","Insert Image":"Bild einfügen","Insert file":"Datei einfügen","Insert youtube/vimeo video":"Youtube/vimeo Video einfügen","Insert link":"Link einfügen","Font size":"Schriftgröße","Font family":"Schriftfamilie","Insert format block":"Formatblock einfügen",Normal:"Normal","Heading 1":"Überschrift 1","Heading 2":"Überschrift 2","Heading 3":"Überschrift 3","Heading 4":"Überschrift 4",Quote:"Zitat",Code:"Code",Insert:"Einfügen","Insert table":"Tabelle einfügen","Decrease Indent":"Einzug verkleinern","Increase Indent":"Einzug vergrößern","Select Special Character":"Sonderzeichen auswählen","Insert Special Character":"Sonderzeichen einfügen","Paint format":"Format kopieren","Change mode":"Änderungsmodus",Margins:"Ränder",top:"Oben",right:"Rechts",bottom:"Unten",left:"Links",Styles:"CSS Stiel",Classes:"CSS Klassen",Align:"Ausrichten",Right:"Rechts",Center:"Zentriert",Left:"Links","--Not Set--":"Keine",Src:"Pfad",Title:"Titel",Alternative:"Alternativer Text",Link:"Link","Open link in new tab":"Link in neuem Tab öffnen",Image:"Bild",file:"Datei",Advansed:"Erweitert","Image properties":"Bildeigenschaften",Cancel:"Abbrechen",Ok:"OK","Your code is similar to HTML. Keep as HTML?":"Es scheint als dass Sie HTML-Text einfügen möchten","Paste as HTML":"Als HTML einfügen?",Keep:"Original speichern",Clean:"Säubern","Insert as Text":"Als Text einfügen","Word Paste Detected":"In Word formatierter Text erkannt","The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?":"Der Inhalt, den Sie einfügen, stammt aus einem Microsoft Word / Excel-Dokument. Möchten Sie das Format erhalten oder löschen?","Insert only Text":"Nur Text einfügen","File Browser":"Dateibrowser","Error on load list":"Fehler beim Laden der Liste","Error on load folders":"Fehler beim Laden der Ordner","Are you sure?":"Sind Sie sicher?","Enter Directory name":"Geben Sie den Verzeichnisnamen ein","Create directory":"Verzeichnis erstellen","type name":"Typname","Drop image":"Bild hier hinziehen","Drop file":"Datei löschen","or click":"oder hier klicken","Alternative text":"Alternativtext",Browse:"Auswählen",Upload:"Hochladen",Background:"Hintergrund",Text:"Text",Top:"Oben",Middle:"Mittig",Bottom:"Unten","Insert column before":"Spalte einfügen vor","Insert column after":"Spalte einfügen nach","Insert row above":"Zeile einfügen oberhalb","Insert row below":"Zeile unterhalb einfügen","Delete table":"Tabelle löschen","Delete row":"Zeile löschen","Delete column":"Spalte löschen","Empty cell":"Leere Zelle",Delete:"Löschen","Strike through":"Durchschlagen",Underline:"Unterstreichen",Break:"Pause","Search for":"Suche nach","Replace with":"Ersetzen durch",Replace:"Ersetzen",Edit:"Bearbeiten","Vertical align":"Vertikale Ausrichtung","Horizontal align":"Horizontale Ausrichtung",Filter:"filter","Sort by changed":"Sortieren nach geändert","Sort by name":"Nach Name sortieren","Sort by size":"Nach Größe sortiert","Add folder":"Ordner hinzufügen","Split vertical":"Split vertikal","Split horizontal":"Split horizontally",Split:"Split",Merge:"Verschmelzen","Add column":"Spalte hinzufügen","Add row":"Zeile hinzufügen",Border:"Rand","Embed code":"Code einbetten",Update:"Aktualisieren",superscript:"hochgestellt",subscript:"Index","Cut selection":"Auswahl ausschneid",Paste:"Einfügen","Choose Content to Paste":"Wählen Sie Inhalt zum Einfügen","Chars: %d":"Zeichen: %d","Words: %d":"Wörter: %d",All:"Wählen Sie Alle aus","Select %s":"Markieren: %s","Select all":"Wählen Sie Alle aus",source:"HTML",bold:"Fett gedruckt",italic:"kursiv",brush:"Bürste",link:"Verknüpfung",undo:"rückgängig machen",redo:"wiederholen",table:"Tabelle",image:"Bild",eraser:"Radiergummi",paragraph:"Absatz",fontsize:"Schriftgröße",video:"Video",font:"Schriftart",about:"Über",print:"drucken",symbol:"Symbol",underline:"unterstreichen",strikethrough:"durchgestrichen",indent:"Einzug",outdent:"Aussenseiter",fullsize:"Vollgröße",shrink:"schrumpfen",copyformat:"Format kopierenт",hr:"die Linie",ul:"Liste von",ol:"Nummerierte Liste",cut:"Schnitt",selectall:"Wählen Sie Alle aus","Open link":"Link öffnen","Edit link":"Link bearbeiten","No follow":"Nofollow-Attribut",Unlink:"Link entfernen",Eye:"Ansehen",pencil:"Bearbeiten"," URL":"URL",Reset:"Wiederherstellen",Save:"Speichern","Save as ...":"Speichern als",Resize:"Ändern Sie die Größe",Crop:"Größe anpassen",Width:"Breite",Height:"Höhe","Keep Aspect Ratio":"Halten Sie Proportionen",Yes:"Ja",No:"Nein",Remove:"Entfernen",Select:"Markieren","You can only edit your own images. Download this image on the host?":"Sie können nur Ihre eigenen Bilder bearbeiten. Laden Sie dieses Bild auf dem Host herunter?","The image has been successfully uploaded to the host!":"Das Bild wurde erfolgreich auf den Server hochgeladen!null",palette:"Palette","There are no files":"In diesem Verzeichnis befinden sich keine Dateien.",Rename:"umbenennen","Enter new name":"Geben Sie einen neuen Namen ein",preview:"Vorschau",download:"Herunterladen","Paste from clipboard":"Aus der Zwischenablage einfügen","Your browser doesn't support direct access to the clipboard.":"Ihr browser unterstützt kein direkter Zugriff auf die Zwischenablage.","Copy selection":"Auswahl kopieren",copy:"kopieren","Border radius":"Border-radius","Show all":"Alle anzeigen",Apply:"Bewerben","Please fill out this field":"Bitte füllen Sie dieses Feld aus","Please enter a web address":"Bitte geben Sie eine web-Adresse",Default:"Standard",Circle:"Kreis",Dot:"Dot",Quadrate:"Quadrate",Find:"Finden","Find Previous":"Finden Frühere","Find Next":"Weitersuchen"};},e=>{e.exports={"Type something":"Start writing...",pencil:"Edit",Quadrate:"Square"};},e=>{e.exports={"Type something":"Escriba algo...",Advanced:"Avanzado","About Jodit":"Acerca de Jodit","Jodit Editor":"Jodit Editor","Jodit User's Guide":"Guía de usuario Jodit","contains detailed help for using":"contiene ayuda detallada para el uso.","For information about the license, please go to our website:":"Para información sobre la licencia, por favor visite nuestro sitio:","Buy full version":"Compre la versión completa","Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.":"Copyright © XDSoft.net - Chupurnov Valeriy. Todos los derechos reservados.",Anchor:"Anclar","Open in new tab":"Abrir en nueva pestaña","Open editor in fullsize":"Abrir editor en pantalla completa","Clear Formatting":"Limpiar formato","Fill color or set the text color":"Color de relleno o de letra",Redo:"Rehacer",Undo:"Deshacer",Bold:"Negrita",Italic:"Cursiva","Insert Unordered List":"Insertar lista no ordenada","Insert Ordered List":"Insertar lista ordenada","Align Center":"Alinear Centrado","Align Justify":"Alinear Justificado","Align Left":"Alinear Izquierda","Align Right":"Alinear Derecha","Insert Horizontal Line":"Insertar línea horizontal","Insert Image":"Insertar imagen","Insert file":"Insertar archivo","Insert youtube/vimeo video":"Insertar video de Youtube/vimeo","Insert link":"Insertar vínculo","Font size":"Tamaño de letra","Font family":"Familia de letra","Insert format block":"Insertar bloque",Normal:"Normal","Heading 1":"Encabezado 1","Heading 2":"Encabezado 2","Heading 3":"Encabezado 3","Heading 4":"Encabezado 4",Quote:"Cita",Code:"Código",Insert:"Insertar","Insert table":"Insertar tabla","Decrease Indent":"Disminuir sangría","Increase Indent":"Aumentar sangría","Select Special Character":"Seleccionar caracter especial","Insert Special Character":"Insertar caracter especial","Paint format":"Copiar formato","Change mode":"Cambiar modo",Margins:"Márgenes",top:"arriba",right:"derecha",bottom:"abajo",left:"izquierda",Styles:"Estilos CSS",Classes:"Clases CSS",Align:"Alinear",Right:"Derecha",Center:"Centrado",Left:"Izquierda","--Not Set--":"--No Establecido--",Src:"Fuente",Title:"Título",Alternative:"Texto Alternativo",Link:"Vínculo","Open link in new tab":"Abrir vínculo en nueva pestaña",Image:"Imagen",file:"Archivo",Advansed:"Avanzado","Image properties":"Propiedades de imagen",Cancel:"Cancelar",Ok:"Aceptar","Your code is similar to HTML. Keep as HTML?":"El código es similar a HTML. ¿Mantener como HTML?","Paste as HTML":"Pegar como HTML?",Keep:"Mantener",Clean:"Limpiar","Insert as Text":"Insertar como texto","Word Paste Detected":"Pegado desde Word detectado","The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?":"El contenido pegado proviene de un documento de Microsoft Word/Excel. ¿Desea mantener el formato o limpiarlo?","Insert only Text":"Insertar solo texto","File Browser":"Buscar archivo","Error on load list":"Error al cargar la lista","Error on load folders":"Error al cargar las carpetas","Are you sure?":"¿Está seguro?","Enter Directory name":"Entre nombre de carpeta","Create directory":"Crear carpeta","type name":"Entre el nombre","Drop image":"Soltar imagen","Drop file":"Soltar archivo","or click":"o click","Alternative text":"Texto alternativo",Browse:"Buscar",Upload:"Subir",Background:"Fondo",Text:"Texto",Top:"Arriba",Middle:"Centro",Bottom:"Abajo","Insert column before":"Insertar columna antes","Insert column after":"Interar columna después","Insert row above":"Insertar fila arriba","Insert row below":"Insertar fila debajo","Delete table":"Borrar tabla","Delete row":"Borrar fila","Delete column":"Borrar columna","Empty cell":"Vaciar celda",Delete:"Borrar","Strike through":"Tachado",Underline:"Subrayado",Break:"Pausa","Search for":"Buscar","Replace with":"Reemplazar con",Replace:"Reemplazar",Edit:"Editar","Vertical align":"Alineación vertical","Horizontal align":"Alineación horizontal",Filter:"filtrar","Sort by changed":"Ordenar por fecha modificación","Sort by name":"Ordenar por nombre","Sort by size":"Ordenar por tamaño","Add folder":"Agregar carpeta",Split:"Dividir","Split vertical":"Dividir vertical","Split horizontal":"Dividir horizontal",Merge:"Mezclar","Add column":"Agregar columna","Add row":"Agregar fila",Border:"Borde","Embed code":"Incluir código",Update:"Actualizar",superscript:"superíndice",subscript:"subíndice","Cut selection":"Cortar selección",Paste:"Pegar","Choose Content to Paste":"Seleccionar contenido para pegar","Chars: %d":"Caracteres: %d","Words: %d":"Palabras: %d",All:"Todo","Select %s":"Seleccionar: %s","Select all":"Seleccionar todo",source:"HTML",bold:"negrita",italic:"cursiva",brush:"Brocha",link:"Vínculo",undo:"deshacer",redo:"rehacer",table:"Tabla",image:"Imagen",eraser:"Borrar",paragraph:"Párrafo",fontsize:"Tamaño de letra",video:"Video",font:"Letra",about:"Acerca de",print:"Imprimir",symbol:"Símbolo",underline:"subrayar",strikethrough:"tachar",indent:"sangría",outdent:"quitar sangría",fullsize:"Tamaño completo",shrink:"encoger",copyformat:"Copiar formato",hr:"línea horizontal",ul:"lista sin ordenar",ol:"lista ordenada",cut:"Cortar",selectall:"Seleccionar todo","Open link":"Abrir vínculo","Edit link":"Editar vínculo","No follow":"No seguir",Unlink:"Desvincular",Eye:"Ver",pencil:"Para editar"," URL":"URL",Reset:"Resetear",Save:"Guardar","Save as ...":"Guardar como...",Resize:"Redimensionar",Crop:"Recortar",Width:"Ancho",Height:"Alto","Keep Aspect Ratio":"Mantener relación de aspecto",Yes:"Si",No:"No",Remove:"Quitar",Select:"Seleccionar","You can only edit your own images. Download this image on the host?":"Solo puedes editar tus propias imágenes. ¿Descargar esta imagen en el servidor?","The image has been successfully uploaded to the host!":"¡La imagen se ha subido correctamente al servidor!",palette:"paleta","There are no files":"No hay archivos en este directorio.",Rename:"renombrar","Enter new name":"Ingresa un nuevo nombre",preview:"avance",download:"Descargar","Paste from clipboard":"Pegar desde el portapapeles","Your browser doesn't support direct access to the clipboard.":"Su navegador no soporta el acceso directo en el portapapeles.","Copy selection":"Selección de copia",copy:"copia","Border radius":"Radio frontera","Show all":"Mostrar todos los",Apply:"Aplicar","Please fill out this field":"Por favor, rellene este campo","Please enter a web address":"Por favor, introduzca una dirección web",Default:"Predeterminado",Circle:"Círculo",Dot:"Punto",Quadrate:"Cuadro","Lower Alpha":"Letra Minúscula","Lower Greek":"Griego Minúscula","Lower Roman":"Romano Minúscula","Upper Alpha":"Letra Mayúscula","Upper Roman":"Romano Mayúscula",Find:"Encontrar","Find Previous":"Buscar Anterior","Find Next":"Buscar Siguiente"};},e=>{e.exports={"Type something":"Ecrivez ici","About Jodit":"A propos de Jodit","Jodit Editor":"Editeur Jodit","Jodit User's Guide":"Guide de l'utilisateur","contains detailed help for using":"Aide détaillée à l'utilisation","For information about the license, please go to our website:":"Consulter la licence sur notre site web:","Buy full version":"Acheter la version complète","Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.":"Copyright © XDSoft.net - Chupurnov Valeriy. Tous droits réservés.",Anchor:"Ancre","Open in new tab":"Ouvrir dans un nouvel onglet","Open editor in fullsize":"Ouvrir l'éditeur en pleine page","Clear Formatting":"Supprimer le formattage","Fill color or set the text color":"Modifier la couleur du fond ou du texte",Redo:"Refaire",Undo:"Défaire",Bold:"Gras",Italic:"Italique","Insert Unordered List":"Liste non ordonnée","Insert Ordered List":"Liste ordonnée","Align Center":"Centrer","Align Justify":"Justifier","Align Left":"Aligner à gauche ","Align Right":"Aligner à droite","Insert Horizontal Line":"Insérer une ligne horizontale","Insert Image":"Insérer une image","Insert file":"Insérer un fichier","Insert youtube/vimeo video":"Insérer une vidéo","Insert link":"Insérer un lien","Font size":"Taille des caractères","Font family":"Famille des caractères","Insert format block":"Bloc formatté",Normal:"Normal","Heading 1":"Titre 1","Heading 2":"Titre 2","Heading 3":"Titre 3","Heading 4":"Titre 4",Quote:"Citation",Code:"Code",Insert:"Insérer","Insert table":"Insérer un tableau","Decrease Indent":"Diminuer le retrait","Increase Indent":"Retrait plus","Select Special Character":"Sélectionnez un caractère spécial","Insert Special Character":"Insérer un caractère spécial","Paint format":"Cloner le format","Change mode":"Mode wysiwyg <-> code html",Margins:"Marges",top:"haut",right:"droite",bottom:"Bas",left:"gauche",Styles:"Styles",Classes:"Classes",Align:"Alignement",Right:"Droite",Center:"Centre",Left:"Gauche","--Not Set--":"--Non disponible--",Src:"Source",Title:"Titre",Alternative:"Alternative",Filter:"Filtre",Link:"Lien","Open link in new tab":"Ouvrir le lien dans un nouvel onglet",Image:"Image",file:"fichier",Advanced:"Avancé","Image properties":"Propriétés de l'image",Cancel:"Annuler",Ok:"OK","Your code is similar to HTML. Keep as HTML?":"Votre texte que vous essayez de coller est similaire au HTML. Collez-le en HTML?","Paste as HTML":"Coller en HTML?",Keep:"Sauvegarder l'original",Clean:"Nettoyer","Insert as Text":"Coller en tant que texte","Word Paste Detected":"C'est peut-être un fragment de Word ou Excel","The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?":"Le contenu que vous insérez provient d'un document Microsoft Word / Excel. Voulez-vous enregistrer le format ou l'effacer?","Insert only Text":"Coller le texte seulement","File Browser":"Explorateur de fichiers","Error on load list":"Erreur de liste de chargement","Error on load folders":"Erreur de dossier de chargement","Are you sure?":"Etes-vous sûrs ?","Enter Directory name":"Entrer le non de dossier","Create directory":"Créer un dossier","type name":"type de fichier","Drop image":"Coller une image","Drop file":"Déposer un fichier","or click":"ou cliquer","Alternative text":"Texte de remplacemement",Browse:"Chercher",Upload:"Charger",Background:"Arrière-plan",Text:"Texte",Top:"Haut",Middle:"Milieu",Bottom:"Bas","Insert column before":"Insérer une colonne avant","Insert column after":"Insérer une colonne après","Insert row above":"Insérer une ligne en dessus","Insert row below":"Insérer une ligne en dessous","Delete table":"Supprimer le tableau","Delete row":"Supprimer la ligne","Delete column":"Supprimer la colonne","Empty cell":"Vider la cellule","Chars: %d":"Symboles: %d","Words: %d":"Mots: %d",Split:"Split","Split vertical":"Split vertical","Split horizontal":"Split horizontal","Strike through":"Frapper à travers",Underline:"Souligner",superscript:"exposant",subscript:"indice","Cut selection":"Couper la sélection","Select all":"Tout sélectionner",Break:"Pause","Search for":"Rechercher","Replace with":"Remplacer par",Replace:"Remplacer",Paste:"Coller","Choose Content to Paste":"Choisissez le contenu à coller",source:"la source",bold:"graisseux",italic:"italique",brush:"verser",link:"lien",undo:"abolir",redo:"prêt",table:"graphique",image:"Image",eraser:"la gommen",paragraph:"clause",fontsize:"taille de police",video:"Video",font:"police",about:"à propos de l'éditeur",print:"impression",symbol:"caractère",underline:"souligné",strikethrough:"barré",indent:"indentation",outdent:"indifférent",fullsize:"taille réelle",shrink:"taille conventionnelle",copyformat:"Format de copie",hr:"la ligne",ul:"Liste des",ol:"Liste numérotée",cut:"Couper",selectall:"Sélectionner tout","Open link":"Ouvrir le lien","Edit link":"Modifier le lien","No follow":"Attribut Nofollow",Unlink:"Supprimer le lien",Eye:"Voir",pencil:"Pour éditer"," URL":"URL",Reset:"Restaurer",Save:"Sauvegarder","Save as ...":"Enregistrer sous",Resize:"Changer la taille",Crop:"Taille de garniture",Width:"Largeur",Height:"Hauteur","Keep Aspect Ratio":"Garder les proportions",Yes:"Oui",No:"Non",Remove:"Supprimer",Select:"Mettre en évidence","Select %s":"Mettre en évidence: %s",Update:"Mettre à jour","Vertical align":"Alignement vertical",Merge:"aller","Add column":"Ajouter une colonne","Add row":"Ajouter une rangée",Delete:"Effacer","Horizontal align":"Alignement horizontal","Sort by changed":"Trier par modifié","Sort by name":"Trier par nom","Sort by size":"Classer par taille","Add folder":"Ajouter le dossier","You can only edit your own images. Download this image on the host?":"Vous ne pouvez éditer que vos propres images. Téléchargez cette image sur l'hôte?","The image has been successfully uploaded to the host!":"L'image a été téléchargée avec succès sur le serveur!null",palette:"Palette","There are no files":"Il n'y a aucun fichier dans ce répertoire.",Rename:"renommer","Enter new name":"Entrez un nouveau nom",preview:"Aperçu",download:"Télécharger","Paste from clipboard":"Coller à partir du presse-papiers","Your browser doesn't support direct access to the clipboard.":"Votre navigateur ne prend pas en charge l'accès direct à la presse-papiers.","Copy selection":"Copier la sélection",copy:"copie","Border radius":"Rayon des frontières","Show all":"Afficher tous les",Apply:"Appliquer","Please fill out this field":"Veuillez remplir ce champ","Please enter a web address":"Veuillez entrer une adresse web",Default:"Par défaut",Circle:"Cercle",Dot:"Dot",Quadrate:"Quadrate",Find:"Trouver","Find Previous":"Trouvez Précédente","Find Next":"Suivant"};},e=>{e.exports={"Type something":"הקלד משהו...",Advanced:"מתקדם","About Jodit":"About Jodit","Jodit Editor":"Jodit Editor","Jodit User's Guide":"Jodit User's Guide","contains detailed help for using":"contains detailed help for using.","For information about the license, please go to our website:":"For information about the license, please go to our website:","Buy full version":"Buy full version","Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.":"Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.",Anchor:"מקום עיגון","Open in new tab":"פתח בכרטיסיה חדשה","Open editor in fullsize":"פתח את העורך בחלון חדש","Clear Formatting":"נקה עיצוב","Fill color or set the text color":"שנה צבע טקסט או רקע",Redo:"בצע שוב",Undo:"בטל",Bold:"מודגש",Italic:"נטוי","Insert Unordered List":"הכנס רשימת תבליטים","Insert Ordered List":"הכנס רשימה ממוספרת","Align Center":"מרכז","Align Justify":"ישר ","Align Left":"ישר לשמאל","Align Right":"ישר לימין","Insert Horizontal Line":"הכנס קו אופקי","Insert Image":"הכנס תמונה","Insert file":"הכנס קובץ","Insert youtube/vimeo video":"הכנס סרטון וידאו מYouTube/Vimeo","Insert link":"הכנס קישור","Font size":"גודל גופן","Font family":"גופן","Insert format block":"מעוצב מראש",Normal:"רגיל","Heading 1":"כותרת 1","Heading 2":"כותרת 2","Heading 3":"כותרת 3","Heading 4":"כותרת 4",Quote:"ציטוט",Code:"קוד",Insert:"הכנס","Insert table":"הכנס טבלה","Decrease Indent":"הקטן כניסה","Increase Indent":"הגדל כניסה","Select Special Character":"בחר תו מיוחד","Insert Special Character":"הכנס תו מיוחד","Paint format":"העתק עיצוב","Change mode":"החלף מצב",Margins:"ריווח",top:"עליון",right:"ימין",bottom:"תחתון",left:"שמאל",Styles:"עיצוב CSS",Classes:"מחלקת CSS",Align:"יישור",Right:"ימין",Center:"מרכז",Left:"שמאל","--Not Set--":"--לא נקבע--",Src:"מקור",Title:"כותרת",Alternative:"כיתוב חלופי",Link:"קישור","Open link in new tab":"פתח בכרטיסיה חדשה",Image:"תמונה",file:"קובץ",Advansed:"מתקדם","Image properties":"מאפייני תמונה",Cancel:"ביטול",Ok:"אישור","Your code is similar to HTML. Keep as HTML?":"הקוד דומה לHTML, האם להשאיר כHTML","Paste as HTML":"הדבק כHTML",Keep:"השאר",Clean:"נקה","Insert as Text":"הכנס כטקסט","Word Paste Detected":'זוהתה הדבקה מ"וורד"',"The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?":"התוכן המודבק מגיע ממסמך וורד/אקסל. האם ברצונך להשאיר את העיצוב או לנקותו","Insert only Text":"הכנס טקסט בלבד","File Browser":"סייר הקבצים","Error on load list":"שגיאה  בזמן טעינת רשימה","Error on load folders":"שגיאה בזמן טעינת תקיות","Are you sure?":"האם אתה בטוח?","Enter Directory name":"הכנס שם תקיה","Create directory":"צור תקיה","type name":"סוג הקובץ","Drop image":"הסר תמונה","Drop file":"הסר קובץ","or click":"או לחץ","Alternative text":"כיתוב חלופי",Browse:"סייר",Upload:"העלה",Background:"רקע",Text:"טקסט",Top:"עליון",Middle:"מרכז",Bottom:"תחתון","Insert column before":"הכנס עמודה לפני","Insert column after":"הכנס עמודה אחרי","Insert row above":"הכנס שורה מעל","Insert row below":"הכנס שורה מתחת","Delete table":"מחק טבלה","Delete row":"מחק שורה","Delete column":"מחק עמודה","Empty cell":"רוקן תא",Delete:"מחק","Strike through":"קו חוצה",Underline:"קו תחתון",Break:"שבירת שורה","Search for":"חפש","Replace with":"החלף ב",Replace:"להחליף",Edit:"ערוך","Vertical align":"יישור אנכי","Horizontal align":"יישור אופקי",Filter:"סנן","Sort by changed":"מין לפי שינוי","Sort by name":"מיין לפי שם","Sort by size":"מיין לפי גודל","Add folder":"הוסף תקייה",Split:"פיצול","Split vertical":"פיצול אנכי","Split horizontal":"פיצול אופקי",Merge:"מזג","Add column":"הוסף עמודה","Add row":"הוסף שורה",Border:"מסגרת","Embed code":"הוסף קוד",Update:"עדכן",superscript:"superscript",subscript:"subscript","Cut selection":"גזור בחירה",Paste:"הדבק","Choose Content to Paste":"בחר תוכן להדבקה","Chars: %d":"תווים: %d","Words: %d":"מילים: %d",All:"הכל","Select %s":"נבחר: %s","Select all":"בחר הכל",source:"HTML",bold:"מודגש",italic:"נטוי",brush:"מברשת",link:"קישור",undo:"בטל",redo:"בצע שוב",table:"טבלה",image:"תמונה",eraser:"מחק",paragraph:"פסקה",fontsize:"גודל גופן",video:"וידאו",font:"גופן",about:"עלינו",print:"הדפס",symbol:"תו מיוחד",underline:"קו תחתון",strikethrough:"קו חוצה",indent:"הגדל כניסה",outdent:"הקטן כניסה",fullsize:"גודל מלא",shrink:"כווץ",copyformat:"העתק עיצוב",hr:"קו אופקי",ul:"רשימת תבליטים",ol:"רשימה ממוספרת",cut:"חתוך",selectall:"בחר הכל","Open link":"פתח קישור","Edit link":"ערוך קישור","No follow":"ללא מעקב",Unlink:"בטל קישור",Eye:"הצג",pencil:"כדי לערוך"," URL":"כתובת",Reset:"אפס",Save:"שמור","Save as ...":"שמור בשם...",Resize:"שנה גודל",Crop:"חתוך",Width:"רוחב",Height:"גובה","Keep Aspect Ratio":"שמור יחס",Yes:"כן",No:"לא",Remove:"הסר",Select:"בחר","You can only edit your own images. Download this image on the host?":"רק קבצים המשוייכים שלך ניתנים לעריכה. האם להוריד את הקובץ?","The image has been successfully uploaded to the host!":"התמונה עלתה בהצלחה!",palette:"לוח","There are no files":"אין קבצים בספריה זו.",Rename:"הונגרית","Enter new name":"הזן שם חדש",preview:"תצוגה מקדימה",download:"הורד","Paste from clipboard":"להדביק מהלוח","Your browser doesn't support direct access to the clipboard.":"הדפדפן שלך לא תומך גישה ישירה ללוח.","Copy selection":"העתק בחירה",copy:"העתק","Border radius":"רדיוס הגבול","Show all":"הצג את כל",Apply:"החל","Please fill out this field":"נא למלא שדה זה","Please enter a web address":"אנא הזן כתובת אינטרנט",Default:"ברירת המחדל",Circle:"מעגל",Dot:"נקודה",Quadrate:"הריבוע הזה",Find:"למצוא","Find Previous":"מצא את הקודם","Find Next":"חפש את הבא"};},e=>{e.exports={"Type something":"Írjon be valamit",Advanced:"Haladó","About Jodit":"Joditról","Jodit Editor":"Jodit Editor","Free Non-commercial Version":"Ingyenes változat","Jodit User's Guide":"Jodit útmutató","contains detailed help for using":"további segítséget tartalmaz","For information about the license, please go to our website:":"További licence információkért látogassa meg a weboldalunkat:","Buy full version":"Teljes verzió megvásárlása","Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.":"Copyright © XDSoft.net - Chupurnov Valeriy. Minden jog fenntartva.",Anchor:"Horgony","Open in new tab":"Megnyitás új lapon","Open editor in fullsize":"Megnyitás teljes méretben","Clear Formatting":"Formázás törlése","Fill color or set the text color":"Háttér/szöveg szín",Redo:"Újra",Undo:"Visszavon",Bold:"Félkövér",Italic:"Dőlt","Insert Unordered List":"Pontozott lista","Insert Ordered List":"Számozott lista","Align Center":"Középre zárt","Align Justify":"Sorkizárt","Align Left":"Balra zárt","Align Right":"Jobbra zárt","Insert Horizontal Line":"Vízszintes vonal beszúrása","Insert Image":"Kép beszúrás","Insert file":"Fájl beszúrás","Insert youtube/vimeo video":"Youtube videó beszúrása","Insert link":"Link beszúrás","Font size":"Betűméret","Font family":"Betűtípus","Insert format block":"Formázott blokk beszúrása",Normal:"Normál","Heading 1":"Fejléc 1","Heading 2":"Fejléc 2","Heading 3":"Fejléc 3","Heading 4":"Fejléc 4",Quote:"Idézet",Code:"Kód",Insert:"Beszúr","Insert table":"Táblázat beszúrása","Decrease Indent":"Behúzás csökkentése","Increase Indent":"Behúzás növelése","Select Special Character":"Speciális karakter kiválasztása","Insert Special Character":"Speciális karakter beszúrása","Paint format":"Kép formázása","Change mode":"Nézet váltása",Print:"Nyomtatás",Margins:"Szegélyek",top:"felső",right:"jobb",bottom:"alsó",left:"bal",Styles:"CSS stílusok",Classes:"CSS osztályok",Align:"Igazítás",Right:"Jobbra",Center:"Középre",Left:"Balra","--Not Set--":"Nincs",Src:"Forrás",Title:"Cím",Alternative:"Helyettesítő szöveg",Link:"Link","Open link in new tab":"Link megnyitása új lapon",Image:"Kép",file:"Fájl",Advansed:"További beállítás","Image properties":"Kép tulajdonságai",Cancel:"Mégsem",Ok:"OK","Your code is similar to HTML. Keep as HTML?":"A beillesztett szöveg HTML-nek tűnik. Megtartsuk HTML-ként?","Paste as HTML":"Beszúrás HTML-ként",Keep:"Megtartás",Clean:"Elvetés","Insert as Text":"Beszúrás szövegként","Word Paste Detected":"Word-ből másolt szöveg","The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?":"A beillesztett tartalom Microsoft Word/Excel dokumentumból származik. Meg szeretné tartani a formátumát?","Insert only Text":"Csak szöveg beillesztése","File Browser":"Fájl tallózó","Error on load list":"Hiba a lista betöltése közben","Error on load folders":"Hiba a mappák betöltése közben","Are you sure?":"Biztosan ezt szeretné?","Enter Directory name":"Írjon be egy mappanevet","Create directory":"Mappa létrehozása","type name":"írjon be bevet","Drop image":"Húzza ide a képet","Drop file":"Húzza ide a fájlt","or click":"vagy kattintson","Alternative text":"Helyettesítő szöveg",Browse:"Tallóz",Upload:"Feltölt",Background:"Háttér",Text:"Szöveg",Top:"Fent",Middle:"Középen",Bottom:"Lent","Insert column before":"Oszlop beszúrás elé","Insert column after":"Oszlop beszúrás utána","Insert row above":"Sor beszúrás fölé","Insert row below":"Sor beszúrás alá","Delete table":"Táblázat törlése","Delete row":"Sor törlése","Delete column":"Oszlop törlése","Empty cell":"Cella tartalmának törlése",Delete:"Törlés","Strike through":"Áthúzott",Underline:"Aláhúzott",Break:"Szünet","Search for":"Keresés","Replace with":"Csere erre",Replace:"Cserélje ki",Edit:"Szerkeszt","Vertical align":"Függőleges igazítás","Horizontal align":"Vízszintes igazítás",Filter:"Szűrő","Sort by changed":"Rendezés módosítás szerint","Sort by name":"Rendezés név szerint","Sort by size":"Rendezés méret szerint","Add folder":"Mappa hozzáadás","Split vertical":"Függőleges felosztás","Split horizontal":"Vízszintes felosztás",Merge:"Összevonás","Add column":"Oszlop hozzáadás","Add row":"Sor hozzáadás",Border:"Szegély","Embed code":"Beágyazott kód",Update:"Frissít",superscript:"Felső index",subscript:"Alsó index","Cut selection":"Kivágás",Paste:"Beillesztés","Choose Content to Paste":"Válasszon tartalmat a beillesztéshez",Split:"Felosztás","Chars: %d":"Karakterek száma: %d","Words: %d":"Szavak száma: %d",All:"Összes","Select %s":"Kijelöl: %s","Select all":"Összes kijelölése",source:"HTML",bold:"Félkövér",italic:"Dőlt",brush:"Ecset",link:"Link",undo:"Visszavon",redo:"Újra",table:"Táblázat",image:"Kép",eraser:"Törlés",paragraph:"Paragráfus",fontsize:"Betűméret",video:"Videó",font:"Betű",about:"Rólunk",print:"Nyomtat",symbol:"Szimbólum",underline:"Aláhúzott",strikethrough:"Áthúzott",indent:"Behúzás",outdent:"Aussenseiter",fullsize:"Teljes méret",shrink:"Összenyom",copyformat:"Formátum másolás",hr:"Egyenes vonal",ul:"Lista",ol:"Számozott lista",cut:"Kivág",selectall:"Összes kijelölése","Open link":"Link megnyitása","Edit link":"Link szerkesztése","No follow":"Nincs követés",Unlink:"Link leválasztása",Eye:"felülvizsgálat",pencil:"Szerkesztés"," URL":"URL",Reset:"Visszaállít",Save:"Mentés","Save as ...":"Mentés másként...",Resize:"Átméretezés",Crop:"Kivág",Width:"Szélesség",Height:"Magasság","Keep Aspect Ratio":"Képarány megtartása",Yes:"Igen",No:"Nem",Remove:"Eltávolít",Select:"Kijelöl","You can only edit your own images. Download this image on the host?":"Csak a saját képeit tudja szerkeszteni. Letölti ezt a képet?","The image has been successfully uploaded to the host!":"Kép sikeresen feltöltve!",palette:"Palette","There are no files":"Er zijn geen bestanden in deze map.",Rename:"átnevezés","Enter new name":"Adja meg az új nevet",preview:"előnézet",download:"Letöltés","Paste from clipboard":"Illessze be a vágólap","Your browser doesn't support direct access to the clipboard.":"A böngésző nem támogatja a közvetlen hozzáférést biztosít a vágólapra.","Copy selection":"Másolás kiválasztása",copy:"másolás","Border radius":"Határ sugár","Show all":"Összes",Apply:"Alkalmazni","Please fill out this field":"Kérjük, töltse ki ezt a mezőt,","Please enter a web address":"Kérjük, írja be a webcímet",Default:"Alapértelmezett",Circle:"Kör",Dot:"Pont",Quadrate:"Quadrate",Find:"Találni","Find Previous":"Megtalálja Előző","Find Next":"Következő Keresése"};},e=>{e.exports={"Type something":"Ketik sesuatu","About Jodit":"Tentang Jodit","Jodit Editor":"Editor Jodit","Free Non-commercial Version":"Versi Bebas Non-komersil","Jodit User's Guide":"Panduan Pengguna Jodit","contains detailed help for using":"mencakup detail bantuan penggunaan","For information about the license, please go to our website:":"Untuk informasi tentang lisensi, silakan kunjungi website:","Buy full version":"Beli versi lengkap","Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.":"Hak Cipta © XDSoft.net - Chupurnov Valeriy. Hak cipta dilindungi undang-undang.",Anchor:"Tautan","Open in new tab":"Buka di tab baru","Open editor in fullsize":"Buka editor dalam ukuran penuh","Clear Formatting":"Hapus Pemformatan","Fill color or set the text color":"Isi warna atau atur warna teks",Redo:"Ulangi",Undo:"Batalkan",Bold:"Tebal",Italic:"Miring","Insert Unordered List":"Sisipkan Daftar Tidak Berurut","Insert Ordered List":"Sisipkan Daftar Berurut","Align Center":"Tengah","Align Justify":"Penuh","Align Left":"Kiri","Align Right":"Kanan","Insert Horizontal Line":"Sisipkan Garis Horizontal","Insert Image":"Sisipkan Gambar","Insert file":"Sisipkan Berkas","Insert youtube/vimeo video":"Sisipkan video youtube/vimeo","Insert link":"Sisipkan tautan","Font size":"Ukuran font","Font family":"Keluarga font","Insert format block":"Sisipkan blok format",Normal:"Normal","Heading 1":"Heading 1","Heading 2":"Heading 2","Heading 3":"Heading 3","Heading 4":"Heading 4",Quote:"Kutip",Code:"Kode",Insert:"Sisipkan","Insert table":"Sisipkan tabel","Decrease Indent":"Kurangi Indentasi","Increase Indent":"Tambah Indentasi","Select Special Character":"Pilih Karakter Spesial","Insert Special Character":"Sisipkan Karakter Spesial","Paint format":"Formar warna","Change mode":"Ubah mode",Margins:"Batas",top:"atas",right:"kanan",bottom:"bawah",left:"kiri",Styles:"Gaya",Classes:"Class",Align:"Rata",Right:"Kanan",Center:"Tengah",Left:"Kiri","--Not Set--":"--Tidak diset--",Src:"Src",Title:"Judul",Alternative:"Teks alternatif",Link:"Tautan","Open link in new tab":"Buka tautan di tab baru",Image:"Gambar",file:"berkas",Advanced:"Lanjutan","Image properties":"Properti gambar",Cancel:"Batal",Ok:"Ya","Your code is similar to HTML. Keep as HTML?":"Kode Anda cenderung ke HTML. Biarkan sebagai HTML?","Paste as HTML":"Paste sebagai HTML",Keep:"Jaga",Clean:"Bersih","Insert as Text":"Sisipkan sebagai teks","Insert only Text":"Sisipkan hanya teks","Word Paste Detected":"Terdeteksi paste dari Word","The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?":"Konten dipaste dari dokumen Microsoft Word/Excel. Apakah Anda ingin tetap menjaga format atau membersihkannya?","File Browser":"Penjelajah Berkas","Error on load list":"Error ketika memuat list","Error on load folders":"Error ketika memuat folder","Are you sure?":"Apakah Anda yakin?","Enter Directory name":"Masukkan nama Direktori","Create directory":"Buat direktori","type name":"ketik nama","Drop image":"Letakkan gambar","Drop file":"Letakkan berkas","or click":"atau klik","Alternative text":"Teks alternatif",Browse:"Jelajahi",Upload:"Unggah",Background:"Latar Belakang",Text:"Teks",Top:"Atas",Middle:"Tengah",Bottom:"Bawah","Insert column before":"Sisipkan kolom sebelumnya","Insert column after":"Sisipkan kolom setelahnya","Insert row above":"Sisipkan baris di atasnya","Insert row below":"Sisipkan baris di bawahnya","Delete table":"Hapus tabel","Delete row":"Hapus baris","Delete column":"Hapus kolom","Empty cell":"Kosongkan cell",source:"sumber",bold:"tebal",italic:"miring",brush:"sikat",link:"tautan",undo:"batalkan",redo:"ulangi",table:"tabel",image:"gambar",eraser:"penghapus",paragraph:"paragraf",fontsize:"ukuran font",video:"video",font:"font",about:"tentang",print:"cetak",symbol:"simbol",underline:"garis bawah",strikethrough:"coret",indent:"menjorok ke dalam",outdent:"menjorok ke luar",fullsize:"ukuran penuh",shrink:"menyusut",copyformat:"salin format",hr:"hr",ul:"ul",ol:"ol",cut:"potong",selectall:"Pilih semua","Embed code":"Kode embed","Open link":"Buka tautan","Edit link":"Edit tautan","No follow":"No follow",Unlink:"Hapus tautan",Eye:"Mata",pencil:"pensil",Update:"Perbarui"," URL":"URL",Edit:"Edit","Horizontal align":"Perataan horizontal",Filter:"Filter","Sort by changed":"Urutkan berdasarkan perubahan","Sort by name":"Urutkan berdasarkan nama","Sort by size":"Urutkan berdasarkan ukuran","Add folder":"Tambah folder",Reset:"Reset",Save:"Simpan","Save as ...":"Simpan sebagai...",Resize:"Ubah ukuran",Crop:"Crop",Width:"Lebar",Height:"Tinggi","Keep Aspect Ratio":"Jaga aspek rasio",Yes:"Ya",No:"Tidak",Remove:"Copot",Select:"Pilih","Chars: %d":"Karakter: %d","Words: %d":"Kata: %d",All:"Semua","Select %s":"Pilih %s","Select all":"Pilih semua","Vertical align":"Rata vertikal",Split:"Bagi","Split vertical":"Bagi secara vertikal","Split horizontal":"Bagi secara horizontal",Merge:"Gabungkan","Add column":"Tambah kolom","Add row":"tambah baris",Delete:"Hapus",Border:"Bingkai","License: %s":"Lisensi: %s","Strike through":"Coret",Underline:"Garis Bawah",superscript:"Superskrip",subscript:"Subskrip","Cut selection":"Potong pilihan",Break:"Berhenti","Search for":"Mencari","Replace with":"Ganti dengan",Replace:"Mengganti",Paste:"Paste","Choose Content to Paste":"Pilih konten untuk dipaste","You can only edit your own images. Download this image on the host?":"Anda hanya dapat mengedit gambar Anda sendiri. Unduh gambar ini di host?","The image has been successfully uploaded to the host!":"Gambar telah sukses diunggah ke host!",palette:"palet","There are no files":"Tidak ada berkas",Rename:"ganti nama","Enter new name":"Masukkan nama baru",preview:"pratinjau",download:"Unduh","Paste from clipboard":"Paste dari clipboard","Your browser doesn't support direct access to the clipboard.":"Browser anda tidak mendukung akses langsung ke clipboard.","Copy selection":"Copy seleksi",copy:"copy","Border radius":"Border radius","Show all":"Tampilkan semua",Apply:"Menerapkan","Please fill out this field":"Silahkan mengisi kolom ini","Please enter a web address":"Silahkan masukkan alamat web",Default:"Default",Circle:"Lingkaran",Dot:"Dot",Quadrate:"Kuadrat",Find:"Menemukan","Find Previous":"Menemukan Sebelumnya","Find Next":"Menemukan Berikutnya"};},e=>{e.exports={"Type something":"Scrivi qualcosa...",Advanced:"Avanzato","About Jodit":"A proposito di Jodit","Jodit Editor":"Jodit Editor","Jodit User's Guide":"Guida utente di Jodit","contains detailed help for using":"contiene una guida dettagliata per l'uso.","For information about the license, please go to our website:":"Per informazioni sulla licenza, si prega di visitare il nostro sito:","Buy full version":"Acquista la versione completa","Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.":"Copyright © XDSoft.net - Chupurnov Valeriy. Alle Rechte vorbehalten.",Anchor:"Ancora","Open in new tab":"Apri in una nuova scheda","Open editor in fullsize":"Apri l'editor a schermo intero","Clear Formatting":"Formato chiaro","Fill color or set the text color":"Riempi colore o lettera",Redo:"Ripristina",Undo:"Annulla",Bold:"Grassetto",Italic:"Corsivo","Insert Unordered List":"Inserisci lista non ordinata","Insert Ordered List":"Inserisci l'elenco ordinato","Align Center":"Allinea Centra","Align Justify":"Allineare Giustificato","Align Left":"Allinea a Sinistra","Align Right":"Allinea a Destra","Insert Horizontal Line":"Inserisci la linea orizzontale","Insert Image":"Inserisci immagine","Insert file":"Inserisci un file","Insert youtube/vimeo video":"Inserisci video Youtube/Vimeo","Insert link":"Inserisci il link","Font size":"Dimensione del carattere","Font family":"Tipo di font","Insert format block":"Inserisci blocco",Normal:"Normale","Heading 1":"Heading 1","Heading 2":"Heading 2","Heading 3":"Heading 3","Heading 4":"Heading 4",Quote:"Citazione",Code:"Codice",Insert:"Inserisci","Insert table":"Inserisci tabella","Decrease Indent":"Riduci il rientro","Increase Indent":"Aumenta il rientro","Select Special Character":"Seleziona una funzione speciale","Insert Special Character":"Inserisci un carattere speciale","Paint format":"Copia formato","Change mode":"Cambia modo",Margins:"Margini",top:"su",right:"destra",bottom:"giù",left:"sinistra",Styles:"Stili CSS",Classes:"Classi CSS",Align:"Allinea",Right:"Destra",Center:"Centro",Left:"Sinistra","--Not Set--":"--Non Impostato--",Src:"Fonte",Title:"Titolo",Alternative:"Testo Alternativo",Link:"Link","Open link in new tab":"Apri il link in una nuova scheda",Image:"Immagine",file:"Archivio",Advansed:"Avanzato","Image properties":"Proprietà dell'immagine",Cancel:"Annulla",Ok:"Accetta","Your code is similar to HTML. Keep as HTML?":"Il codice è simile all'HTML. Mantieni come HTML?","Paste as HTML":"Incolla come HTML?",Keep:"Mantieni",Clean:"Pulisci","Insert as Text":"Inserisci come testo","Word Paste Detected":"Incollato da Word rilevato","The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?":"Il contenuto incollato proviene da un documento Microsoft Word / Excel. Vuoi mantenere il formato o pulirlo?","Insert only Text":"Inserisci solo il testo","File Browser":"Cerca il file","Error on load list":"Errore durante il caricamento dell'elenco","Error on load folders":"Errore durante il caricamento delle cartelle","Are you sure?":"Sei sicuro?","Enter Directory name":"Inserisci il nome della cartella","Create directory":"Crea cartella","type name":"Entre el nombre","Drop image":"Rilascia l'immagine","Drop file":"Rilascia file","or click":"o click","Alternative text":"Testo alternativo",Browse:"Sfoglia",Upload:"Carica",Background:"Sfondo",Text:"Testo",Top:"Su",Middle:"Centro",Bottom:"Sotto","Insert column before":"Inserisci prima la colonna","Insert column after":"Inserisci colonna dopo","Insert row above":"Inserisci la riga sopra","Insert row below":"Inserisci la riga sotto","Delete table":"Elimina tabella","Delete row":"Elimina riga","Delete column":"Elimina colonna","Empty cell":"Cella vuota",Delete:"Cancella","Strike through":"Barrato",Underline:"Sottolineato",Break:"Pausa","Search for":"Cerca","Replace with":"Sostituisci con",Replace:"Sostituire",Edit:"Modifica","Vertical align":"Allineamento verticala","Horizontal align":"Allineamento orizzontale",Filter:"Filtro","Sort by changed":"Ordina per data di modifica","Sort by name":"Ordina per nome","Sort by size":"Ordina per dimensione","Add folder":"Aggiungi cartella",Split:"Dividere","Split vertical":"Dividere verticalmente","Split horizontal":"Diviso orizzontale",Merge:"Fondi","Add column":"Aggiungi colonna","Add row":"Aggiungi riga",Border:"Bordo","Embed code":"Includi codice",Update:"Aggiornare",superscript:"indice",subscript:"deponente","Cut selection":"Taglia la selezione",Paste:"Incolla","Choose Content to Paste":"Seleziona il contenuto da incollare","Chars: %d":"Caratteri: %d","Words: %d":"Parole: %d",All:"Tutto","Select %s":"Seleziona: %s","Select all":"Seleziona tutto",source:"HTML",bold:"Grassetto",italic:"Corsivo",brush:"Pennello",link:"Link",undo:"Annulla",redo:"Ripristina",table:"Tabella",image:"Immagine",eraser:"Gomma",paragraph:"Paragrafo",fontsize:"Dimensione del carattere",video:"Video",font:"Font",about:"Approposito di",print:"Stampa",symbol:"Simbolo",underline:"Sottolineato",strikethrough:"Barrato",indent:"trattino",outdent:"annulla rientro",fullsize:"A grandezza normale",shrink:"comprimere",copyformat:"Copia il formato",hr:"linea orizzontale",ul:"lista non ordinata",ol:"lista ordinata",cut:"Taglia",selectall:"Seleziona tutto","Open link":"Apri link","Edit link":"Modifica link","No follow":"Non seguire",Unlink:"Togli link",Eye:"Recensione",pencil:"Per modificare"," URL":" URL",Reset:"Reset",Save:"Salva","Save as ...":"Salva con nome...",Resize:"Ridimensiona",Crop:"Tagliare",Width:"Larghezza",Height:"Altezza","Keep Aspect Ratio":"Mantenere le proporzioni",Yes:"Si",No:"No",Remove:"Rimuovere",Select:"Seleziona","You can only edit your own images. Download this image on the host?":"Puoi modificare solo le tue immagini. Scarica questa immagine sul server?","The image has been successfully uploaded to the host!":"L'immagine è stata caricata con successo sul server!",palette:"tavolozza","There are no files":"Non ci sono file in questa directory.",Rename:"ungherese","Enter new name":"Inserisci un nuovo nome",preview:"anteprima",download:"Scaricare","Paste from clipboard":"Incolla dagli appunti","Your browser doesn't support direct access to the clipboard.":"Il tuo browser non supporta l'accesso diretto agli appunti.","Copy selection":"Selezione di copia",copy:"copia","Border radius":"Border radius","Show all":"Mostra tutti",Apply:"Applicare","Please fill out this field":"Si prega di compilare questo campo","Please enter a web address":"Si prega di inserire un indirizzo web",Default:"Di Default",Circle:"Cerchio",Dot:"Dot",Quadrate:"Quadrate",Find:"Trovare","Find Previous":"Trova Precedente","Find Next":"Trova Successivo"};},e=>{e.exports={"Type something":"なにかタイプしてください",Advanced:"高度な設定","About Jodit":"Joditについて","Jodit Editor":"Jodit Editor","Jodit User's Guide":"Jodit ユーザーズ・ガイド","contains detailed help for using":"詳しい使い方","For information about the license, please go to our website:":"ライセンス詳細についてはJodit Webサイトを確認ください：","Buy full version":"フルバージョンを購入","Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.":"Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.",Anchor:"Anchor","Open in new tab":"新しいタブで開く","Open editor in fullsize":"エディターのサイズ（フル/ノーマル）","Clear Formatting":"書式をクリア","Fill color or set the text color":"テキストの色",Redo:"やり直し",Undo:"元に戻す",Bold:"太字",Italic:"斜体","Insert Unordered List":"箇条書き","Insert Ordered List":"番号付きリスト","Align Center":"中央揃え","Align Justify":"両端揃え","Align Left":"左揃え","Align Right":"右揃え","Insert Horizontal Line":"区切り線を挿入","Insert Image":"画像を挿入","Insert file":"ファイルを挿入","Insert youtube/vimeo video":"Youtube/Vimeo 動画","Insert link":"リンクを挿入","Font size":"フォントサイズ","Font family":"フォント","Insert format block":"テキストのスタイル",Normal:"指定なし","Heading 1":"タイトル1","Heading 2":"タイトル2","Heading 3":"タイトル3","Heading 4":"タイトル4",Quote:"引用",Code:"コード",Insert:"挿入","Insert table":"表を挿入","Decrease Indent":"インデント減","Increase Indent":"インデント増","Select Special Character":"特殊文字を選択","Insert Special Character":"特殊文字を挿入","Paint format":"書式を貼付け","Change mode":"編集モード切替え",Margins:"マージン",top:"上",right:"右",bottom:"下",left:"左",Styles:"スタイル",Classes:"クラス",Align:"配置",Right:"右寄せ",Center:"中央寄せ",Left:"左寄せ","--Not Set--":"指定なし",Src:"ソース",Title:"タイトル",Alternative:"代替テキスト",Link:"リンク","Open link in new tab":"新しいタブで開く",Image:"画像",file:"ファイル",Advansed:"Advansed","Image properties":"画像のプロパティー",Cancel:"キャンセル",Ok:"確定","Your code is similar to HTML. Keep as HTML?":"HTMLコードを保持しますか？","Paste as HTML":"HTMLで貼付け",Keep:"HTMLを保持",Clean:"Clean","Insert as Text":"HTMLをテキストにする","Word Paste Detected":"Word Paste Detected","The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?":"The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?","Insert only Text":"テキストだけ","File Browser":"File Browser","Error on load list":"Error on load list","Error on load folders":"Error on load folders","Are you sure?":"Are you sure?","Enter Directory name":"Enter Directory name","Create directory":"Create directory","type name":"type name","Drop image":"ここに画像をドロップ","Drop file":"ここにファイルをドロップ","or click":"or クリック","Alternative text":"代替テキスト",Browse:"ブラウズ",Upload:"アップロード",Background:"背景",Text:"文字",Top:"上",Middle:"中央",Bottom:"下","Insert column before":"左に列を挿入","Insert column after":"右に列を挿入","Insert row above":"上に行を挿入","Insert row below":"下に行を挿入","Delete table":"表を削除","Delete row":"行を削除","Delete column":"列を削除","Empty cell":"セルを空にする","Chars: %d":"文字数: %d","Words: %d":"単語数: %d","Strike through":"取り消し線",Underline:"下線",superscript:"上付き文字",subscript:"下付き文字","Cut selection":"切り取り","Select all":"すべて選択",Break:"Pause","Search for":"検索","Replace with":"置換",Replace:"交換",Paste:"貼付け","Choose Content to Paste":"選択した内容を貼付け",All:"全部",source:"source",bold:"bold",italic:"italic",brush:"brush",link:"link",undo:"undo",redo:"redo",table:"table",image:"image",eraser:"eraser",paragraph:"paragraph",fontsize:"fontsize",video:"video",font:"font",about:"about",print:"print",symbol:"symbol",underline:"underline",strikethrough:"strikethrough",indent:"indent",outdent:"outdent",fullsize:"fullsize",shrink:"shrink",copyformat:"copyformat",hr:"分割線",ul:"箇条書き",ol:"番号付きリスト",cut:"切り取り",selectall:"すべて選択","Open link":"リンクを開く","Edit link":"リンクを編集","No follow":"No follow",Unlink:"リンク解除",Eye:"サイトを確認"," URL":"URL",Reset:"リセット",Save:"保存","Save as ...":"Save as ...",Resize:"リサイズ",Crop:"Crop",Width:"幅",Height:"高さ","Keep Aspect Ratio":"縦横比を保持",Yes:"はい",No:"いいえ",Remove:"移除",Select:"選択","Select %s":"選択: %s",Update:"更新","Vertical align":"垂直方向の配置",Merge:"セルの結合","Add column":"列を追加","Add row":"行を追加",Border:"境界線","Embed code":"埋め込みコード",Delete:"削除",Edit:"編集","Horizontal align":"水平方向の配置",Filter:"Filter","Sort by changed":"Sort by changed","Sort by name":"Sort by name","Sort by size":"Sort by size","Add folder":"Add folder",Split:"分割","Split vertical":"セルの分割（垂直方向）","Split horizontal":"セルの分割（水平方向）","You can only edit your own images. Download this image on the host?":"You can only edit your own images. Download this image on the host?","The image has been successfully uploaded to the host!":"The image has been successfully uploaded to the host!",palette:"パレット",pencil:"鉛筆","There are no files":"There are no files",Rename:"Rename","Enter new name":"Enter new name",preview:"プレビュー",download:"ダウンロード","Paste from clipboard":"貼り付け","Your browser doesn't support direct access to the clipboard.":"お使いのブラウザはクリップボードを使用できません","Copy selection":"コピー",copy:"copy","Border radius":"角の丸み","Show all":"全て表示",Apply:"適用","Please fill out this field":"まだこの分野","Please enter a web address":"を入力してくださいウェブアドレス",Default:"デフォルト",Circle:"円",Dot:"恐竜",Quadrate:"Quadrate",Find:"見","Find Previous":"探前","Find Next":"由来"};},e=>{e.exports={"Type something":"무엇이든 입력하세요","About Jodit":"Jodit에 대하여","Jodit Editor":"Jodit Editor","Jodit User's Guide":"Jodit 사용자 안내서","contains detailed help for using":"자세한 도움말이 들어있어요","For information about the license, please go to our website:":"라이센스에 관해서는 Jodit 웹 사이트를 방문해주세요：","Buy full version":"풀 버전 구입하기","Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.":"© XDSoft.net - Chupurnov Valeriy. 에게 저작권과 모든 권리가 있습니다.",Anchor:"Anchor","Open in new tab":"새 탭에서 열기","Open editor in fullsize":"전체 크기로 보기","Clear Formatting":"서식 지우기","Fill color or set the text color":"글씨 색상",Redo:"재실행",Undo:"실행 취소",Bold:"굵게",Italic:"기울임","Insert Unordered List":"글머리 목록","Insert Ordered List":"번호 목록","Align Center":"가운데 정렬","Align Justify":"양쪽 정렬","Align Left":"왼쪽 정렬","Align Right":"오른쪽 정렬","Insert Horizontal Line":"수평 구분선 넣기","Insert Image":"이미지 넣기","Insert file":"파일 넣기","Insert youtube/vimeo video":"Youtube/Vimeo 동영상","Insert link":"링크 넣기","Font size":"글꼴 크기","Font family":"글꼴","Insert format block":"블록 요소 넣기",Normal:"일반 텍스트","Heading 1":"제목 1","Heading 2":"제목 2","Heading 3":"제목 3","Heading 4":"제목 4",Quote:"인용",Code:"코드",Insert:"붙여 넣기","Insert table":"테이블","Decrease Indent":"들여쓰기 감소","Increase Indent":"들여쓰기 증가","Select Special Character":"특수문자 선택","Insert Special Character":"특수문자 입력","Paint format":"페인트 형식","Change mode":"편집모드 변경",Margins:"마진",top:"위",right:"오른쪽",bottom:"아래",left:"왼쪽",Styles:"스타일",Classes:"클래스",Align:"정렬",Right:"오른쪽으로",Center:"가운데로",Left:"왼쪽으로","--Not Set--":"--지정 안 함--",Src:"경로(src)",Title:"제목",Alternative:"대체 텍스트(alt)",Link:"링크","Open link in new tab":"새 탭에서 열기",file:"파일",Advanced:"고급","Image properties":"이미지 속성",Cancel:"취소",Ok:"확인","Your code is similar to HTML. Keep as HTML?":"HTML 코드로 감지했어요. 코드인채로 붙여넣을까요?","Paste as HTML":"HTML로 붙여넣기",Keep:"원본 유지",Clean:"지우기","Insert as Text":"텍스트로 넣기","Insert only Text":"텍스트만 넣기","Word Paste Detected":"Word 붙여넣기 감지","The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?":"Microsoft Word/Excel 문서로 감지했어요. 서식을 유지한채로 붙여넣을까요?","File Browser":"파일 탐색기","Error on load list":"목록 불러오기 에러","Error on load folders":"폴더 불러오기","Are you sure?":"정말 진행할까요?","Enter Directory name":"디렉토리 이름 입력","Create directory":"디렉토리 생성","type name":"이름 입력","Drop image":"이미지 드래그","Drop file":"파일 드래그","or click":"혹은 클릭","Alternative text":"대체 텍스트",Browse:"탐색",Upload:"업로드",Background:"배경",Text:"텍스트",Top:"위",Middle:"중앙",Bottom:"아래","Insert column before":"이전 열에 삽입","Insert column after":"다음 열에 삽입","Insert row above":"위 행에 삽입","Insert row below":"아래 행에 삽입","Delete table":"테이블 삭제","Delete row":"행 삭제","Delete column":"열 삭제","Empty cell":"빈 셀",source:"HTML 소스",bold:"볼드",italic:"이탤릭",brush:"브러시",link:"링크",undo:"실행 취소",redo:"재실행",table:"테이블",image:"이미지",eraser:"지우개",paragraph:"문단",fontsize:"글꼴 크기",video:"비디오",font:"글꼴",about:"편집기 정보",print:"프린트",symbol:"기호",underline:"밑줄",strikethrough:"취소선",indent:"들여쓰기",outdent:"내어쓰기",fullsize:"전체 화면",shrink:"일반 화면",copyformat:"복사 형식",hr:"구분선",ul:"글머리 목록",ol:"번호 목록",cut:"잘라내기",selectall:"모두 선택","Embed code":"Embed 코드","Open link":"링크 열기","Edit link":"링크 편집","No follow":"No follow",Unlink:"링크 제거",Eye:"사이트 확인",pencil:"연필",Update:"갱신"," URL":"URL",Edit:"편집","Horizontal align":"수평 정렬",Filter:"필터","Sort by changed":"변경일 정렬","Sort by name":"이름 정렬","Sort by size":"크기 정렬","Add folder":"새 폴더",Reset:"초기화",Save:"저장","Save as ...":"새로 저장하기 ...",Resize:"리사이즈",Crop:"크롭",Width:"가로 길이",Height:"세로 높이","Keep Aspect Ratio":"비율 유지하기",Yes:"네",No:"아니오",Remove:"제거",Select:"선택","Chars: %d":"문자수: %d","Words: %d":"단어수: %d",All:"모두","Select all":"모두 선택","Select %s":"선택: %s","Vertical align":"수직 정렬",Split:"분할","Split vertical":"세로 셀 분할","Split horizontal":"가로 셀 분할",Merge:"셀 병합","Add column":"열 추가","Add row":"행 추가",Delete:"삭제",Border:"외곽선","License: %s":"라이센스: %s","Strike through":"취소선",Underline:"밑줄",superscript:"윗첨자",subscript:"아래첨자","Cut selection":"선택 잘라내기",Break:"구분자","Search for":"검색","Replace with":"대체하기",Replace:"대체",Paste:"붙여넣기","Choose Content to Paste":"붙여넣을 내용 선택","You can only edit your own images. Download this image on the host?":"외부 이미지는 편집할 수 없어요. 외부 이미지를 다운로드 할까요?","The image has been successfully uploaded to the host!":"이미지를 무사히 업로드 했어요!",palette:"팔레트","There are no files":"파일이 없어요",Rename:"이름 변경","Enter new name":"새 이름 입력",preview:"리미보기",download:"다운로드","Paste from clipboard":"클립보드 붙여넣기","Your browser doesn't support direct access to the clipboard.":"사용중인 브라우저가 클립보드 접근을 지원하지 않아요.","Copy selection":"선택 복사",copy:"복사","Border radius":"둥근 테두리","Show all":"모두 보기",Apply:"적용","Please fill out this field":"이 분야","Please enter a web address":"를 입력하십시오.웹 주소",Default:"기본",Circle:"원",Dot:"점",Quadrate:"정방형",Find:"찾기","Find Previous":"이전 찾기","Find Next":"다음 찾기"};},e=>{e.exports={"Type something":"Begin met typen..",Advanced:"Geavanceerd","About Jodit":"Over Jodit","Jodit Editor":"Jodit Editor","Free Non-commercial Version":"Gratis niet-commerciële versie","Jodit User's Guide":"Jodit gebruikershandleiding","contains detailed help for using":"bevat gedetailleerde informatie voor gebruik.","For information about the license, please go to our website:":"Voor informatie over de licentie, ga naar onze website:","Buy full version":"Volledige versie kopen","Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.":"Copyright © XDSoft.net - Chupurnov Valeriy. Alle rechten voorbehouden.",Anchor:"Anker","Open in new tab":"Open in nieuwe tab","Open editor in fullsize":"Editor in volledig scherm openen","Clear Formatting":"Opmaak verwijderen","Fill color or set the text color":"Vulkleur of tekstkleur aanpassen",Redo:"Opnieuw",Undo:"Ongedaan maken",Bold:"Vet",Italic:"Cursief","Insert Unordered List":"Geordende list invoegen","Insert Ordered List":"Ongeordende lijst invoegen","Align Center":"Centreren","Align Justify":"Uitlijnen op volledige breedte","Align Left":"Links uitlijnen","Align Right":"Rechts uitlijnen","Insert Horizontal Line":"Horizontale lijn invoegen","Insert Image":"Afbeelding invoegen","Insert file":"Bestand invoegen","Insert youtube/vimeo video":"Youtube/Vimeo video invoegen","Insert link":"Link toevoegen","Font size":"Tekstgrootte","Font family":"Lettertype","Insert format block":"Format blok invoegen",Normal:"Normaal","Heading 1":"Koptekst 1","Heading 2":"Koptekst 2","Heading 3":"Koptekst 3","Heading 4":"Koptekst 4",Quote:"Citaat",Code:"Code",Insert:"Invoegen","Insert table":"Tabel invoegen","Decrease Indent":"Inspringing verkleinen","Increase Indent":"Inspringing vergroten","Select Special Character":"Symbool selecteren","Insert Special Character":"Symbool invoegen","Paint format":"Opmaak kopieren","Change mode":"Modus veranderen",Margins:"Marges",top:"Boven",right:"Rechts",bottom:"Onder",left:"Links",Styles:"CSS styles",Classes:"CSS classes",Align:"Uitlijning",Right:"Rechts",Center:"Gecentreerd",Left:"Links","--Not Set--":"--Leeg--",Src:"Src",Title:"Titel",Alternative:"Alternatieve tekst",Link:"Link","Open link in new tab":"Link in nieuwe tab openen",Image:"Afbeelding",file:"Bestand",Advansed:"Geavanceerd","Image properties":"Afbeeldingseigenschappen",Cancel:"Annuleren",Ok:"OK","Your code is similar to HTML. Keep as HTML?":"Deze code lijkt op HTML. Als HTML behouden?","Paste as HTML":"Invoegen als HTML",Keep:"Origineel behouden",Clean:"Opschonen","Insert as Text":"Als tekst invoegen","Word Paste Detected":"Word-tekst gedetecteerd","The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?":"De geplakte tekst is afkomstig van een Microsoft Word/Excel document. Wil je de opmaak behouden of opschonen?","Insert only Text":"Als onopgemaakte tekst invoegen","File Browser":"Bestandsbrowser","Error on load list":"Fout bij het laden van de lijst","Error on load folders":"Fout bij het laden van de mappenlijst","Are you sure?":"Weet je het zeker?","Enter Directory name":"Geef de map een naam","Create directory":"Map aanmaken","type name":"Type naam","Drop image":"Sleep hier een afbeelding naartoe","Drop file":"Sleep hier een bestand naartoe","or click":"of klik","Alternative text":"Alternatieve tekst",Browse:"Bladeren",Upload:"Uploaden",Background:"Achtergrond",Text:"Tekst",Top:"Boven",Middle:"Midden",Bottom:"Onder","Insert column before":"Kolom invoegen (voor)","Insert column after":"Kolom invoegen (na)","Insert row above":"Rij invoegen (boven)","Insert row below":"Rij invoegen (onder)","Delete table":"Tabel verwijderen","Delete row":"Rij verwijderen","Delete column":"Kolom verwijderen","Empty cell":"Cel leegmaken",Delete:"Verwijderen","Strike through":"Doorstrepen",Underline:"Onderstrepen",Break:"Enter","Search for":"Zoek naar","Replace with":"Vervangen door",Replace:"Vervangen",Edit:"Bewerken","Vertical align":"Verticaal uitlijnen","Horizontal align":"Horizontaal uitlijnen",Filter:"Filteren","Sort by changed":"Sorteren op wijzigingsdatum","Sort by name":"Sorteren op naam","Sort by size":"Sorteren op grootte","Add folder":"Map toevoegen",Split:"Splitsen","Split vertical":"Verticaal splitsen","Split horizontal":"Horizontaal splitsen",Merge:"Samenvoegen","Add column":"Kolom toevoegen","Add row":"Rij toevoegen",Border:"Rand","Embed code":"Embed code",Update:"Updaten",superscript:"Superscript",subscript:"Subscript","Cut selection":"Selectie knippen",Paste:"Plakken","Choose Content to Paste":"Kies content om te plakken","Chars: %d":"Tekens: %d","Words: %d":"Woorden: %d",All:"Alles","Select %s":"Selecteer: %s","Select all":"Selecteer alles",source:"Broncode",bold:"vet",italic:"cursief",brush:"kwast",link:"link",undo:"ongedaan maken",redo:"opnieuw",table:"tabel",image:"afbeelding",eraser:"gum",paragraph:"paragraaf",fontsize:"lettergrootte",video:"video",font:"lettertype",about:"over",print:"afdrukken",symbol:"symbool",underline:"onderstreept",strikethrough:"doorgestreept",indent:"inspringen",outdent:"minder inspringen",fullsize:"volledige grootte",shrink:"kleiner maken",copyformat:"opmaak kopiëren",hr:"horizontale lijn",ul:"lijst",ol:"genummerde lijst",cut:"knip",selectall:"alles selecteren","Open link":"link openen","Edit link":"link aanpassen","No follow":"niet volgen",Unlink:"link verwijderen",Eye:"Recensie",pencil:"Om te bewerken"," URL":" URL",Reset:"Herstellen",Save:"Opslaan","Save as ...":"Opslaan als ...",Resize:"Grootte aanpassen",Crop:"Bijknippen",Width:"Breedte",Height:"Hoogte","Keep Aspect Ratio":"Verhouding behouden",Yes:"Ja",No:"Nee",Remove:"Verwijderen",Select:"Selecteren","You can only edit your own images. Download this image on the host?":"Je kunt alleen je eigen afbeeldingen aanpassen. Deze afbeelding downloaden?","The image has been successfully uploaded to the host!":"De afbeelding is succesvol geüploadet!",palette:"Palette","There are no files":"Er zijn geen bestanden in deze map.",Rename:"Hongaars","Enter new name":"Voer een nieuwe naam in",preview:"voorvertoning",download:"Download","Paste from clipboard":"Plakken van klembord","Your browser doesn't support direct access to the clipboard.":"Uw browser ondersteunt geen directe toegang tot het klembord.","Copy selection":"Selectie kopiëren",copy:"kopiëren","Border radius":"Border radius","Show all":"Toon alle",Apply:"Toepassing","Please fill out this field":"Vul dit veld","Please enter a web address":"Voer een webadres",Default:"Standaard",Circle:"Cirkel",Dot:"Dot",Quadrate:"Quadrate",Find:"Zoeken","Find Previous":"Vorige Zoeken","Find Next":"Volgende Zoeken"};},e=>{e.exports={"Type something":"Napisz coś",Advanced:"Zaawansowane","About Jodit":"O Jodit","Jodit Editor":"Edytor Jodit","Jodit User's Guide":"Instrukcja Jodit","contains detailed help for using":"zawiera szczegółowe informacje dotyczące użytkowania.","For information about the license, please go to our website:":"Odwiedź naszą stronę, aby uzyskać więcej informacji na temat licencji:","Buy full version":"Zakup pełnej wersji","Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.":"Copyright © XDSoft.net - Chupurnov Valeriy. Wszystkie prawa zastrzeżone.",Anchor:"Kotwica","Open in new tab":"Otwórz w nowej zakładce","Open editor in fullsize":"Otwórz edytor w pełnym rozmiarze","Clear Formatting":"Wyczyść formatowanie","Fill color or set the text color":"Kolor wypełnienia lub ustaw kolor tekstu",Redo:"Ponów",Undo:"Cofnij",Bold:"Pogrubienie",Italic:"Kursywa","Insert Unordered List":"Wstaw listę wypunktowaną","Insert Ordered List":"Wstaw listę numeryczną","Align Center":"Wyśrodkuj","Align Justify":"Wyjustuj","Align Left":"Wyrównaj do lewej","Align Right":"Wyrównaj do prawej","Insert Horizontal Line":"Wstaw linię poziomą","Insert Image":"Wstaw grafikę","Insert file":"Wstaw plik","Insert youtube/vimeo video":"Wstaw film Youtube/vimeo","Insert link":"Wstaw link","Font size":"Rozmiar tekstu","Font family":"Krój czcionki","Insert format block":"Wstaw formatowanie",Normal:"Normalne","Heading 1":"Nagłówek 1","Heading 2":"Nagłówek 2","Heading 3":"Nagłówek 3","Heading 4":"Nagłówek 4",Quote:"Cytat",Code:"Kod",Insert:"Wstaw","Insert table":"Wstaw tabelę","Decrease Indent":"Zmniejsz wcięcie","Increase Indent":"Zwiększ wcięcie","Select Special Character":"Wybierz znak specjalny","Insert Special Character":"Wstaw znak specjalny","Paint format":"Malarz formatów","Change mode":"Zmień tryb",Margins:"Marginesy",top:"Górny",right:"Prawy",bottom:"Dolny",left:"Levy",Styles:"Style CSS",Classes:"Klasy CSS",Align:"Wyrównanie",Right:"Prawa",Center:"środek",Left:"Lewa","--Not Set--":"brak",Src:"Źródło",Title:"Tytuł",Alternative:"Tekst alternatywny",Link:"Link","Open link in new tab":"Otwórz w nowej zakładce",Image:"Grafika",file:"Plik",Advansed:"Zaawansowne","Image properties":"Właściwości grafiki",Cancel:"Anuluj",Ok:"OK","Your code is similar to HTML. Keep as HTML?":"Twój kod wygląda jak HTML. Zachować HTML?","Paste as HTML":"Wkleić jako HTML?",Keep:"Oryginalny tekst",Clean:"Wyczyść","Insert as Text":"Wstaw jako tekst","Word Paste Detected":"Wykryto tekst w formacie Word","The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?":"Wklejany tekst pochodzi z dokumentu Microsoft Word/Excel. Chcesz zachować ten format czy wyczyścić go? ","Insert only Text":"Wstaw tylko treść","File Browser":"Przeglądarka plików","Error on load list":"Błąd ładowania listy plików","Error on load folders":"Błąd ładowania folderów","Are you sure?":"Czy jesteś pewien?","Enter Directory name":"Wprowadź nazwę folderu","Create directory":"Utwórz folder","type name":"wprowadź nazwę","Drop image":"Upuść plik graficzny","Drop file":"Upuść plik","or click":"lub kliknij tu","Alternative text":"Tekst alternatywny",Browse:"Przeglądaj",Upload:"Wczytaj",Background:"Tło",Text:"Treść",Top:"Góra",Middle:"Środek",Bottom:"Dół","Insert column before":"Wstaw kolumnę przed","Insert column after":"Wstaw kolumnę po","Insert row above":"Wstaw wiersz przed","Insert row below":"Wstaw wiersz po","Delete table":"Usuń tabelę","Delete row":"Usuń wiersz","Delete column":"Usuń kolumnę","Empty cell":"Wyczyść komórkę",Delete:"Usuń","Strike through":"Przekreślenie",Underline:"Podkreślenie",Break:"Przerwa","Search for":"Szukaj","Replace with":"Zamień na",Replace:"Wymienić",Edit:"Edytuj","Vertical align":"Wyrównywanie w pionie","Horizontal align":"Wyrównywanie w poziomie",Filter:"Filtruj","Sort by changed":"Sortuj wg zmiany","Sort by name":"Sortuj wg nazwy","Sort by size":"Sortuj wg rozmiaru","Add folder":"Dodaj folder","Split vertical":"Podziel w pionie","Split horizontal":"Podziel w poziomie",Split:"Podziel",Merge:"Scal","Add column":"Dodaj kolumnę","Add row":"Dodaj wiersz",Border:"Obramowanie","Embed code":"Wstaw kod",Update:"Aktualizuj",superscript:"indeks górny",subscript:"index dolny","Cut selection":"Wytnij zaznaczenie",Paste:"Wklej","Choose Content to Paste":"Wybierz zawartość do wklejenia","Chars: %d":"Znaki: %d","Words: %d":"Słowa: %d",All:"Wszystko","Select %s":"Wybierz: %s","Select all":"Wybierz wszystko",source:"HTML",bold:"pogrubienie",italic:"kursywa",brush:"pędzel",link:"link",undo:"cofnij",redo:"ponów",table:"tabela",image:"grafika",eraser:"wyczyść",paragraph:"akapit",fontsize:"rozmiar czcionki",video:"wideo",font:"czcionka",about:"O programie",print:"drukuj",symbol:"symbol",underline:"podkreślenie",strikethrough:"przekreślenie",indent:"wcięcie",outdent:"wycięcie",fullsize:"pełen rozmiar",shrink:"przytnij",copyformat:"format kopii",hr:"linia pozioma",ul:"lista",ol:"lista numerowana",cut:"wytnij",selectall:"zaznacz wszystko","Open link":"otwórz link","Edit link":"edytuj link","No follow":"Atrybut no-follow",Unlink:"Usuń link",Eye:"szukaj",pencil:"edytuj"," URL":"URL",Reset:"wyczyść",Save:"zapisz","Save as ...":"zapisz jako",Resize:"Zmień rozmiar",Crop:"Przytnij",Width:"Szerokość",Height:"Wysokość","Keep Aspect Ratio":"Zachowaj proporcje",Yes:"Tak",No:"Nie",Remove:"Usuń",Select:"Wybierz","You can only edit your own images. Download this image on the host?":"Możesz edytować tylko swoje grafiki. Czy chcesz pobrać tą grafikę?","The image has been successfully uploaded to the host!":"Grafika została pomyślnienie dodana na serwer",palette:"Paleta","There are no files":"Brak plików.",Rename:"zmień nazwę","Enter new name":"Wprowadź nową nazwę",preview:"podgląd",download:"pobierz","Paste from clipboard":"Wklej ze schowka","Your browser doesn't support direct access to the clipboard.":"Twoja przeglądarka nie obsługuje schowka","Copy selection":"Kopiuj zaznaczenie",copy:"kopiuj","Border radius":"Zaokrąglenie krawędzi","Show all":"Pokaż wszystkie",Apply:"Zastosuj","Please fill out this field":"Proszę wypełnić to pole","Please enter a web address":"Proszę, wpisz adres sieci web",Default:"Domyślnie",Circle:"Koło",Dot:"Punkt",Quadrate:"Kwadrat",Find:"Znaleźć","Find Previous":"Znaleźć Poprzednie","Find Next":"Znajdź Dalej"};},e=>{e.exports={"Type something":"Escreva algo...",Advanced:"Avançado","About Jodit":"Sobre o Jodit","Jodit Editor":"Editor Jodit","Jodit User's Guide":"Guia de usuário Jodit","contains detailed help for using":"contém ajuda detalhada para o uso.","For information about the license, please go to our website:":"Para informação sobre a licença, por favor visite nosso site:","Buy full version":"Compre a versão completa","Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.":"Copyright © XDSoft.net - Chupurnov Valeriy. Todos os direitos reservados.",Anchor:"Link","Open in new tab":"Abrir em nova aba","Open editor in fullsize":"Abrir editor em tela cheia","Clear Formatting":"Limpar formatação","Fill color or set the text color":"Cor de preenchimento ou cor do texto",Redo:"Refazer",Undo:"Desfazer",Bold:"Negrito",Italic:"Itálico","Insert Unordered List":"Inserir lista não ordenada","Insert Ordered List":"Inserir lista ordenada","Align Center":"Centralizar","Align Justify":"Justificar","Align Left":"Alinhar à Esquerda","Align Right":"Alinhar à Direita","Insert Horizontal Line":"Inserir linha horizontal","Insert Image":"Inserir imagem","Insert file":"Inserir arquivo","Insert youtube/vimeo video":"Inserir vídeo do Youtube/vimeo","Insert link":"Inserir link","Font size":"Tamanho da letra","Font family":"Fonte","Insert format block":"Inserir bloco",Normal:"Normal","Heading 1":"Cabeçalho 1","Heading 2":"Cabeçalho 2","Heading 3":"Cabeçalho 3","Heading 4":"Cabeçalho 4",Quote:"Citação",Code:"Código",Insert:"Inserir","Insert table":"Inserir tabela","Decrease Indent":"Diminuir recuo","Increase Indent":"Aumentar recuo","Select Special Character":"Selecionar caractere especial","Insert Special Character":"Inserir caractere especial","Paint format":"Copiar formato","Change mode":"Mudar modo",Margins:"Margens",top:"cima",right:"direta",bottom:"baixo",left:"esquerda",Styles:"Estilos CSS",Classes:"Classes CSS",Align:"Alinhamento",Right:"Direita",Center:"Centro",Left:"Esquerda","--Not Set--":"--Não Estabelecido--",Src:"Fonte",Title:"Título",Alternative:"Texto Alternativo",Link:"Link","Open link in new tab":"Abrir link em nova aba",Image:"Imagem",file:"Arquivo",Advansed:"Avançado","Image properties":"Propriedades da imagem",Cancel:"Cancelar",Ok:"Ok","Your code is similar to HTML. Keep as HTML?":"Seu código é similar ao HTML. Manter como HTML?","Paste as HTML":"Colar como HTML?",Keep:"Manter",Clean:"Limpar","Insert as Text":"Inserir como Texto","Word Paste Detected":"Colado do Word Detectado","The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?":"O conteúdo colado veio de um documento Microsoft Word/Excel. Você deseja manter o formato ou limpa-lo?","Insert only Text":"Inserir somente o Texto","File Browser":"Procurar arquivo","Error on load list":"Erro ao carregar a lista","Error on load folders":"Erro ao carregar as pastas","Are you sure?":"Você tem certeza?","Enter Directory name":"Escreva o nome da pasta","Create directory":"Criar pasta","type name":"Escreva seu nome","Drop image":"Soltar imagem","Drop file":"Soltar arquivo","or click":"ou clique","Alternative text":"Texto alternativo",Browse:"Explorar",Upload:"Upload",Background:"Fundo",Text:"Texto",Top:"Cima",Middle:"Meio",Bottom:"Baixo","Insert column before":"Inserir coluna antes","Insert column after":"Inserir coluna depois","Insert row above":"Inserir linha acima","Insert row below":"Inserir linha abaixo","Delete table":"Excluir tabela","Delete row":"Excluir linha","Delete column":"Excluir coluna","Empty cell":"Limpar célula",Delete:"Excluir","Strike through":"Tachado",Underline:"Sublinhar",Break:"Pausa","Search for":"Procurar por","Replace with":"Substituir com",Replace:"Substituir",Edit:"Editar","Vertical align":"Alinhamento vertical","Horizontal align":"Alinhamento horizontal",Filter:"filtrar","Sort by changed":"Ordenar por modificação","Sort by name":"Ordenar por nome","Sort by size":"Ordenar por tamanho","Add folder":"Adicionar pasta",Split:"Dividir","Split vertical":"Dividir vertical","Split horizontal":"Dividir horizontal",Merge:"Mesclar","Add column":"Adicionar coluna","Add row":"Adicionar linha",Border:"Borda","Embed code":"Incluir código",Update:"Atualizar",superscript:"sobrescrito",subscript:"subscrito","Cut selection":"Cortar seleção",Paste:"Colar","Choose Content to Paste":"Escolher conteúdo para colar","Chars: %d":"Caracteres: %d","Words: %d":"Palavras: %d",All:"Tudo","Select %s":"Selecionar: %s","Select all":"Selecionar tudo",source:"HTML",bold:"negrito",italic:"itálico",brush:"pincel",link:"link",undo:"desfazer",redo:"refazer",table:"tabela",image:"imagem",eraser:"apagar",paragraph:"parágrafo",fontsize:"tamanho da letra",video:"vídeo",font:"fonte",about:"Sobre de",print:"Imprimir",symbol:"Símbolo",underline:"sublinhar",strikethrough:"tachado",indent:"recuar",outdent:"diminuir recuo",fullsize:"Tamanho completo",shrink:"diminuir",copyformat:"Copiar formato",hr:"linha horizontal",ul:"lista não ordenada",ol:"lista ordenada",cut:"Cortar",selectall:"Selecionar tudo","Open link":"Abrir link","Edit link":"Editar link","No follow":"Não siga",Unlink:"Remover link",Eye:"Visualizar",pencil:"Editar"," URL":"URL",Reset:"Resetar",Save:"Salvar","Save as ...":"Salvar como...",Resize:"Redimensionar",Crop:"Recortar",Width:"Largura",Height:"Altura","Keep Aspect Ratio":"Manter a proporção",Yes:"Sim",No:"Não",Remove:"Remover",Select:"Selecionar","You can only edit your own images. Download this image on the host?":"Você só pode editar suas próprias imagens. Baixar essa imagem pro servidor?","The image has been successfully uploaded to the host!":"A imagem foi enviada com sucesso para o servidor!",palette:"Palette","There are no files":"Não há arquivos nesse diretório.",Rename:"Húngara","Enter new name":"Digite um novo nome",preview:"preview",download:"Baixar","Paste from clipboard":"Colar da área de transferência","Your browser doesn't support direct access to the clipboard.":"O seu navegador não oferece suporte a acesso direto para a área de transferência.","Copy selection":"Selecção de cópia",copy:"cópia","Border radius":"Border radius","Show all":"Mostrar todos os",Apply:"Aplicar","Please fill out this field":"Por favor, preencha este campo","Please enter a web address":"Por favor introduza um endereço web",Default:"Padrão",Circle:"Círculo",Dot:"Ponto",Quadrate:"Quadro","Lower Alpha":"Letra Minúscula","Lower Greek":"Grego Minúscula","Lower Roman":"Romano Minúscula","Upper Alpha":"Letra Maiúscula","Upper Roman":"Romano Maiúscula",Find:"Encontrar","Find Previous":"Encontrar Anteriores","Find Next":"Localizar Próxima"};},e=>{e.exports={"Type something":"Напишите что-либо","About Jodit":"О Jodit","Jodit Editor":"Редактор Jodit","Jodit User's Guide":"Jodit Руководство пользователя","contains detailed help for using":"содержит детальную информацию по использованию","For information about the license, please go to our website:":"Для получения сведений о лицензии , пожалуйста, перейдите на наш сайт:","Buy full version":"Купить полную версию","Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.":"Авторские права © XDSoft.net - Чупурнов Валерий. Все права защищены.",Anchor:"Анкор","Open in new tab":"Открывать ссылку в новой вкладке","Open editor in fullsize":"Открыть редактор в полном размере","Clear Formatting":"Очистить форматирование","Fill color or set the text color":"Цвет заливки или цвет текста",Redo:"Повтор",Undo:"Отмена",Bold:"Жирный",Italic:"Наклонный","Insert Unordered List":"Вставка маркированного списка","Insert Ordered List":"Вставить нумерованный список","Align Center":"Выровнять по центру","Align Justify":"Выровнять по ширине","Align Left":"Выровнять по левому краю","Align Right":"Выровнять по правому краю","Insert Horizontal Line":"Вставить горизонтальную линию","Insert Image":"Вставить изображение","Insert file":"Вставить файл","Insert youtube/vimeo video":"Вставьте видео","Insert link":"Вставить ссылку","Font size":"Размер шрифта","Font family":"Шрифт","Insert format block":"Вставить блочный элемент",Normal:"Нормальный текст","Heading 1":"Заголовок 1","Heading 2":"Заголовок 2","Heading 3":"Заголовок 3","Heading 4":"Заголовок 4",Quote:"Цитата",Code:"Код",Insert:"Вставить","Insert table":"Вставить таблицу","Decrease Indent":"Уменьшить отступ","Increase Indent":"Увеличить отступ","Select Special Character":"Выберите специальный символ","Insert Special Character":"Вставить специальный символ","Paint format":"Формат краски","Change mode":"Источник",Margins:"Отступы",top:"сверху",right:"справа",bottom:"снизу",left:"слева",Styles:"Стили",Classes:"Классы",Align:"Выравнивание",Right:"По правому краю",Center:"По центру",Left:"По левому краю","--Not Set--":"--не устанавливать--",Src:"src",Title:"Заголовок",Alternative:"Альтернативный текст (alt)",Link:"Ссылка","Open link in new tab":"Открывать ссылку в новом окне",file:"Файл",Advanced:"Расширенные","Image properties":"Свойства изображения",Cancel:"Отмена",Ok:"Ок","Your code is similar to HTML. Keep as HTML?":"Ваш текст, который вы пытаетесь вставить похож на HTML. Вставить его как HTML?","Paste as HTML":"Вставить как HTML?",Keep:"Сохранить оригинал",Clean:"Почистить","Insert as Text":"Вставить как текст","Insert only Text":"Вставить только текст","Word Paste Detected":"Возможно это фрагмент Word или Excel","The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?":"Контент который вы вставляете поступает из документа Microsoft Word / Excel. Вы хотите сохранить формат или очистить его?","File Browser":"Браузер файлов","Error on load list":"Ошибка при загрузке списка изображений","Error on load folders":"Ошибка при загрузке списка директорий","Are you sure?":"Вы уверены?","Enter Directory name":"Введите название директории","Create directory":"Создать директорию","type name":"введите название","Drop image":"Перетащите сюда изображение","Drop file":"Перетащите сюда файл","or click":"или нажмите","Alternative text":"Альтернативный текст",Browse:"Сервер",Upload:"Загрузка",Background:"Фон",Text:"Текст",Top:" К верху",Middle:"По середине",Bottom:"К низу","Insert column before":"Вставить столбец до","Insert column after":"Вставить столбец после","Insert row above":"Вставить ряд выше","Insert row below":"Вставить ряд ниже","Delete table":"Удалить таблицу","Delete row":"Удалять ряд","Delete column":"Удалить столбец","Empty cell":"Очистить ячейку",source:"HTML",bold:"жирный",italic:"курсив",brush:"заливка",link:"ссылка",undo:"отменить",redo:"повторить",table:"таблица",image:"Изображение",eraser:"очистить",paragraph:"параграф",fontsize:"размер шрифта",video:"видео",font:"шрифт",about:"о редакторе",print:"печать",symbol:"символ",underline:"подчеркнутый",strikethrough:"перечеркнутый",indent:"отступ",outdent:"выступ",fullsize:"во весь экран",shrink:"обычный размер",copyformat:"Копировать формат",hr:"линия",ul:"Список",ol:"Нумерованный список",cut:"Вырезать",selectall:"Выделить все","Embed code":"Код","Open link":"Открыть ссылку","Edit link":"Редактировать ссылку","No follow":"Атрибут nofollow",Unlink:"Убрать ссылку",Eye:"Просмотр",pencil:"Редактировать",Update:"Обновить"," URL":"URL",Edit:"Редактировать","Horizontal align":"Горизонтальное выравнивание",Filter:"Фильтр","Sort by changed":"По изменению","Sort by name":"По имени","Sort by size":"По размеру","Add folder":"Добавить папку",Reset:"Восстановить",Save:"Сохранить","Save as ...":"Сохранить как",Resize:"Изменить размер",Crop:"Обрезать размер",Width:"Ширина",Height:"Высота","Keep Aspect Ratio":"Сохранять пропорции",Yes:"Да",No:"Нет",Remove:"Удалить",Select:"Выделить","Chars: %d":"Символов: %d","Words: %d":"Слов: %d",All:"Выделить все","Select %s":"Выделить: %s","Select all":"Выделить все","Vertical align":"Вертикальное выравнивание",Split:"Разделить","Split vertical":"Разделить по вертикали","Split horizontal":"Разделить по горизонтали",Merge:"Объединить в одну","Add column":"Добавить столбец","Add row":"Добавить строку",Delete:"Удалить",Border:"Рамка","License: %s":"Лицензия: %s","Strike through":"Перечеркнуть",Underline:"Подчеркивание",superscript:"верхний индекс",subscript:"индекс","Cut selection":"Вырезать",Break:"Разделитель","Search for":"Найти","Replace with":"Заменить на",Replace:"Заменить",Paste:"Вставить","Choose Content to Paste":"Выбрать контент для вставки","You can only edit your own images. Download this image on the host?":"Вы можете редактировать только свои собственные изображения. Загрузить это изображение на ваш сервер?","The image has been successfully uploaded to the host!":"Изображение успешно загружено на сервер!",palette:"палитра","There are no files":"В данном каталоге нет файлов",Rename:"Переименовать","Enter new name":"Введите новое имя",preview:"Предпросмотр",download:"Скачать","Paste from clipboard":"Вставить из буфера обмена","Your browser doesn't support direct access to the clipboard.":"Ваш браузер не поддерживает прямой доступ к буферу обмена.","Copy selection":"Скопировать выделенное",copy:"копия","Border radius":"Радиус границы","Show all":"Показать все",Apply:"Применить","Please fill out this field":"Пожалуйста, заполните это поле","Please enter a web address":"Пожалуйста, введите веб-адрес",Default:"По умолчанию",Circle:"Круг",Dot:"Точка",Quadrate:"Квадрат",Find:"Найти","Find Previous":"Найти Предыдущие","Find Next":"Найти Далее"};},e=>{e.exports={"Type something":"Bir şeyler yaz",Advanced:"Gelişmiş","About Jodit":"Jodit Hakkında","Jodit Editor":"Jodit Editor","Jodit User's Guide":"Jodit Kullanım Kılavuzu","contains detailed help for using":"kullanım için detaylı bilgiler içerir","For information about the license, please go to our website:":"Lisans hakkında bilgi için lütfen web sitemize gidin:","Buy full version":"Tam versiyonunu satın al","Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.":"Copyright © XDSoft.net - Chupurnov Valeriy. Tüm hakları saklıdır.",Anchor:"Bağlantı","Open in new tab":"Yeni sekmede aç","Open editor in fullsize":"Editörü tam ekranda aç","Clear Formatting":"Stili temizle","Fill color or set the text color":"Renk doldur veya yazı rengi seç",Redo:"Yinele",Undo:"Geri Al",Bold:"Kalın",Italic:"İtalik","Insert Unordered List":"Sırasız Liste Ekle","Insert Ordered List":"Sıralı Liste Ekle","Align Center":"Ortala","Align Justify":"Kenarlara Yasla","Align Left":"Sola Yasla","Align Right":"Sağa Yasla","Insert Horizontal Line":"Yatay Çizgi Ekle","Insert Image":"Resim Ekle","Insert file":"Dosya Ekle","Insert youtube/vimeo video":"Youtube/Vimeo Videosu Ekle","Insert link":"Bağlantı Ekle","Font size":"Font Boyutu","Font family":"Font Ailesi","Insert format block":"Blok Ekle",Normal:"Normal","Heading 1":"Başlık 1","Heading 2":"Başlık 2","Heading 3":"Başlık 3","Heading 4":"Başlık 4",Quote:"Alıntı",Code:"Kod",Insert:"Ekle","Insert table":"Tablo Ekle","Decrease Indent":"Girintiyi Azalt","Increase Indent":"Girintiyi Arttır","Select Special Character":"Özel Karakter Seç","Insert Special Character":"Özel Karakter Ekle","Paint format":"Resim Biçimi","Change mode":"Mod Değiştir",Margins:"Boşluklar",top:"Üst",right:"Sağ",bottom:"Alt",left:"Sol",Styles:"CSS Stilleri",Classes:"CSS Sınıfları",Align:"Hizalama",Right:"Sağ",Center:"Ortalı",Left:"Sol","--Not Set--":"Belirsiz",Src:"Kaynak",Title:"Başlık",Alternative:"Alternatif Yazı",Link:"Link","Open link in new tab":"Bağlantıyı yeni sekmede aç",Image:"Resim",file:"Dosya",Advansed:"Gelişmiş","Image properties":"Resim özellikleri",Cancel:"İptal",Ok:"Tamam","Your code is similar to HTML. Keep as HTML?":"Kodunuz HTML koduna benziyor. HTML olarak devam etmek ister misiniz?","Paste as HTML":"HTML olarak yapıştır",Keep:"Sakla",Clean:"Temizle","Insert as Text":"Yazı olarak ekle","Word Paste Detected":"Word biçiminde yapıştırma algılandı","The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?":"Der Inhalt, den Sie einfügen, stammt aus einem Microsoft Word / Excel-Dokument. Möchten Sie das Format erhalten oder löschen?","Insert only Text":"Sadece yazıyı ekle","File Browser":"Dosya Listeleyici","Error on load list":"Liste yüklenirken hata oluştu","Error on load folders":"Klasörler yüklenirken hata oluştur","Are you sure?":"Emin misiniz?","Enter Directory name":"Dizin yolu giriniz","Create directory":"Dizin oluştur","type name":"İsim yaz","Drop image":"Resim bırak","Drop file":"Dosya bırak","or click":"veya tıkla","Alternative text":"Alternatif yazı",Browse:"Gözat",Upload:"Yükle",Background:"Arka plan",Text:"Yazı",Top:"Üst",Middle:"Orta",Bottom:"Aşağı","Insert column before":"Öncesine kolon ekle","Insert column after":"Sonrasına kolon ekle","Insert row above":"Üstüne satır ekle","Insert row below":"Altına satır ekle","Delete table":"Tabloyu sil","Delete row":"Satırı sil","Delete column":"Kolonu sil","Empty cell":"Hücreyi temizle",Delete:"Sil","Strike through":"Üstü çizili",Underline:"Alt çizgi",Break:"Satır sonu","Search for":"Ara","Replace with":"Şununla değiştir",Replace:"Değiştir",Edit:"Düzenle","Vertical align":"Dikey hizala","Horizontal align":"Yatay hizala",Filter:"Filtre","Sort by changed":"Değişime göre sırala","Sort by name":"İsme göre sırala","Sort by size":"Boyuta göre sırala","Add folder":"Klasör ekle",Split:"Ayır","Split vertical":"Dikey ayır","Split horizontal":"Yatay ayır",Merge:"Birleştir","Add column":"Kolon ekle","Add row":"Satır ekle",Border:"Kenarlık","Embed code":"Kod ekle",Update:"Güncelle",superscript:"Üst yazı",subscript:"Alt yazı","Cut selection":"Seçilimi kes",Paste:"Yapıştır","Choose Content to Paste":"Yapıştırılacak içerik seç","Chars: %d":"Harfler: %d","Words: %d":"Kelimeler: %d",All:"Tümü","Select %s":"Seç: %s","Select all":"Tümünü seç",source:"Kaynak",bold:"Kalın",italic:"italik",brush:"Fırça",link:"Bağlantı",undo:"Geri al",redo:"Yinele",table:"Tablo",image:"Resim",eraser:"Silgi",paragraph:"Paragraf",fontsize:"Font boyutu",video:"Video",font:"Font",about:"Hakkında",print:"Yazdır",symbol:"Sembol",underline:"Alt çizgi",strikethrough:"Üstü çizili",indent:"Girinti",outdent:"Çıkıntı",fullsize:"Tam ekran",shrink:"Küçült",copyformat:"Kopyalama Biçimi",hr:"Ayraç",ul:"Sırasız liste",ol:"Sıralı liste",cut:"Kes",selectall:"Tümünü seç","Open link":"Bağlantıyı aç","Edit link":"Bağlantıyı düzenle","No follow":"Nofollow özelliği",Unlink:"Bağlantıyı kaldır",Eye:"Yorumu",pencil:"Düzenlemek için"," URL":"URL",Reset:"Sıfırla",Save:"Kaydet","Save as ...":"Farklı kaydet",Resize:"Boyutlandır",Crop:"Kırp",Width:"Genişlik",Height:"Yükseklik","Keep Aspect Ratio":"En boy oranını koru",Yes:"Evet",No:"Hayır",Remove:"Sil",Select:"Seç","You can only edit your own images. Download this image on the host?":"Sadece kendi resimlerinizi düzenleyebilirsiniz. Bu görseli kendi hostunuza indirmek ister misiniz?","The image has been successfully uploaded to the host!":"Görsel başarıyla hostunuza yüklendi",palette:"Palet","There are no files":"Bu dizinde dosya yok",Rename:"Yeniden isimlendir","Enter new name":"Yeni isim girin",preview:"Ön izleme",download:"İndir","Paste from clipboard":"Panodan yapıştır ","Your browser doesn't support direct access to the clipboard.":"Tarayıcınız panoya doğrudan erişimi desteklemiyor.","Copy selection":"Seçimi kopyala",copy:"Kopyala","Border radius":"Sınır yarıçapı","Show all":"Tümünü Göster",Apply:"Uygula","Please fill out this field":"Lütfen bu alanı doldurun","Please enter a web address":"Lütfen bir web adresi girin",Default:"Varsayılan",Circle:"Daire",Dot:"Nokta",Quadrate:"Kare",Find:"Bul","Find Previous":"Öncekini Bul","Find Next":"Sonrakini Bul"};},e=>{e.exports={"Type something":"输入一些内容",Advanced:"高级","About Jodit":"关于Jodit","Jodit Editor":"Jodit Editor","Free Non-commercial Version":"Free Non-commercial Version","Jodit User's Guide":"开发者指南","contains detailed help for using":"使用帮助","For information about the license, please go to our website:":"有关许可证的信息，请访问我们的网站：","Buy full version":"购买完整版本","Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.":"Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.",Anchor:"Anchor","Open in new tab":"在新窗口打开","Open editor in fullsize":"全屏编辑","Clear Formatting":"清除样式","Fill color or set the text color":"颜色",Redo:"重做",Undo:"撤销",Bold:"粗体",Italic:"斜体","Insert Unordered List":"符号列表","Insert Ordered List":"编号","Align Center":"居中","Align Justify":"对齐文本","Align Left":"左对齐","Align Right":"右对齐","Insert Horizontal Line":"分割线","Insert Image":"图片","Insert file":"文件","Insert youtube/vimeo video":"youtube/vimeo 视频","Insert link":"链接","Font size":"字号","Font family":"字体","Insert format block":"格式块",Normal:"文本","Heading 1":"标题1","Heading 2":"标题2","Heading 3":"标题3","Heading 4":"标题4",Quote:"引用",Code:"代码",Insert:"插入","Insert table":"表格","Decrease Indent":"减少缩进","Increase Indent":"增加缩进","Select Special Character":"选择特殊符号","Insert Special Character":"特殊符号","Paint format":"格式复制","Change mode":"改变模式",Margins:"外边距（Margins）",top:"top",right:"right",bottom:"bottom",left:"left",Styles:"样式",Classes:"Classes",Align:"对齐方式",Right:"居右",Center:"居中",Left:"居左","--Not Set--":"无",Src:"Src",Title:"Title",Alternative:"Alternative",Link:"Link","Open link in new tab":"在新窗口打开链接",Image:"图片",file:"file",Advansed:"高级","Image properties":"图片属性",Cancel:"取消",Ok:"确定","Your code is similar to HTML. Keep as HTML?":"你粘贴的文本是一段html代码，是否保留源格式","Paste as HTML":"html粘贴",Keep:"保留源格式",Clean:"匹配目标格式","Insert as Text":"把html代码视为普通文本","Word Paste Detected":"文本粘贴","The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?":"正在粘贴 Word/Excel 的文本，是否保留源格式？","Insert only Text":"只保留文本","File Browser":"文件管理","Error on load list":"加载list错误","Error on load folders":"加载folders错误","Are you sure?":"你确定吗？","Enter Directory name":"输入路径","Create directory":"创建路径","type name":"type name","Drop image":"拖动图片到此","Drop file":"拖动文件到此","or click":"或点击","Alternative text":"Alternative text",Browse:"浏览",Upload:"上传",Background:"背景色",Text:"文字",Top:"顶部",Middle:"中间",Bottom:"底部","Insert column before":"在之前插入列","Insert column after":"在之后插入列","Insert row above":"在之前插入行","Insert row below":"在之后插入行","Delete table":"删除表格","Delete row":"删除行","Delete column":"删除列","Empty cell":"清除内容","Chars: %d":"字符数: %d","Words: %d":"单词数: %d","Strike through":"删除线",Underline:"下划线",superscript:"上标",subscript:"下标","Cut selection":"剪切","Select all":"全选",Break:"Pause","Search for":"查找","Replace with":"替换为",Replace:"替换",Paste:"粘贴","Choose Content to Paste":"选择内容并粘贴",All:"全部",source:"源码",bold:"粗体",italic:"斜体",brush:"颜色",link:"链接",undo:"撤销",redo:"重做",table:"表格",image:"图片",eraser:"橡皮擦",paragraph:"段落",fontsize:"字号",video:"视频",font:"字体",about:"关于",print:"打印",symbol:"符号",underline:"下划线",strikethrough:"上出现",indent:"增加缩进",outdent:"减少缩进",fullsize:"全屏",shrink:"收缩",copyformat:"复制格式",hr:"分割线",ul:"无序列表",ol:"顺序列表",cut:"剪切",selectall:"全选","Open link":"打开链接","Edit link":"编辑链接","No follow":"No follow",Unlink:"Unlink",Eye:"回顧"," URL":"URL",Reset:"重置",Save:"保存","Save as ...":"保存为",Resize:"调整大小",Crop:"Crop",Width:"宽",Height:"高","Keep Aspect Ratio":"保存长宽比",Yes:"是",No:"不",Remove:"移除",Select:"选择","Select %s":"选择: %s",Update:"更新","Vertical align":"垂直对齐",Merge:"合并","Add column":"添加列","Add row":"添加行",Border:"边框","Embed code":"嵌入代码",Delete:"删除","Horizontal align":"水平对齐",Filter:"筛选","Sort by changed":"修改时间排序","Sort by name":"名称排序","Sort by size":"大小排序","Add folder":"新建文件夹",Split:"拆分","Split vertical":"垂直拆分","Split horizontal":"水平拆分","You can only edit your own images. Download this image on the host?":"你只能编辑你自己的图片。Download this image on the host?","The image has been successfully uploaded to the host!":"图片上传成功",palette:"调色板",pencil:"铅笔","There are no files":"此目录中沒有文件。",Rename:"重命名","Enter new name":"输入新名称",preview:"预览",download:"下载","Paste from clipboard":"粘贴从剪贴板","Your browser doesn't support direct access to the clipboard.":"你浏览器不支持直接访问的剪贴板。","Copy selection":"复制的选择",copy:"复制","Border radius":"边界半径","Show all":"显示所有",Apply:"适用","Please fill out this field":"请填写这个领域","Please enter a web address":"请输入一个网址",Default:"默认的",Circle:"圆圈",Dot:"点",Quadrate:"方形",Find:"找到","Find Previous":"找到以前的","Find Next":"找到下一个"};},e=>{e.exports={"Type something":"輸入一些內容",Advanced:"高級","About Jodit":"關於Jodit","Jodit Editor":"Jodit Editor","Jodit User's Guide":"開發者指南","contains detailed help for using":"使用幫助","For information about the license, please go to our website:":"有關許可證的信息，請訪問我們的網站：","Buy full version":"購買完整版本","Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.":"Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.",Anchor:"Anchor","Open in new tab":"在新窗口打開","Open editor in fullsize":"全屏編輯","Clear Formatting":"清除樣式","Fill color or set the text color":"顏色",Redo:"重做",Undo:"撤銷",Bold:"粗體",Italic:"斜體","Insert Unordered List":"符號列表","Insert Ordered List":"編號","Align Center":"居中","Align Justify":"對齊文本","Align Left":"左對齊","Align Right":"右對齊","Insert Horizontal Line":"分割線","Insert Image":"圖片","Insert file":"文件","Insert youtube/vimeo video":"youtube/vimeo 影片","Insert link":"鏈接","Font size":"字號","Font family":"字體","Insert format block":"格式塊",Normal:"文本","Heading 1":"標題1","Heading 2":"標題2","Heading 3":"標題3","Heading 4":"標題4",Quote:"引用",Code:"代碼",Insert:"插入","Insert table":"表格","Decrease Indent":"減少縮進","Increase Indent":"增加縮進","Select Special Character":"選擇特殊符號","Insert Special Character":"特殊符號","Paint format":"格式複製","Change mode":"改變模式",Margins:"外邊距（Margins）",top:"top",right:"right",bottom:"bottom",left:"left",Styles:"樣式",Classes:"Classes",Align:"對齊方式",Right:"居右",Center:"居中",Left:"居左","--Not Set--":"無",Src:"Src",Title:"Title",Alternative:"替代",Link:"Link","Open link in new tab":"在新窗口打開鏈接",Image:"圖片",file:"file",Advansed:"高級","Image properties":"圖片屬性",Cancel:"取消",Ok:"確定","Your code is similar to HTML. Keep as HTML?":"你黏貼的文本是一段html代碼，是否保留源格式","Paste as HTML":"html黏貼",Keep:"保留源格式",Clean:"匹配目標格式","Insert as Text":"把html代碼視為普通文本","Word Paste Detected":"文本黏貼","The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?":"正在黏貼 Word/Excel 的文本，是否保留源格式？","Insert only Text":"只保留文本","File Browser":"文件管理","Error on load list":"加載list錯誤","Error on load folders":"加載folders錯誤","Are you sure?":"你確定嗎？","Enter Directory name":"輸入路徑","Create directory":"創建路徑","type name":"type name","Drop image":"拖動圖片到此","Drop file":"拖動文件到此","or click":"或點擊","Alternative text":"替代文字",Browse:"瀏覽",Upload:"上傳",Background:"背景色",Text:"文字",Top:"頂部",Middle:"中間",Bottom:"底部","Insert column before":"在之前插入列","Insert column after":"在之後插入列","Insert row above":"在之前插入行","Insert row below":"在之後插入行","Delete table":"刪除表格","Delete row":"刪除行","Delete column":"刪除列","Empty cell":"清除內容","Chars: %d":"字符數: %d","Words: %d":"單詞數: %d","Strike through":"刪除線",Underline:"下劃線",superscript:"上標",subscript:"下標","Cut selection":"剪切","Select all":"全選",Break:"Pause","Search for":"查找","Replace with":"替換為",Replace:"แทนที่",Paste:"黏貼","Choose Content to Paste":"選擇內容並黏貼",All:"全部",source:"源碼",bold:"粗體",italic:"斜體",brush:"顏色",link:"鏈接",undo:"撤銷",redo:"重做",table:"表格",image:"圖片",eraser:"橡皮擦",paragraph:"段落",fontsize:"字號",video:"影片",font:"字體",about:"關於",print:"打印",symbol:"符號",underline:"下劃線",strikethrough:"上出現",indent:"增加縮進",outdent:"減少縮進",fullsize:"全屏",shrink:"收縮",copyformat:"複製格式",hr:"分割線",ul:"無序列表",ol:"順序列表",cut:"剪切",selectall:"全選","Open link":"打開鏈接","Edit link":"編輯鏈接","No follow":"No follow",Unlink:"取消連結",Eye:"回顧"," URL":"URL",Reset:"重置",Save:"保存","Save as ...":"保存為",Resize:"調整大小",Crop:"Crop",Width:"寬",Height:"高","Keep Aspect Ratio":"保存長寬比",Yes:"是",No:"不",Remove:"移除",Select:"選擇","Select %s":"選擇: %s",Update:"更新","Vertical align":"垂直對齊",Merge:"合併","Add column":"添加列","Add row":"添加行",Border:"邊框","Embed code":"嵌入代碼",Delete:"刪除","Horizontal align":"水平對齊",Filter:"篩選","Sort by changed":"修改時間排序","Sort by name":"名稱排序","Sort by size":"大小排序","Add folder":"新建文件夾",Split:"拆分","Split vertical":"垂直拆分","Split horizontal":"水平拆分","You can only edit your own images. Download this image on the host?":"你只能編輯你自己的圖片。是否下載此圖片到本地?","The image has been successfully uploaded to the host!":"圖片上傳成功",palette:"調色板",pencil:"鉛筆","There are no files":"此目錄中沒有文件。",Rename:"重命名","Enter new name":"輸入新名稱",preview:"預覽",download:"下載","Paste from clipboard":"從剪貼板貼上","Your browser doesn't support direct access to the clipboard.":"瀏覽器無法存取剪贴板。","Copy selection":"複製已選取項目",copy:"複製","Border radius":"邊框圓角","Show all":"顯示所有",Apply:"應用","Please fill out this field":"ได้โปรดกรอกช่องข้อมูลนี้","Please enter a web address":"โปรดเติมที่อยู่บนเว็บ",Default:"ค่าปริยาย",Circle:"วงกลม",Dot:"จุด",Quadrate:"Quadrate",Find:"ค้นหา","Find Previous":"ค้นหาก่อนหน้านี้","Find Next":"ค้นหาถัดไป"};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.xpath=t.tooltip=t.symbols=t.sticky=t.stat=t.source=t.resizeHandler=t.size=t.search=t.resizer=t.redoUndo=t.placeholder=t.orderedList=t.mobile=t.link=t.limit=t.justify=t.inlinePopup=t.hr=t.indent=t.iframe=t.hotkeys=t.fullsize=t.formatBlock=t.font=t.errorMessages=t.enter=t.DragAndDropElement=t.DragAndDrop=t.color=t.pasteStorage=t.paste=t.clipboard=t.copyFormat=t.WrapTextNodes=t.cleanHtml=t.bold=t.Delete=t.autofocus=t.about=t.addNewLine=void 0;var r=o(7),i=o(228);Object.defineProperty(t,"addNewLine",{enumerable:!0,get:function(){return i.addNewLine}});var n=o(230);Object.defineProperty(t,"about",{enumerable:!0,get:function(){return n.about}});var a=o(232);Object.defineProperty(t,"autofocus",{enumerable:!0,get:function(){return a.autofocus}});var s=o(233);Object.defineProperty(t,"Delete",{enumerable:!0,get:function(){return s.Delete}});var l=o(236);Object.defineProperty(t,"bold",{enumerable:!0,get:function(){return l.bold}});var c=o(237);Object.defineProperty(t,"cleanHtml",{enumerable:!0,get:function(){return c.cleanHtml}});var u=o(238);Object.defineProperty(t,"WrapTextNodes",{enumerable:!0,get:function(){return u.WrapTextNodes}});var d=o(239);Object.defineProperty(t,"copyFormat",{enumerable:!0,get:function(){return d.copyFormat}}),Object.defineProperty(t,"clipboard",{enumerable:!0,get:function(){return d.clipboard}}),Object.defineProperty(t,"paste",{enumerable:!0,get:function(){return d.paste}}),Object.defineProperty(t,"pasteStorage",{enumerable:!0,get:function(){return d.pasteStorage}});var p=o(247);Object.defineProperty(t,"color",{enumerable:!0,get:function(){return p.color}});var f=o(254);Object.defineProperty(t,"DragAndDrop",{enumerable:!0,get:function(){return f.DragAndDrop}});var h=o(255);Object.defineProperty(t,"DragAndDropElement",{enumerable:!0,get:function(){return h.DragAndDropElement}});var m=o(256);Object.defineProperty(t,"enter",{enumerable:!0,get:function(){return m.enter}});var v=o(257);Object.defineProperty(t,"errorMessages",{enumerable:!0,get:function(){return v.errorMessages}});var g=o(259);Object.defineProperty(t,"font",{enumerable:!0,get:function(){return g.font}});var y=o(260);Object.defineProperty(t,"formatBlock",{enumerable:!0,get:function(){return y.formatBlock}});var b=o(261);Object.defineProperty(t,"fullsize",{enumerable:!0,get:function(){return b.fullsize}});var _=o(263);Object.defineProperty(t,"hotkeys",{enumerable:!0,get:function(){return _.hotkeys}});var w=o(264);Object.defineProperty(t,"iframe",{enumerable:!0,get:function(){return w.iframe}}),r.__exportStar(o(265),t);var S=o(274);Object.defineProperty(t,"indent",{enumerable:!0,get:function(){return S.indent}});var C=o(275);Object.defineProperty(t,"hr",{enumerable:!0,get:function(){return C.hr}});var j=o(277);Object.defineProperty(t,"inlinePopup",{enumerable:!0,get:function(){return j.inlinePopup}});var k=o(283);Object.defineProperty(t,"justify",{enumerable:!0,get:function(){return k.justify}});var E=o(284);Object.defineProperty(t,"limit",{enumerable:!0,get:function(){return E.limit}});var I=o(285);Object.defineProperty(t,"link",{enumerable:!0,get:function(){return I.link}}),r.__exportStar(o(287),t);var x=o(292);Object.defineProperty(t,"mobile",{enumerable:!0,get:function(){return x.mobile}});var T=o(293);Object.defineProperty(t,"orderedList",{enumerable:!0,get:function(){return T.orderedList}});var P=o(294);Object.defineProperty(t,"placeholder",{enumerable:!0,get:function(){return P.placeholder}});var D=o(296);Object.defineProperty(t,"redoUndo",{enumerable:!0,get:function(){return D.redoUndo}});var z=o(297);Object.defineProperty(t,"resizer",{enumerable:!0,get:function(){return z.resizer}});var A=o(299);Object.defineProperty(t,"search",{enumerable:!0,get:function(){return A.search}});var M=o(301);Object.defineProperty(t,"size",{enumerable:!0,get:function(){return M.size}}),Object.defineProperty(t,"resizeHandler",{enumerable:!0,get:function(){return M.resizeHandler}});var L=o(306);Object.defineProperty(t,"source",{enumerable:!0,get:function(){return L.source}});var O=o(315);Object.defineProperty(t,"stat",{enumerable:!0,get:function(){return O.stat}});var B=o(316);Object.defineProperty(t,"sticky",{enumerable:!0,get:function(){return B.sticky}});var R=o(318);Object.defineProperty(t,"symbols",{enumerable:!0,get:function(){return R.symbols}}),r.__exportStar(o(321),t);var N=o(328);Object.defineProperty(t,"tooltip",{enumerable:!0,get:function(){return N.tooltip}}),r.__exportStar(o(330),t);var q=o(333);Object.defineProperty(t,"xpath",{enumerable:!0,get:function(){return q.xpath}});},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.addNewLine=void 0;var r=o(7);o(229);var i=o(8),n=o(115),a=o(10);i.Config.prototype.addNewLine=!0,i.Config.prototype.addNewLineOnDBLClick=!0,i.Config.prototype.addNewLineTagsTriggers=["table","iframe","img","hr","jodit"],i.Config.prototype.addNewLineDeltaShow=20;var s="addnewline",l=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.line=t.j.c.fromHTML('<div role="button" tabIndex="-1" title="'+t.j.i18n("Break")+'" class="jodit-add-new-line"><span>'+n.Icon.get("enter")+"</span></div>"),t.isMatchedTag=function(e){return Boolean(e&&t.j.o.addNewLineTagsTriggers.includes(e.nodeName.toLowerCase()))},t.preview=!1,t.lineInFocus=!1,t.isShown=!1,t.hideForce=function(){t.isShown&&(t.isShown=!1,t.j.async.clearTimeout(t.timeout),t.lineInFocus=!1,n.Dom.safeRemove(t.line));},t.hide=function(){t.isShown&&!t.lineInFocus&&(t.timeout=t.j.async.setTimeout(t.hideForce,{timeout:500,label:"add-new-line-hide"}));},t.canGetFocus=function(e){return null!=e&&n.Dom.isBlock(e,t.j.ew)&&!/^(img|table|iframe|hr)$/i.test(e.nodeName)},t.onClickLine=function(e){var o=t.j,r=o.createInside.element(o.o.enter);t.preview&&t.current&&t.current.parentNode?t.current.parentNode.insertBefore(r,t.current):o.editor.appendChild(r),o.s.setCursorIn(r),a.scrollIntoView(r,o.editor,o.ed),o.e.fire("synchro"),t.hideForce(),e.preventDefault();},t.onDblClickEditor=function(e){var o=t.j;if(!o.o.readonly&&o.o.addNewLineOnDBLClick&&e.target===o.editor&&o.s.isCollapsed()){var r=a.offset(o.editor,o,o.ed),i=e.pageY-o.ew.pageYOffset,n=o.createInside.element(o.o.enter);Math.abs(i-r.top)<Math.abs(i-(r.height+r.top))&&o.editor.firstChild?o.editor.insertBefore(n,o.editor.firstChild):o.editor.appendChild(n),o.s.setCursorIn(n),o.setEditorValue(),t.hideForce(),e.preventDefault();}},t.onMouseMove=function(e){var o=t.j,r=o.ed.elementFromPoint(e.clientX,e.clientY);if(n.Dom.isHTMLElement(r,o.ew)&&!n.Dom.isOrContains(t.line,r)&&n.Dom.isOrContains(o.editor,r))if(t.isMatchedTag(r)||(r=n.Dom.closest(r,t.isMatchedTag,o.editor)),r){if(t.isMatchedTag(r)){var i=n.Dom.up(r,(function(e){return n.Dom.isBlock(e,o.ew)}),o.editor);i&&i!==o.editor&&(r=i);}var s=a.position(r,t.j),l=!1,c=e.clientY;t.j.iframe&&(c+=a.position(t.j.iframe,t.j,!0).top);var u=t.j.o.addNewLineDeltaShow;Math.abs(c-s.top)>u||(l=s.top,t.preview=!0),Math.abs(c-(s.top+s.height))>u||(l=s.top+s.height,t.preview=!1),!1===l||a.call(t.preview?n.Dom.prev:n.Dom.next,r,t.canGetFocus,o.editor)?(t.current=!1,t.hide()):(t.line.style.top=l+"px",t.current=r,t.show());}else t.hide();},t}return r.__extends(t,e),t.prototype.show=function(){this.isShown||this.j.o.readonly||this.j.isLocked||(this.isShown=!0,this.j.async.clearTimeout(this.timeout),this.line.classList.toggle("jodit-add-new-line_after",!this.preview),this.j.container.appendChild(this.line),this.line.style.width=this.j.editor.clientWidth+"px");},t.prototype.afterInit=function(e){var t=this;e.o.addNewLine&&(e.e.on(this.line,"mousemove",(function(e){e.stopPropagation();})).on(this.line,"mousedown touchstart",this.onClickLine).on("change",this.hideForce).on(this.line,"mouseenter",(function(){t.j.async.clearTimeout(t.timeout),t.lineInFocus=!0;})).on(this.line,"mouseleave",(function(){t.lineInFocus=!1;})).on("changePlace",this.addEventListeners.bind(this)),this.addEventListeners());},t.prototype.addEventListeners=function(){var e=this.j;e.e.off(e.editor,"."+s).off(e.container,"."+s).on([e.ow,e.ew,e.editor],"scroll."+s,this.hideForce).on(e.editor,"dblclick."+s,this.onDblClickEditor).on(e.editor,"click."+s,this.hide).on(e.container,"mouseleave."+s,this.hide).on(e.editor,"mousemove."+s,e.async.debounce(this.onMouseMove,3*e.defaultTimeout));},t.prototype.beforeDestruct=function(){this.j.async.clearTimeout(this.timeout),this.j.e.off(this.line),this.j.e.off("changePlace",this.addEventListeners),n.Dom.safeRemove(this.line),this.j.e.off([this.j.ow,this.j.ew,this.j.editor],"."+s).off(this.j.container,"."+s);},t}(n.Plugin);t.addNewLine=l;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.about=void 0,o(231);var r=o(8),i=o(10),n=o(9),a=o(136);r.Config.prototype.controls.about={exec:function(e){var t=new a.Dialog({language:e.o.language}),o=e.i18n.bind(e);t.setHeader(o("About Jodit")),t.setContent('<div class="jodit-about">\n\t\t\t\t\t<div>'+o("Jodit Editor")+" v."+e.getVersion()+"</div>\n\t\t\t\t\t<div>"+o("License: %s",i.isLicense(e.o.license)?i.normalizeLicense(e.o.license):"MIT")+'</div>\n\t\t\t\t\t<div>\n\t\t\t\t\t\t<a href="https://xdsoft.net/jodit/" target="_blank">http://xdsoft.net/jodit/</a>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div>\n\t\t\t\t\t\t<a href="https://xdsoft.net/jodit/doc/" target="_blank">'+o("Jodit User's Guide")+"</a>\n\t\t\t\t\t\t"+o("contains detailed help for using")+"\n\t\t\t\t\t</div>\n\t\t\t\t\t<div>"+o("Copyright © XDSoft.net - Chupurnov Valeriy. All rights reserved.")+"</div>\n\t\t\t\t</div>"),i.css(t.dialog,{minHeight:200,minWidth:420}),t.open(!0),t.bindDestruct(e);},tooltip:"About Jodit",mode:n.MODE_SOURCE+n.MODE_WYSIWYG},t.about=function(e){e.registerButton({name:"about",group:"info"});};},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.autofocus=void 0;var r=o(8),i=o(33);r.Config.prototype.autofocus=!1,t.autofocus=function(e){e.e.on("afterInit",(function(){e.o.autofocus&&(e.defaultTimeout?e.async.setTimeout(e.s.focus,300):e.s.focus());})),e.e.on("afterInit afterAddPlace",(function(){e.e.off(e.editor,"mousedown.autofocus").on(e.editor,"mousedown.autofocus",(function(t){e.isEditorMode()&&t.target&&i.Dom.isBlock(t.target,e.ew)&&!t.target.childNodes.length&&(e.editor===t.target?e.s.focus():e.s.setCursorIn(t.target));}));}));};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Delete=void 0;var r=o(7),i=o(175),n=o(33),a=o(9),s=o(10),l=o(234);o(8).Config.prototype.delete={hotkeys:{delete:["delete","cmd+backspace"],deleteWord:["ctrl+delete","cmd+alt+backspace","ctrl+alt+backspace"],backspace:["backspace"],backspaceWord:["ctrl+backspace"]}};var c=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.requires=["hotkeys"],t}return r.__extends(t,e),Object.defineProperty(t.prototype,"root",{get:function(){return this.j.editor},enumerable:!1,configurable:!0}),t.prototype.afterInit=function(e){var t=this;e.e.on("afterCommand.delete",(function(e){"delete"===e&&t.afterDeleteCommand();})),e.registerCommand("deleteButton",{exec:function(){return t.onDelete(!1)},hotkeys:e.o.delete.hotkeys.delete},{stopPropagation:!1}).registerCommand("backspaceButton",{exec:function(){return t.onDelete(!0)},hotkeys:e.o.delete.hotkeys.backspace},{stopPropagation:!1}).registerCommand("deleteWordButton",{exec:function(){return t.onDelete(!1,!0)},hotkeys:e.o.delete.hotkeys.deleteWord}).registerCommand("backspaceWordButton",{exec:function(){return t.onDelete(!0,!0)},hotkeys:e.o.delete.hotkeys.backspaceWord});},t.prototype.beforeDestruct=function(e){e.e.off("afterCommand.delete");},t.prototype.afterDeleteCommand=function(){var e=this.j,t=e.s.current();if(t&&n.Dom.isTag(t.firstChild,"br")&&e.s.removeNode(t.firstChild),!(s.trim(e.editor.textContent||"")||e.editor.querySelector("img")||t&&n.Dom.closest(t,"table",e.editor))){e.editor.innerHTML="";var o=e.s.setCursorIn(e.editor);e.s.removeNode(o);}},t.prototype.onDelete=function(e,t){var o;void 0===t&&(t=!1);var r=this.j.selection;if(r.isFocused()||r.focus(),!(null===(o=r.sel)||void 0===o?void 0:o.rangeCount)||this.checkNotCollapsed())return !1;var i=this.j,s=r.range,c=i.createInside.text(a.INVISIBLE_SPACE);try{if(s.insertNode(c),!n.Dom.isOrContains(i.editor,c))return;if(l.normalizeCursorPosition(c,e),this.checkRemoveInseparableElement(c,e)||this.checkRemoveChar(c,e,t)||this.checkTableCell(c,e)||this.checkRemoveEmptyParent(c,e)||this.checkRemoveEmptyNeighbor(c,e)||this.checkJoinTwoLists(c,e)||this.checkJoinNeighbors(c,e)||this.checkRewrapListItem(c,e))return !1}catch(e){throw e}finally{this.safeRemoveEmptyNode(c);}return !1},t.prototype.checkNotCollapsed=function(){var e=this.j;if(!e.s.isCollapsed())return e.execCommand("Delete"),!0},t.prototype.checkRemoveChar=function(e,t,o){for(var r,i,c,u,d=t?-1:1,p=l.getSibling(e,!t),f=l.getSibling(e,t),h=null,m=!1;f&&(n.Dom.isText(f)||n.Dom.isInlineBlock(f));){for(;n.Dom.isInlineBlock(f);)f=t?null==f?void 0:f.lastChild:null==f?void 0:f.firstChild;if(!f)break;if(null===(r=f.nodeValue)||void 0===r?void 0:r.length){var v=f.nodeValue,g=v.length,y=t?g-1:0;if(v[y]===a.INVISIBLE_SPACE)for(;v[y]===a.INVISIBLE_SPACE;)y+=d;if(u=v[y],v[y+d]===a.INVISIBLE_SPACE){for(y+=d;v[y]===a.INVISIBLE_SPACE;)y+=d;y+=t?1:-1;}v=v.substr(t?0:y+1,t?y:g),p&&n.Dom.isText(p)&&!(t?/^ /:/ $/).test(null!==(i=p.nodeValue)&&void 0!==i?i:"")&&s.trimInv(p.nodeValue||"").length||(v=v.replace(t?/ +$/:/^ +/,a.NBSP_SPACE)),f.nodeValue=v;}if((null===(c=f.nodeValue)||void 0===c?void 0:c.length)||(h=f),!s.isVoid(u)&&u!==a.INVISIBLE_SPACE){if(m=!0,s.call(t?n.Dom.after:n.Dom.before,f,e),o)for(;this.checkRemoveChar(e,t,!1););break}var b=l.getSibling(f,t);!b&&f.parentNode&&f.parentNode!==this.root&&(b=l.findMostNestedNeighbor(f,!t,this.root,!0)),h&&(n.Dom.safeRemove(h),h=null),f=b;}return m&&(this.removeEmptyInlineParent(e),this.addBRInsideEmptyBlock(e),this.j.s.setCursorBefore(e)),m||void 0},t.prototype.removeEmptyInlineParent=function(e){for(var t=e.parentElement;t&&n.Dom.isInlineBlock(t);){var o=t.parentElement;n.Dom.isEmpty(t)&&(n.Dom.after(t,e),n.Dom.safeRemove(t)),t=o;}},t.prototype.addBRInsideEmptyBlock=function(e){e.parentElement!==this.root&&n.Dom.isBlock(e.parentElement,this.j.ew)&&n.Dom.each(e.parentElement,n.Dom.isEmptyTextNode)&&n.Dom.after(e,this.j.createInside.element("br"));},t.prototype.checkRemoveInseparableElement=function(e,t){var o=n.Dom.findSibling(e,t);if(n.Dom.isElement(o)&&(n.Dom.isTag(o,a.INSEPARABLE_TAGS)||n.Dom.isEmpty(o)||"false"===s.attr(o,"contenteditable")))return n.Dom.safeRemove(o),this.j.s.setCursorBefore(e),n.Dom.isTag(o,"br")&&this.checkRemoveEmptyParent(e,t),!0},t.prototype.checkTableCell=function(e,t){if(n.Dom.isCell(e.parentElement,this.j.ew))return !0},t.prototype.checkRemoveEmptyParent=function(e,t){var o=!1,r=this.j.s,i=r.setCursorBefore,s=r.setCursorIn,c=n.Dom.closest(e,n.Dom.isElement,this.root);if(c&&n.Dom.isEmpty(c)){var u=l.findNotEmptyNeighbor(e,t,this.root);do{if(!c||!n.Dom.isEmpty(c)||n.Dom.isCell(c,this.j.ew))break;n.Dom.after(c,e);var d=n.Dom.closest(c,(function(e){return n.Dom.isElement(e)&&e!==c}),this.root);n.Dom.safeRemove(c),o=!0,c=d;}while(c);return !(!o||!this.checkJoinTwoLists(e,t))||(!u||n.Dom.isText(u)||n.Dom.isTag(u,a.INSEPARABLE_TAGS)?i(e):s(u,!t),o||void 0)}},t.prototype.checkJoinTwoLists=function(e,t){var o=n.Dom.findSibling(e,t),r=n.Dom.findSibling(e,!t);if(!n.Dom.closest(e,n.Dom.isElement,this.root)&&n.Dom.isTag(o,["ul","ol"])&&n.Dom.isTag(r,["ul","ol"])&&n.Dom.isTag(o.lastElementChild,"li")&&n.Dom.isTag(r.firstElementChild,"li")){var i=this.j.s,a=i.setCursorBefore,l=i.setCursorAfter,c=o.lastElementChild;return s.call(t?n.Dom.prepend:n.Dom.append,r.firstElementChild,e),n.Dom.moveContent(r,o,!t),n.Dom.safeRemove(r),s.call(t?n.Dom.append:n.Dom.prepend,c,e),s.call(t?a:l,e),!0}},t.prototype.checkRemoveEmptyNeighbor=function(e,t){var o=n.Dom.closest(e,n.Dom.isElement,this.root);if(o){var r=l.findNotEmptySibling(o,t);return r&&n.Dom.isEmpty(r)?(n.Dom.safeRemove(r),this.j.s.setCursorBefore(e),!0):void 0}},t.prototype.checkJoinNeighbors=function(e,t){for(var o=this.jodit,r=e,i=r;r&&!l.findNotEmptySibling(r,t)&&r.parentElement!==this.root;)i=r=r.parentElement;if(n.Dom.isElement(i)){var a=l.findNotEmptySibling(i,t);if(a&&(this.checkMoveListContent(i,a,t)||this.moveContentAndRemoveEmpty(i,a,t)))return o.s.setCursorBefore(e),!0}},t.prototype.checkMoveListContent=function(e,t,o){var r=this.jodit,i=n.Dom.isTag(t,["ol","ul"]),a=n.Dom.isTag(e,["ol","ul"]),s=function(e,t){return t?e.firstElementChild:e.lastElementChild};return a?(t=r.createInside.element(r.o.enterBlock),n.Dom.before(e,t),this.moveContentAndRemoveEmpty(s(e,o),t,o)):!(!t||!i||a)&&this.moveContentAndRemoveEmpty(e,s(t,!o),o)},t.prototype.moveContentAndRemoveEmpty=function(e,t,o){if(e&&n.Dom.isElement(t)){n.Dom.moveContent(e,t,!o);for(var r=e;r&&r!==this.root&&n.Dom.isEmpty(r);){var i=r.parentElement;n.Dom.safeRemove(r),r=i;}return !0}return !1},t.prototype.checkJoinNeighbors2=function(e,t){var o=n.Dom.closest(e,n.Dom.isElement,this.root);if(o){var r=l.getSiblingBox(o,t,this.root);if(r){var i=r;if(this.j.s.setCursorBefore(e),this.j.s.cursorInTheEdge(t,o)){if(n.Dom.isTag(r,["ul","ol"])&&!n.Dom.isTag(o,["ul","ol"])&&(r=t?r.lastElementChild:r.firstElementChild),o&&r&&i&&n.Dom.isElement(r)&&this.j.s.cursorInTheEdge(t,o)){n.Dom.moveContent(o,r,!t);var a=void 0;do{if((a=l.findMostNestedNeighbor(i,t,this.root))===o){var c=a;do{var u=c.parentElement;n.Dom.safeRemove(c),c=u;}while(c&&n.Dom.isEmpty(c))}n.Dom.safeRemove(a);}while(a!==o);return this.j.s.setCursorBefore(e),!0}if(n.Dom.isTag(o,"li")&&this.j.s.cursorInTheEdge(t,o)){s.call(t?n.Dom.before:n.Dom.after,o,e);var d=this.checkJoinNeighbors(e,t);return s.call(t?n.Dom.prepend:n.Dom.append,o,e),this.j.s.setCursorBefore(e),d}}}}},t.prototype.checkRewrapListItem=function(e,t){var o;if(t){var r=n.Dom.closest(e,n.Dom.isElement,this.root);if(n.Dom.isTag(r,"li")&&(null===(o=null==r?void 0:r.parentElement)||void 0===o?void 0:o.firstElementChild)===r&&this.j.s.cursorInTheEdge(!0,r)){var i=r.parentElement,a=this.j.createInside.element(this.j.o.enterBlock);return n.Dom.before(i,a),n.Dom.moveContent(r,a),n.Dom.safeRemove(r),n.Dom.isEmpty(i)&&n.Dom.safeRemove(i),this.j.s.setCursorBefore(e),!0}}},t.prototype.safeRemoveEmptyNode=function(e){var t,o,r=this.j.s.range;r.startContainer===e&&(e.previousSibling?n.Dom.isText(e.previousSibling)?r.setStart(e.previousSibling,null!==(o=null===(t=e.previousSibling.nodeValue)||void 0===t?void 0:t.length)&&void 0!==o?o:0):r.setStartAfter(e.previousSibling):e.nextSibling&&(n.Dom.isText(e.nextSibling)?r.setStart(e.nextSibling,0):r.setStartBefore(e.nextSibling)),r.collapse(!0),this.j.s.selectRange(r)),n.Dom.safeRemove(e);},t}(i.Plugin);t.Delete=c;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.normalizeCursorPosition=t.findMostNestedNeighbor=t.findNotEmptySibling=t.findNotEmptyNeighbor=t.getSibling=void 0;var r=o(7),i=o(11),n=o(33),a=o(9),s=o(23);function l(e,t){return t?e.previousSibling:e.nextSibling}function c(e,t,o){return i.call(t?n.Dom.prev:n.Dom.next,e,(function(e){return Boolean(e&&(!n.Dom.isText(e)||s.trim((null==e?void 0:e.nodeValue)||"").length))}),o)}r.__exportStar(o(235),t),t.getSibling=l,t.findNotEmptyNeighbor=c,t.findNotEmptySibling=function(e,t){return n.Dom.findSibling(e,t,(function(e){var t;return !n.Dom.isEmptyTextNode(e)&&Boolean(!n.Dom.isText(e)||(null===(t=e.nodeValue)||void 0===t?void 0:t.length)&&s.trim(e.nodeValue))}))},t.findMostNestedNeighbor=function(e,t,o,r){void 0===r&&(r=!1);var i=function(e){return t?e.firstChild:e.lastChild},a=c(e,!t,o);if(r&&n.Dom.isElement(a)&&!n.Dom.isInlineBlock(a))return null;if(a)do{if(!i(a))return a;a=i(a);}while(a);return null},t.normalizeCursorPosition=function(e,t){for(var o=n.Dom.findSibling(e,t),r=n.Dom.findSibling(e,!t);n.Dom.isElement(o)&&!n.Dom.isTag(o,a.INSEPARABLE_TAGS)&&!r;)t||!o.firstChild?o.appendChild(e):n.Dom.before(o.firstChild,e),o=l(e,t),r=l(e,!t);};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.getSiblingBox=void 0;var r=o(33),i=o(9),n=o(234);t.getSiblingBox=function(e,t,o){for(var a=function(){var a=function(e){return r.Dom.isElement(e)&&!r.Dom.isTag(e,i.INSEPARABLE_TAGS)},s=function(e){var o=t?e.lastChild:e.firstChild;return a(o)?s(o):a(e)?e:null},l=n.findNotEmptySibling(e,t);if(l)return {value:a(l)?s(l):null};e.parentElement&&e.parentElement!==o&&(e=e.parentElement);};e;){var s=a();if("object"==typeof s)return s.value}return null};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.bold=void 0;var r=o(7),i=o(8),n=o(10);i.Config.prototype.controls.subscript={tags:["sub"],tooltip:"subscript"},i.Config.prototype.controls.superscript={tags:["sup"],tooltip:"superscript"},i.Config.prototype.controls.bold={tagRegExp:/^(strong|b)$/i,tags:["strong","b"],css:{"font-weight":["bold","700"]},tooltip:"Bold"},i.Config.prototype.controls.italic={tagRegExp:/^(em|i)$/i,tags:["em","i"],css:{"font-style":"italic"},tooltip:"Italic"},i.Config.prototype.controls.underline={tagRegExp:/^(u)$/i,tags:["u"],css:{"text-decoration":"underline"},tooltip:"Underline"},i.Config.prototype.controls.strikethrough={tagRegExp:/^(s)$/i,tags:["s"],css:{"text-decoration":"line-through"},tooltip:"Strike through"},t.bold=function(e){var t=function(t){var o=i.Config.defaultOptions.controls[t],a=r.__assign({},o.css),s={};return Object.keys(a).forEach((function(e){s[e]=n.isArray(a[e])?a[e][0]:a[e];})),e.s.applyStyle(s,{element:o.tags?o.tags[0]:void 0}),e.e.fire("synchro"),!1};["bold","italic","underline","strikethrough"].forEach((function(t){e.registerButton({name:t,group:"font-style"});})),["superscript","subscript"].forEach((function(t){e.registerButton({name:t,group:"script"});})),e.registerCommand("bold",{exec:t,hotkeys:["ctrl+b","cmd+b"]}).registerCommand("italic",{exec:t,hotkeys:["ctrl+i","cmd+i"]}).registerCommand("underline",{exec:t,hotkeys:["ctrl+u","cmd+u"]}).registerCommand("strikethrough",{exec:t});};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.cleanHtml=void 0;var r=o(7),i=o(8),n=o(9),a=o(115),s=o(10),l=o(175),c=o(38);i.Config.prototype.cleanHTML={timeout:300,removeEmptyElements:!0,fillEmptyParagraph:!0,replaceNBSP:!0,replaceOldTags:{i:"em",b:"strong"},allowTags:!1,denyTags:!1},i.Config.prototype.controls.eraser={command:"removeFormat",tooltip:"Clear Formatting"};var u=function(e){function t(){var o=null!==e&&e.apply(this,arguments)||this;return o.buttons=[{name:"eraser",group:"font-style"}],o.visitNode=function(e,t,r){var i=!1;if(!e)return i;if(o.isRemovableNode(e,t))return r.push(e),o.visitNode(e.nextSibling,t,r);if(o.j.o.cleanHTML.fillEmptyParagraph&&a.Dom.isBlock(e,o.j.ew)&&a.Dom.isEmpty(e,/^(img|svg|canvas|input|textarea|form|br)$/)){var n=o.j.createInside.element("br");e.appendChild(n),i=!0;}var s=o.allowTagsHash;if(s&&!0!==s[e.nodeName]){var l=e.attributes;if(l&&l.length){for(var c=[],u=0;l.length>u;u+=1){var d=s[e.nodeName][l[u].name];(!d||!0!==d&&d!==l[u].value)&&c.push(l[u].name);}c.length&&(i=!0),c.forEach((function(t){e.removeAttribute(t);}));}}return i=o.visitNode(e.firstChild,t,r)||i,o.visitNode(e.nextSibling,t,r)||i},o.allowTagsHash=t.getHash(o.j.o.cleanHTML.allowTags),o.denyTagsHash=t.getHash(o.j.o.cleanHTML.denyTags),o.onKeyUpCleanUp=function(){var e=o.j;if(o.allowEdit()){var t=e.s.current();if(t){var r=a.Dom.up(t,(function(t){return a.Dom.isBlock(t,e.ew)}),e.editor);r&&a.Dom.all(r,(function(o){o&&a.Dom.isText(o)&&null!=o.nodeValue&&n.INVISIBLE_SPACE_REG_EXP().test(o.nodeValue)&&0!==o.nodeValue.replace(n.INVISIBLE_SPACE_REG_EXP(),"").length&&(o.nodeValue=o.nodeValue.replace(n.INVISIBLE_SPACE_REG_EXP(),""),o===t&&e.s.isCollapsed()&&e.s.setCursorAfter(o));}));}}},o.beforeCommand=function(e){if("removeformat"===e.toLowerCase())return o.onRemoveFormat(),!1},o}return r.__extends(t,e),t.prototype.afterInit=function(e){e.e.off(".cleanHtml").on("change.cleanHtml afterSetMode.cleanHtml afterInit.cleanHtml mousedown.cleanHtml keydown.cleanHtml",this.onChangeCleanHTML).on("keyup.cleanHtml",this.onKeyUpCleanUp).on("beforeCommand.cleanHtml",this.beforeCommand);},t.prototype.onChangeCleanHTML=function(){if(this.allowEdit()){var e=this.j,t=e.s.current(),o=e.o.cleanHTML.replaceOldTags;if(o&&t){var r=Object.keys(o);if(e.s.isCollapsed()){var i=a.Dom.closest(t,r,e.editor);if(i){var n=e.s.save(),s=o[i.nodeName.toLowerCase()]||o[i.nodeName];a.Dom.replace(i,s,e.createInside,!0,!1),e.s.restore(n);}}}var l=null;e.editor.firstChild&&(l=e.editor.firstChild);var c=[],u=this.visitNode(l,t,c);c.forEach(a.Dom.safeRemove),(c.length||u)&&e.events&&e.e.fire("synchro");}},t.prototype.allowEdit=function(){return !(this.j.isInDestruct||!this.j.isEditorMode()||this.j.getReadOnly())},t.getHash=function(e){var t=/([^[]*)\[([^\]]+)]/,o=/[\s]*,[\s]*/,r=/^(.*)[\s]*=[\s]*(.*)$/,i={};return s.isString(e)?(e.split(o).map((function(e){e=s.trim(e);var n=t.exec(e),a={};if(n){var l=n[2].split(o);n[1]&&(l.forEach((function(e){e=s.trim(e);var t=r.exec(e);t?a[t[1]]=t[2]:a[e]=!0;})),i[n[1].toUpperCase()]=a);}else i[e.toUpperCase()]=!0;})),i):!!e&&(Object.keys(e).forEach((function(t){i[t.toUpperCase()]=e[t];})),i)},t.prototype.onRemoveFormat=function(){this.j.s.isCollapsed()?this.removeFormatForCollapsedSelection():this.removeFormatForSelection();},t.prototype.removeFormatForCollapsedSelection=function(e){var t=this.j.s,o=e;o||(o=this.j.createInside.fake(),t.range.insertNode(o),t.range.collapse());var r=a.Dom.furthest(o,this.isInlineBlock,this.j.editor);if(r)if(t.cursorOnTheLeft(r))a.Dom.before(r,o);else if(t.cursorOnTheRight(r))a.Dom.after(r,o);else {var i=t.splitSelection(r);i&&a.Dom.after(i,o);}e||(t.setCursorBefore(o),a.Dom.safeRemove(o));},t.prototype.isInlineBlock=function(e){return a.Dom.isInlineBlock(e)&&!a.Dom.isTag(e,n.INSEPARABLE_TAGS)},t.prototype.removeFormatForSelection=function(){var e=this,t=this.j.s,o=t.range,r=o.cloneRange(),i=o.cloneRange(),n=this.j.createInside.fake(),s=this.j.createInside.fake();r.collapse(!0),i.collapse(!1),r.insertNode(n),i.insertNode(s),o.setStartBefore(n),o.collapse(!0),t.selectRange(o),this.removeFormatForCollapsedSelection(n),o.setEndAfter(s),o.collapse(!1),t.selectRange(o),this.removeFormatForCollapsedSelection(s);var l=[];a.Dom.between(n,s,(function(t){e.isInlineBlock(t)&&l.push(t);})),l.forEach((function(e){return a.Dom.unwrap(e)})),o.setStartAfter(n),o.setEndBefore(s),t.selectRange(o),a.Dom.safeRemove(n),a.Dom.safeRemove(s);},t.prototype.isRemovableNode=function(e,o){var r=this,i=this.allowTagsHash;return !(a.Dom.isText(e)||!(i&&!i[e.nodeName]||this.denyTagsHash&&this.denyTagsHash[e.nodeName]))||!(!(o&&a.Dom.isTag(e,"br")&&t.hasNotEmptyTextSibling(e))||t.hasNotEmptyTextSibling(e,!0)||a.Dom.up(e,(function(e){return a.Dom.isBlock(e,r.j.ew)}),this.j.editor)===a.Dom.up(o,(function(e){return a.Dom.isBlock(e,r.j.ew)}),this.j.editor))||this.j.o.cleanHTML.removeEmptyElements&&null!=o&&a.Dom.isElement(e)&&null!=e.nodeName.match(n.IS_INLINE)&&!this.j.s.isMarker(e)&&0===s.trim(e.innerHTML).length&&!a.Dom.isOrContains(e,o)},t.hasNotEmptyTextSibling=function(e,t){void 0===t&&(t=!1);for(var o=t?e.nextSibling:e.previousSibling;o;){if(a.Dom.isElement(o)||!a.Dom.isEmptyTextNode(o))return !0;o=t?o.nextSibling:o.previousSibling;}return !1},t.prototype.beforeDestruct=function(){this.j.e.off(".cleanHtml");},r.__decorate([c.debounce((function(e){return e.jodit.o.cleanHTML.timeout}))],t.prototype,"onChangeCleanHTML",null),r.__decorate([c.autobind],t.prototype,"isInlineBlock",null),t}(l.Plugin);t.cleanHtml=u;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.WrapTextNodes=void 0;var r=o(7),i=o(175),n=o(33),a=o(14),s=o(38),l=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.isSuitableStart=function(e){return n.Dom.isText(e)&&a.isString(e.nodeValue)&&/[^\s]/.test(e.nodeValue)||t.isNotClosed(e)&&!t.jodit.selection.isMarker(e)},t.isSuitable=function(e){return n.Dom.isText(e)||t.isNotClosed(e)},t.isNotClosed=function(e){return n.Dom.isElement(e)&&!(n.Dom.isBlock(e,t.jodit.ew)||n.Dom.isTag(e,["hr"]))},t}return r.__extends(t,e),t.prototype.afterInit=function(e){"br"!==e.o.enter.toLowerCase()&&e.e.on("afterInit.wtn postProcessSetEditorValue.wtn",this.postProcessSetEditorValue);},t.prototype.beforeDestruct=function(e){e.e.off(".wtn");},t.prototype.postProcessSetEditorValue=function(){var e=this.jodit;if(e.isEditorMode()){for(var t=e.editor.firstChild,o=!1,r=null;t;){if(this.isSuitableStart(t)){o||(r=e.s.save()),o=!0;var i=e.createInside.element(e.o.enter);for(n.Dom.before(t,i);t&&this.isSuitable(t);){var a=t.nextSibling;i.appendChild(t),t=a;}i.normalize();}t=t&&t.nextSibling;}o&&(e.s.restore(r),"afterInit"===e.e.current&&e.e.fire("internalChange"));}},r.__decorate([s.autobind],t.prototype,"postProcessSetEditorValue",null),t}(i.Plugin);t.WrapTextNodes=l;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);o(240),r.__exportStar(o(242),t),r.__exportStar(o(243),t),r.__exportStar(o(244),t),r.__exportStar(o(246),t);},(e,t,o)=>{var r;Object.defineProperty(t,"__esModule",{value:!0});var i=o(7),n=o(8),a=o(9),s=o(136),l=o(241),c=o(242);n.Config.prototype.askBeforePasteHTML=!0,n.Config.prototype.processPasteHTML=!0,n.Config.prototype.askBeforePasteFromWord=!0,n.Config.prototype.processPasteFromWord=!0,n.Config.prototype.nl2brInPlainText=!0,n.Config.prototype.defaultActionOnPaste=a.INSERT_AS_HTML,n.Config.prototype.defaultActionOnPasteFromWord=null,n.Config.prototype.draggableTags=["img","a","jodit-media","jodit"],n.Config.prototype.controls.cut={command:"cut",isDisabled:function(e){return e.s.isCollapsed()},tooltip:"Cut selection"},n.Config.prototype.controls.copy={command:"copy",isDisabled:function(e){return e.s.isCollapsed()},tooltip:"Copy selection"};var u="pasteStorage";n.Config.prototype.controls.paste={tooltip:"Paste from clipboard",exec:function(e,t,o){var r=o.control;return i.__awaiter(this,void 0,void 0,(function(){var t,o,n,d,p;return i.__generator(this,(function(i){switch(i.label){case 0:if(r.name===u)return e.execCommand("showPasteStorage"),[2];if(e.s.focus(),t="",o=!0,!navigator.clipboard)return [3,11];i.label=1;case 1:return i.trys.push([1,6,,7]),[4,navigator.clipboard.read()];case 2:return (n=i.sent())&&n.length?[4,n[0].getType(a.TEXT_PLAIN)]:[3,5];case 3:return d=i.sent(),[4,new Response(d).text()];case 4:t=i.sent(),i.label=5;case 5:return o=!1,[3,7];case 6:return i.sent(),[3,7];case 7:if(!o)return [3,11];i.label=8;case 8:return i.trys.push([8,10,,11]),[4,navigator.clipboard.readText()];case 9:return t=i.sent(),o=!1,[3,11];case 10:return i.sent(),[3,11];case 11:return o&&(t=e.buffer.get(c.pluginKey)||"",o=0===t.length),p=e.value,o?(e.ed.execCommand("paste"),!(o=p===e.value)&&e.e.fire("afterPaste")):t.length?(l.pasteInsertHtml(null,e,t),e.e.fire("afterPaste")):o&&s.Alert(e.i18n("Your browser doesn't support direct access to the clipboard."),(function(){e.s.focus();})).bindDestruct(e),[2]}}))}))},list:(r={},r[u]="Paste Storage",r),isChildDisabled:function(e){return 2>e.e.fire("pasteStorageList")}},n.Config.prototype.controls.selectall={icon:"select-all",command:"selectall",tooltip:"Select all"};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.getAllTypes=t.pasteInsertHtml=t.getDataTransfer=void 0;var r=o(10),i=o(33),n=o(9);t.getDataTransfer=function(e){if(e.clipboardData)return e.clipboardData;try{return e.dataTransfer||new DataTransfer}catch(e){return null}},t.pasteInsertHtml=function(e,t,o){if(!t.isInDestruct){"drop"===(null==e?void 0:e.type)&&t.s.insertCursorAtPoint(e.clientX,e.clientY);var n=t.e.fire("beforePasteInsert",o);!r.isVoid(n)&&(r.isString(n)||r.isNumber(n)||i.Dom.isNode(n,t.ew))&&(o=n),r.isString(o)&&(o=function(e){var t=(e=e.replace(/<meta[^>]+?>/g,"")).search(/<!--StartFragment-->/i);-1!==t&&(e=e.substr(t+20));var o=e.search(/<!--EndFragment-->/i);return -1!==o&&(e=e.substr(0,o)),e}(o)),t.s.insertHTML(o);}},t.getAllTypes=function(e){var t=e.types,o="";if(r.isArray(t)||"domstringlist"===r.type(t))for(var i=0;t.length>i;i+=1)o+=t[i]+";";else o=(t||n.TEXT_PLAIN).toString()+";";return o};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.clipboard=t.pluginKey=void 0;var r=o(9),i=o(10),n=o(241);t.pluginKey="clipboard";var a=function(){function e(){this.buttons=[{name:"cut",group:"clipboard"},{name:"copy",group:"clipboard"},{name:"paste",group:"clipboard"},{name:"selectall",group:"clipboard"}];}return e.prototype.init=function(e){this.buttons.forEach((function(t){return e.registerButton(t)})),e.e.off("copy."+t.pluginKey+" cut."+t.pluginKey).on("copy."+t.pluginKey+" cut."+t.pluginKey,(function(o){var a,s=e.s.html,l=n.getDataTransfer(o)||n.getDataTransfer(e.ew)||n.getDataTransfer(o.originalEvent);l&&(l.setData(r.TEXT_PLAIN,i.stripTags(s)),l.setData(r.TEXT_HTML,s)),e.buffer.set(t.pluginKey,s),e.e.fire("pasteStack",{html:s,action:e.o.defaultActionOnPaste}),"cut"===o.type&&(e.s.remove(),e.s.focus()),o.preventDefault(),null===(a=null==e?void 0:e.events)||void 0===a||a.fire("afterCopy",s);}));},e.prototype.destruct=function(e){var o,r;null===(o=null==e?void 0:e.buffer)||void 0===o||o.set(t.pluginKey,""),null===(r=null==e?void 0:e.events)||void 0===r||r.off("."+t.pluginKey);},e}();t.clipboard=a;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.paste=void 0;var r=o(7),i=o(175),n=o(241),a=o(9),s=o(10),l=o(242),c=o(33),u=o(136),d=o(124),p=o(38),f=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.pasteStack=new s.LimitedStack(20),t}return r.__extends(t,e),t.prototype.afterInit=function(e){var t=this;e.e.on("paste.paste",this.onPaste).on("pasteStack.paste",(function(e){return t.pasteStack.push(e)})),e.o.nl2brInPlainText&&this.j.e.on("processPaste.paste",this.onProcessPasteReplaceNl2Br);},t.prototype.onPaste=function(e){try{if(!1===this.j.e.fire("beforePaste",e)||!1===this.customPasteProcess(e))return e.preventDefault(),!1;this.defaultPasteProcess(e);}finally{this.j.e.fire("afterPaste",e);}},t.prototype.customPasteProcess=function(e){if(this.j.o.processPasteHTML)for(var t=n.getDataTransfer(e),o=0,r=[null==t?void 0:t.getData(a.TEXT_HTML),null==t?void 0:t.getData(a.TEXT_PLAIN)];r.length>o;o++){var i=r[o];if(s.isHTML(i)&&(this.processWordHTML(e,i)||this.processHTML(e,i)))return !1}},t.prototype.defaultPasteProcess=function(e){var t=n.getDataTransfer(e),o=(null==t?void 0:t.getData(a.TEXT_HTML))||(null==t?void 0:t.getData(a.TEXT_PLAIN));if(t&&o&&""!==s.trim(o)){var r=this.j.e.fire("processPaste",e,o,n.getAllTypes(t));void 0!==r&&(o=r),(s.isString(o)||c.Dom.isNode(o,this.j.ew))&&this.insertByType(e,o,this.j.o.defaultActionOnPaste),e.preventDefault(),e.stopPropagation();}},t.prototype.processWordHTML=function(e,t){var o=this;return !(!this.j.o.processPasteFromWord||!s.isHtmlFromWord(t)||(this.j.o.askBeforePasteFromWord?this.askInsertTypeDialog("The pasted content is coming from a Microsoft Word/Excel document. Do you want to keep the format or clean it up?","Word Paste Detected",(function(r){o.insertFromWordByType(e,t,r);})):this.insertFromWordByType(e,t,this.j.o.defaultActionOnPasteFromWord||this.j.o.defaultActionOnPaste),0))},t.prototype.processHTML=function(e,t){var o=this;if(this.j.o.askBeforePasteHTML){var r=this.pasteStack.find((function(e){var t=e.html;return t==t}));return r?(this.insertByType(e,t,r.action||this.j.o.defaultActionOnPaste),!0):(this.askInsertTypeDialog("Your code is similar to HTML. Keep as HTML?","Paste as HTML",(function(r){o.insertByType(e,t,r);}),"Insert as Text"),!0)}return !1},t.prototype.insertFromWordByType=function(e,t,o){var r;switch(o){case a.INSERT_AS_HTML:if(t=s.applyStyles(t),this.j.o.beautifyHTML){var i=null===(r=this.j.events)||void 0===r?void 0:r.fire("beautifyHTML",t);s.isString(i)&&(t=i);}break;case a.INSERT_AS_TEXT:t=s.cleanFromWord(t);break;case a.INSERT_ONLY_TEXT:t=s.stripTags(s.cleanFromWord(t));}n.pasteInsertHtml(e,this.j,t);},t.prototype.insertByType=function(e,t,o){if(this.pasteStack.push({html:t,action:o}),s.isString(t))switch(this.j.buffer.set(l.pluginKey,t),o){case a.INSERT_CLEAR_HTML:t=s.cleanFromWord(t);break;case a.INSERT_ONLY_TEXT:t=s.stripTags(t);break;case a.INSERT_AS_TEXT:t=s.htmlspecialchars(t);}n.pasteInsertHtml(e,this.j,t);},t.prototype.askInsertTypeDialog=function(e,t,o,r,i){var n,l,c,p;if(void 0===r&&(r="Clean"),void 0===i&&(i="Insert only Text"),!1!==(null===(l=null===(n=this.j)||void 0===n?void 0:n.e)||void 0===l?void 0:l.fire("beforeOpenPasteDialog",e,t,o,r,i))){var f=u.Confirm('<div style="word-break: normal; white-space: normal">'+this.j.i18n(e)+"</div>",this.j.i18n(t));f.bindDestruct(this.j),s.markOwner(this.j,f.container);var h=d.Button(this.j,{text:"Keep",name:"keep",status:"primary",tabIndex:0}),m=d.Button(this.j,{text:r,tabIndex:0}),v=d.Button(this.j,{text:i,tabIndex:0}),g=d.Button(this.j,{text:"Cancel",tabIndex:0});return h.onAction((function(){f.close(),o&&o(a.INSERT_AS_HTML);})),m.onAction((function(){f.close(),o&&o(a.INSERT_AS_TEXT);})),v.onAction((function(){f.close(),o&&o(a.INSERT_ONLY_TEXT);})),g.onAction((function(){f.close();})),f.setFooter([h,m,i?v:"",g]),h.focus(),null===(p=null===(c=this.j)||void 0===c?void 0:c.e)||void 0===p||p.fire("afterOpenPasteDialog",f,e,t,o,r,i),f}},t.prototype.onProcessPasteReplaceNl2Br=function(e,t,o){if(o===a.TEXT_PLAIN+";"&&!s.isHTML(t))return s.nl2br(t)},t.prototype.useFakeDivBox=function(e){var t=this,o=this.j.c.div("",{tabindex:-1,contenteditable:!0,style:{left:-9999,top:0,width:0,height:"100%",lineHeight:"140%",overflow:"hidden",position:"fixed",zIndex:2147483647,wordBreak:"break-all"}});this.j.container.appendChild(o);var r=this.j.s.save();o.focus();var i=0,n=function(){c.Dom.safeRemove(o),t.j.selection&&t.j.s.restore(r);},a=function(){if(i+=1,o.childNodes&&o.childNodes.length>0){var r=o.innerHTML;return n(),void t.processHTML(e,r)}5>i?t.j.async.setTimeout(a,20):n();};a();},t.prototype.beforeDestruct=function(e){e.e.off("paste.paste",this.onPaste);},r.__decorate([p.autobind],t.prototype,"onPaste",null),r.__decorate([p.autobind],t.prototype,"onProcessPasteReplaceNl2Br",null),t}(i.Plugin);t.paste=f;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.pasteStorage=void 0;var r=o(7);o(245);var i=o(9),n=o(136),a=o(175),s=o(33),l=o(10),c=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.currentIndex=0,t.list=[],t.container=null,t.listBox=null,t.previewBox=null,t.dialog=null,t.paste=function(){if(t.j.s.focus(),t.j.s.insertHTML(t.list[t.currentIndex]),0!==t.currentIndex){var e=t.list[0];t.list[0]=t.list[t.currentIndex],t.list[t.currentIndex]=e;}t.dialog&&t.dialog.close(),t.j.setEditorValue(),t.j.e.fire("afterPaste");},t.onKeyDown=function(e){var o=t.currentIndex;-1!==[i.KEY_UP,i.KEY_DOWN,i.KEY_ENTER].indexOf(e.key)&&(e.key===i.KEY_UP&&(0===o?o=t.list.length-1:o-=1),e.key===i.KEY_DOWN&&(o===t.list.length-1?o=0:o+=1),e.key!==i.KEY_ENTER?(o!==t.currentIndex&&t.selectIndex(o),e.stopImmediatePropagation(),e.preventDefault()):t.paste());},t.selectIndex=function(e){t.listBox&&l.toArray(t.listBox.childNodes).forEach((function(o,r){o.classList.remove("jodit_active"),e===r&&t.previewBox&&(o.classList.add("jodit_active"),t.previewBox.innerHTML=t.list[e],o.focus());})),t.currentIndex=e;},t.showDialog=function(){2>t.list.length||(t.dialog||t.createDialog(),t.listBox&&(t.listBox.innerHTML=""),t.previewBox&&(t.previewBox.innerHTML=""),t.list.forEach((function(e,o){var r=t.j.c.element("a");r.textContent=o+1+". "+e.replace(i.SPACE_REG_EXP(),""),t.j.e.on(r,"keydown",t.onKeyDown),l.attr(r,"href","javascript:void(0)"),l.attr(r,"data-index",o.toString()),l.attr(r,"tab-index","-1"),t.listBox&&t.listBox.appendChild(r);})),t.dialog&&t.dialog.open(),t.j.async.setTimeout((function(){t.selectIndex(0);}),100));},t}return r.__extends(t,e),t.prototype.createDialog=function(){var e=this;this.dialog=new n.Dialog({language:this.j.o.language});var t=this.j.c.fromHTML('<a href="javascript:void(0)" style="float:right;" class="jodit-button"><span>'+this.j.i18n("Paste")+"</span></a>");this.j.e.on(t,"click",this.paste);var o=this.j.c.fromHTML('<a href="javascript:void(0)" style="float:right; margin-right: 10px;" class="jodit-button"><span>'+this.j.i18n("Cancel")+"</span></a>");this.j.e.on(o,"click",this.dialog.close),this.container=this.j.c.div(),this.container.classList.add("jodit-paste-storage"),this.listBox=this.j.c.div(),this.previewBox=this.j.c.div(),this.container.appendChild(this.listBox),this.container.appendChild(this.previewBox),this.dialog.setHeader(this.j.i18n("Choose Content to Paste")),this.dialog.setContent(this.container),this.dialog.setFooter([t,o]),this.j.e.on(this.listBox,"click dblclick",(function(t){var o=t.target;return s.Dom.isTag(o,"a")&&o.hasAttribute("data-index")&&e.selectIndex(parseInt(l.attr(o,"-index")||"0",10)),"dblclick"===t.type&&e.paste(),!1}));},t.prototype.afterInit=function(){var e=this;this.j.e.off("afterCopy.paste-storage").on("pasteStorageList.paste-storage",(function(){return e.list.length})).on("afterCopy.paste-storage",(function(t){-1!==e.list.indexOf(t)&&e.list.splice(e.list.indexOf(t),1),e.list.unshift(t),e.list.length>5&&(e.list.length=5);})),this.j.registerCommand("showPasteStorage",{exec:this.showDialog,hotkeys:["ctrl+shift+v","cmd+shift+v"]});},t.prototype.beforeDestruct=function(){this.dialog&&this.dialog.destruct(),this.j.e.off(".paste-storage"),s.Dom.safeRemove(this.previewBox),s.Dom.safeRemove(this.listBox),s.Dom.safeRemove(this.container),this.container=null,this.listBox=null,this.previewBox=null,this.dialog=null,this.list=[];},t}(a.Plugin);t.pasteStorage=c;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.copyFormat=void 0;var r=o(8),i=o(33),n=o(10),a="copyformat",s=["fontWeight","fontStyle","fontSize","color","margin","padding","borderWidth","borderStyle","borderColor","borderRadius","backgroundColor","textDecorationLine","fontFamily"],l=function(e,t,o,r){var i=n.css(o,t);return i===r[t]&&(i=o.parentNode&&o!==e.editor&&o.parentNode!==e.editor?l(e,t,o.parentNode,r):void 0),i};r.Config.prototype.controls.copyformat={exec:function(e,t,o){var r=o.button;if(t){if(e.buffer.exists(a))e.buffer.delete(a),e.e.off(e.editor,"mouseup.copyformat");else {var c={},u=i.Dom.up(t,(function(e){return e&&!i.Dom.isText(e)}),e.editor)||e.editor,d=e.createInside.span();e.editor.appendChild(d),s.forEach((function(e){c[e]=n.css(d,e);})),d!==e.editor&&i.Dom.safeRemove(d);var p=function(e,t,o){var r={};return t&&s.forEach((function(i){r[i]=l(e,i,t,o),i.match(/border(Style|Color)/)&&!r.borderWidth&&(r[i]=void 0);})),r}(e,u,c);e.e.on(e.editor,"mouseup.copyformat",(function(){e.buffer.delete(a);var t=e.s.current();t&&(i.Dom.isTag(t,"img")?n.css(t,p):e.s.applyStyle(p)),e.e.off(e.editor,"mouseup.copyformat");})),e.buffer.set(a,!0);}r.update();}},isActive:function(e){return e.buffer.exists(a)},tooltip:"Paint format"},t.copyFormat=function(e){e.registerButton({name:"copyformat",group:"clipboard"});};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.color=void 0;var r=o(8),i=o(115),n=o(10),a=o(248);r.Config.prototype.controls.brush={update:function(e){var t=n.dataBind(e,"color"),o=e.j,r=function(t,r){r&&r!==n.css(o.editor,t).toString()&&(e.state.icon.fill=r);};if(t){var a=n.dataBind(e,"color");r("color"===a?a:"background-color",t);}else {var s=o.s.current();if(s&&!e.state.disabled){var l=i.Dom.closest(s,(function(e){return i.Dom.isBlock(e,o.ew)||e&&i.Dom.isElement(e)}),o.editor)||o.editor;r("color",n.css(l,"color").toString()),r("background-color",n.css(l,"background-color").toString());}e.state.icon.fill="",e.state.activated=!1;}},popup:function(e,t,o,r,s){var l="",c="",u=[],d=null;return t&&t!==e.editor&&i.Dom.isNode(t,e.ew)&&(i.Dom.isElement(t)&&e.s.isCollapsed()&&!i.Dom.isTag(t,["br","hr"])&&(d=t),i.Dom.up(t,(function(t){if(i.Dom.isHTMLElement(t,e.ew)){var o=n.css(t,"color",void 0,!0),r=n.css(t,"background-color",void 0,!0);if(o)return l=o.toString(),!0;if(r)return c=r.toString(),!0}}),e.editor)),u=[{name:"Background",content:a.ColorPickerWidget(e,(function(t){d?d.style.backgroundColor=t:e.execCommand("background",!1,t),n.dataBind(s,"color",t),n.dataBind(s,"color-mode","background"),r();}),c)},{name:"Text",content:a.ColorPickerWidget(e,(function(t){d?d.style.color=t:e.execCommand("forecolor",!1,t),n.dataBind(s,"color",t),n.dataBind(s,"color-mode","color"),r();}),l)}],"background"!==e.o.colorPickerDefaultTab&&(u=u.reverse()),a.TabsWidget(e,u,d)},exec:function(e,t,o){var r=o.button,a=n.dataBind(r,"color-mode"),s=n.dataBind(r,"color");if(!a)return !1;if(t&&t!==e.editor&&i.Dom.isNode(t,e.ew)&&i.Dom.isElement(t))switch(a){case"color":t.style.color=s;break;case"background":t.style.backgroundColor=s;}else e.execCommand("background"===a?a:"forecolor",!1,s);},tooltip:"Fill color or set the text color"},t.color=function(e){e.registerButton({name:"brush",group:"color"});var t=function(t,o,r){var i=n.normalizeColor(r);switch(t){case"background":e.s.applyStyle({backgroundColor:i||""});break;case"forecolor":e.s.applyStyle({color:i||""});}return e.setEditorValue(),!1};e.registerCommand("forecolor",t).registerCommand("background",t);};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(249),t),r.__exportStar(o(251),t),r.__exportStar(o(253),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ColorPickerWidget=void 0,o(250);var r=o(10),i=o(149),n=o(33);t.ColorPickerWidget=function(e,t,o){var a=r.normalizeColor(o),s=e.c.div("jodit-color-picker"),l=e.o.textIcons?"<span>"+e.i18n("palette")+"</span>":i.Icon.get("palette"),c=function(e){var t=[];return r.isPlainObject(e)?Object.keys(e).forEach((function(o){t.push('<div class="jodit-color-picker__group jodit-color-picker__group-'+o+'">'),t.push(c(e[o])),t.push("</div>");})):r.isArray(e)&&e.forEach((function(e){t.push("<a "+(a===e?' class="jodit_active" ':"")+' title="'+e+'" style="background-color:'+e+'" data-color="'+e+'" href="javascript:void(0)"></a>');})),t.join("")};s.appendChild(e.c.fromHTML('<div class="jodit-color-picker__groups">'+c(e.o.colors)+"</div>")),s.appendChild(e.c.fromHTML('<div data-ref="extra" class="jodit-color-picker__extra"></div>'));var u=r.refs(s).extra;return e.o.showBrowserColorPicker&&r.hasBrowserColorPicker()&&(u.appendChild(e.c.fromHTML('<div class="jodit-color-picker__native">'+l+'<input type="color" value="#ffffff"/></div>')),e.e.on(s,"change",(function(e){e.stopPropagation();var o=e.target;if(o&&o.tagName&&n.Dom.isTag(o,"input")){var i=o.value||"";r.isFunction(t)&&t(i),e.preventDefault();}}))),e.e.on(s,"mousedown touchend",(function(o){o.stopPropagation();var i=o.target;if(i&&i.tagName&&!n.Dom.isTag(i,"svg")&&!n.Dom.isTag(i,"path")||!i.parentNode||(i=n.Dom.closest(i.parentNode,"a",e.editor)),n.Dom.isTag(i,"a")){var a=r.attr(i,"-color")||"";t&&"function"==typeof t&&t(a),o.preventDefault();}})),e.e.fire("afterGenerateColorPicker",s,u,t,a),s};},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.TabsWidget=void 0,o(252);var r=o(10),i=o(149);t.TabsWidget=function(e,t,o){var n=e.c.div("jodit-tabs"),a=e.c.div("jodit-tabs__wrapper"),s=e.c.div("jodit-tabs__buttons"),l={},c=[],u="",d=0;if(n.appendChild(s),n.appendChild(a),t.forEach((function(n){var p=n.icon,f=n.name,h=n.content,m=e.c.div("jodit-tab"),v=i.Button(e,p||f,f);u||(u=f),s.appendChild(v.container),c.push(v),v.container.classList.add("jodit-tabs__button","jodit-tabs__button_columns_"+t.length),r.isFunction(h)?m.appendChild(e.c.div("jodit-tab_empty")):m.appendChild(h),a.appendChild(m),v.onAction((function(){return c.forEach((function(e){e.state.activated=!1;})),r.$$(".jodit-tab",a).forEach((function(e){e.classList.remove("jodit-tab_active");})),v.state.activated=!0,m.classList.add("jodit-tab_active"),r.isFunction(h)&&h.call(e),o&&(o.__activeTab=f),!1})),l[f]={button:v,tab:m},d+=1;})),!d)return n;r.$$("a",s).forEach((function(e){e.style.width=(100/d).toFixed(10)+"%";}));var p=o&&o.__activeTab&&l[o.__activeTab]?o.__activeTab:u;return l[p].button.state.activated=!0,l[p].tab.classList.add("jodit-tab_active"),n};},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.FileSelectorWidget=void 0;var r=o(10),i=o(33),n=o(251),a=o(149);t.FileSelectorWidget=function(e,t,o,s,l){var c;void 0===l&&(l=!0);var u=[];if(t.upload&&e.o.uploader&&(e.o.uploader.url||e.o.uploader.insertImageAsBase64URI)){var d=e.c.fromHTML('<div class="jodit-drag-and-drop__file-box"><strong>'+e.i18n(l?"Drop image":"Drop file")+"</strong><span><br>"+e.i18n("or click")+'</span><input type="file" accept="'+(l?"image/*":"*")+'" tabindex="-1" dir="auto" multiple=""/></div>');e.uploader.bind(d,(function(o){var i=r.isFunction(t.upload)?t.upload:e.o.uploader.defaultHandlerSuccess;r.isFunction(i)&&i.call(e,o),e.e.fire("closeAllPopups");}),(function(t){e.e.fire("errorMessage",t.message),e.e.fire("closeAllPopups");})),u.push({icon:"upload",name:"Upload",content:d});}if(t.filebrowser&&(e.o.filebrowser.ajax.url||e.o.filebrowser.items.url)&&u.push({icon:"folder",name:"Browse",content:function(){s&&s(),t.filebrowser&&e.filebrowser.open(t.filebrowser,l);}}),t.url){var p=new a.UIButton(e,{type:"submit",status:"primary",text:"Insert"}),f=new a.UIForm(e,[new a.UIInput(e,{required:!0,label:"URL",name:"url",type:"url",placeholder:"https://"}),new a.UIInput(e,{name:"text",label:"Alternative text"}),new a.UIBlock(e,[p])]);c=null,o&&!i.Dom.isText(o)&&(i.Dom.isTag(o,"img")||r.$$("img",o).length)&&(c="IMG"===o.tagName?o:r.$$("img",o)[0],r.val(f.container,"input[name=url]",r.attr(c,"src")),r.val(f.container,"input[name=text]",r.attr(c,"alt")),p.state.text="Update"),o&&i.Dom.isTag(o,"a")&&(r.val(f.container,"input[name=url]",r.attr(o,"href")),r.val(f.container,"input[name=text]",r.attr(o,"title")),p.state.text="Update"),f.onSubmit((function(o){r.isFunction(t.url)&&t.url.call(e,o.url,o.text);})),u.push({icon:"link",name:"URL",content:f.container});}return n.TabsWidget(e,u)};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.DragAndDrop=void 0;var r=o(7),i=o(9),n=o(33),a=o(10),s=o(175),l=o(241),c=o(38),u=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.isFragmentFromEditor=!1,t.isCopyMode=!1,t.startDragPoint={x:0,y:0},t.draggable=null,t.bufferRange=null,t.getText=function(e){var t=l.getDataTransfer(e);return t?t.getData(i.TEXT_HTML)||t.getData(i.TEXT_PLAIN):null},t}return r.__extends(t,e),t.prototype.afterInit=function(){this.j.e.on([window,this.j.ed,this.j.editor],"dragstart.DragAndDrop",this.onDragStart);},t.prototype.onDragStart=function(e){var t=e.target;if(this.onDragEnd(),this.isFragmentFromEditor=n.Dom.isOrContains(this.j.editor,t,!0),this.isCopyMode=!this.isFragmentFromEditor||a.ctrlKey(e),this.isFragmentFromEditor){var o=this.j.s.sel,r=o&&o.rangeCount?o.getRangeAt(0):null;r&&(this.bufferRange=r.cloneRange());}else this.bufferRange=null;this.startDragPoint.x=e.clientX,this.startDragPoint.y=e.clientY,n.Dom.isElement(t)&&t.classList.contains("jodit-filebrowser__files-item")&&(t=t.querySelector("img")),n.Dom.isTag(t,"img")&&(this.draggable=t.cloneNode(!0),a.dataBind(this.draggable,"target",t)),this.addDragListeners();},t.prototype.addDragListeners=function(){this.j.e.on("dragover",this.onDrag).on("drop.DragAndDrop",this.onDrop).on(window,"dragend.DragAndDrop drop.DragAndDrop mouseup.DragAndDrop",this.onDragEnd);},t.prototype.removeDragListeners=function(){this.j.e.off("dragover",this.onDrag).off("drop.DragAndDrop",this.onDrop).off(window,"dragend.DragAndDrop drop.DragAndDrop mouseup.DragAndDrop",this.onDragEnd);},t.prototype.onDrag=function(e){this.draggable&&(this.j.e.fire("hidePopup"),this.j.s.insertCursorAtPoint(e.clientX,e.clientY),e.preventDefault(),e.stopPropagation());},t.prototype.onDragEnd=function(){this.draggable&&(n.Dom.safeRemove(this.draggable),this.draggable=null),this.isCopyMode=!1,this.removeDragListeners();},t.prototype.onDrop=function(e){if(!e.dataTransfer||!e.dataTransfer.files||!e.dataTransfer.files.length){if(!this.isFragmentFromEditor&&!this.draggable)return this.j.e.fire("paste",e),e.preventDefault(),e.stopPropagation(),!1;var t=this.j.s.sel,o=this.bufferRange||(t&&t.rangeCount?t.getRangeAt(0):null),r=null;if(!this.draggable&&o)r=this.isCopyMode?o.cloneContents():o.extractContents();else if(this.draggable)if(this.isCopyMode){var i="1"===a.attr(this.draggable,"-is-file")?["a","href"]:["img","src"],s=i[0],l=i[1];(r=this.j.createInside.element(s)).setAttribute(l,a.attr(this.draggable,"data-src")||a.attr(this.draggable,"src")||""),"a"===s&&(r.textContent=a.attr(r,l)||"");}else r=a.dataBind(this.draggable,"target");else this.getText(e)&&(r=this.j.createInside.fromHTML(this.getText(e)));t&&t.removeAllRanges(),this.j.s.insertCursorAtPoint(e.clientX,e.clientY),r&&(this.j.s.insertNode(r,!1,!1),o&&r.firstChild&&r.lastChild&&(o.setStartBefore(r.firstChild),o.setEndAfter(r.lastChild),this.j.s.selectRange(o),this.j.e.fire("synchro")),n.Dom.isTag(r,"img")&&this.j.events&&this.j.e.fire("afterInsertImage",r)),e.preventDefault(),e.stopPropagation();}this.isFragmentFromEditor=!1,this.removeDragListeners();},t.prototype.beforeDestruct=function(){this.onDragEnd(),this.j.e.off(window,".DragAndDrop").off(".DragAndDrop").off([window,this.j.ed,this.j.editor],"dragstart.DragAndDrop",this.onDragStart);},r.__decorate([c.autobind],t.prototype,"onDragStart",null),r.__decorate([c.throttle((function(e){return e.j.defaultTimeout/10}))],t.prototype,"onDrag",null),r.__decorate([c.autobind],t.prototype,"onDragEnd",null),r.__decorate([c.autobind],t.prototype,"onDrop",null),t}(s.Plugin);t.DragAndDrop=u;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.DragAndDropElement=void 0;var r=o(7),i=o(10),n=o(175),a=o(33),s=o(31),l=o(38),c=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.dragList=[],t.draggable=null,t.wasMoved=!1,t.isCopyMode=!1,t.diffStep=10,t.startX=0,t.startY=0,t}return r.__extends(t,e),t.prototype.afterInit=function(){this.dragList=this.j.o.draggableTags?i.splitArray(this.j.o.draggableTags).filter(Boolean).map((function(e){return e.toLowerCase()})):[],this.dragList.length&&this.j.e.on("mousedown touchstart dragstart",this.onDragStart);},t.prototype.onDragStart=function(e){var t=this;if("dragstart"===e.type&&this.draggable)return !1;var o=e.target;if(this.dragList.length&&o){var r=function(e){return e&&t.dragList.includes(e.nodeName.toLowerCase())},n=a.Dom.furthest(o,r,this.j.editor)||(r(o)?o:null);n&&(this.startX=e.clientX,this.startY=e.clientY,this.isCopyMode=i.ctrlKey(e),this.onDragEnd(),this.draggable=n.cloneNode(!0),i.dataBind(this.draggable,"target",n),this.addDragListeners());}},t.prototype.onDrag=function(e){var o,r;if(this.draggable){var n=e.clientY;if(Math.sqrt(Math.pow(e.clientX-this.startX,2)+Math.pow(n-this.startY,2))>=this.diffStep){if(this.wasMoved=!0,this.j.e.fire("hidePopup hideResizer"),!this.draggable.parentNode){var a=i.dataBind(this.draggable,"target");i.css(this.draggable,{zIndex:1e13,pointerEvents:"none",pointer:"drag",position:"fixed",display:"inline-block",left:e.clientX,top:e.clientY,width:null!==(o=null==a?void 0:a.offsetWidth)&&void 0!==o?o:100,height:null!==(r=null==a?void 0:a.offsetHeight)&&void 0!==r?r:100}),s.getContainer(this.j,t).appendChild(this.draggable);}i.css(this.draggable,{left:e.clientX,top:e.clientY}),this.j.s.insertCursorAtPoint(e.clientX,e.clientY);}}},t.prototype.onDragEnd=function(){this.isInDestruct||this.draggable&&(a.Dom.safeRemove(this.draggable),this.draggable=null,this.wasMoved=!1,this.removeDragListeners());},t.prototype.onDrop=function(){if(this.draggable&&this.wasMoved){var e=i.dataBind(this.draggable,"target");this.onDragEnd(),this.isCopyMode&&(e=e.cloneNode(!0));var t=e.parentElement;this.j.s.insertNode(e,!0,!1),t&&a.Dom.isEmpty(t)&&a.Dom.safeRemove(t),a.Dom.isTag(e,"img")&&this.j.e&&this.j.e.fire("afterInsertImage",e),this.j.e.fire("synchro");}else this.onDragEnd();},t.prototype.addDragListeners=function(){this.j.e.on(this.j.editor,"mousemove touchmove",this.onDrag).on("mouseup touchend",this.onDrop).on([this.j.ew,this.ow],"mouseup touchend",this.onDragEnd);},t.prototype.removeDragListeners=function(){this.j.e.off(this.j.editor,"mousemove touchmove",this.onDrag).off("mouseup touchend",this.onDrop).off([this.j.ew,this.ow],"mouseup touchend",this.onDragEnd);},t.prototype.beforeDestruct=function(){this.onDragEnd(),this.j.e.off("mousedown touchstart dragstart",this.onDragStart),this.removeDragListeners();},r.__decorate([l.autobind],t.prototype,"onDragStart",null),r.__decorate([l.throttle((function(e){return e.j.defaultTimeout/10}))],t.prototype,"onDrag",null),r.__decorate([l.autobind],t.prototype,"onDragEnd",null),r.__decorate([l.autobind],t.prototype,"onDrop",null),t}(n.Plugin);t.DragAndDropElement=c;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.enter=t.insertParagraph=void 0;var r=o(7),i=o(9),n=o(33),a=o(10),s=o(175),l=o(9);t.insertParagraph=function(e,t,o,r){var i,s=e.createInside.element(o),l=e.createInside.element("br");s.appendChild(l),r&&r.cssText&&s.setAttribute("style",r.cssText),e.s.insertNode(s,!1,!1),e.s.setCursorBefore(l);var c=e.s.createRange();return c.setStartBefore("br"!==o.toLowerCase()?l:s),c.collapse(!0),e.s.selectRange(c),n.Dom.safeRemove(t),a.scrollIntoView(s,e.editor,e.ed),null===(i=e.events)||void 0===i||i.fire("synchro"),s};var c=function(e){function o(){var t=null!==e&&e.apply(this,arguments)||this;return t.brMode=!1,t.defaultTag=i.PARAGRAPH,t}return r.__extends(o,e),o.prototype.afterInit=function(e){var t=this;this.defaultTag=e.o.enter.toLowerCase(),this.brMode=this.defaultTag===i.BR.toLowerCase(),e.o.enterBlock||(e.o.enterBlock=this.brMode?i.PARAGRAPH:this.defaultTag),e.e.off(".enter").on("keydown.enter",(function(o){if(o.key===i.KEY_ENTER){var r=e.e.fire("beforeEnter",o);return void 0!==r?r:(e.s.isCollapsed()||e.execCommand("Delete"),e.s.focus(),t.onEnter(o),!1)}}));},o.prototype.onEnter=function(e){var o=this.j,r=o.selection,i=this.defaultTag,a=r.current(!1);a&&a!==o.editor||(a=o.createInside.text(l.INVISIBLE_SPACE),r.insertNode(a),r.select(a));var s=this.getBlockWrapper(a),c=n.Dom.isTag(s,"li");if((!c||e.shiftKey)&&!this.checkBR(a,e.shiftKey))return !1;if(s||this.hasPreviousBlock(a)||(s=this.wrapText(a)),!s||s===a)return t.insertParagraph(o,null,c?"li":i),!1;if(!this.checkUnsplittableBox(s))return !1;if(c&&n.Dom.isEmpty(s))return this.enterInsideEmptyLIelement(s),!1;var u,d=s.tagName.toLowerCase()===this.defaultTag||c,p=r.cursorOnTheRight(s),f=r.cursorOnTheLeft(s);if(!d&&(p||f))return u=p?r.setCursorAfter(s):r.setCursorBefore(s),t.insertParagraph(o,u,this.defaultTag),void(f&&!p&&r.setCursorIn(s,!0));r.splitSelection(s);},o.prototype.getBlockWrapper=function(e,t){void 0===t&&(t=i.IS_BLOCK);var o=e,r=this.j.editor;do{if(!o||o===r)break;if(t.test(o.nodeName))return n.Dom.isTag(o,"li")?o:this.getBlockWrapper(o.parentNode,/^li$/i)||o;o=o.parentNode;}while(o&&o!==r);return null},o.prototype.checkBR=function(e,t){var o=n.Dom.closest(e,["pre","blockquote"],this.j.editor);if(this.brMode||t&&!o||!t&&o){var r=this.j.createInside.element("br");return this.j.s.insertNode(r,!0),a.scrollIntoView(r,this.j.editor,this.j.ed),!1}return !0},o.prototype.wrapText=function(e){var t=this,o=e;n.Dom.up(o,(function(e){e&&e.hasChildNodes()&&e!==t.j.editor&&(o=e);}),this.j.editor);var r=n.Dom.wrapInline(o,this.j.o.enter,this.j);if(n.Dom.isEmpty(r)){var i=this.j.createInside.element("br");r.appendChild(i),this.j.s.setCursorBefore(i);}return r},o.prototype.hasPreviousBlock=function(e){var t=this.j;return Boolean(n.Dom.prev(e,(function(e){return n.Dom.isBlock(e,t.ew)||n.Dom.isImage(e,t.ew)}),t.editor))},o.prototype.checkUnsplittableBox=function(e){var t=this.j,o=t.selection;if(!n.Dom.canSplitBlock(e,t.ew)){var r=t.createInside.element("br");return o.insertNode(r,!1),o.setCursorAfter(r),!1}return !0},o.prototype.enterInsideEmptyLIelement=function(e){var o=null,r=n.Dom.closest(e,["ol","ul"],this.j.editor);if(r){if(n.Dom.prev(e,(function(e){return n.Dom.isTag(e,"li")}),r))if(n.Dom.next(e,(function(e){return n.Dom.isTag(e,"li")}),r)){var i=this.j.s.createRange();i.setStartBefore(r),i.setEndAfter(e);var s=i.extractContents();r.parentNode&&r.parentNode.insertBefore(s,r),o=this.j.s.setCursorBefore(r);}else o=this.j.s.setCursorAfter(r);else o=this.j.s.setCursorBefore(r);n.Dom.safeRemove(e),t.insertParagraph(this.j,o,this.defaultTag),a.$$("li",r).length||n.Dom.safeRemove(r);}},o.prototype.beforeDestruct=function(e){e.e.off("keydown.enter");},o}(s.Plugin);t.enter=c;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.errorMessages=void 0,o(258);var r=o(8),i=o(33),n=o(10);r.Config.prototype.showMessageErrors=!0,r.Config.prototype.showMessageErrorTime=3e3,r.Config.prototype.showMessageErrorOffsetPx=3,t.errorMessages=function(e){if(e.o.showMessageErrors){var t,o=e.c.div("jodit_error_box_for_messages"),r=function(){t=5,n.toArray(o.childNodes).forEach((function(r){n.css(o,"bottom",t+"px"),t+=r.offsetWidth+e.o.showMessageErrorOffsetPx;}));};e.e.on("beforeDestruct",(function(){i.Dom.safeRemove(o);})).on("errorMessage",(function(t,n,a){e.workplace.appendChild(o);var s=e.c.div("active "+(n||""),t);o.appendChild(s),r(),e.async.setTimeout((function(){s.classList.remove("active"),e.async.setTimeout((function(){i.Dom.safeRemove(s),r();}),300);}),a||e.o.showMessageErrorTime);}));}};},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.font=void 0;var r=o(7),i=o(8),n=o(33),a=o(10);i.Config.prototype.defaultFontSizePoints="px",i.Config.prototype.controls.fontsize={command:"fontSize",data:{cssRule:"font-size"},list:["8","9","10","11","12","14","16","18","24","30","36","48","60","72","96"],exec:function(e,t,o){var r,i=o.control,n="button"+i.command,s=i.args&&i.args[0]||a.dataBind(e,n);if(a.isVoid(s))return !1;a.dataBind(e,n,s),"fontsize"===(null===(r=i.command)||void 0===r?void 0:r.toLowerCase())&&(s=""+s+e.o.defaultFontSizePoints),e.execCommand(i.command,!1,s||void 0);},childTemplate:function(e,t,o){return ""+o+e.o.defaultFontSizePoints},tooltip:"Font size",isChildActive:function(e,t){var o,r,i=e.s.current(),s=(null===(o=t.data)||void 0===o?void 0:o.cssRule)||"font-size",l=(null===(r=t.data)||void 0===r?void 0:r.normalize)||function(t){return /pt$/i.test(t)&&"pt"===e.o.defaultFontSizePoints?t.replace(/pt$/i,""):t};if(i){var c=n.Dom.closest(i,(function(t){return n.Dom.isBlock(t,e.ew)||t&&n.Dom.isElement(t)}),e.editor)||e.editor,u=a.css(c,s);return Boolean(u&&t.args&&l(t.args[0].toString())===l(u.toString()))}return !1}},i.Config.prototype.controls.font=r.__assign(r.__assign({},i.Config.prototype.controls.fontsize),{command:"fontname",list:{"":"Default","Helvetica,sans-serif":"Helvetica","Arial,Helvetica,sans-serif":"Arial","Georgia,serif":"Georgia","Impact,Charcoal,sans-serif":"Impact","Tahoma,Geneva,sans-serif":"Tahoma","'Times New Roman',Times,serif":"Times New Roman","Verdana,Geneva,sans-serif":"Verdana"},childTemplate:function(e,t,o){return '<span style="font-family: '+t+'!important;">'+o+"</span>"},data:{cssRule:"font-family",normalize:function(e){return e.toLowerCase().replace(/['"]+/g,"").replace(/[^a-z0-9]+/g,",")}},tooltip:"Font family"}),t.font=function(e){e.registerButton({name:"font",group:"font"}).registerButton({name:"fontsize",group:"font"});var t=function(t,o,r){switch(t){case"fontsize":e.s.applyStyle({fontSize:a.normalizeSize(r)});break;case"fontname":e.s.applyStyle({fontFamily:r});}return e.e.fire("synchro"),!1};e.registerCommand("fontsize",t).registerCommand("fontname",t);};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.formatBlock=void 0;var r=o(8),i=o(115),n=o(10);r.Config.prototype.controls.paragraph={command:"formatBlock",update:function(e){var t=e.j,o=e.control,r=t.s.current();if(r&&t.o.textIcons){var n=(i.Dom.closest(r,(function(e){return i.Dom.isBlock(e,t.ew)}),t.editor)||t.editor).nodeName.toLowerCase(),a=o.list;e&&o.data&&o.data.currentValue!==n&&a&&a[n]&&(t.o.textIcons?e.state.text=n:e.state.icon.name=n,o.data.currentValue=n);}return !1},exec:function(e,t,o){var r=o.control,i="button"+r.command,a=r.args&&r.args[0]||n.dataBind(e,i);if(n.isVoid(a))return !1;n.dataBind(e,i,a),e.execCommand(r.command,!1,a||void 0);},data:{currentValue:"left"},list:{p:"Normal",h1:"Heading 1",h2:"Heading 2",h3:"Heading 3",h4:"Heading 4",blockquote:"Quote"},isChildActive:function(e,t){var o=e.s.current();if(o){var r=i.Dom.closest(o,(function(t){return i.Dom.isBlock(t,e.ew)}),e.editor);return Boolean(r&&r!==e.editor&&void 0!==t.args&&r.nodeName.toLowerCase()===t.args[0])}return !1},isActive:function(e,t){var o=e.s.current();if(o){var r=i.Dom.closest(o,(function(t){return i.Dom.isBlock(t,e.ew)}),e.editor);return Boolean(r&&r!==e.editor&&void 0!==t.list&&!i.Dom.isTag(r,"p")&&void 0!==t.list[r.nodeName.toLowerCase()])}return !1},childTemplate:function(e,t,o){return "<"+t+' style="margin:0;padding:0"><span>'+e.i18n(o)+"</span></"+t+">"},tooltip:"Insert format block"},t.formatBlock=function(e){e.registerButton({name:"paragraph",group:"font"}),e.registerCommand("formatblock",(function(t,o,r){return e.s.applyStyle(void 0,{element:r}),e.setEditorValue(),!1}));};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.fullsize=void 0,o(262);var r=o(8),i=o(9),n=o(10);r.Config.prototype.fullsize=!1,r.Config.prototype.globalFullSize=!0,r.Config.prototype.controls.fullsize={exec:function(e){e.toggleFullSize();},update:function(e){var t=e.j,o=t.isFullSize?"shrink":"fullsize";e.state.activated=t.isFullSize,t.o.textIcons?e.state.text=o:e.state.icon.name=o;},tooltip:"Open editor in fullsize",mode:i.MODE_SOURCE+i.MODE_WYSIWYG},t.fullsize=function(e){e.registerButton({name:"fullsize"});var t=!1,o=0,r=0,i=!1,a=function(){e.events&&(t?(o=n.css(e.container,"height",void 0,!0),r=n.css(e.container,"width",void 0,!0),n.css(e.container,{height:e.ow.innerHeight,width:e.ow.innerWidth}),i=!0):i&&n.css(e.container,{height:o||"auto",width:r||"auto"}));},s=function(o){var r;if(e.container){if(void 0===o&&(o=!e.container.classList.contains("jodit_fullsize")),e.o.fullsize=o,t=o,e.container.classList.toggle("jodit_fullsize",o),e.toolbar&&(n.isJoditObject(e)&&e.toolbarContainer.appendChild(e.toolbar.container),n.css(e.toolbar.container,"width","auto")),e.o.globalFullSize){for(var i=e.container.parentNode;i&&i.nodeType!==Node.DOCUMENT_NODE;)i.classList.toggle("jodit_fullsize-box_true",o),i=i.parentNode;a();}null===(r=e.events)||void 0===r||r.fire("afterResize");}};e.o.globalFullSize&&e.e.on(e.ow,"resize",a),e.e.on("afterInit afterOpen",(function(){var t;e.toggleFullSize(null===(t=null==e?void 0:e.options)||void 0===t?void 0:t.fullsize);})).on("toggleFullSize",s).on("beforeDestruct",(function(){t&&s(!1);})).on("beforeDestruct",(function(){e.events&&e.e.off(e.ow,"resize",a);}));};},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.hotkeys=void 0;var r=o(7),i=o(8),n=o(175),a=o(10),s=o(9);i.Config.prototype.commandToHotkeys={removeFormat:["ctrl+shift+m","cmd+shift+m"],insertOrderedList:["ctrl+shift+7","cmd+shift+7"],insertUnorderedList:["ctrl+shift+8, cmd+shift+8"],selectall:["ctrl+a","cmd+a"]};var l=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.onKeyPress=function(e){var o=t.specialKeys[e.which],r=(e.key||String.fromCharCode(e.which)).toLowerCase(),i=[o||r];return ["alt","ctrl","shift","meta"].forEach((function(t){e[t+"Key"]&&o!==t&&i.push(t);})),a.normalizeKeyAliases(i.join("+"))},t.specialKeys={8:"backspace",9:"tab",10:"return",13:"return",16:"shift",17:"ctrl",18:"alt",19:"pause",20:"capslock",27:"esc",32:"space",33:"pageup",34:"pagedown",35:"end",36:"home",37:"left",38:"up",39:"right",40:"down",45:"insert",46:"del",59:";",61:"=",91:"meta",96:"0",97:"1",98:"2",99:"3",100:"4",101:"5",102:"6",103:"7",104:"8",105:"9",106:"*",107:"+",109:"-",110:".",111:"/",112:"f1",113:"f2",114:"f3",115:"f4",116:"f5",117:"f6",118:"f7",119:"f8",120:"f9",121:"f10",122:"f11",123:"f12",144:"numlock",145:"scroll",173:"-",186:";",187:"=",188:",",189:"-",190:".",191:"/",192:"`",219:"[",220:"\\",221:"]",222:"'"},t}return r.__extends(t,e),t.prototype.afterInit=function(e){var t=this;Object.keys(e.o.commandToHotkeys).forEach((function(t){var o=e.o.commandToHotkeys[t];o&&e.registerHotkeyToCommand(o,t);}));var o=!1;e.e.off(".hotkeys").on([e.ow,e.ew],"keydown.hotkeys",(function(e){if(e.key===s.KEY_ESC)return t.j.e.fire("escape",e)})).on("keydown.hotkeys",(function(r){var i=t.onKeyPress(r),n={shouldStop:!0};if(!1===t.j.e.fire(i+".hotkey",r.type,n)){if(n.shouldStop)return o=!0,e.e.stopPropagation("keydown"),!1;r.preventDefault();}}),void 0,!0).on("keyup.hotkeys",(function(){if(o)return o=!1,e.e.stopPropagation("keyup"),!1}),void 0,!0);},t.prototype.beforeDestruct=function(e){e.events&&e.e.off(".hotkeys");},t}(n.Plugin);t.hotkeys=l;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.iframe=void 0;var r=o(8),i=o(10),n=o(10),a=o(9);r.Config.prototype.iframeBaseUrl="",r.Config.prototype.iframeTitle="Jodit Editor",r.Config.prototype.iframeDoctype="<!DOCTYPE html>",r.Config.prototype.iframeDefaultSrc="about:blank",r.Config.prototype.iframeStyle='html{margin:0;padding:0;min-height: 100%;}body{box-sizing:border-box;font-size:13px;line-height:1.6;padding:10px;margin:0;background:transparent;color:#000;position:relative;z-index:2;user-select:auto;margin:0px;overflow:auto;outline:none;}table{width:100%;border:none;border-collapse:collapse;empty-cells: show;max-width: 100%;}th,td{padding: 2px 5px;border:1px solid #ccc;-webkit-user-select:text;-moz-user-select:text;-ms-user-select:text;user-select:text}p{margin-top:0;}.jodit_editor .jodit_iframe_wrapper{display: block;clear: both;user-select: none;position: relative;}.jodit_editor .jodit_iframe_wrapper:after {position:absolute;content:"";z-index:1;top:0;left:0;right: 0;bottom: 0;cursor: pointer;display: block;background: rgba(0, 0, 0, 0);} .jodit_disabled{user-select: none;-o-user-select: none;-moz-user-select: none;-khtml-user-select: none;-webkit-user-select: none;-ms-user-select: none}',r.Config.prototype.iframeCSSLinks=[],r.Config.prototype.editHTMLDocumentMode=!1,t.iframe=function(e){var t=e.options;e.e.on("afterSetMode",(function(){e.isEditorMode()&&e.s.focus();})).on("generateDocumentStructure.iframe",(function(e,o){var r=e||o.iframe.contentWindow.document;if(r.open(),r.write(t.iframeDoctype+'<html dir="'+t.direction+'" class="jodit" lang="'+i.defaultLanguage(t.language)+'"><head><title>'+t.iframeTitle+"</title>"+(t.iframeBaseUrl?'<base href="'+t.iframeBaseUrl+'"/>':"")+'</head><body class="jodit-wysiwyg"></body></html>'),r.close(),t.iframeCSSLinks&&t.iframeCSSLinks.forEach((function(e){var t=r.createElement("link");t.setAttribute("rel","stylesheet"),t.setAttribute("href",e),r.head&&r.head.appendChild(t);})),t.iframeStyle){var n=r.createElement("style");n.innerHTML=t.iframeStyle,r.head&&r.head.appendChild(n);}})).on("createEditor",(function(){if(t.iframe){var o=e.c.element("iframe");o.style.display="block",o.src="about:blank",o.className="jodit-wysiwyg_iframe",o.setAttribute("allowtransparency","true"),o.setAttribute("tabindex",t.tabIndex.toString()),o.setAttribute("frameborder","0"),e.workplace.appendChild(o),e.iframe=o;var r=e.e.fire("generateDocumentStructure.iframe",null,e);return i.callPromise(r,(function(){if(e.iframe){var o=e.iframe.contentWindow.document;e.editorWindow=e.iframe.contentWindow;var r=function(){i.attr(o.body,"contenteditable",e.getMode()!==a.MODE_SOURCE&&!e.getReadOnly()||null);},s=function(e){var t=/<body.*<\/body>/im,o="{%%BODY%%}",r=t.exec(e);return r&&(e=e.replace(t,o).replace(/<span([^>]*?)>(.*?)<\/span>/gim,"").replace(/&lt;span([^&]*?)&gt;(.*?)&lt;\/span&gt;/gim,"").replace(o,r[0].replace(/(<body[^>]+?)min-height["'\s]*:[\s"']*[0-9]+(px|%)/im,"$1").replace(/(<body[^>]+?)([\s]*["'])?contenteditable["'\s]*=[\s"']*true["']?/im,"$1").replace(/<(style|script|span)[^>]+jodit[^>]+>.*?<\/\1>/g,"")).replace(/(class\s*=\s*)(['"])([^"']*)(jodit-wysiwyg|jodit)([^"']*\2)/g,"$1$2$3$5").replace(/(<[^<]+?)\sclass="[\s]*"/gim,"$1").replace(/(<[^<]+?)\sstyle="[\s;]*"/gim,"$1").replace(/(<[^<]+?)\sdir="[\s]*"/gim,"$1")),e};if(t.editHTMLDocumentMode){var l=e.element.tagName;if("TEXTAREA"!==l&&"INPUT"!==l)throw n.error("If enable `editHTMLDocumentMode` - source element should be INPUT or TEXTAREA");e.e.on("beforeGetNativeEditorValue",(function(){return s(e.o.iframeDoctype+o.documentElement.outerHTML)})).on("beforeSetNativeEditorValue",(function(t){return !e.isLocked&&(/<(html|body)/i.test(t)?s(o.documentElement.outerHTML)!==s(t)&&(o.open(),o.write(e.o.iframeDoctype+s(t)),o.close(),e.editor=o.body,r(),e.e.fire("prepareWYSIWYGEditor")):o.body.innerHTML=t,!0)}));}if(e.editor=o.body,e.e.on("afterSetMode afterInit afterAddPlace",r),"auto"===t.height){o.documentElement&&(o.documentElement.style.overflowY="hidden");var c=e.async.throttle((function(){e.editor&&e.iframe&&"auto"===t.height&&i.css(e.iframe,"height",e.editor.offsetHeight);}),e.defaultTimeout/2);e.e.on("change afterInit afterSetMode resize",c).on([e.iframe,e.ew,o.documentElement],"load",c).on(o,"readystatechange DOMContentLoaded",c);}return o.documentElement&&e.e.on(o.documentElement,"mousedown touchend",(function(){e.s.isFocused()||(e.s.focus(),e.editor===o.body&&e.s.setCursorIn(o.body));})).on(e.ew,"mousedown touchstart keydown keyup touchend click mouseup mousemove scroll",(function(t){var o;null===(o=e.events)||void 0===o||o.fire(e.ow,t);})),!1}}))}}));};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(266),t),r.__exportStar(o(272),t),r.__exportStar(o(273),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.imageProperties=void 0;var r=o(7);o(267);var i=o(8),n=o(115),a=o(10),s=o(248),l=o(124),c=o(268),u=o(38);i.Config.prototype.image={dialogWidth:600,openOnDblClick:!0,editSrc:!0,useImageEditor:!0,editTitle:!0,editAlt:!0,editLink:!0,editSize:!0,editBorderRadius:!0,editMargins:!0,editClass:!0,editStyle:!0,editId:!0,editAlign:!0,showPreview:!0,selectImageAfterClose:!0};var d=function(e){return e=a.trim(e),/^[0-9]+$/.test(e)?e+"px":e},p=function(e){return /^[-+]?[0-9.]+px$/.test(e.toString())?parseFloat(e.toString()):e},f=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.state={image:new Image,get ratio(){return this.image.naturalWidth/this.image.naturalHeight||1},sizeIsLocked:!0,marginIsLocked:!0},t}return r.__extends(t,e),t.prototype.onChangeMarginIsLocked=function(){var e=this;if(this.form){var t=a.refs(this.form),o=t.lockMargin;[t.marginRight,t.marginBottom,t.marginLeft].forEach((function(t){a.attr(t,"disabled",e.state.marginIsLocked||null);})),o.innerHTML=n.Icon.get(this.state.marginIsLocked?"lock":"unlock");}},t.prototype.onChangeSizeIsLocked=function(){if(this.form){var e=a.refs(this.form),t=e.lockSize,o=e.imageWidth;t.innerHTML=n.Icon.get(this.state.sizeIsLocked?"lock":"unlock"),t.classList.remove("jodit-properties__lock"),t.classList.remove("jodit-properties__unlock"),t.classList.add(this.state.sizeIsLocked?"jodit-properties__lock":"jodit-properties__unlock"),this.j.e.fire(o,"change");}},t.prototype.open=function(){return this.makeForm(),this.j.e.fire("hidePopup"),a.markOwner(this.j,this.dialog.container),this.state.marginIsLocked=!0,this.state.sizeIsLocked=!0,this.updateValues(),this.dialog.open().setModal(!0).setPosition(),!1},t.prototype.makeForm=function(){var e=this;if(!this.dialog){this.dialog=new n.Dialog({fullsize:this.j.o.fullsize,globalFullSize:this.j.o.globalFullSize,language:this.j.o.language,minWidth:Math.min(400,screen.width),minHeight:400,buttons:["fullsize","dialog.close"]});var t=this.j,o=t.o,r=t.i18n.bind(t),i={check:l.Button(t,"ok","Apply"),remove:l.Button(t,"bin","Delete")};t.e.on(this.dialog,"afterClose",(function(){e.state.image.parentNode&&o.image.selectImageAfterClose&&t.s.select(e.state.image);})),i.remove.onAction((function(){t.s.removeNode(e.state.image),e.dialog.close();}));var u=this.dialog;u.setHeader(r("Image properties"));var d=c.form(t);this.form=d,u.setContent(d);var p=a.refs(this.form).tabsBox;p&&p.appendChild(s.TabsWidget(t,[{name:"Image",content:c.mainTab(t)},{name:"Advanced",content:c.positionTab(t)}])),i.check.onAction(this.onApply);var f=a.refs(this.form),h=f.editImage;t.e.on(f.changeImage,"click",this.openImagePopup),o.image.useImageEditor&&t.e.on(h,"click",this.openImageEditor);var m=a.refs(d),v=m.lockSize,g=m.lockMargin,y=m.imageWidth,b=m.imageHeight;v&&t.e.on(v,"click",(function(){e.state.sizeIsLocked=!e.state.sizeIsLocked;})),t.e.on(g,"click",(function(t){e.state.marginIsLocked=!e.state.marginIsLocked,t.preventDefault();}));var _=function(t){if(a.isNumeric(y.value)&&a.isNumeric(b.value)){var o=parseFloat(y.value),r=parseFloat(b.value);t.target===y?b.value=Math.round(o/e.state.ratio).toString():y.value=Math.round(r*e.state.ratio).toString();}};t.e.on([y,b],"change keydown mousedown paste",(function(o){e.state.sizeIsLocked&&t.async.setTimeout(_.bind(e,o),{timeout:t.defaultTimeout,label:"image-properties-changeSize"});})),u.setFooter([i.remove,i.check]),u.setSize(this.j.o.image.dialogWidth);}},t.prototype.updateValues=function(){var e,t,o=this,r=this.j.o,i=this.state.image,s=a.refs(this.form),l=s.marginTop,c=s.marginRight,u=s.marginBottom,d=s.marginLeft,f=s.imageSrc,h=s.id,m=s.classes,v=s.align,g=s.style,y=s.imageTitle,b=s.imageAlt,_=s.borderRadius,w=s.imageLink,S=s.imageWidth,C=s.imageHeight,j=s.imageLinkOpenInNewTab,k=s.imageViewSrc,E=s.lockSize;s.lockMargin.checked=o.state.marginIsLocked,E.checked=o.state.sizeIsLocked,f.value=a.attr(i,"src")||"",k&&a.attr(k,"src",a.attr(i,"src")||""),function(){y.value=a.attr(i,"title")||"",b.value=a.attr(i,"alt")||"";var e=n.Dom.closest(i,"a",o.j.editor);e?(w.value=a.attr(e,"href")||"",j.checked="_blank"===a.attr(e,"target")):(w.value="",j.checked=!1);}(),e=a.attr(i,"width")||a.css(i,"width",void 0,!0)||!1,t=a.attr(i,"height")||a.css(i,"height",void 0,!0)||!1,S.value=!1!==e?p(e).toString():i.offsetWidth.toString(),C.value=!1!==t?p(t).toString():i.offsetHeight.toString(),o.state.sizeIsLocked=function(){if(!a.isNumeric(S.value)||!a.isNumeric(C.value))return !1;var e=parseFloat(S.value),t=parseFloat(C.value);return 1>Math.abs(e-t*o.state.ratio)}(),function(){if(r.image.editMargins){var e=!0,t=!1;[l,c,u,d].forEach((function(o){var r=a.attr(o,"data-ref")||"",n=i.style.getPropertyValue(a.kebabCase(r));if(!n)return t=!0,void(o.value="");/^[0-9]+(px)?$/.test(n)&&(n=parseInt(n,10)),o.value=n.toString()||"",(t&&o.value||e&&"marginTop"!==r&&o.value!==l.value)&&(e=!1);})),o.state.marginIsLocked=e;}}(),m.value=(a.attr(i,"class")||"").replace(/jodit_focused_image[\s]*/,""),h.value=a.attr(i,"id")||"",_.value=(parseInt(i.style.borderRadius||"0",10)||"0").toString(),i.style.cssFloat&&-1!==["left","right"].indexOf(i.style.cssFloat.toLowerCase())?v.value=a.css(i,"float"):"block"===a.css(i,"display")&&"auto"===i.style.marginLeft&&"auto"===i.style.marginRight&&(v.value="center"),g.value=a.attr(i,"style")||"";},t.prototype.onApply=function(){var e=a.refs(this.form),t=e.imageSrc,o=e.borderRadius,r=e.imageTitle,i=e.imageAlt,s=e.imageLink,l=e.imageWidth,c=e.imageHeight,u=e.marginTop,p=e.marginRight,f=e.marginBottom,h=e.marginLeft,m=e.imageLinkOpenInNewTab,v=e.align,g=e.classes,y=e.id,b=this.j.o,_=this.state.image;if(b.image.editStyle&&a.attr(_,"style",e.style.value||null),!t.value)return n.Dom.safeRemove(_),void this.dialog.close();a.attr(_,"src",t.value),_.style.borderRadius="0"!==o.value&&/^[0-9]+$/.test(o.value)?o.value+"px":"",a.attr(_,"title",r.value||null),a.attr(_,"alt",i.value||null);var w=n.Dom.closest(_,"a",this.j.editor);s.value?(w||(w=n.Dom.wrap(_,"a",this.j)),a.attr(w,"href",s.value),a.attr(w,"target",m.checked?"_blank":null)):w&&w.parentNode&&w.parentNode.replaceChild(_,w),l.value===_.offsetWidth.toString()&&c.value===_.offsetHeight.toString()||(a.css(_,{width:a.trim(l.value)?d(l.value):null,height:a.trim(c.value)?d(c.value):null}),a.attr(_,"width",null),a.attr(_,"height",null));var S=[u,p,f,h];b.image.editMargins&&(this.state.marginIsLocked?a.css(_,"margin",d(u.value)):S.forEach((function(e){var t=a.attr(e,"data-ref")||"";a.css(_,t,d(e.value));}))),b.image.editClass&&a.attr(_,"class",g.value||null),b.image.editId&&a.attr(_,"id",y.value||null),b.image.editAlign&&(v.value?["right","left"].includes(v.value.toLowerCase())?(a.css(_,"float",v.value),a.clearCenterAlign(_)):a.css(_,{float:"",display:"block",marginLeft:"auto",marginRight:"auto"}):(a.css(_,"float")&&-1!==["right","left"].indexOf(a.css(_,"float").toString().toLowerCase())&&a.css(_,"float",""),a.clearCenterAlign(_))),this.j.setEditorValue(),this.dialog.close();},t.prototype.openImageEditor=function(){var e=this,t=a.attr(this.state.image,"src")||"",o=this.j.c.element("a"),r=function(){o.host===location.host||n.Confirm(e.j.i18n("You can only edit your own images. Download this image on the host?"),(function(t){t&&e.j.uploader&&e.j.uploader.uploadRemoteImage(o.href.toString(),(function(t){n.Alert(e.j.i18n("The image has been successfully uploaded to the host!"),(function(){a.isString(t.newfilename)&&(a.attr(e.state.image,"src",t.baseurl+t.newfilename),e.updateValues());})).bindDestruct(e.j);}),(function(t){n.Alert(e.j.i18n("There was an error loading %s",t.message)).bindDestruct(e.j);}));})).bindDestruct(e.j);};o.href=t,this.j.filebrowser.dataProvider.getPathByUrl(o.href.toString(),(function(r,i,s){e.j.filebrowser.openImageEditor(o.href,i,r,s,(function(){var o=(new Date).getTime();a.attr(e.state.image,"src",t+(-1!==t.indexOf("?")?"":"?")+"&_tmp="+o.toString()),e.updateValues();}),(function(t){n.Alert(t.message).bindDestruct(e.j);}));}),(function(t){n.Alert(t.message,r).bindDestruct(e.j);}));},t.prototype.openImagePopup=function(e){var t=this,o=new n.Popup(this.j),r=a.refs(this.form).changeImage;o.setZIndex(this.dialog.getZIndex()+1),o.setContent(s.FileSelectorWidget(this.j,{upload:function(e){e.files&&e.files.length&&a.attr(t.state.image,"src",e.baseurl+e.files[0]),t.updateValues(),o.close();},filebrowser:function(e){e&&a.isArray(e.files)&&e.files.length&&(a.attr(t.state.image,"src",e.files[0]),o.close(),t.updateValues());}},this.state.image,o.close)).open((function(){return a.position(r)})),e.stopPropagation();},t.prototype.afterInit=function(e){var t=this,o=this;e.e.on("afterConstructor changePlace",(function(){e.e.off(e.editor,".imageproperties").on(e.editor,"dblclick.imageproperties",(function(t){var r=t.target;n.Dom.isTag(r,"img")&&(e.o.image.openOnDblClick?(o.state.image=r,e.o.readonly||(t.stopImmediatePropagation(),t.preventDefault(),o.open())):(t.stopImmediatePropagation(),e.s.select(r)));}));})).on("openImageProperties.imageproperties",(function(e){t.state.image=e,t.open();}));},t.prototype.beforeDestruct=function(e){this.dialog&&this.dialog.destruct(),e.e.off(e.editor,".imageproperties").off(".imageproperties");},r.__decorate([u.watch("state.marginIsLocked")],t.prototype,"onChangeMarginIsLocked",null),r.__decorate([u.watch("state.sizeIsLocked")],t.prototype,"onChangeSizeIsLocked",null),r.__decorate([u.autobind],t.prototype,"onApply",null),r.__decorate([u.autobind],t.prototype,"openImageEditor",null),r.__decorate([u.autobind],t.prototype,"openImagePopup",null),t}(n.Plugin);t.imageProperties=f;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(269),t),r.__exportStar(o(270),t),r.__exportStar(o(271),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.form=void 0;var r=o(149);t.form=function(e){var t=e.o.image,o=t.showPreview,i=t.editSize,n=r.Icon.get.bind(r.Icon);return e.c.fromHTML('<form class="jodit-properties">\n\t\t<div class="jodit-grid jodit-grid_xs-column">\n\t\t\t<div class="jodit_col-lg-2-5 jodit_col-xs-5-5">\n\t\t\t\t<div class="jodit-properties_view_box">\n\t\t\t\t\t<div style="'+(o?"":"display:none")+'" class="jodit-properties_image_view">\n\t\t\t\t\t\t<img data-ref="imageViewSrc" src="" alt=""/>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div style="'+(i?"":"display:none")+'" class="jodit-form__group jodit-properties_image_sizes">\n\t\t\t\t\t\t<input data-ref="imageWidth" type="text" class="jodit-input"/>\n\t\t\t\t\t\t<a data-ref="lockSize" class="jodit-properties__lock">'+n("lock")+'</a>\n\t\t\t\t\t\t<input data-ref="imageHeight" type="text" class="imageHeight jodit-input"/>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t\t<div data-ref="tabsBox" class="jodit_col-lg-3-5 jodit_col-xs-5-5"></div>\n\t\t</div>\n\t</form>')};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.mainTab=void 0;var r=o(149);t.mainTab=function(e){var t=e.o,o=e.i18n.bind(e),i=r.Icon.get.bind(r.Icon),n=t.filebrowser.ajax.url||t.uploader.url,a=t.image.useImageEditor;return e.c.fromHTML('<div style="'+(t.image.editSrc?"":"display:none")+'" class="jodit-form__group">\n\t\t\t<label>'+o("Src")+'</label>\n\t\t\t<div class="jodit-input_group">\n\t\t\t\t<input data-ref="imageSrc" class="jodit-input" type="text"/>\n\t\t\t\t<div\n\t\t\t\t\tclass="jodit-input_group-buttons"\n\t\t\t\t\tstyle="'+(n?"":"display: none")+'"\n\t\t\t\t>\n\t\t\t\t\t\t<a\n\t\t\t\t\t\t\tdata-ref="changeImage"\n\t\t\t\t\t\t\tclass="jodit-button"\n\t\t\t\t\t\t>'+i("image")+'</a>\n\t\t\t\t\t\t<a\n\t\t\t\t\t\t\tdata-ref="editImage"\n\t\t\t\t\t\t\tclass="jodit-button"\n\t\t\t\t\t\t\tstyle="'+(a?"":"display: none")+'"\n\t\t\t\t\t\t>'+i("crop")+'</a>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t\t<div style="'+(t.image.editTitle?"":"display:none")+'" class="jodit-form__group">\n\t\t\t<label>'+o("Title")+'</label>\n\t\t\t<input data-ref="imageTitle" type="text" class="jodit-input"/>\n\t\t</div>\n\t\t<div style="'+(t.image.editAlt?"":"display:none")+'" class="jodit-form__group">\n\t\t\t<label>'+o("Alternative")+'</label>\n\t\t\t<input data-ref="imageAlt" type="text" class="jodit-input"/>\n\t\t</div>\n\t\t<div style="'+(t.image.editLink?"":"display:none")+'" class="jodit-form__group">\n\t\t\t<label>'+o("Link")+'</label>\n\t\t\t<input data-ref="imageLink" type="text" class="jodit-input"/>\n\t\t</div>\n\t\t<div style="'+(t.image.editLink?"":"display:none")+'" class="jodit-form__group">\n\t\t\t<label class="jodit_vertical_middle">\n\t\t\t\t<input data-ref="imageLinkOpenInNewTab" type="checkbox" class="jodit-checkbox"/>\n\t\t\t\t<span>'+o("Open link in new tab")+"</span>\n\t\t\t</label>\n\t\t</div>")};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.positionTab=void 0;var r=o(149);t.positionTab=function(e){var t=e.o,o=e.i18n.bind(e),i=r.Icon.get.bind(r.Icon);return e.c.fromHTML('<div style="'+(t.image.editMargins?"":"display:none")+'" class="jodit-form__group">\n\t\t\t<label>'+o("Margins")+'</label>\n\t\t\t<div class="jodit-grid jodit_vertical_middle">\n\t\t\t\t<input class="jodit_col-lg-1-5 jodit-input" data-ref="marginTop" type="text" placeholder="'+o("top")+'"/>\n\t\t\t\t<a style="text-align: center;" data-ref="lockMargin" class="jodit-properties__lock jodit_col-lg-1-5">'+i("lock")+'</a>\n\t\t\t\t<input disabled="true" class="jodit_col-lg-1-5 jodit-input" data-ref="marginRight" type="text" placeholder="'+o("right")+'"/>\n\t\t\t\t<input disabled="true" class="jodit_col-lg-1-5 jodit-input" data-ref="marginBottom" type="text" placeholder="'+o("bottom")+'"/>\n\t\t\t\t<input disabled="true" class="jodit_col-lg-1-5 jodit-input" data-ref="marginLeft" type="text" placeholder="'+o("left")+'"/>\n\t\t\t</div>\n\t\t</div>\n\t\t<div style="'+(t.image.editStyle?"":"display:none")+'" class="jodit-form__group">\n\t\t\t<label>'+o("Styles")+'</label>\n\t\t\t<input data-ref="style" type="text" class="jodit-input"/>\n\t\t</div>\n\t\t<div style="'+(t.image.editClass?"":"display:none")+'" class="jodit-form__group">\n\t\t\t<label>'+o("Classes")+'</label>\n\t\t\t<input data-ref="classes" type="text" class="jodit-input"/>\n\t\t</div>\n\t\t<div style="'+(t.image.editId?"":"display:none")+'" class="jodit-form__group">\n\t\t\t<label>Id</label>\n\t\t\t<input data-ref="id" type="text" class="jodit-input"/>\n\t\t</div>\n\t\t<div\n\t\t\tstyle="'+(t.image.editBorderRadius?"":"display:none")+'"\n\t\t\tclass="jodit-form__group"\n\t\t>\n\t\t\t<label>'+o("Border radius")+'</label>\n\t\t\t\t<input data-ref="borderRadius" type="number" class="jodit-input"/>\n\t\t</div>\n\t\t<div\n\t\t\tstyle="'+(t.image.editAlign?"":"display:none")+'"\n\t\t\tclass="jodit-form__group"\n\t\t>\n\t\t\t<label>'+o("Align")+'</label>\n\t\t\t<select data-ref="align" class="jodit-select">\n\t\t\t\t<option value="">'+o("--Not Set--")+'</option>\n\t\t\t\t<option value="left">'+o("Left")+'</option>\n\t\t\t\t<option value="center">'+o("Center")+'</option>\n\t\t\t\t<option value="right">'+o("Right")+"</option>\n\t\t\t</select>\n\t\t</div>")};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.imageProcessor=void 0;var r=o(10);t.imageProcessor=function(e){e.e.on("change afterInit changePlace",e.async.debounce((function(){e.editor&&r.$$("img",e.editor).forEach((function(t){t.__jodit_imageprocessor_binded||(t.__jodit_imageprocessor_binded=!0,t.complete||t.addEventListener("load",(function o(){var r;!e.isInDestruct&&(null===(r=e.e)||void 0===r||r.fire("resize")),t.removeEventListener("load",o);})),e.e.on(t,"mousedown touchstart",(function(){e.s.select(t);})));}));}),e.defaultTimeout));};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.image=void 0;var r=o(7),i=o(33),n=o(10),a=o(248);o(8).Config.prototype.controls.image={popup:function(e,t,o,s){var l=null;t&&!i.Dom.isText(t)&&i.Dom.isHTMLElement(t,e.ew)&&(i.Dom.isTag(t,"img")||n.$$("img",t).length)&&(l=i.Dom.isTag(t,"img")?t:n.$$("img",t)[0]);var c=e.s.save();return a.FileSelectorWidget(e,{filebrowser:function(t){e.s.restore(c),t.files&&t.files.forEach((function(o){return e.s.insertImage(t.baseurl+o,null,e.o.imageDefaultWidth)})),s();},upload:!0,url:function(t,o){return r.__awaiter(void 0,void 0,void 0,(function(){var i;return r.__generator(this,(function(r){switch(r.label){case 0:return e.s.restore(c),(i=l||e.createInside.element("img")).setAttribute("src",t),i.setAttribute("alt",o),l?[3,2]:[4,e.s.insertImage(i,null,e.o.imageDefaultWidth)];case 1:r.sent(),r.label=2;case 2:return s(),[2]}}))}))}},l,s)},tags:["img"],tooltip:"Insert Image"},t.image=function(e){e.registerButton({name:"image",group:"media"});};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.indent=void 0;var r=o(8),i=o(9),n=o(33),a=o(10);r.Config.prototype.controls.indent={tooltip:"Increase Indent"};var s=function(e){return "rtl"===e?"marginRight":"marginLeft"};r.Config.prototype.controls.outdent={isDisabled:function(e){var t=e.s.current();if(t){var o=n.Dom.closest(t,(function(t){return n.Dom.isBlock(t,e.ew)}),e.editor),r=s(e.o.direction);if(o&&o.style&&o.style[r])return 0>=parseInt(o.style[r],10)}return !0},tooltip:"Decrease Indent"},r.Config.prototype.indentMargin=10,t.indent=function(e){var t=s(e.o.direction);e.registerButton({name:"indent",group:"indent"}).registerButton({name:"outdent",group:"indent"});var o=function(o){var r=[];return e.s.eachSelection((function(s){var l=e.s.save(),c=!!s&&n.Dom.up(s,(function(t){return n.Dom.isBlock(t,e.ew)}),e.editor),u=e.o.enter;if(!c&&s&&(c=n.Dom.wrapInline(s,u!==i.BR?u:i.PARAGRAPH,e)),!c)return e.s.restore(l),!1;var d=-1!==r.indexOf(c);if(c&&c.style&&!d){r.push(c);var p=c.style[t]?parseInt(c.style[t],10):0;c.style[t]=(p+=e.o.indentMargin*("outdent"===o?-1:1))>0?p+"px":"",a.attr(c,"style")||c.removeAttribute("style");}e.s.restore(l);})),e.setEditorValue(),!1};e.registerCommand("indent",{exec:o,hotkeys:["ctrl+]","cmd+]"]}),e.registerCommand("outdent",{exec:o,hotkeys:["ctrl+[","cmd+["]});};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),o(7).__exportStar(o(276),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.hr=void 0;var r=o(8),i=o(33);r.Config.prototype.controls.hr={command:"insertHorizontalRule",tags:["hr"],tooltip:"Insert Horizontal Line"},t.hr=function(e){e.registerButton({name:"hr",group:"insert"}),e.registerCommand("insertHorizontalRule",(function(){var t=e.createInside.element("hr");e.s.insertNode(t,!1,!1);var o=i.Dom.closest(t.parentElement,(function(t){return i.Dom.isBlock(t,e.ew)}),e.editor);o&&i.Dom.isEmpty(o)&&o!==e.editor&&(i.Dom.after(o,t),i.Dom.safeRemove(o));var r=i.Dom.next(t,(function(t){return i.Dom.isBlock(t,e.ew)}),e.editor,!1);return r||(r=e.createInside.element(e.o.enter),i.Dom.after(t,r)),e.s.setCursorIn(r),!1}));};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.inlinePopup=void 0;var r=o(7);o(278),o(279);var i=o(175),n=o(146),a=o(120),s=o(10),l=o(115),c=o(38),u=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.type=null,t.popup=new a.Popup(t.jodit),t.toolbar=n.makeCollection(t.jodit,t.popup),t.snapRange=null,t}return r.__extends(t,e),t.prototype.onClick=function(e){var t=this,o=e.target,r=Object.keys(this.j.o.popup),i=l.Dom.isTag(o,"img")?o:l.Dom.closest(o,r,this.j.editor);i&&this.canShowPopupForType(i.nodeName.toLowerCase())&&this.showPopup((function(){return s.position(i,t.j)}),i.nodeName.toLowerCase(),i);},t.prototype.showPopup=function(e,t,o){if(t=t.toLowerCase(),!this.canShowPopupForType(t))return !1;if(this.type!==t||o!==this.previousTarget){this.previousTarget=o;var r=this.j.o.popup[t],i=void 0;i=s.isFunction(r)?r(this.j,o,this.popup.close):r,s.isArray(i)&&(this.toolbar.build(i,o),this.toolbar.buttonSize=this.j.o.toolbarButtonSize,i=this.toolbar.container),this.popup.setContent(i),this.type=t;}return this.popup.open(e),!0},t.prototype.hidePopup=function(e){e&&e!==this.type||this.popup.close();},t.prototype.canShowPopupForType=function(e){var t=this.j.o.popup[e.toLowerCase()];return !(this.j.o.readonly||!this.j.o.toolbarInline||!t||this.isExcludedTarget(e))},t.prototype.isExcludedTarget=function(e){return s.splitArray(this.j.o.toolbarInlineDisableFor).map((function(e){return e.toLowerCase()})).includes(e.toLowerCase())},t.prototype.afterInit=function(e){var t=this;this.j.e.on("getDiffButtons.mobile",(function(o){if(t.toolbar===o){var r=t.toolbar.getButtonsNames();return s.toArray(e.registeredButtons).filter((function(e){return !t.j.o.toolbarInlineDisabledButtons.includes(e.name)})).filter((function(e){var t=s.isString(e)?e:e.name;return t&&"|"!==t&&"\n"!==t&&!r.includes(t)}))}})).on("hidePopup",this.hidePopup).on("showPopup",(function(e,o,r){t.showPopup(o,r||(s.isString(e)?e:e.nodeName),s.isString(e)?void 0:e);})).on("click",this.onClick).on("mousedown keydown",this.onSelectionStart).on([this.j.ew,this.j.ow],"mouseup keyup",this.onSelectionEnd);},t.prototype.onSelectionStart=function(){this.snapRange=this.j.s.range.cloneRange();},t.prototype.onSelectionEnd=function(e){if(!(e&&e.target&&l.UIElement.closestElement(e.target,a.Popup))){var t=this.snapRange,o=this.j.s.range;t&&!o.collapsed&&o.startContainer===t.startContainer&&o.startOffset===t.startOffset&&o.endContainer===t.endContainer&&o.endOffset===t.endOffset||this.onSelectionChange();}},t.prototype.onSelectionChange=function(){if(this.j.o.toolbarInlineForSelection){var e="selection",t=this.j.s.sel,o=this.j.s.range;(null==t?void 0:t.isCollapsed)||this.isSelectedTarget(o)||this.tableModule.getAllSelectedCells().length?this.type===e&&this.popup.isOpened&&this.hidePopup():this.j.s.current()&&this.showPopup((function(){return o.getBoundingClientRect()}),e);}},t.prototype.isSelectedTarget=function(e){var t=e.startContainer;return l.Dom.isElement(t)&&t===e.endContainer&&l.Dom.isTag(t.childNodes[e.startOffset],Object.keys(this.j.o.popup))&&e.startOffset===e.endOffset-1},Object.defineProperty(t.prototype,"tableModule",{get:function(){return this.j.getInstance("Table",this.j.o)},enumerable:!1,configurable:!0}),t.prototype.beforeDestruct=function(e){e.e.off("showPopup").off("click",this.onClick).off([this.j.ew,this.j.ow],"mouseup keyup",this.onSelectionEnd);},r.__decorate([c.autobind],t.prototype,"onClick",null),r.__decorate([c.wait((function(e){return !e.j.isLocked}))],t.prototype,"showPopup",null),r.__decorate([c.autobind],t.prototype,"hidePopup",null),r.__decorate([c.autobind],t.prototype,"onSelectionStart",null),r.__decorate([c.autobind],t.prototype,"onSelectionEnd",null),r.__decorate([c.debounce((function(e){return e.defaultTimeout}))],t.prototype,"onSelectionChange",null),t}(i.Plugin);t.inlinePopup=u;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(8);r.Config.prototype.toolbarInline=!0,r.Config.prototype.toolbarInlineForSelection=!1,r.Config.prototype.toolbarInlineDisableFor=[],r.Config.prototype.toolbarInlineDisabledButtons=["source"],r.Config.prototype.popup={a:o(280).Z,img:o(281).Z,cells:o(282).Z,jodit:[{name:"bin",tooltip:"Delete",exec:function(e,t){t&&e.s.removeNode(t);}}],"jodit-media":[{name:"bin",tooltip:"Delete",exec:function(e,t){t&&e.s.removeNode(t);}}],selection:["bold","underline","italic","ul","ol","\n","outdent","indent","fontsize","brush","cut","\n","paragraph","link","align","dots"]};},(e,t,o)=>{var r=o(11);t.Z=[{name:"eye",tooltip:"Open link",exec:function(e,t){var o=r.attr(t,"href");t&&o&&e.ow.open(o);}},{name:"link",tooltip:"Edit link",icon:"pencil"},"unlink","brush","file"];},(e,t,o)=>{var r=o(33),i=o(14),n=o(10);t.Z=[{name:"delete",icon:"bin",tooltip:"Delete",exec:function(e,t){t&&e.s.removeNode(t);}},{name:"pencil",exec:function(e,t){"img"===t.tagName.toLowerCase()&&e.e.fire("openImageProperties",t);},tooltip:"Edit"},{name:"valign",list:["Top","Middle","Bottom","Normal"],tooltip:"Vertical align",exec:function(e,t,o){var a=o.control;if(r.Dom.isTag(t,"img")){var s=a.args&&i.isString(a.args[0])?a.args[0].toLowerCase():"";if(!s)return !1;n.css(t,"vertical-align","normal"===s?"":s),e.e.fire("recalcPositionPopup");}}},{name:"left",childTemplate:function(e,t,o){return o},list:["Left","Right","Center","Normal"],exec:function(e,t,o){var a=o.control;if(r.Dom.isTag(t,"img")){var s=a.args&&i.isString(a.args[0])?a.args[0].toLowerCase():"";if(!s)return !1;"normal"!==s?-1!==["right","left"].indexOf(s)?(n.css(t,"float",s),n.clearCenterAlign(t)):(n.css(t,"float",""),n.css(t,{display:"block","margin-left":"auto","margin-right":"auto"})):(n.css(t,"float")&&-1!==["right","left"].indexOf(n.css(t,"float").toLowerCase())&&n.css(t,"float",""),n.clearCenterAlign(t)),e.setEditorValue(),e.e.fire("recalcPositionPopup");}},tooltip:"Horizontal align"}];},(e,t,o)=>{var r=o(14),i=o(10),n=o(248),a=function(e){return e.args&&r.isString(e.args[0])?e.args[0].toLowerCase():""};t.Z=[{name:"brush",popup:function(e){if(r.isJoditObject(e)){var t=e.getInstance("Table",e.o).getAllSelectedCells();if(!t.length)return !1;var o=i.css(t[0],"color"),a=i.css(t[0],"background-color"),s=i.css(t[0],"border-color"),l=n.ColorPickerWidget(e,(function(o){t.forEach((function(e){i.css(e,"background-color",o);})),e.setEditorValue();}),a),c=n.ColorPickerWidget(e,(function(o){t.forEach((function(e){i.css(e,"color",o);})),e.setEditorValue();}),o),u=n.ColorPickerWidget(e,(function(o){t.forEach((function(e){i.css(e,"border-color",o);})),e.setEditorValue();}),s);return n.TabsWidget(e,[{name:"Background",content:l},{name:"Text",content:c},{name:"Border",content:u}])}},tooltip:"Background"},{name:"valign",list:["Top","Middle","Bottom","Normal"],childTemplate:function(e,t,o){return o},exec:function(e,t,o){var r=a(o.control);e.getInstance("Table",e.o).getAllSelectedCells().forEach((function(e){i.css(e,"vertical-align","normal"===r?"":r);}));},tooltip:"Vertical align"},{name:"splitv",list:{tablesplitv:"Split vertical",tablesplitg:"Split horizontal"},tooltip:"Split"},{name:"align",icon:"left"},"\n",{name:"merge",command:"tablemerge",tooltip:"Merge"},{name:"addcolumn",list:{tableaddcolumnbefore:"Insert column before",tableaddcolumnafter:"Insert column after"},exec:function(e,t,o){var i=o.control;if(r.isJoditObject(e)){var n=a(i);e.execCommand(n,!1,t);}},tooltip:"Add column"},{name:"addrow",list:{tableaddrowbefore:"Insert row above",tableaddrowafter:"Insert row below"},exec:function(e,t,o){var i=o.control;if(r.isJoditObject(e)){var n=a(i);e.execCommand(n,!1,t);}},tooltip:"Add row"},{name:"delete",icon:"bin",list:{tablebin:"Delete table",tablebinrow:"Delete row",tablebincolumn:"Delete column",tableempty:"Empty cell"},exec:function(e,t,o){var i=o.control;if(r.isJoditObject(e)){var n=a(i);e.execCommand(n,!1,t),e.e.fire("hidePopup");}},tooltip:"Delete"}];},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.justify=t.alignElement=t.clearAlign=void 0;var r=o(8),i=o(115),n=o(10);r.Config.prototype.controls.align={name:"left",tooltip:"Align",update:function(e){var t=e.j,o=e.control,r=t.s.current();if(r){var a=i.Dom.closest(r,(function(e){return i.Dom.isBlock(e,t.ew)}),t.editor)||t.editor,s=n.css(a,"text-align").toString();o.defaultValue&&-1!==o.defaultValue.indexOf(s)&&(s="left"),o.data&&o.data.currentValue!==s&&o.list&&-1!==o.list.indexOf(s)&&(t.o.textIcons?e.state.text=s:e.state.icon.name=s,o.data.currentValue=s);}},isActive:function(e,t){var o=e.s.current();if(o&&t.defaultValue){var r=i.Dom.closest(o,(function(t){return i.Dom.isBlock(t,e.ew)}),e.editor)||e.editor;return -1===t.defaultValue.indexOf(n.css(r,"text-align").toString())}return !1},defaultValue:["left","start","inherit"],data:{currentValue:"left"},list:["center","left","right","justify"]},r.Config.prototype.controls.center={command:"justifyCenter",css:{"text-align":"center"},tooltip:"Align Center"},r.Config.prototype.controls.justify={command:"justifyFull",css:{"text-align":"justify"},tooltip:"Align Justify"},r.Config.prototype.controls.left={command:"justifyLeft",css:{"text-align":"left"},tooltip:"Align Left"},r.Config.prototype.controls.right={command:"justifyRight",css:{"text-align":"right"},tooltip:"Align Right"},t.clearAlign=function(e,t){i.Dom.each(e,(function(e){i.Dom.isHTMLElement(e,t.ew)&&e.style.textAlign&&(e.style.textAlign="",e.style.cssText.trim().length||e.removeAttribute("style"));}));},t.alignElement=function(e,o,r){if(i.Dom.isNode(o,r.ew)&&i.Dom.isElement(o))switch(t.clearAlign(o,r),e.toLowerCase()){case"justifyfull":o.style.textAlign="justify";break;case"justifyright":o.style.textAlign="right";break;case"justifyleft":o.style.textAlign="left";break;case"justifycenter":o.style.textAlign="center";}},t.justify=function(e){e.registerButton({name:"align",group:"indent"});var o=function(o){return e.s.focus(),e.s.eachSelection((function(r){if(r){var n=i.Dom.up(r,(function(t){return i.Dom.isBlock(t,e.ew)}),e.editor);n||(n=i.Dom.wrapInline(r,e.o.enterBlock,e)),t.alignElement(o,n,e);}})),!1};e.registerCommand("justifyfull",o),e.registerCommand("justifyright",o),e.registerCommand("justifyleft",o),e.registerCommand("justifycenter",o);};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.limit=void 0;var r=o(7),i=o(8),n=o(175),a=o(9),s=o(10),l=o(38);i.Config.prototype.limitWords=!1,i.Config.prototype.limitChars=!1,i.Config.prototype.limitHTML=!1;var c=function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return r.__extends(t,e),t.prototype.afterInit=function(e){var t=this,o=e.o;if(e&&(o.limitWords||o.limitChars)){var r=null;e.e.off(".limit").on("beforePaste.limit",(function(){r=e.observer.snapshot.make();})).on("keydown.limit keyup.limit beforeEnter.limit beforePaste.limit",this.checkPreventKeyPressOrPaste).on("change.limit",this.checkPreventChanging).on("afterPaste.limit",(function(){if(t.shouldPreventInsertHTML()&&r)return e.observer.snapshot.restore(r),!1}));}},t.prototype.shouldPreventInsertHTML=function(e,t){if(void 0===e&&(e=null),void 0===t&&(t=""),e&&a.COMMAND_KEYS.includes(e.key))return !1;var o=this.jodit,r=o.o,i=r.limitWords,n=r.limitChars,s=this.splitWords(t||(o.o.limitHTML?o.value:o.text));return !(!i||i>s.length)||Boolean(n)&&s.join("").length>=n},t.prototype.checkPreventKeyPressOrPaste=function(e){if(this.shouldPreventInsertHTML(e))return !1},t.prototype.checkPreventChanging=function(e,t){var o=this.jodit,r=o.o,i=r.limitWords,n=r.limitChars,a=o.o.limitHTML?e:s.stripTags(e),l=this.splitWords(a);(i&&l.length>i||Boolean(n)&&l.join("").length>n)&&(o.value=t);},t.prototype.splitWords=function(e){return e.replace(a.INVISIBLE_SPACE_REG_EXP(),"").split(a.SPACE_REG_EXP()).filter((function(e){return e.length}))},t.prototype.beforeDestruct=function(e){e.e.off(".limit");},r.__decorate([l.autobind],t.prototype,"checkPreventKeyPressOrPaste",null),r.__decorate([l.autobind],t.prototype,"checkPreventChanging",null),t}(n.Plugin);t.limit=c;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.link=void 0;var r=o(7),i=o(8),n=o(33),a=o(10),s=o(286),l=o(175),c=o(38),u=o(115);i.Config.prototype.link={formTemplate:s.formTemplate,followOnDblClick:!1,processVideoLink:!0,processPastedLink:!0,noFollowCheckbox:!0,openInNewTabCheckbox:!0,modeClassName:"input",selectMultipleClassName:!0,selectSizeClassName:3,selectOptionsClassName:[],hotkeys:["ctrl+k","cmd+k"]},i.Config.prototype.controls.unlink={exec:function(e,t){var o=n.Dom.closest(t,"a",e.editor);o&&n.Dom.unwrap(o),e.setEditorValue(),e.e.fire("hidePopup");},tooltip:"Unlink"},i.Config.prototype.controls.link={isActive:function(e){var t=e.s.current();return Boolean(t&&n.Dom.closest(t,"a",e.editor))},popup:function(e,t,o,r){return e.e.fire("generateLinkForm.link",t,r)},tags:["a"],tooltip:"Insert link"};var d=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.buttons=[{name:"link",group:"insert"}],t}return r.__extends(t,e),t.prototype.afterInit=function(e){var t=this;e.o.link.followOnDblClick&&e.e.on("dblclick.link",this.onDblClickOnLink),e.o.link.processPastedLink&&e.e.on("processPaste.link",this.onProcessPasteLink),e.e.on("generateLinkForm.link",this.generateForm),e.registerCommand("openLinkDialog",{exec:function(){var o=new u.Dialog({resizable:!1}),r=t.generateForm(e.s.current(),(function(){o.close();}));r.container.classList.add("jodit-dialog_alert"),o.setContent(r),o.open(),e.async.requestIdleCallback((function(){var e=a.refs(r.container).url_input;null==e||e.focus();}));},hotkeys:e.o.link.hotkeys});},t.prototype.onDblClickOnLink=function(e){if(n.Dom.isTag(e.target,"a")){var t=a.attr(e.target,"href");t&&(location.href=t,e.preventDefault());}},t.prototype.onProcessPasteLink=function(e,t){var o=this.jodit;if(a.isURL(t)){if(o.o.link.processVideoLink){var r=a.convertMediaUrlToVideoEmbed(t);if(r!==t)return o.createInside.fromHTML(r)}var i=o.createInside.element("a");return i.setAttribute("href",t),i.textContent=t,o.e.stopPropagation("processPaste"),i}},t.prototype.generateForm=function(e,t){var o,r=this.jodit,i=r.i18n.bind(r),s=r.o.link,l=s.openInNewTabCheckbox,c=s.noFollowCheckbox,u=s.formClassName,d=s.modeClassName,p=(0, s.formTemplate)(r),f=a.isString(p)?r.c.fromHTML(p,{target_checkbox_box:l,nofollow_checkbox_box:c}):p,h=n.Dom.isElement(f)?f:f.container,m=a.refs(h),v=m.insert,g=m.unlink,y=m.content_input_box,b=m.target_checkbox,_=m.nofollow_checkbox,w=m.url_input,S=n.Dom.isImage(e,r.ew),C=m.content_input,j=m.className_input,k=m.className_select;C||(C=r.c.element("input",{type:"hidden",ref:"content_input"})),u&&h.classList.add(u),S&&n.Dom.hide(y);var E=function(){return o?o.innerText:a.stripTags(r.s.range.cloneContents(),r.ed)};if(o=!(!e||!n.Dom.closest(e,"a",r.editor))&&n.Dom.closest(e,"a",r.editor),!S&&e&&(C.value=E()),o){if(w.value=a.attr(o,"href")||"",d)switch(d){case"input":j&&(j.value=a.attr(o,"class")||"");break;case"select":if(k){for(var I=0;k.selectedOptions.length>I;I++){var x=k.options.item(I);x&&(x.selected=!1);}(a.attr(o,"class")||"").split(" ").forEach((function(e){if(e)for(var t=0;k.options.length>t;t++){var o=k.options.item(t);(null==o?void 0:o.value)&&o.value===e&&(o.selected=!0);}}));}}l&&b&&(b.checked="_blank"===a.attr(o,"target")),c&&_&&(_.checked="nofollow"===a.attr(o,"rel")),v.textContent=i("Update");}else n.Dom.hide(g);var T=r.observer.snapshot.make();g&&r.e.on(g,"click",(function(e){r.observer.snapshot.restore(T),o&&n.Dom.unwrap(o),r.setEditorValue(),t(),e.preventDefault();}));var P=function(){if(!w.value.trim().length)return w.focus(),w.classList.add("jodit_error"),!1;var e;r.observer.snapshot.restore(T);var i=E()!==C.value.trim();if(o)e=[o];else if(r.s.isCollapsed()){var n=r.createInside.element("a");r.s.insertNode(n),e=[n];}else e=r.s.wrapInTag("a");return e.forEach((function(e){var t;if(a.attr(e,"href",w.value),d&&(null!=j?j:k))if("input"===d)""===j.value&&e.hasAttribute("class")&&a.attr(e,"class",null),""!==j.value&&a.attr(e,"class",j.value);else if("select"===d){e.hasAttribute("class")&&a.attr(e,"class",null);for(var o=0;k.selectedOptions.length>o;o++){var r=null===(t=k.selectedOptions.item(o))||void 0===t?void 0:t.value;r&&e.classList.add(r);}}S||(C.value.trim().length?i&&(e.textContent=C.value):e.textContent=w.value),l&&b&&a.attr(e,"target",b.checked?"_blank":null),c&&_&&a.attr(e,"rel",_.checked?"nofollow":null);})),r.setEditorValue(),t(),!1};return n.Dom.isElement(f)?r.e.on(f,"submit",(function(e){return e.preventDefault(),e.stopImmediatePropagation(),P(),!1})):f.onSubmit(P),f},t.prototype.beforeDestruct=function(e){e.e.off("generateLinkForm.link",this.generateForm).off("dblclick.link",this.onDblClickOnLink).off("processPaste.link",this.onProcessPasteLink);},r.__decorate([c.autobind],t.prototype,"onDblClickOnLink",null),r.__decorate([c.autobind],t.prototype,"onProcessPasteLink",null),r.__decorate([c.autobind],t.prototype,"generateForm",null),t}(l.Plugin);t.link=d;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.formTemplate=void 0;var r=o(150),i=o(124);t.formTemplate=function(e){var t=e.o.link,o=t.openInNewTabCheckbox,n=t.noFollowCheckbox,a=t.modeClassName,s=t.selectSizeClassName,l=t.selectMultipleClassName,c=t.selectOptionsClassName;return new r.UIForm(e,[new r.UIBlock(e,[new r.UIInput(e,{name:"url",type:"url",ref:"url_input",label:"URL",placeholder:"http://",required:!0})]),new r.UIBlock(e,[new r.UIInput(e,{name:"content",ref:"content_input",label:"Text"})],{ref:"content_input_box"}),a?new r.UIBlock(e,["input"===a?new r.UIInput(e,{name:"className",ref:"className_input",label:"Class name"}):"select"===a?new r.UISelect(e,{name:"className",ref:"className_select",label:"Class name",size:s,multiple:l,options:c}):null]):null,o?new r.UICheckbox(e,{name:"target",ref:"target_checkbox",label:"Open in new tab"}):null,n?new r.UICheckbox(e,{name:"nofollow",ref:"nofollow_checkbox",label:"No follow"}):null,new r.UIBlock(e,[new i.UIButton(e,{name:"unlink",status:"default",text:"Unlink"}),new i.UIButton(e,{name:"insert",type:"submit",status:"primary",text:"Insert"})],{align:"full"})])};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(288),t),r.__exportStar(o(289),t),r.__exportStar(o(291),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.media=void 0;var r=o(8),i=o(9),n=o(10);r.Config.prototype.mediaFakeTag="jodit-media",r.Config.prototype.mediaInFakeBlock=!0,r.Config.prototype.mediaBlocks=["video","audio"],t.media=function(e){var t="jodit_fake_wrapper",o=e.options,r=o.mediaFakeTag,a=o.mediaBlocks;o.mediaInFakeBlock&&e.e.on("afterGetValueFromEditor",(function(e){var o=new RegExp("<"+r+"[^>]+data-"+t+"[^>]+>(.+?)</"+r+">","ig");o.test(e.value)&&(e.value=e.value.replace(o,"$1"));})).on("change afterInit afterSetMode changePlace",e.async.debounce((function(){e.isDestructed||e.getMode()===i.MODE_SOURCE||n.$$(a.join(","),e.editor).forEach((function(o){n.dataBind(o,t)||(n.dataBind(o,t,!0),function(o){if(o.parentNode&&n.attr(o.parentNode,"data-jodit_iframe_wrapper"))o=o.parentNode;else {var i=e.createInside.fromHTML("<"+r+' data-jodit-temp="1" contenteditable="false" draggable="true" data-'+t+'="1"></'+r+">");i.style.display="inline-block"===o.style.display?"inline-block":"block",i.style.width=o.offsetWidth+"px",i.style.height=o.offsetHeight+"px",o.parentNode&&o.parentNode.insertBefore(i,o),i.appendChild(o),o=i;}e.e.off(o,"mousedown.select touchstart.select").on(o,"mousedown.select touchstart.select",(function(){e.s.setCursorAfter(o);}));}(o));}));}),e.defaultTimeout));};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.video=void 0,o(290),t.video=function(e){e.registerButton({name:"video",group:"media"});};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(8),i=o(248),n=o(10),a=o(150),s=o(124);r.Config.prototype.controls.video={popup:function(e,t,o,r){var l=new a.UIForm(e,[new a.UIBlock(e,[new a.UIInput(e,{name:"url",required:!0,label:"URL",placeholder:"https://",validators:["url"]})]),new a.UIBlock(e,[s.Button(e,"","Insert","primary").onAction((function(){return l.submit()}))])]),c=new a.UIForm(e,[new a.UIBlock(e,[new a.UITextArea(e,{name:"code",required:!0,label:"Embed code"})]),new a.UIBlock(e,[s.Button(e,"","Insert","primary").onAction((function(){return c.submit()}))])]),u=[],d=e.s.save(),p=function(t){e.s.restore(d),e.s.insertHTML(t),r();};return u.push({icon:"link",name:"Link",content:l.container},{icon:"source",name:"Code",content:c.container}),l.onSubmit((function(e){p(n.convertMediaUrlToVideoEmbed(e.url));})),c.onSubmit((function(e){p(e.code);})),i.TabsWidget(e,u)},tags:["iframe"],tooltip:"Insert youtube/vimeo video"};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.file=void 0;var r=o(8),i=o(33),n=o(248);r.Config.prototype.controls.file={popup:function(e,t,o,r){var a=function(t,o){void 0===o&&(o=""),e.s.insertNode(e.createInside.fromHTML('<a href="'+t+'" title="'+o+'">'+(o||t)+"</a>"));},s=null;return t&&(i.Dom.isTag(t,"a")||i.Dom.closest(t,"a",e.editor))&&(s=i.Dom.isTag(t,"a")?t:i.Dom.closest(t,"a",e.editor)),n.FileSelectorWidget(e,{filebrowser:function(e){e.files&&e.files.forEach((function(t){return a(e.baseurl+t)})),r();},upload:!0,url:function(e,t){s?(s.setAttribute("href",e),s.setAttribute("title",t)):a(e,t),r();}},s,r,!1)},tags:["a"],tooltip:"Insert file"},t.file=function(e){e.registerButton({name:"file",group:"media"});};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.mobile=void 0;var r=o(7),i=o(8),n=o(9),a=o(10),s=o(146),l=o(149),c=o(135);i.Config.prototype.mobileTapTimeout=300,i.Config.prototype.toolbarAdaptive=!0,i.Config.prototype.controls.dots={mode:n.MODE_SOURCE+n.MODE_WYSIWYG,popup:function(e,t,o,r,i){var n=o.data;return void 0===n&&(n={toolbar:s.makeCollection(e),rebuild:function(){var t;if(i){var o=e.e.fire("getDiffButtons.mobile",i.closest(l.UIList));if(o&&n){n.toolbar.build(a.splitArray(o));var r=(null===(t=e.toolbar.firstButton)||void 0===t?void 0:t.container.offsetWidth)||36;n.toolbar.container.style.width=3*(r+4)+"px";}}}},o.data=n),n.rebuild(),n.toolbar},tooltip:"Show all"},t.mobile=function(e){var t=0,o=a.splitArray(e.o.buttons);e.e.on("touchend",(function(o){if(o.changedTouches&&o.changedTouches.length){var r=(new Date).getTime();r-t>e.o.mobileTapTimeout&&(t=r,e.s.insertCursorAtPoint(o.changedTouches[0].clientX,o.changedTouches[0].clientY));}})).on("getDiffButtons.mobile",(function(t){if(t===e.toolbar){var i=a.splitArray(e.o.buttons),n=c.flatButtonsSet(o);return i.reduce((function(e,t){return c.isButtonGroup(t)?e.push(r.__assign(r.__assign({},t),{buttons:t.buttons.filter((function(e){return !n.has(e)}))})):n.has(t)||e.push(t),e}),[])}})),e.o.toolbarAdaptive&&e.e.on("resize afterInit recalcAdaptive changePlace afterAddPlace",(function(){if(e.o.toolbar){var t=e.container.offsetWidth,r=a.splitArray(e.o.sizeLG>t?e.o.sizeMD>t?e.o.sizeSM>t?e.o.buttonsXS:e.o.buttonsSM:e.o.buttonsMD:e.o.buttons);r.toString()!==o.toString()&&(o=r,e.e.fire("closeAllPopups"),e.toolbar.setRemoveButtons(e.o.removeButtons).build(o.concat(e.o.extraButtons)));}})).on(e.ow,"load",(function(){return e.e.fire("recalcAdaptive")}));};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.orderedList=void 0;var r=o(8),i=o(33),n=o(10),a=function(e,t,o){var r=o.control,i="button"+r.command,a=r.args&&r.args[0]||n.dataBind(e,i);n.dataBind(e,i,a),e.execCommand(r.command,!1,a);};r.Config.prototype.controls.ul={command:"insertUnorderedList",tags:["ul"],tooltip:"Insert Unordered List",list:{default:"Default",circle:"Circle",disc:"Dot",square:"Quadrate"},exec:a},r.Config.prototype.controls.ol={command:"insertOrderedList",tags:["ol"],tooltip:"Insert Ordered List",list:{default:"Default","lower-alpha":"Lower Alpha","lower-greek":"Lower Greek","lower-roman":"Lower Roman","upper-alpha":"Upper Alpha","upper-roman":"Upper Roman"},exec:a},t.orderedList=function(e){var t=function(e){return /insert(un)?orderedlist/i.test(e)},o=function(){return i.Dom.up(e.s.current(),(function(e){return e&&/^UL|OL$/i.test(e.nodeName)}),e.editor)},r=function(e,t){"default"!==t&&t?e.style.setProperty("list-style-type",t):e.style.removeProperty("list-style-type");};e.e.on("beforeCommand",(function(e,n,a){if(t(e)&&a){var s=o();if(s&&!function(e,t){var o=e.style.listStyleType;return o===t||!o&&"default"===t}(s,a)&&(i.Dom.isTag(s,"ul")&&/unordered/i.test(e)||i.Dom.isTag(s,"ol")&&!/unordered/i.test(e)))return r(s,a),!1}})).on("afterCommand",(function(a,s,l){if(t(a)){var c=o();c&&(r(c,l),e.createInside.applyCreateAttributes(c),c.querySelectorAll("li").forEach((function(t){e.createInside.applyCreateAttributes(t);})));var u=[],d=function(e){i.Dom.isTag(e,["p","h1","h2","h3","h4","h5","h6"])&&u.push(e);};if(c&&(d(c.parentNode),c.querySelectorAll("li").forEach((function(e){return d(e.firstChild)})),u.length)){var p=e.s.save();n.toArray(c.childNodes).forEach((function(e){i.Dom.isTag(e.lastChild,"br")&&i.Dom.safeRemove(e.lastChild);})),u.forEach((function(e){return i.Dom.unwrap(e)})),e.s.restore(p);}e.setEditorValue();}}));};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.placeholder=void 0;var r=o(7);o(295);var i=o(8),n=o(9),a=o(10),s=o(33),l=o(175),c=o(9),u=o(38);i.Config.prototype.showPlaceholder=!0,i.Config.prototype.useInputsPlaceholder=!0,i.Config.prototype.placeholder="Type something";var d=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.addNativeListeners=function(){t.j.e.off(t.j.editor,"input.placeholder keydown.placeholder").on(t.j.editor,"input.placeholder keydown.placeholder",t.toggle);},t.addEvents=function(){var e=t.j;e.o.useInputsPlaceholder&&e.element.hasAttribute("placeholder")&&(t.placeholderElm.innerHTML=a.attr(e.element,"placeholder")||""),e.e.fire("placeholder",t.placeholderElm.innerHTML),e.e.off(".placeholder").on("changePlace.placeholder",t.addNativeListeners).on("change.placeholder focus.placeholder keyup.placeholder mouseup.placeholder keydown.placeholder mousedown.placeholder afterSetMode.placeholder changePlace.placeholder",t.toggle).on(window,"load",t.toggle),t.addNativeListeners(),t.toggle();},t}return r.__extends(t,e),t.prototype.afterInit=function(e){var t=this;e.o.showPlaceholder&&(this.placeholderElm=e.c.fromHTML('<span data-ref="placeholder" style="display: none;" class="jodit-placeholder">'+e.i18n(e.o.placeholder)+"</span>"),"rtl"===e.o.direction&&(this.placeholderElm.style.right="0px",this.placeholderElm.style.direction="rtl"),e.e.on("readonly",(function(e){e?t.hide():t.toggle();})).on("changePlace",this.addEvents),this.addEvents());},t.prototype.show=function(){var e=this.j;if(!e.o.readonly){var t=0,o=0,r=e.s.current(),i=r&&s.Dom.closest(r,(function(t){return s.Dom.isBlock(t,e.ew)}),e.editor)||e.editor,n=e.ew.getComputedStyle(i);if(e.workplace.appendChild(this.placeholderElm),s.Dom.isElement(e.editor.firstChild)){var l=e.ew.getComputedStyle(e.editor.firstChild);t=parseInt(l.getPropertyValue("margin-top"),10),o=parseInt(l.getPropertyValue("margin-left"),10),this.placeholderElm.style.fontSize=parseInt(l.getPropertyValue("font-size"),10)+"px",this.placeholderElm.style.lineHeight=l.getPropertyValue("line-height");}else this.placeholderElm.style.fontSize=parseInt(n.getPropertyValue("font-size"),10)+"px",this.placeholderElm.style.lineHeight=n.getPropertyValue("line-height");a.css(this.placeholderElm,{display:"block",textAlign:n.getPropertyValue("text-align"),marginTop:Math.max(parseInt(n.getPropertyValue("margin-top"),10),t),marginLeft:Math.max(parseInt(n.getPropertyValue("margin-left"),10),o)});}},t.prototype.hide=function(){s.Dom.safeRemove(this.placeholderElm);},t.prototype.toggle=function(){var e=this.j;e.editor&&!e.isInDestruct&&(e.getRealMode()===n.MODE_WYSIWYG&&this.isEmpty(e.editor)?this.show():this.hide());},t.prototype.isEmpty=function(e){if(!e.firstChild)return !0;var t=e.firstChild;if(c.MAY_BE_REMOVED_WITH_KEY.test(t.nodeName)||/^(TABLE)$/i.test(t.nodeName))return !1;var o=s.Dom.next(t,(function(e){return e&&!s.Dom.isEmptyTextNode(e)}),e);return s.Dom.isText(t)&&!o?s.Dom.isEmptyTextNode(t):!(o||!s.Dom.each(t,(function(e){return !s.Dom.isTag(e,["ul","li","ol"])&&(s.Dom.isEmpty(e)||s.Dom.isTag(e,"br"))})))},t.prototype.beforeDestruct=function(e){this.hide(),e.e.off(".placeholder").off(window,"load",this.toggle);},r.__decorate([u.debounce((function(e){return e.defaultTimeout/10}),!0)],t.prototype,"toggle",null),t}(l.Plugin);t.placeholder=d;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.redoUndo=void 0;var r=o(7),i=o(8),n=o(9),a=o(175);i.Config.prototype.controls.redo={mode:n.MODE_SPLIT,isDisabled:function(e){return !e.observer.stack.canRedo()},tooltip:"Redo"},i.Config.prototype.controls.undo={mode:n.MODE_SPLIT,isDisabled:function(e){return !e.observer.stack.canUndo()},tooltip:"Undo"};var s=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.buttons=[{name:"undo",group:"history"},{name:"redo",group:"history"}],t}return r.__extends(t,e),t.prototype.beforeDestruct=function(){},t.prototype.afterInit=function(e){var t=function(t){return e.observer[t](),!1};e.registerCommand("redo",{exec:t,hotkeys:["ctrl+y","ctrl+shift+z","cmd+y","cmd+shift+z"]}),e.registerCommand("undo",{exec:t,hotkeys:["ctrl+z","cmd+z"]});},t}(a.Plugin);t.redoUndo=s;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.resizer=void 0;var r=o(7);o(298);var i=o(8),n=o(9),a=o(9),s=o(33),l=o(10),c=o(175),u=o(31),d=o(38);i.Config.prototype.useIframeResizer=!0,i.Config.prototype.useTableResizer=!0,i.Config.prototype.useImageResizer=!0,i.Config.prototype.resizer={showSize:!0,hideSizeTimeout:1e3,min_width:10,min_height:10};var p="__jodit-resizer_binded",f=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.LOCK_KEY="resizer",t.element=null,t.isResized=!1,t.isShown=!1,t.start_x=0,t.start_y=0,t.width=0,t.height=0,t.ratio=0,t.rect=t.j.c.fromHTML('<div class="jodit-resizer">\n\t\t\t\t<i class="jodit-resizer-topleft"></i>\n\t\t\t\t<i class="jodit-resizer-topright"></i>\n\t\t\t\t<i class="jodit-resizer-bottomright"></i>\n\t\t\t\t<i class="jodit-resizer-bottomleft"></i>\n\t\t\t\t<span>100x100</span>\n\t\t\t</div>'),t.sizeViewer=t.rect.getElementsByTagName("span")[0],t.onResize=function(e){if(t.isResized){var o=e.clientX-t.start_x,r=e.clientY-t.start_y;if(!t.element)return;var i=t.handle.className,n=0,a=0;s.Dom.isTag(t.element,"img")?(o?(n=t.width+(i.match(/left/)?-1:1)*o,a=Math.round(n/t.ratio)):(a=t.height+(i.match(/top/)?-1:1)*r,n=Math.round(a*t.ratio)),n>l.innerWidth(t.j.editor,t.j.ow)&&(n=l.innerWidth(t.j.editor,t.j.ow),a=Math.round(n/t.ratio))):(n=t.width+(i.match(/left/)?-1:1)*o,a=t.height+(i.match(/top/)?-1:1)*r),n>t.j.o.resizer.min_width&&l.css(t.element,"width",t.rect.parentNode.offsetWidth>n?n:"100%"),a>t.j.o.resizer.min_height&&l.css(t.element,"height",a),t.updateSize(),t.showSizeViewer(t.element.offsetWidth,t.element.offsetHeight),e.stopImmediatePropagation();}},t.onClickOutside=function(e){t.isShown&&(t.isResized?(t.j.unlock(),t.isResized=!1,t.j.setEditorValue(),e.stopImmediatePropagation(),t.j.e.off(t.j.ow,"mousemove.resizer touchmove.resizer",t.onResize)):t.hide());},t.onClickElement=function(e){t.element===e&&t.isShown||(t.element=e,t.show(),s.Dom.isTag(t.element,"img")&&!t.element.complete&&t.j.e.on(t.element,"load",t.updateSize));},t.updateSize=function(){if(!t.isInDestruct&&t.isShown&&t.element&&t.rect){var e=l.offset(t.rect.parentNode||t.j.od.documentElement,t.j,t.j.od,!0),o=l.offset(t.element,t.j,t.j.ed),r=parseInt(t.rect.style.left||"0",10),i=parseInt(t.rect.style.top||"0",10),n=o.top-1-e.top,a=o.left-1-e.left;i===n&&r===a&&t.rect.offsetWidth===t.element.offsetWidth&&t.rect.offsetHeight===t.element.offsetHeight||(l.css(t.rect,{top:n,left:a,width:t.element.offsetWidth,height:t.element.offsetHeight}),t.j.events&&(t.j.e.fire(t.element,"changesize"),isNaN(r)||t.j.e.fire("resize")));}},t.hideSizeViewer=function(){t.sizeViewer.style.opacity="0";},t}return r.__extends(t,e),t.prototype.afterInit=function(e){var t=this;l.$$("i",this.rect).forEach((function(o){e.e.on(o,"mousedown.resizer touchstart.resizer",t.onClickHandle.bind(t,o));})),u.eventEmitter.on("hideHelpers",this.hide),e.e.on("readonly",(function(e){e&&t.hide();})).on("afterInit changePlace",this.addEventListeners.bind(this)).on("afterGetValueFromEditor.resizer",(function(e){var t=/<jodit[^>]+data-jodit_iframe_wrapper[^>]+>(.*?<iframe[^>]+>.*?<\/iframe>.*?)<\/jodit>/gi;t.test(e.value)&&(e.value=e.value.replace(t,"$1"));})).on("hideResizer",this.hide).on("change afterInit afterSetMode",e.async.debounce(this.onChangeEditor.bind(this),e.defaultTimeout)),this.addEventListeners(),this.onChangeEditor();},t.prototype.addEventListeners=function(){var e=this,t=this.j;t.e.off(t.editor,".resizer").off(t.ow,".resizer").on(t.editor,"keydown.resizer",(function(t){e.isShown&&t.key===n.KEY_DELETE&&e.element&&!s.Dom.isTag(e.element,"table")&&e.onDelete(t);})).on(t.ow,"resize.resizer",this.updateSize).on(t.ow,"mouseup.resizer keydown.resizer touchend.resizer",this.onClickOutside).on([t.ow,t.editor],"scroll.resizer",(function(){e.isShown&&!e.isResized&&e.hide();}));},t.prototype.onClickHandle=function(e,t){if(!this.element||!this.element.parentNode)return this.hide(),!1;this.handle=e,t.preventDefault(),t.stopImmediatePropagation(),this.width=this.element.offsetWidth,this.height=this.element.offsetHeight,this.ratio=this.width/this.height,this.isResized=!0,this.start_x=t.clientX,this.start_y=t.clientY,this.j.e.fire("hidePopup"),this.j.lock(this.LOCK_KEY),this.j.e.on(this.j.ow,"mousemove.resizer touchmove.resizer",this.onResize);},t.prototype.onDelete=function(e){this.element&&("JODIT"!==this.element.tagName?this.j.s.select(this.element):(s.Dom.safeRemove(this.element),this.hide(),e.preventDefault()));},t.prototype.onChangeEditor=function(){var e=this,t=this.j;this.isShown&&(this.element&&this.element.parentNode?this.updateSize():this.hide()),t.isDestructed||l.$$("img, table, iframe",t.editor).forEach((function(o){t.getMode()!==n.MODE_SOURCE&&!o[p]&&(s.Dom.isTag(o,"iframe")&&t.o.useIframeResizer||s.Dom.isTag(o,"img")&&t.o.useImageResizer||s.Dom.isTag(o,"table")&&t.o.useTableResizer)&&(o[p]=!0,e.bind(o));}));},t.prototype.bind=function(e){var t,o=this;if(s.Dom.isTag(e,"iframe")){var r=e;l.attr(e.parentNode,"-jodit_iframe_wrapper")?e=e.parentNode:(t=this.j.createInside.fromHTML('<jodit data-jodit-temp="1" contenteditable="false" draggable="true" data-jodit_iframe_wrapper="1"></jodit>'),l.css(t,{display:"inline-block"===e.style.display?"inline-block":"block",width:e.offsetWidth,height:e.offsetHeight}),e.parentNode&&e.parentNode.insertBefore(t,e),t.appendChild(e),e=t),this.j.e.off(e,"mousedown.select touchstart.select").on(e,"mousedown.select touchstart.select",(function(){o.j.s.select(e);})).off(e,"changesize").on(e,"changesize",(function(){r.setAttribute("width",e.offsetWidth+"px"),r.setAttribute("height",e.offsetHeight+"px");}));}this.j.e.on(e,"dragstart",this.hide).on(e,"mousedown",(function(t){a.IS_IE&&s.Dom.isTag(e,"img")&&t.preventDefault();})).on(e,"click",(function(){return o.onClickElement(e)}));},t.prototype.showSizeViewer=function(e,t){this.j.o.resizer.showSize&&(this.sizeViewer.offsetWidth>e||this.sizeViewer.offsetHeight>t?this.hideSizeViewer():(this.sizeViewer.style.opacity="1",this.sizeViewer.textContent=e+" x "+t,this.j.async.setTimeout(this.hideSizeViewer,{timeout:this.j.o.resizer.hideSizeTimeout,label:"hideSizeViewer"})));},t.prototype.show=function(){this.j.o.readonly||this.isShown||(this.isShown=!0,this.rect.parentNode||(l.markOwner(this.j,this.rect),this.j.workplace.appendChild(this.rect)),this.j.isFullSize&&(this.rect.style.zIndex=l.css(this.j.container,"zIndex").toString()),this.updateSize());},t.prototype.hide=function(){this.isResized=!1,this.isShown=!1,this.element=null,s.Dom.safeRemove(this.rect);},t.prototype.beforeDestruct=function(e){this.hide(),u.eventEmitter.off("hideHelpers",this.hide),e.e.off(this.j.ow,".resizer").off(".resizer");},r.__decorate([d.autobind],t.prototype,"hide",null),t}(c.Plugin);t.resizer=f;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.search=void 0;var r=o(7);o(300);var i=o(8),n=o(9),a=o(9),s=o(33),l=o(175),c=o(149),u=o(10),d=o(38);i.Config.prototype.useSearch=!0,i.Config.prototype.controls.find={tooltip:"Find",icon:"search",exec:function(e,t,o){var r=o.control;switch(r.args&&r.args[0]){case"findPrevious":e.e.fire("searchPrevious");break;case"findNext":e.e.fire("searchNext");break;case"replace":e.execCommand("openReplaceDialog");break;default:e.execCommand("openSearchDialog");}},list:{search:"Find",findNext:"Find Next",findPrevious:"Find Previous",replace:"Replace"},childTemplate:function(e,t,o){return o}};var p=function(e){function t(){var o=null!==e&&e.apply(this,arguments)||this;return o.buttons=[{name:"find",group:"search"}],o.template='<div class="jodit-search">\n\t\t\t<div class="jodit-search__box">\n\t\t\t\t<div class="jodit-search__inputs">\n\t\t\t\t\t<input data-ref="query" tabindex="0" placeholder="'+o.j.i18n("Search for")+'" type="text"/>\n\t\t\t\t\t<input data-ref="replace" tabindex="0" placeholder="'+o.j.i18n("Replace with")+'" type="text"/>\n\t\t\t\t</div>\n\t\t\t\t<div class="jodit-search__counts">\n\t\t\t\t\t<span data-ref="counter-box">0/0</span>\n\t\t\t\t</div>\n\t\t\t\t<div class="jodit-search__buttons">\n\t\t\t\t\t<button data-ref="next" tabindex="0" type="button">'+c.Icon.get("angle-down")+'</button>\n\t\t\t\t\t<button data-ref="prev" tabindex="0" type="button">'+c.Icon.get("angle-up")+'</button>\n\t\t\t\t\t<button data-ref="cancel" tabindex="0" type="button">'+c.Icon.get("cancel")+'</button>\n\t\t\t\t\t<button data-ref="replace-btn" tabindex="0" type="button" class="jodit-ui-button">'+o.j.i18n("Replace")+"</button>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>",o.isOpened=!1,o.selInfo=null,o.current=null,o.eachMap=function(e,t,r){s.Dom.findWithCurrent(e,(function(e){return Boolean(e&&t(e))}),o.j.editor,r?"nextSibling":"previousSibling",r?"firstChild":"lastChild");},o.updateCounters=function(){if(o.isOpened){o.counterBox.style.display=o.queryInput.value.length?"inline-block":"none";var e=o.calcCounts(o.queryInput.value,o.j.s.range);o.counterBox.textContent=e.join("/");}},o.calcCounts=function(e,t){void 0===t&&(t=!1);for(var r=[],i=0,n=0,a=!1,s=o.j.editor.firstChild;s&&e.length;)if(a=o.find(s,e,!0,0,a||o.j.ed.createRange())){if(o.boundAlreadyWas(a,r))break;r.push(a),s=a.startContainer,n+=1,t&&o.boundAlreadyWas(t,[a])&&(i=n);}else s=null;return [i,n]},o.findAndReplace=function(e,t){var r=o.find(e,t,!0,0,o.j.s.range);if(r&&r.startContainer&&r.endContainer){var i=o.j.ed.createRange();try{if(r&&r.startContainer&&r.endContainer){i.setStart(r.startContainer,r.startOffset),i.setEnd(r.endContainer,r.endOffset),i.deleteContents();var n=o.j.createInside.text(o.replaceInput.value);i.insertNode(n),o.j.s.select(n),o.tryScrollToElement(n);}}catch(e){}return !0}return !1},o.findAndSelect=function(e,t,r){var i=o.find(e,t,r,0,o.j.s.range);if(i&&i.startContainer&&i.endContainer){var n=o.j.ed.createRange();try{n.setStart(i.startContainer,i.startOffset),n.setEnd(i.endContainer,i.endOffset),o.j.s.selectRange(n);}catch(e){}return o.tryScrollToElement(i.startContainer),o.current=i.startContainer,o.updateCounters(),!0}return !1},o.find=function(e,r,i,n,a){if(e&&r.length){var l="",c={startContainer:null,startOffset:null,endContainer:null,endOffset:null};if(o.eachMap(e,(function(e){if(s.Dom.isText(e)&&null!=e.nodeValue&&e.nodeValue.length){var d=e.nodeValue;i||e!==a.startContainer?i&&e===a.endContainer&&(d=n?d.substr(0,a.startOffset):d.substr(a.endOffset)):d=n?d.substr(a.endOffset):d.substr(0,a.startOffset);var p=i?l+d:d+l,f=t.findSomePartOfString(r,p,i);if(!1!==f){var h=t.findSomePartOfString(r,d,i);!0===h?h=u.trim(r):!1===h&&!0===(h=t.findSomePartOfString(d,r,i))&&(h=u.trim(d));var m=t.getSomePartOfStringIndex(r,d,i)||0;if((i&&!n||!i&&n)&&e.nodeValue.length-d.length>0&&(m+=e.nodeValue.length-d.length),null==c.startContainer&&(c.startContainer=e,c.startOffset=m),!0===f)return c.endContainer=e,c.endOffset=m,c.endOffset+=h.length,!0;l=p;}else l="",c={startContainer:null,startOffset:null,endContainer:null,endOffset:null};}else s.Dom.isBlock(e,o.j.ew)&&""!==l&&(l=i?l+" ":" "+l);return !1}),i),c.startContainer&&c.endContainer)return c;if(!n)return o.current=i?o.j.editor.firstChild:o.j.editor.lastChild,o.find(o.current,r,i,n+1,a)}return !1},o.open=function(e){void 0===e&&(e=!1),o.isOpened||(o.searchBox.classList.add("jodit-search_active"),o.isOpened=!0),o.calcSticky(o.j.e.fire("getStickyState.sticky")||!1),o.j.e.fire("hidePopup"),o.searchBox.classList.toggle("jodit-search_replace",e),o.current=o.j.s.current(),o.selInfo=o.j.s.save();var t=(o.j.s.sel||"").toString();t&&(o.queryInput.value=t),o.updateCounters(),t?o.queryInput.select():o.queryInput.focus();},o.close=function(){o.isOpened&&(o.selInfo&&(o.j.s.restore(o.selInfo),o.selInfo=null),o.searchBox.classList.remove("jodit-search_active"),o.isOpened=!1);},o}return r.__extends(t,e),t.getSomePartOfStringIndex=function(e,t,o){return void 0===o&&(o=!0),this.findSomePartOfString(e,t,o,!0)},t.findSomePartOfString=function(e,t,o,r){void 0===o&&(o=!0),void 0===r&&(r=!1),e=u.trim(e.toLowerCase().replace(n.SPACE_REG_EXP()," ")),t=t.toLowerCase();for(var i=o?0:t.length-1,a=o?0:e.length-1,s=0,l=null,c=o?1:-1,d=[];void 0!==t[i];i+=c){var p=e[a]===t[i];if(p||null!=l&&n.SPACE_REG_EXP().test(t[i])?(null!=l&&o||(l=i),d.push(t[i]),p&&(s+=1,a+=c)):(l=null,d.length=0,s=0,a=o?0:e.length-1),s===e.length)return !r||l}return r?null!=l&&l:!!d.length&&(o?d.join(""):d.reverse().join(""))},t.prototype.boundAlreadyWas=function(e,t){return t.some((function(t){return t.startContainer===e.startContainer&&t.endContainer===e.endContainer&&t.startOffset===e.startOffset&&t.endOffset===e.endOffset}),!1)},t.prototype.tryScrollToElement=function(e){var t=s.Dom.closest(e,s.Dom.isElement,this.j.editor);t||(t=s.Dom.prev(e,s.Dom.isElement,this.j.editor)),t&&t!==this.j.editor&&t.scrollIntoView();},t.prototype.afterInit=function(e){var t=this;if(e.o.useSearch){var o=this;o.searchBox=e.c.fromHTML(o.template);var r=u.refs(o.searchBox),i=r.replace,s=r.cancel,l=r.next,c=r.prev,d=r.replaceBtn,p=r.counterBox;o.queryInput=r.query,o.replaceInput=i,o.closeButton=s,o.nextButton=l,o.prevButton=c,o.replaceButton=d,o.counterBox=p;var f=function(){e.workplace.appendChild(t.searchBox),e.e.off(t.j.container,"keydown.search").on(t.j.container,"keydown.search",(function(r){if(e.getRealMode()===a.MODE_WYSIWYG)switch(r.key){case n.KEY_ESC:t.close();break;case n.KEY_F3:o.queryInput.value&&(e.e.fire(r.shiftKey?"searchPrevious":"searchNext"),r.preventDefault());}}));};f(),e.e.on("changePlace",f).on(o.closeButton,"click",this.close).on(o.queryInput,"mousedown",(function(){e.s.isFocused()&&(e.s.removeMarkers(),o.selInfo=e.s.save());})).on(o.replaceButton,"click",(function(r){o.findAndReplace(e.s.current()||e.editor.firstChild,o.queryInput.value),t.updateCounters(),r.preventDefault(),r.stopImmediatePropagation();})).on([o.nextButton,o.prevButton],"click",(function(t){e.e.fire(o.nextButton===this?"searchNext":"searchPrevious"),t.preventDefault(),t.stopImmediatePropagation();})).on(this.queryInput,"keydown",this.j.async.debounce((function(o){switch(o.key){case n.KEY_ENTER:o.preventDefault(),o.stopImmediatePropagation(),e.e.fire("searchNext")&&t.close();break;default:t.updateCounters();}}),this.j.defaultTimeout)).on("beforeSetMode.search",(function(){t.close();})).on("keydown.search mousedown.search",(function(){t.selInfo&&(e.s.removeMarkers(),t.selInfo=null),t.isOpened&&(t.current=t.j.s.current(),t.updateCounters());})).on("searchNext.search searchPrevious.search",(function(){return o.isOpened?o.findAndSelect(e.s.current()||e.editor.firstChild,o.queryInput.value,"searchNext"===e.e.current):o.open()})).on("search.search",(function(t,o){void 0===o&&(o=!0),e.execCommand("search",t,o);})).on("toggleSticky.search",this.calcSticky),e.registerCommand("search",{exec:function(t,r,i){return void 0===i&&(i=!0),o.findAndSelect(e.s.current()||e.editor.firstChild,r||"",i),!1}}).registerCommand("openSearchDialog",{exec:function(){return o.open(),!1},hotkeys:["ctrl+f","cmd+f"]}).registerCommand("openReplaceDialog",{exec:function(){return e.o.readonly||o.open(!0),!1},hotkeys:["ctrl+h","cmd+h"]});}},t.prototype.beforeDestruct=function(e){var t;s.Dom.safeRemove(this.searchBox),null===(t=e.events)||void 0===t||t.off(".search");},t.prototype.calcSticky=function(e){if(this.isOpened)if(this.searchBox.classList.toggle("jodit-search_sticky",e),e){var t=u.position(this.j.toolbarContainer);u.css(this.searchBox,{top:t.top+t.height,left:t.left+t.width});}else u.css(this.searchBox,{top:null,left:null});},r.__decorate([d.autobind],t.prototype,"calcSticky",null),t}(l.Plugin);t.search=p;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);o(302),r.__exportStar(o(303),t),r.__exportStar(o(304),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(8);r.Config.prototype.width="auto",r.Config.prototype.minWidth=200,r.Config.prototype.maxWidth="100%",r.Config.prototype.allowResizeX=!1,r.Config.prototype.allowResizeY=!0,r.Config.prototype.height="auto",r.Config.prototype.minHeight=200,r.Config.prototype.maxHeight="auto",r.Config.prototype.saveHeightInStorage=!1;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.resizeHandler=void 0;var r=o(7),i=o(175),n=o(33),a=o(38),s=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.isResized=!1,t.start={x:0,y:0,w:0,h:0},t.handle=t.j.c.div("jodit-editor__resize",'<a tabindex="-1" href="javascript:void(0)"></a>'),t}return r.__extends(t,e),t.prototype.afterInit=function(e){var t=this;"auto"!==e.o.height&&(e.o.allowResizeX||e.o.allowResizeY)&&(e.e.on("toggleFullSize.resizeHandler",(function(){t.handle.style.display=e.isFullSize?"none":"block";})).on(this.handle,"mousedown touchstart",this.onHandleResizeStart).on(e.ow,"mouseup touchsend",this.onHandleResizeEnd),e.container.appendChild(this.handle));},t.prototype.onHandleResizeStart=function(e){this.isResized=!0,this.start.x=e.clientX,this.start.y=e.clientY,this.start.w=this.j.container.offsetWidth,this.start.h=this.j.container.offsetHeight,this.j.lock(),this.j.e.on(this.j.ow,"mousemove touchmove",this.onHandleResize),e.preventDefault();},t.prototype.onHandleResize=function(e){this.isResized&&(this.j.o.allowResizeY&&this.j.e.fire("setHeight",this.start.h+e.clientY-this.start.y),this.j.o.allowResizeX&&this.j.e.fire("setWidth",this.start.w+e.clientX-this.start.x),this.j.e.fire("resize"));},t.prototype.onHandleResizeEnd=function(){this.isResized&&(this.isResized=!1,this.j.e.off(this.j.ow,"mousemove touchmove",this.onHandleResize),this.j.unlock());},t.prototype.beforeDestruct=function(e){n.Dom.safeRemove(this.handle),this.j.e.off(this.j.ow,"mouseup touchsend",this.onHandleResizeEnd);},t.requires=["size"],r.__decorate([a.autobind],t)}(i.Plugin);t.resizeHandler=s;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.size=void 0;var r=o(7);o(305);var i=o(10),n=o(175),a=o(38),s=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.resizeWorkspaces=t.j.async.debounce(t.resizeWorkspaceImd,t.j.defaultTimeout,!0),t}return r.__extends(t,e),t.prototype.afterInit=function(e){e.e.on("setHeight.size",this.setHeight).on("setWidth.size",this.setWidth).on("afterInit.size changePlace.size",this.initialize,void 0,!0).on(e.ow,"load.size",this.resizeWorkspaces).on("afterInit.size resize.size afterUpdateToolbar.size scroll.size afterResize.size toggleFullSize.size",this.resizeWorkspaces),this.initialize();},t.prototype.initialize=function(){var e=this.j;if(!e.o.inline){var t=e.o.height;if(e.o.saveHeightInStorage&&"auto"!==t){var o=e.storage.get("height");o&&(t=o);}i.css(e.editor,{minHeight:"100%"}),i.css(e.container,{minHeight:e.o.minHeight,maxHeight:e.o.maxHeight,minWidth:e.o.minWidth,maxWidth:e.o.maxWidth}),this.setHeight(t),this.setWidth(e.o.width);}},t.prototype.setHeight=function(e){if(i.isNumber(e)){var t=this.j.o,o=t.minHeight,r=t.maxHeight;i.isNumber(o)&&o>e&&(e=o),i.isNumber(r)&&e>r&&(e=r);}i.css(this.j.container,"height",e),this.j.o.saveHeightInStorage&&this.j.storage.set("height",e),this.resizeWorkspaceImd();},t.prototype.setWidth=function(e){if(i.isNumber(e)){var t=this.j.o,o=t.minWidth,r=t.maxWidth;i.isNumber(o)&&o>e&&(e=o),i.isNumber(r)&&e>r&&(e=r);}i.css(this.j.container,"width",e),this.resizeWorkspaceImd();},t.prototype.getNotWorkHeight=function(){var e,t;return ((null===(e=this.j.toolbarContainer)||void 0===e?void 0:e.offsetHeight)||0)+((null===(t=this.j.statusbar)||void 0===t?void 0:t.getHeight())||0)+2},t.prototype.resizeWorkspaceImd=function(){if(this.j&&!this.j.isDestructed&&this.j.o&&!this.j.o.inline&&this.j.container&&this.j.container.parentNode){var e=(i.css(this.j.container,"minHeight")||0)-this.getNotWorkHeight();if(i.isNumber(e)&&e>0&&([this.j.workplace,this.j.iframe,this.j.editor].map((function(t){t&&i.css(t,"minHeight",e);})),this.j.e.fire("setMinHeight",e)),i.isNumber(this.j.o.maxHeight)){var t=this.j.o.maxHeight-this.getNotWorkHeight();[this.j.workplace,this.j.iframe,this.j.editor].map((function(e){e&&i.css(e,"maxHeight",t);})),this.j.e.fire("setMaxHeight",t);}this.j.container&&i.css(this.j.workplace,"height","auto"!==this.j.o.height||this.j.isFullSize?this.j.container.offsetHeight-this.getNotWorkHeight():"auto");}},t.prototype.beforeDestruct=function(e){this.j.e.off(this.j.ow,"load.size",this.resizeWorkspaces).off(".size");},r.__decorate([a.autobind],t)}(n.Plugin);t.size=s;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);o(307),r.__exportStar(o(308),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(8),i=o(9),n=o(9);r.Config.prototype.beautifyHTML=!n.IS_IE,r.Config.prototype.sourceEditor="ace",r.Config.prototype.sourceEditorNativeOptions={showGutter:!0,theme:"ace/theme/idle_fingers",mode:"ace/mode/html",wrap:!0,highlightActiveLine:!0},r.Config.prototype.sourceEditorCDNUrlsJS=["https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/ace.js"],r.Config.prototype.beautifyHTMLCDNUrlsJS=["https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.13.0/beautify.min.js","https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.13.0/beautify-html.min.js"],r.Config.prototype.controls.source={mode:i.MODE_SPLIT,exec:function(e){e.toggleMode();},isActive:function(e){return e.getRealMode()===i.MODE_SOURCE},tooltip:"Change mode"};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.source=void 0;var r=o(7);o(309);var i=o(9),n=o(9),a=o(175),s=o(33),l=o(10),c=o(310),u=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.buttons=[{name:"source",group:"source"}],t.__lock=!1,t.__oldMirrorValue="",t.tempMarkerStart="{start-jodit-selection}",t.tempMarkerStartReg=/{start-jodit-selection}/g,t.tempMarkerEnd="{end-jodit-selection}",t.tempMarkerEndReg=/{end-jodit-selection}/g,t.selInfo=[],t.insertHTML=function(e){var o;null===(o=t.sourceEditor)||void 0===o||o.insertRaw(e),t.toWYSIWYG();},t.fromWYSIWYG=function(e){if(void 0===e&&(e=!1),!t.__lock||!0===e){t.__lock=!0;var o=t.j.getEditorValue(!1);o!==t.getMirrorValue()&&t.setMirrorValue(o),t.__lock=!1;}},t.toWYSIWYG=function(){if(!t.__lock){var e=t.getMirrorValue();e!==t.__oldMirrorValue&&(t.__lock=!0,t.j.setEditorValue(e),t.__lock=!1,t.__oldMirrorValue=e);}},t.getNormalPosition=function(e,t){for(var o=e;o>0;){if("<"===t[--o]&&void 0!==t[o+1]&&t[o+1].match(/[\w/]+/i))return o;if(">"===t[o])return e}return e},t.__clear=function(e){return e.replace(i.INVISIBLE_SPACE_REG_EXP(),"")},t.selectAll=function(){var e;null===(e=t.sourceEditor)||void 0===e||e.selectAll();},t.onSelectAll=function(e){if("selectall"===e.toLowerCase()&&t.j.getRealMode()===n.MODE_SOURCE)return t.selectAll(),!1},t.getSelectionStart=function(){var e,o;return null!==(o=null===(e=t.sourceEditor)||void 0===e?void 0:e.getSelectionStart())&&void 0!==o?o:0},t.getSelectionEnd=function(){var e,o;return null!==(o=null===(e=t.sourceEditor)||void 0===e?void 0:e.getSelectionEnd())&&void 0!==o?o:0},t.saveSelection=function(){if(t.j.getRealMode()===i.MODE_WYSIWYG)t.selInfo=t.j.s.save()||[],t.j.setEditorValue(),t.fromWYSIWYG(!0);else {if(t.selInfo.length=0,t.j.o.editHTMLDocumentMode)return;var e=t.getMirrorValue();if(t.getSelectionStart()===t.getSelectionEnd()){var o=t.j.s.marker(!0);t.selInfo[0]={startId:o.id,collapsed:!0,startMarker:o.outerHTML};var r=t.getNormalPosition(t.getSelectionStart(),t.getMirrorValue());t.setMirrorValue(e.substr(0,r)+t.__clear(t.selInfo[0].startMarker)+e.substr(r));}else {var n=t.j.s.marker(!0),a=t.j.s.marker(!1);t.selInfo[0]={startId:n.id,endId:a.id,collapsed:!1,startMarker:t.__clear(n.outerHTML),endMarker:t.__clear(a.outerHTML)},r=t.getNormalPosition(t.getSelectionStart(),e);var s=t.getNormalPosition(t.getSelectionEnd(),e);t.setMirrorValue(e.substr(0,r)+t.selInfo[0].startMarker+e.substr(r,s-r)+t.selInfo[0].endMarker+e.substr(s));}t.toWYSIWYG();}},t.removeSelection=function(){if(t.selInfo.length){if(t.j.getRealMode()===i.MODE_WYSIWYG)return t.__lock=!0,t.j.s.restore(t.selInfo),void(t.__lock=!1);var e=t.getMirrorValue(),o=0,r=0;try{if(t.selInfo[0].startMarker&&(e=e.replace(/<span[^>]+data-jodit-selection_marker="start"[^>]*>[<>]*?<\/span>/gim,t.tempMarkerStart)),t.selInfo[0].endMarker&&(e=e.replace(/<span[^>]+data-jodit-selection_marker="end"[^>]*>[<>]*?<\/span>/gim,t.tempMarkerEnd)),!t.j.o.editHTMLDocumentMode&&t.j.o.beautifyHTML){var n=t.j.e.fire("beautifyHTML",e);l.isString(n)&&(e=n);}r=o=e.indexOf(t.tempMarkerStart),e=e.replace(t.tempMarkerStartReg,""),t.selInfo[0].collapsed&&-1!==o||(r=e.indexOf(t.tempMarkerEnd),-1===o&&(o=r)),e=e.replace(t.tempMarkerEndReg,"");}finally{e=e.replace(t.tempMarkerEndReg,"").replace(t.tempMarkerStartReg,"");}t.setMirrorValue(e),t.setMirrorSelectionRange(o,r),t.toWYSIWYG(),t.setFocusToMirror();}},t.setMirrorSelectionRange=function(e,o){var r;null===(r=t.sourceEditor)||void 0===r||r.setSelectionRange(e,o);},t.onReadonlyReact=function(){var e;null===(e=t.sourceEditor)||void 0===e||e.setReadOnly(t.j.o.readonly);},t}return r.__extends(t,e),t.prototype.getMirrorValue=function(){var e;return (null===(e=this.sourceEditor)||void 0===e?void 0:e.getValue())||""},t.prototype.setMirrorValue=function(e){var t;null===(t=this.sourceEditor)||void 0===t||t.setValue(e);},t.prototype.setFocusToMirror=function(){var e;null===(e=this.sourceEditor)||void 0===e||e.focus();},t.prototype.initSourceEditor=function(e){var t,o=this;if("area"!==e.o.sourceEditor){var r=c.createSourceEditor(e.o.sourceEditor,e,this.mirrorContainer,this.toWYSIWYG,this.fromWYSIWYG);r.onReadyAlways((function(){var t,i;null===(t=o.sourceEditor)||void 0===t||t.destruct(),o.sourceEditor=r,o.fromWYSIWYG(!0),null===(i=e.events)||void 0===i||i.fire("sourceEditorReady",e);}));}else null===(t=this.sourceEditor)||void 0===t||t.onReadyAlways((function(){var t;o.fromWYSIWYG(!0),null===(t=e.events)||void 0===t||t.fire("sourceEditorReady",e);}));},t.prototype.afterInit=function(e){var t=this;if(this.mirrorContainer=e.c.div("jodit-source"),e.workplace.appendChild(this.mirrorContainer),e.e.on("afterAddPlace changePlace afterInit",(function(){e.workplace.appendChild(t.mirrorContainer);})),this.sourceEditor=c.createSourceEditor("area",e,this.mirrorContainer,this.toWYSIWYG,this.fromWYSIWYG),e.e.off("beforeSetMode.source afterSetMode.source").on("beforeSetMode.source",t.saveSelection).on("afterSetMode.source",t.removeSelection),this.onReadonlyReact(),e.e.on("insertHTML.source",(function(o){if(!e.o.readonly&&!t.j.isEditorMode())return t.insertHTML(o),!1})).on("readonly.source",this.onReadonlyReact).on("placeholder.source",(function(e){var o;null===(o=t.sourceEditor)||void 0===o||o.setPlaceHolder(e);})).on("beforeCommand.source",this.onSelectAll).on("change.source",this.fromWYSIWYG),e.e.on("beautifyHTML",(function(e){return e})),e.o.beautifyHTML){var o=function(){var t,o,r=e.ow.html_beautify;return !(!r||e.isInDestruct||(null===(o=null===(t=e.events)||void 0===t?void 0:t.off("beautifyHTML"))||void 0===o||o.on("beautifyHTML",(function(e){return r(e)})),0))};o()||l.loadNext(e,e.o.beautifyHTMLCDNUrlsJS).then(o);}this.fromWYSIWYG(),this.initSourceEditor(e);},t.prototype.beforeDestruct=function(e){this.sourceEditor&&(this.sourceEditor.destruct(),delete this.sourceEditor),s.Dom.safeRemove(this.mirrorContainer);},t}(a.Plugin);t.source=u;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.createSourceEditor=void 0;var r=o(311);t.createSourceEditor=function(e,t,o,i,n){var a;switch(e){case"ace":if(!t.o.shadowRoot){a=new r.AceEditor(t,o,i,n);break}default:a=new r.TextAreaEditor(t,o,i,n);}return a.init(t),a.onReadyAlways((function(){a.setReadOnly(t.o.readonly);})),a};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(312),t),r.__exportStar(o(314),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.TextAreaEditor=void 0;var r=o(7),i=o(10),n=o(115),a=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.autosize=t.j.async.debounce((function(){t.instance.style.height="auto",t.instance.style.height=t.instance.scrollHeight+"px";}),t.j.defaultTimeout),t}return r.__extends(t,e),t.prototype.init=function(e){var t=this;this.instance=e.c.element("textarea",{class:"jodit-source__mirror"}),this.container.appendChild(this.instance),e.e.on(this.instance,"mousedown keydown touchstart input",e.async.debounce(this.toWYSIWYG,e.defaultTimeout)).on("setMinHeight.source",(function(e){i.css(t.instance,"minHeight",e);})).on(this.instance,"change keydown mousedown touchstart input",this.autosize).on("afterSetMode.source",this.autosize).on(this.instance,"mousedown focus",(function(t){e.e.fire(t.type,t);})),this.autosize(),this.onReady();},t.prototype.destruct=function(){n.Dom.safeRemove(this.instance);},t.prototype.getValue=function(){return this.instance.value},t.prototype.setValue=function(e){this.instance.value=e;},t.prototype.insertRaw=function(e){var t=this.getValue();if(0>this.getSelectionStart())this.setValue(t+e);else {var o=this.getSelectionStart(),r=this.getSelectionEnd();this.setValue(t.substring(0,o)+e+t.substring(r,t.length));}},t.prototype.getSelectionStart=function(){return this.instance.selectionStart},t.prototype.getSelectionEnd=function(){return this.instance.selectionEnd},t.prototype.setSelectionRange=function(e,t){void 0===t&&(t=e),this.instance.setSelectionRange(e,t);},t.prototype.focus=function(){this.instance.focus();},t.prototype.setPlaceHolder=function(e){this.instance.setAttribute("placeholder",e);},t.prototype.setReadOnly=function(e){e?this.instance.setAttribute("readonly","true"):this.instance.removeAttribute("readonly");},t.prototype.selectAll=function(){this.instance.select();},t.prototype.replaceUndoManager=function(){var e=this,t=this.jodit.observer;this.j.e.on(this.instance,"keydown",(function(o){if((o.ctrlKey||o.metaKey)&&"z"===o.key)return o.shiftKey?t.redo():t.undo(),e.setSelectionRange(e.getValue().length),!1}));},t}(o(313).SourceEditor);t.TextAreaEditor=a;},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.SourceEditor=void 0;var o=function(){function e(e,t,o,r){this.jodit=e,this.container=t,this.toWYSIWYG=o,this.fromWYSIWYG=r,this.className="",this.isReady=!1;}return Object.defineProperty(e.prototype,"j",{get:function(){return this.jodit},enumerable:!1,configurable:!0}),e.prototype.onReady=function(){this.replaceUndoManager(),this.isReady=!0,this.j.e.fire(this,"ready");},e.prototype.onReadyAlways=function(e){var t;this.isReady?e():null===(t=this.j.events)||void 0===t||t.on(this,"ready",e);},e}();t.SourceEditor=o;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.AceEditor=void 0;var r=o(7),i=o(9),n=o(10),a=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.className="jodit_ace_editor",t.proxyOnFocus=function(e){t.j.e.fire("focus",e);},t.proxyOnMouseDown=function(e){t.j.e.fire("mousedown",e);},t}return r.__extends(t,e),t.prototype.aceExists=function(){return void 0!==this.j.ow.ace},t.prototype.getLastColumnIndex=function(e){return this.instance.session.getLine(e).length},t.prototype.getLastColumnIndices=function(){for(var e=this.instance.session.getLength(),t=[],o=0,r=0;e>r;r++)o+=this.getLastColumnIndex(r),r>0&&(o+=1),t[r]=o;return t},t.prototype.getRowColumnIndices=function(e){var t=this.getLastColumnIndices();if(t[0]>=e)return {row:0,column:e};for(var o=1,r=1;t.length>r;r++)e>t[r]&&(o=r+1);return {row:o,column:e-t[o-1]-1}},t.prototype.setSelectionRangeIndices=function(e,t){var o=this.getRowColumnIndices(e),r=this.getRowColumnIndices(t);this.instance.getSelection().setSelectionRange({start:o,end:r});},t.prototype.getIndexByRowColumn=function(e,t){return this.getLastColumnIndices()[e]-this.getLastColumnIndex(e)+t},t.prototype.init=function(e){var t=this,o=function(){if(void 0===t.instance&&t.aceExists()){var o=t.j.c.div("jodit-source__mirror-fake");t.container.appendChild(o),t.instance=e.ow.ace.edit(o),t.instance.setTheme(e.o.sourceEditorNativeOptions.theme),t.instance.renderer.setShowGutter(e.o.sourceEditorNativeOptions.showGutter),t.instance.getSession().setMode(e.o.sourceEditorNativeOptions.mode),t.instance.setHighlightActiveLine(e.o.sourceEditorNativeOptions.highlightActiveLine),t.instance.getSession().setUseWrapMode(!0),t.instance.setOption("indentedSoftWrap",!1),t.instance.setOption("wrap",e.o.sourceEditorNativeOptions.wrap),t.instance.getSession().setUseWorker(!1),t.instance.$blockScrolling=1/0,t.instance.on("change",t.toWYSIWYG),t.instance.on("focus",t.proxyOnFocus),t.instance.on("mousedown",t.proxyOnMouseDown),e.getRealMode()!==i.MODE_WYSIWYG&&t.setValue(t.getValue());var r=t.j.async.debounce((function(){e.isInDestruct||(t.instance.setOption("maxLines","auto"!==e.o.height?e.workplace.offsetHeight/t.instance.renderer.lineHeight:1/0),t.instance.resize());}),2*t.j.defaultTimeout);e.e.on("afterResize afterSetMode",r),r(),t.onReady();}};e.e.on("afterSetMode",(function(){e.getRealMode()!==i.MODE_SOURCE&&e.getMode()!==i.MODE_SPLIT||(t.fromWYSIWYG(),o());})),o(),this.aceExists()||n.loadNext(e,e.o.sourceEditorCDNUrlsJS).then((function(){e.isInDestruct||o();}));},t.prototype.destruct=function(){var e,t;this.instance.off("change",this.toWYSIWYG),this.instance.off("focus",this.proxyOnFocus),this.instance.off("mousedown",this.proxyOnMouseDown),this.instance.destroy(),null===(t=null===(e=this.j)||void 0===e?void 0:e.events)||void 0===t||t.off("aceInited.source");},t.prototype.setValue=function(e){if(!this.j.o.editHTMLDocumentMode&&this.j.o.beautifyHTML){var t=this.j.e.fire("beautifyHTML",e);n.isString(t)&&(e=t);}this.instance.setValue(e),this.instance.clearSelection();},t.prototype.getValue=function(){return this.instance.getValue()},t.prototype.setReadOnly=function(e){this.instance.setReadOnly(e);},t.prototype.focus=function(){this.instance.focus();},t.prototype.getSelectionStart=function(){var e=this.instance.selection.getRange();return this.getIndexByRowColumn(e.start.row,e.start.column)},t.prototype.getSelectionEnd=function(){var e=this.instance.selection.getRange();return this.getIndexByRowColumn(e.end.row,e.end.column)},t.prototype.selectAll=function(){this.instance.selection.selectAll();},t.prototype.insertRaw=function(e){var t=this.instance.selection.getCursor(),o=this.instance.session.insert(t,e);this.instance.selection.setRange({start:t,end:o},!1);},t.prototype.setSelectionRange=function(e,t){this.setSelectionRangeIndices(e,t);},t.prototype.setPlaceHolder=function(e){},t.prototype.replaceUndoManager=function(){var e=this.jodit.observer;this.instance.commands.addCommand({name:"Undo",bindKey:{win:"Ctrl-Z",mac:"Command-Z"},exec:function(){e.undo();}}),this.instance.commands.addCommand({name:"Redo",bindKey:{win:"Ctrl-Shift-Z",mac:"Command-Shift-Z"},exec:function(){e.redo();}});},t}(o(313).SourceEditor);t.AceEditor=a;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.stat=void 0;var r=o(7),i=o(8),n=o(9),a=o(175),s=o(33);i.Config.prototype.showCharsCounter=!0,i.Config.prototype.countHTMLChars=!1,i.Config.prototype.showWordsCounter=!0;var l=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.charCounter=null,t.wordCounter=null,t.reInit=function(){t.j.o.showCharsCounter&&t.charCounter&&t.j.statusbar.append(t.charCounter,!0),t.j.o.showWordsCounter&&t.wordCounter&&t.j.statusbar.append(t.wordCounter,!0),t.j.e.off("change keyup",t.calc).on("change keyup",t.calc),t.calc();},t.calc=t.j.async.throttle((function(){var e=t.j.text;if(t.j.o.showCharsCounter&&t.charCounter){var o=t.j.o.countHTMLChars?t.j.value:e.replace(n.SPACE_REG_EXP(),"");t.charCounter.textContent=t.j.i18n("Chars: %d",o.length);}t.j.o.showWordsCounter&&t.wordCounter&&(t.wordCounter.textContent=t.j.i18n("Words: %d",e.replace(n.INVISIBLE_SPACE_REG_EXP(),"").split(n.SPACE_REG_EXP()).filter((function(e){return e.length})).length));}),t.j.defaultTimeout),t}return r.__extends(t,e),t.prototype.afterInit=function(){this.charCounter=this.j.c.span(),this.wordCounter=this.j.c.span(),this.j.e.on("afterInit changePlace afterAddPlace",this.reInit),this.reInit();},t.prototype.beforeDestruct=function(){s.Dom.safeRemove(this.charCounter),s.Dom.safeRemove(this.wordCounter),this.j.e.off("afterInit changePlace afterAddPlace",this.reInit),this.charCounter=null,this.wordCounter=null;},t}(a.Plugin);t.stat=l;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.sticky=void 0;var r=o(7);o(317);var i=o(8),n=o(9),a=o(115),s=o(10),l=o(38);i.Config.prototype.toolbarSticky=!0,i.Config.prototype.toolbarDisableStickyForMobile=!0,i.Config.prototype.toolbarStickyOffset=0;var c=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.isToolbarSticked=!1,t.createDummy=function(e){n.IS_IE&&!t.dummyBox&&(t.dummyBox=t.j.c.div(),t.dummyBox.classList.add("jodit_sticky-dummy_toolbar"),t.j.container.insertBefore(t.dummyBox,e));},t.addSticky=function(e){t.isToolbarSticked||(t.createDummy(e),t.j.container.classList.add("jodit_sticky"),t.isToolbarSticked=!0),s.css(e,{top:t.j.o.toolbarStickyOffset||null,width:t.j.container.offsetWidth-2}),n.IS_IE&&t.dummyBox&&s.css(t.dummyBox,{height:e.offsetHeight});},t.removeSticky=function(e){t.isToolbarSticked&&(s.css(e,{width:"",top:""}),t.j.container.classList.remove("jodit_sticky"),t.isToolbarSticked=!1);},t}return r.__extends(t,e),t.prototype.afterInit=function(e){var t=this;e.e.on(e.ow,"scroll.sticky wheel.sticky mousewheel.sticky resize.sticky",this.onScroll).on("getStickyState.sticky",(function(){return t.isToolbarSticked}));},t.prototype.onScroll=function(){var e=this.jodit,t=e.ow.pageYOffset||e.od.documentElement&&e.od.documentElement.scrollTop||0,o=s.offset(e.container,e,e.od,!0),r=e.getMode()===n.MODE_WYSIWYG&&t+e.o.toolbarStickyOffset>o.top&&o.top+o.height>t+e.o.toolbarStickyOffset&&!(e.o.toolbarDisableStickyForMobile&&this.isMobile());if(e.o.toolbarSticky&&!0===e.o.toolbar&&this.isToolbarSticked!==r){var i=e.toolbarContainer;i&&(r?this.addSticky(i):this.removeSticky(i)),e.e.fire("toggleSticky",r);}},t.prototype.isMobile=function(){return this.j&&this.j.options&&this.j.container&&this.j.o.sizeSM>=this.j.container.offsetWidth},t.prototype.beforeDestruct=function(e){this.dummyBox&&a.Dom.safeRemove(this.dummyBox),e.e.off(e.ow,"scroll.sticky wheel.sticky mousewheel.sticky resize.sticky",this.onScroll).off(".sticky");},r.__decorate([l.throttle()],t.prototype,"onScroll",null),t}(a.Plugin);t.sticky=c;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.symbols=void 0;var r=o(7);o(319),o(320);var i=o(9),n=o(115),a=o(11),s=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.buttons=[{name:"symbol",group:"insert"}],t.countInRow=17,t}return r.__extends(t,e),t.prototype.afterInit=function(e){var t=this;e.e.on("generateSpecialCharactersTable.symbols",(function(){for(var o=e.c.fromHTML('<div class="jodit-symbols__container"><div class="jodit-symbols__container_table"><table><tbody></tbody></table></div><div class="jodit-symbols__container_preview"><div class="jodit-symbols__preview"></div></div></div>'),r=o.querySelector(".jodit-symbols__preview"),s=o.querySelector("table").tBodies[0],l=[],c=0;e.o.specialCharacters.length>c;){for(var u=e.c.element("tr"),d=0;t.countInRow>d&&e.o.specialCharacters.length>c;d+=1,c+=1){var p=e.c.element("td"),f=e.c.fromHTML('<a\n\t\t\t\t\t\t\t\t\tdata-index="'+c+'"\n\t\t\t\t\t\t\t\t\tdata-index-j="'+d+'"\n\t\t\t\t\t\t\t\t\thref="javascript:void(0)"\n\t\t\t\t\t\t\t\t\trole="option"\n\t\t\t\t\t\t\t\t\ttabindex="-1"\n\t\t\t\t\t\t\t>'+e.o.specialCharacters[c]+"</a>");l.push(f),p.appendChild(f),u.appendChild(p);}s.appendChild(u);}var h=t;return e.e.on(l,"focus",(function(){r.innerHTML=this.innerHTML;})).on(l,"mousedown",(function(t){n.Dom.isTag(this,"a")&&(e.s.focus(),e.s.insertHTML(this.innerHTML),e.e.fire(this,"close_dialog"),t&&t.preventDefault(),t&&t.stopImmediatePropagation());})).on(l,"mouseenter",(function(){n.Dom.isTag(this,"a")&&this.focus();})).on(l,"keydown",(function(t){var o=t.target;if(n.Dom.isTag(o,"a")){var r=parseInt(a.attr(o,"-index")||"0",10),s=parseInt(a.attr(o,"data-index-j")||"0",10),c=void 0;switch(t.key){case i.KEY_UP:case i.KEY_DOWN:void 0===l[c=t.key===i.KEY_UP?r-h.countInRow:r+h.countInRow]&&(c=t.key===i.KEY_UP?Math.floor(l.length/h.countInRow)*h.countInRow+s:s)>l.length-1&&(c-=h.countInRow),l[c]&&l[c].focus();break;case i.KEY_RIGHT:case i.KEY_LEFT:void 0===l[c=t.key===i.KEY_LEFT?r-1:r+1]&&(c=t.key===i.KEY_LEFT?l.length-1:0),l[c]&&l[c].focus();break;case i.KEY_ENTER:e.e.fire(o,"mousedown"),t.stopImmediatePropagation(),t.preventDefault();}}})),o}));},t.prototype.beforeDestruct=function(e){e.e.off("generateSpecialCharactersTable.symbols");},t}(n.Plugin);t.symbols=s;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(8),i=o(136);r.Config.prototype.usePopupForSpecialCharacters=!1,r.Config.prototype.specialCharacters=["!","&quot;","#","$","%","&amp;","'","(",")","*","+","-",".","/","0","1","2","3","4","5","6","7","8","9",":",";","&lt;","=","&gt;","?","@","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","[","]","^","_","`","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","{","|","}","~","&euro;","&lsquo;","&rsquo;","&ldquo;","&rdquo;","&ndash;","&mdash;","&iexcl;","&cent;","&pound;","&curren;","&yen;","&brvbar;","&sect;","&uml;","&copy;","&ordf;","&laquo;","&raquo;","&not;","&reg;","&macr;","&deg;","&sup2;","&sup3;","&acute;","&micro;","&para;","&middot;","&cedil;","&sup1;","&ordm;","&frac14;","&frac12;","&frac34;","&iquest;","&Agrave;","&Aacute;","&Acirc;","&Atilde;","&Auml;","&Aring;","&AElig;","&Ccedil;","&Egrave;","&Eacute;","&Ecirc;","&Euml;","&Igrave;","&Iacute;","&Icirc;","&Iuml;","&ETH;","&Ntilde;","&Ograve;","&Oacute;","&Ocirc;","&Otilde;","&Ouml;","&times;","&Oslash;","&Ugrave;","&Uacute;","&Ucirc;","&Uuml;","&Yacute;","&THORN;","&szlig;","&agrave;","&aacute;","&acirc;","&atilde;","&auml;","&aring;","&aelig;","&ccedil;","&egrave;","&eacute;","&ecirc;","&euml;","&igrave;","&iacute;","&icirc;","&iuml;","&eth;","&ntilde;","&ograve;","&oacute;","&ocirc;","&otilde;","&ouml;","&divide;","&oslash;","&ugrave;","&uacute;","&ucirc;","&uuml;","&yacute;","&thorn;","&yuml;","&OElig;","&oelig;","&#372;","&#374","&#373","&#375;","&sbquo;","&#8219;","&bdquo;","&hellip;","&trade;","&#9658;","&bull;","&rarr;","&rArr;","&hArr;","&diams;","&asymp;"],r.Config.prototype.controls.symbol={icon:"omega",hotkeys:["ctrl+shift+i","cmd+shift+i"],tooltip:"Insert Special Character",popup:function(e,t,o,r){var n=e.e.fire("generateSpecialCharactersTable.symbols");if(n){if(e.o.usePopupForSpecialCharacters){var a=e.c.div();return a.classList.add("jodit-symbols"),a.appendChild(n),e.e.on(n,"close_dialog",r),a}i.Alert(n,e.i18n("Select Special Character"),void 0,"jodit-symbols").bindDestruct(e);var s=n.querySelector("a");s&&s.focus();}}};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);o(322),r.__exportStar(o(323),t),r.__exportStar(o(325),t),r.__exportStar(o(326),t),r.__exportStar(o(327),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(8),i=o(33),n=o(11),a=o(10);r.Config.prototype.table={allowCellSelection:!0,selectionCellStyle:"border: 1px double #1e88e5 !important;",allowCellResize:!0,useExtraClassesOptions:!1},r.Config.prototype.controls.table={data:{cols:10,rows:10,classList:{"table table-bordered":"Bootstrap Bordered","table table-striped":"Bootstrap Striped","table table-dark":"Bootstrap Dark"}},popup:function(e,t,o,r,s){for(var l=o.data&&o.data.rows?o.data.rows:10,c=o.data&&o.data.cols?o.data.cols:10,u=e.c.fromHTML('<form class="jodit-form jodit-form__inserter"><div class="jodit-form__table-creator-box"><div class="jodit-form__container"></div><div class="jodit-form__options">'+function(){if(!e.o.table.useExtraClassesOptions)return "";var t=[];if(o.data){var r=o.data.classList;Object.keys(r).forEach((function(e){t.push('<label class="jodit_vertical_middle"><input class="jodit-checkbox" value="'+e+'" type="checkbox"/>'+r[e]+"</label>");}));}return t.join("")}()+'</div></div><label class="jodit-form__center"><span>1</span> &times; <span>1</span></label></form>'),d=u.querySelectorAll("span")[0],p=u.querySelectorAll("span")[1],f=u.querySelector(".jodit-form__container"),h=u.querySelector(".jodit-form__options"),m=[],v=l*c,g=0;v>g;g+=1)m[g]||m.push(e.c.element("span",{dataIndex:g}));if(e.e.on(f,"mousemove",(function(e,t){var o=e.target;if(i.Dom.isTag(o,"span")){for(var r=void 0===t||isNaN(t)?parseInt(n.attr(o,"-index")||"0",10):t||0,a=Math.ceil((r+1)/c),s=r%c+1,l=0;m.length>l;l+=1)m[l].className=l%c+1>s||a<Math.ceil((l+1)/c)?"":"jodit_hovered";p.textContent=s.toString(),d.textContent=a.toString();}})).on(f,"touchstart mousedown",(function(t){var o=t.target;if(t.preventDefault(),t.stopImmediatePropagation(),i.Dom.isTag(o,"span")){var s=parseInt(n.attr(o,"-index")||"0",10),l=Math.ceil((s+1)/c),u=s%c+1,d=e.createInside,p=d.element("tbody"),f=d.element("table");f.appendChild(p),f.style.width="100%";for(var m,v,g=null,y=1;l>=y;y+=1){m=d.element("tr");for(var b=1;u>=b;b+=1)v=d.element("td"),g||(g=v),v.appendChild(d.element("br")),m.appendChild(d.text("\n")),m.appendChild(d.text("\t")),m.appendChild(v);p.appendChild(d.text("\n")),p.appendChild(m);}var _=e.s.current();if(_&&e.s.isCollapsed()){var w=i.Dom.closest(_,(function(t){return i.Dom.isBlock(t,e.ew)}),e.editor);w&&w!==e.editor&&!w.nodeName.match(/^TD|TH|TBODY|TABLE|THEADER|TFOOTER$/)&&e.s.setCursorAfter(w);}a.$$("input[type=checkbox]:checked",h).forEach((function(e){e.value.split(/[\s]+/).forEach((function(e){f.classList.add(e);}));})),e.s.insertNode(d.text("\n")),e.s.insertNode(f,!1),g&&(e.s.setCursorIn(g),a.scrollIntoView(g,e.editor,e.ed)),r();}})),s&&s.parentElement){for(g=0;l>g;g+=1){for(var y=e.c.div(),b=0;c>b;b+=1)y.appendChild(m[g*c+b]);f.appendChild(y);}m[0]&&(m[0].className="hovered");}return u},tooltip:"Insert table"};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.resizeCells=void 0;var r=o(7);o(324);var i=o(9),n=o(115),a=o(10),s=o(38),l="table_processor_observer-resize",c=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.selectMode=!1,t.resizeDelta=0,t.createResizeHandle=function(){t.resizeHandler||(t.resizeHandler=t.j.c.div("jodit-table-resizer"),t.j.e.on(t.resizeHandler,"mousedown.table touchstart.table",t.onHandleMouseDown).on(t.resizeHandler,"mouseenter.table",(function(){t.j.async.clearTimeout(t.hideTimeout);})));},t.hideTimeout=0,t.drag=!1,t.minX=0,t.maxX=0,t.startX=0,t}return r.__extends(t,e),Object.defineProperty(t.prototype,"module",{get:function(){return this.j.getInstance("Table",this.j.o)},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"isRTL",{get:function(){return "rtl"===this.j.o.direction},enumerable:!1,configurable:!0}),t.prototype.showResizeHandle=function(){this.j.async.clearTimeout(this.hideTimeout),this.j.workplace.appendChild(this.resizeHandler);},t.prototype.hideResizeHandle=function(){var e=this;this.hideTimeout=this.j.async.setTimeout((function(){n.Dom.safeRemove(e.resizeHandler);}),{timeout:this.j.defaultTimeout,label:"hideResizer"});},t.prototype.onHandleMouseDown=function(e){var t=this;if(!this.j.isLocked){this.drag=!0,this.j.e.on(this.j.ow,"mouseup.resize-cells touchend.resize-cells",this.onMouseUp).on(this.j.ew,"mousemove.table touchmove.table",this.onMouseMove),this.startX=e.clientX,this.j.lock(l),this.resizeHandler.classList.add("jodit-table-resizer_moved");var o,r=this.workTable.getBoundingClientRect();if(this.minX=0,this.maxX=1e6,null!=this.wholeTable)r=this.workTable.parentNode.getBoundingClientRect(),this.minX=r.left,this.maxX=this.minX+r.width;else {var a=n.Table.formalCoordinate(this.workTable,this.workCell,!0);n.Table.formalMatrix(this.workTable,(function(e,r,n){a[1]===n&&(o=e.getBoundingClientRect(),t.minX=Math.max(o.left+i.NEARBY/2,t.minX)),a[1]+(t.isRTL?-1:1)===n&&(o=e.getBoundingClientRect(),t.maxX=Math.min(o.left+o.width-i.NEARBY/2,t.maxX));}));}return !1}},t.prototype.onMouseMove=function(e){if(this.drag){this.j.e.fire("closeAllPopups");var t=e.clientX,o=a.offset(this.resizeHandler.parentNode||this.j.od.documentElement,this.j,this.j.od,!0);this.minX>t&&(t=this.minX),t>this.maxX&&(t=this.maxX),this.resizeDelta=t-this.startX+(this.j.o.iframe?o.left:0),this.resizeHandler.style.left=t-(this.j.o.iframe?0:o.left)+"px";var r=this.j.s.sel;r&&r.removeAllRanges(),e.preventDefault&&e.preventDefault();}},t.prototype.onMouseUp=function(e){(this.selectMode||this.drag)&&(this.selectMode=!1,this.j.unlock()),this.resizeHandler&&this.drag&&(this.drag=!1,this.j.e.off(this.j.ew,"mousemove.table touchmove.table",this.onMouseMove),this.resizeHandler.classList.remove("jodit-table-resizer_moved"),this.startX!==e.clientX&&(null==this.wholeTable?this.resizeColumns():this.resizeTable()),this.j.setEditorValue(),this.j.s.focus());},t.prototype.resizeColumns=function(){var e=this,t=this.resizeDelta,o=[];n.Table.setColumnWidthByDelta(this.workTable,n.Table.formalCoordinate(this.workTable,this.workCell,!0)[1],t,!0,o);var r=a.call(this.isRTL?n.Dom.prev:n.Dom.next,this.workCell,(function(t){return n.Dom.isCell(t,e.j.ew)}),this.workCell.parentNode);n.Table.setColumnWidthByDelta(this.workTable,n.Table.formalCoordinate(this.workTable,r)[1],-t,!1,o);},t.prototype.resizeTable=function(){var e=this.resizeDelta*(this.isRTL?-1:1),t=this.workTable.offsetWidth,o=a.getContentWidth(this.workTable.parentNode,this.j.ew),r=!this.wholeTable;if(this.isRTL?!r:r)this.workTable.style.width=(t+e)/o*100+"%";else {var i=this.isRTL?"marginRight":"marginLeft",n=parseInt(this.j.ew.getComputedStyle(this.workTable)[i]||"0",10);this.workTable.style.width=(t-e)/o*100+"%",this.workTable.style[i]=(n+e)/o*100+"%";}},t.prototype.setWorkCell=function(e,t){void 0===t&&(t=null),this.wholeTable=t,this.workCell=e,this.workTable=n.Dom.up(e,(function(e){return n.Dom.isTag(e,"table")}),this.j.editor);},t.prototype.calcHandlePosition=function(e,t,o,r){var s=this;void 0===o&&(o=0),void 0===r&&(r=0);var l=a.offset(t,this.j,this.j.ed);if(o>i.NEARBY&&l.width-i.NEARBY>o)this.hideResizeHandle();else {var c=a.offset(this.j.workplace,this.j,this.j.od,!0),u=a.offset(e,this.j,this.j.ed);if(this.resizeHandler.style.left=(o>i.NEARBY?l.left+l.width:l.left)-c.left+r+"px",Object.assign(this.resizeHandler.style,{height:u.height+"px",top:u.top-c.top+"px"}),this.showResizeHandle(),o>i.NEARBY){var d=a.call(this.isRTL?n.Dom.prev:n.Dom.next,t,(function(e){return n.Dom.isCell(e,s.j.ew)}),t.parentNode);this.setWorkCell(t,!!d&&null);}else {var p=a.call(this.isRTL?n.Dom.next:n.Dom.prev,t,(function(e){return n.Dom.isCell(e,s.j.ew)}),t.parentNode);this.setWorkCell(p||t,!p||null);}}},t.prototype.afterInit=function(e){var t=this;e.o.table.allowCellResize&&e.e.off(this.j.ow,".resize-cells").off(".resize-cells").on("change.resize-cells afterCommand.resize-cells afterSetMode.resize-cells",(function(){a.$$("table",e.editor).forEach(t.observe);})).on(this.j.ow,"scroll.resize-cells",(function(){if(t.drag){var o=n.Dom.up(t.workCell,(function(e){return n.Dom.isTag(e,"table")}),e.editor);if(o){var r=o.getBoundingClientRect();t.resizeHandler.style.top=r.top+"px";}}})).on("beforeSetMode.resize-cells",(function(){t.module.getAllSelectedCells().forEach((function(o){t.module.removeSelection(o),n.Table.normalizeTable(n.Dom.closest(o,"table",e.editor));}));}));},t.prototype.observe=function(e){var t=this;a.dataBind(e,l)||(a.dataBind(e,l,!0),this.j.e.on(e,"mouseleave.resize-cells",(function(e){t.resizeHandler&&t.resizeHandler!==e.relatedTarget&&t.hideResizeHandle();})).on(e,"mousemove.resize-cells touchmove.resize-cells",(function(o){if(!t.j.isLocked){var r=n.Dom.up(o.target,(function(e){return n.Dom.isCell(e,t.j.ew)}),e);r&&t.calcHandlePosition(e,r,o.offsetX);}})),this.createResizeHandle());},t.prototype.beforeDestruct=function(e){e.events&&(e.e.off(this.j.ow,".resize-cells"),e.e.off(".resize-cells"));},r.__decorate([s.autobind],t.prototype,"onHandleMouseDown",null),r.__decorate([s.autobind],t.prototype,"onMouseMove",null),r.__decorate([s.autobind],t.prototype,"onMouseUp",null),r.__decorate([s.autobind],t.prototype,"observe",null),t}(n.Plugin);t.resizeCells=c;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.selectCells=void 0;var r=o(7),i=o(175),n=o(115),a=o(10),s=o(283),l=o(9),c=o(38),u="table_processor_observer",d=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.selectedCell=null,t}return r.__extends(t,e),Object.defineProperty(t.prototype,"module",{get:function(){return this.j.getInstance("Table",this.j.o)},enumerable:!1,configurable:!0}),t.prototype.afterInit=function(e){var t=this;e.o.table.allowCellSelection&&e.e.on(this.j.ow,"click.select-cells",this.onRemoveSelection).on("keydown.select-cells",(function(e){e.key===l.KEY_TAB&&t.unselectCells();})).on("beforeCommand.select-cells",this.onExecCommand).on("afterCommand.select-cells",this.onAfterCommand).on("change afterCommand afterSetMode click afterInit".split(" ").map((function(e){return e+".select-cells"})).join(" "),(function(){a.$$("table",e.editor).forEach(t.observe);}));},t.prototype.observe=function(e){a.dataBind(e,u)||(this.onRemoveSelection(),a.dataBind(e,u,!0),this.j.e.on(e,"mousedown.select-cells touchstart.select-cells",this.onStartSelection.bind(this,e)));},t.prototype.onStartSelection=function(e,t){var o=this;if(!this.j.o.readonly){this.unselectCells();var r=n.Dom.closest(t.target,["td","th"],e);r&&(r.firstChild||r.appendChild(this.j.createInside.element("br")),this.selectedCell=r,this.module.addSelection(r),this.j.e.on(e,"mousemove.select-cells touchmove.select-cells",this.onMove.bind(this,e)).on(e,"mouseup.select-cells touchend.select-cells",this.onStopSelection.bind(this,e)),this.j.e.fire("showPopup",e,(function(){return a.position(r,o.j)}),"cells"));}},t.prototype.onMove=function(e,t){var o=this;if(!this.j.o.readonly&&!this.j.isLockedNotBy(u)){var r=this.j.ed.elementFromPoint(t.clientX,t.clientY);if(r){var i=n.Dom.closest(r,["td","th"],e);if(i&&this.selectedCell){i!==this.selectedCell&&this.j.lock(u),this.unselectCells(e);for(var a,s=n.Table.getSelectedBound(e,[i,this.selectedCell]),l=n.Table.formalMatrix(e),c=s[0][0];s[1][0]>=c;c+=1)for(var d=s[0][1];s[1][1]>=d;d+=1)this.module.addSelection(l[c][d]);this.j.e.fire("hidePopup"),t.stopPropagation(),a=o.j.createInside.fromHTML('<div style="color:rgba(0,0,0,0.01);width:0;height:0">&nbsp;</div>'),i.appendChild(a),o.j.async.setTimeout((function(){var e;null===(e=a.parentNode)||void 0===e||e.removeChild(a);}),o.j.defaultTimeout/5);}}}},t.prototype.onRemoveSelection=function(e){var t;if(!(null===(t=null==e?void 0:e.buffer)||void 0===t?void 0:t.actionTrigger)&&!this.selectedCell&&this.module.getAllSelectedCells().length)return this.j.unlock(),this.unselectCells(),void this.j.e.fire("hidePopup","cells");this.selectedCell=null;},t.prototype.onStopSelection=function(e,t){var o=this;if(this.selectedCell){this.j.unlock();var r=this.j.ed.elementFromPoint(t.clientX,t.clientY);if(r){var i=n.Dom.closest(r,["td","th"],e);if(i){var s=n.Dom.closest(i,"table",e);if(!s||s===e){var l=n.Table.getSelectedBound(e,[i,this.selectedCell]),c=n.Table.formalMatrix(e),u=c[l[1][0]][l[1][1]],d=c[l[0][0]][l[0][1]];this.j.e.fire("showPopup",e,(function(){var e=a.position(d,o.j),t=a.position(u,o.j);return {left:e.left,top:e.top,width:t.left-e.left+t.width,height:t.top-e.top+t.height}}),"cells"),a.$$("table",this.j.editor).forEach((function(e){o.j.e.off(e,"mousemove.select-cells touchmove.select-cells mouseup.select-cells touchend.select-cells");}));}}}}},t.prototype.unselectCells=function(e,t){var o=this.module,r=o.getAllSelectedCells();r.length&&r.forEach((function(e){t&&t===e||o.removeSelection(e);}));},t.prototype.onExecCommand=function(e){if(/table(splitv|splitg|merge|empty|bin|binrow|bincolumn|addcolumn|addrow)/.test(e)){e=e.replace("table","");var t=this.module.getAllSelectedCells();if(t.length){var o=t.shift();if(!o)return;var r=n.Dom.closest(o,"table",this.j.editor);if(!r)return;switch(e){case"splitv":n.Table.splitVertical(r,this.j);break;case"splitg":n.Table.splitHorizontal(r,this.j);break;case"merge":n.Table.mergeSelected(r,this.j);break;case"empty":t.forEach((function(e){return e.innerHTML=""}));break;case"bin":n.Dom.safeRemove(r);break;case"binrow":n.Table.removeRow(r,o.parentNode.rowIndex);break;case"bincolumn":n.Table.removeColumn(r,o.cellIndex);break;case"addcolumnafter":case"addcolumnbefore":n.Table.appendColumn(r,o.cellIndex,"addcolumnafter"===e,this.j.createInside);break;case"addrowafter":case"addrowbefore":n.Table.appendRow(r,o.parentNode,"addrowafter"===e,this.j.createInside);}}return !1}},t.prototype.onAfterCommand=function(e){var t=this;/^justify/.test(e)&&this.module.getAllSelectedCells().forEach((function(o){return s.alignElement(e,o,t.j)}));},t.prototype.beforeDestruct=function(e){this.onRemoveSelection(),e.e.off(".select-cells");},r.__decorate([c.autobind],t.prototype,"observe",null),r.__decorate([c.autobind],t.prototype,"onRemoveSelection",null),r.__decorate([c.autobind],t.prototype,"onStopSelection",null),r.__decorate([c.autobind],t.prototype,"onExecCommand",null),r.__decorate([c.autobind],t.prototype,"onAfterCommand",null),t}(i.Plugin);t.selectCells=d;},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.tableKeyboardNavigation=void 0;var r=o(9),i=o(33),n=o(115);t.tableKeyboardNavigation=function(e){e.e.off(".tableKeyboardNavigation").on("keydown.tableKeyboardNavigation",(function(t){var o,a;if((t.key===r.KEY_TAB||t.key===r.KEY_LEFT||t.key===r.KEY_RIGHT||t.key===r.KEY_UP||t.key===r.KEY_DOWN)&&(o=e.s.current(),a=i.Dom.up(o,(function(e){return e&&e.nodeName&&/^td|th$/i.test(e.nodeName)}),e.editor))){var s=e.s.range;if(t.key===r.KEY_TAB||o===a||(t.key!==r.KEY_LEFT&&t.key!==r.KEY_UP||!(i.Dom.prev(o,(function(e){return t.key===r.KEY_UP?i.Dom.isTag(e,"br"):Boolean(e)}),a)||t.key!==r.KEY_UP&&i.Dom.isText(o)&&0!==s.startOffset))&&(t.key!==r.KEY_RIGHT&&t.key!==r.KEY_DOWN||!(i.Dom.next(o,(function(e){return t.key===r.KEY_DOWN?i.Dom.isTag(e,"br"):Boolean(e)}),a)||t.key!==r.KEY_DOWN&&i.Dom.isText(o)&&o.nodeValue&&s.startOffset!==o.nodeValue.length))){var l=i.Dom.up(a,(function(e){return e&&/^table$/i.test(e.nodeName)}),e.editor),c=null;switch(t.key){case r.KEY_TAB:case r.KEY_LEFT:var u=t.key===r.KEY_LEFT||t.shiftKey?"prev":"next";(c=i.Dom[u](a,(function(e){return e&&/^td|th$/i.test(e.tagName)}),l))||(n.Table.appendRow(l,"next"!==u&&l.querySelector("tr"),"next"===u,e.createInside),c=i.Dom[u](a,(function(t){return t&&i.Dom.isCell(t,e.ew)}),l));break;case r.KEY_UP:case r.KEY_DOWN:var d=0,p=0,f=n.Table.formalMatrix(l,(function(e,t,o){e===a&&(d=t,p=o);}));t.key===r.KEY_UP?void 0!==f[d-1]&&(c=f[d-1][p]):void 0!==f[d+1]&&(c=f[d+1][p]);}if(c){if(c.firstChild)t.key===r.KEY_TAB?e.s.select(c,!0):e.s.setCursorIn(c,t.key===r.KEY_RIGHT||t.key===r.KEY_DOWN);else {var h=e.createInside.element("br");c.appendChild(h),e.s.setCursorBefore(h);}return !1}}}}));};},(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.table=void 0,t.table=function(e){e.registerButton({name:"table",group:"insert"});};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.tooltip=void 0;var r=o(7);o(329);var i=o(10),n=o(175),a=o(33),s=o(31),l=o(38),c=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.isOpened=!1,t.delayShowTimeout=0,t}return r.__extends(t,e),t.prototype.afterInit=function(e){var o=this;this.container=e.c.div("jodit-tooltip"),s.getContainer(this.j,t).appendChild(this.container);var r=0;e.e.off(".tooltip").on("showTooltip.tooltip",(function(t,i){e.async.clearTimeout(r),o.open(t,i);})).on("delayShowTooltip.tooltip",this.delayOpen).on("escape.tooltip",this.close).on("hideTooltip.tooltip change.tooltip scroll.tooltip changePlace.tooltip hidePopup.tooltip closeAllPopups.tooltip",(function(){o.j.async.clearTimeout(o.delayShowTimeout),r=e.async.setTimeout(o.close,o.j.defaultTimeout);}));},t.prototype.delayOpen=function(e,t){var o=this,r=this.j.o.showTooltipDelay||this.j.defaultTimeout;this.j.async.clearTimeout(this.delayShowTimeout),this.delayShowTimeout=this.j.async.setTimeout((function(){return o.open(e,t)}),{timeout:r,label:"tooltip"});},t.prototype.open=function(e,t){this.container.classList.add("jodit-tooltip_visible"),this.container.innerHTML=t,this.isOpened=!0,this.setPosition(e);},t.prototype.setPosition=function(e){var t=e();i.css(this.container,{left:t.x,top:t.y});},t.prototype.close=function(){this.j.async.clearTimeout(this.delayShowTimeout),this.isOpened&&(this.isOpened=!1,this.container.classList.remove("jodit-tooltip_visible"),i.css(this.container,{left:-5e3}));},t.prototype.beforeDestruct=function(e){null==e||e.e.off(".tooltip"),this.close(),a.Dom.safeRemove(this.container);},r.__decorate([l.autobind],t.prototype,"delayOpen",null),r.__decorate([l.autobind],t.prototype,"close",null),t}(n.Plugin);t.tooltip=c;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0});var r=o(7);r.__exportStar(o(331),t),r.__exportStar(o(332),t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.preview=void 0;var r=o(8),i=o(10),n=o(9);r.Config.prototype.controls.preview={icon:"eye",exec:function(e){var t=e.getInstance("Dialog",{language:e.o.language,theme:e.o.theme}),o=e.c.div();if(i.css(o,{padding:16}),e.iframe){var r=e.create.element("iframe");i.css(r,{minWidth:800,minHeight:600,border:0}),o.appendChild(r),t.open(o,e.i18n("Preview"));var n=r.contentWindow;n&&(e.e.fire("generateDocumentStructure.iframe",n.document,e),n.document.body.innerHTML=e.value);}else i.css(o,{minWidth:1024,minHeight:600,border:0}),o.innerHTML=e.value,t.open(o,e.i18n("Preview"));t.setModal(!0);},mode:n.MODE_SOURCE+n.MODE_WYSIWYG,tooltip:"Preview"},t.preview=function(e){e.registerButton({name:"preview"});};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.print=void 0;var r=o(8),i=o(31),n=o(33),a=o(10),s=o(9);r.Config.prototype.controls.print={exec:function(e){var t=e.create.element("iframe");Object.assign(t.style,{position:"fixed",right:0,bottom:0,width:0,height:0,border:0}),i.getContainer(e,r.Config).appendChild(t);var o=function(){e.e.off(e.ow,"mousemove",o),n.Dom.safeRemove(t);},s=t.contentWindow;s&&(e.e.on(s,"onbeforeunload onafterprint",o).on(e.ow,"mousemove",o),e.o.iframe?(e.e.fire("generateDocumentStructure.iframe",s.document,e),s.document.body.innerHTML=e.value):(s.document.write('<!doctype html><html lang="'+a.defaultLanguage(e.o.language)+'"><head><title></title></head><body>'+e.value+"</body></html>"),s.document.close()),s.focus(),s.print());},mode:s.MODE_SOURCE+s.MODE_WYSIWYG,tooltip:"Print"},t.print=function(e){e.registerButton({name:"print"});};},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.xpath=void 0;var r=o(7);o(334);var i=o(8),n=o(9),a=o(118),s=o(33),l=o(10),c=o(175),u=o(146);i.Config.prototype.showXPathInStatusbar=!0;var d=function(e){function t(){var t=null!==e&&e.apply(this,arguments)||this;return t.onContext=function(e,o){return t.menu||(t.menu=new a.ContextMenu(t.j)),t.menu.show(o.clientX,o.clientY,[{icon:"bin",title:e===t.j.editor?"Clear":"Remove",exec:function(){e!==t.j.editor?s.Dom.safeRemove(e):t.j.value="",t.j.setEditorValue();}},{icon:"select-all",title:"Select",exec:function(){t.j.s.select(e);}}]),!1},t.onSelectPath=function(e,o){t.j.s.focus();var r=l.attr(o.target,"-path")||"/";if("/"===r)return t.j.execCommand("selectall"),!1;try{var i=t.j.ed.evaluate(r,t.j.editor,null,XPathResult.ANY_TYPE,null).iterateNext();if(i)return t.j.s.select(i),!1}catch(e){}return t.j.s.select(e),!1},t.tpl=function(e,o,r,i){var n=t.j.c.fromHTML('<span class="jodit-xpath__item"><a role="button" data-path="'+o+'" href="javascript:void(0)" title="'+i+'" tabindex="-1"\'>'+l.trim(r)+"</a></span>"),a=n.firstChild;return t.j.e.on(a,"click",t.onSelectPath.bind(t,e)).on(a,"contextmenu",t.onContext.bind(t,e)),n},t.removeSelectAll=function(){t.selectAllButton&&(t.selectAllButton.destruct(),delete t.selectAllButton);},t.appendSelectAll=function(){t.removeSelectAll(),t.selectAllButton=u.makeButton(t.j,r.__assign({name:"selectall"},t.j.o.controls.selectall)),t.selectAllButton.state.size="tiny",t.container&&t.container.insertBefore(t.selectAllButton.container,t.container.firstChild);},t.calcPathImd=function(){if(!t.isDestructed){var e,o,r,i=t.j.s.current();t.container&&(t.container.innerHTML=n.INVISIBLE_SPACE),i&&s.Dom.up(i,(function(i){i&&t.j.editor!==i&&!s.Dom.isText(i)&&(e=i.nodeName.toLowerCase(),o=l.getXPathByElement(i,t.j.editor).replace(/^\//,""),r=t.tpl(i,o,e,t.j.i18n("Select %s",e)),t.container&&t.container.insertBefore(r,t.container.firstChild));}),t.j.editor),t.appendSelectAll();}},t.calcPath=t.j.async.debounce(t.calcPathImd,2*t.j.defaultTimeout),t}return r.__extends(t,e),t.prototype.afterInit=function(){var e=this;this.j.o.showXPathInStatusbar&&(this.container=this.j.c.div("jodit-xpath"),this.j.e.off(".xpath").on("mouseup.xpath change.xpath keydown.xpath changeSelection.xpath",this.calcPath).on("afterSetMode.xpath afterInit.xpath changePlace.xpath",(function(){e.j.o.showXPathInStatusbar&&e.container&&(e.j.statusbar.append(e.container),e.j.getRealMode()===n.MODE_WYSIWYG?e.calcPath():(e.container&&(e.container.innerHTML=n.INVISIBLE_SPACE),e.appendSelectAll()));})),this.calcPath());},t.prototype.beforeDestruct=function(){this.j&&this.j.events&&this.j.e.off(".xpath"),this.removeSelectAll(),this.menu&&this.menu.destruct(),s.Dom.safeRemove(this.container),delete this.menu,delete this.container;},t}(c.Plugin);t.xpath=d;},(e,t,o)=>{o.r(t);},(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.paragraph=t.palette=t.outdent=t.omega=t.ol=t.ok=t.merge=t.menu=t.lock=t.link=t.left=t.justify=t.italic=t.info_circle=t.indent=t.image=t.hr=t.fullsize=t.fontsize=t.font=t.folder=t.file=t.eye=t.eraser=t.enter=t.chevron=t.dots=t.dedent=t.cut=t.crop=t.copy=t.copyformat=t.check_square=t.check=t.chain_broken=t.center=t.cancel=t.brush=t.bold=t.bin=t.attachment=t.arrows_h=t.arrows_alt=t.angle_up=t.angle_right=t.angle_left=t.angle_down=t.addrow=t.addcolumn=t.about=void 0,t.video=t.valign=t.upload=t.update=t.unlock=t.unlink=t.undo=t.underline=t.ul=t.th_list=t.th=t.table=t.superscript=t.subscript=t.strikethrough=t.splitv=t.splitg=t.source=t.shrink=t.select_all=t.search=t.save=t.right=t.resizer=t.resize=t.redo=t.print=t.plus=t.pencil=t.paste=void 0;var r=o(336);t.about=r;var i=o(337);t.addcolumn=i;var n=o(338);t.addrow=n;var a=o(339);t.angle_down=a;var s=o(340);t.angle_left=s;var l=o(341);t.angle_right=l;var c=o(342);t.angle_up=c;var u=o(343);t.arrows_alt=u;var d=o(344);t.arrows_h=d;var p=o(345);t.attachment=p;var f=o(346);t.bin=f;var h=o(347);t.bold=h;var m=o(348);t.brush=m;var v=o(349);t.cancel=v;var g=o(350);t.center=g;var y=o(351);t.chain_broken=y;var b=o(352);t.check=b;var _=o(353);t.check_square=_;var w=o(354);t.chevron=w;var S=o(355);t.copyformat=S;var C=o(356);t.crop=C;var j=o(357);t.copy=j;var k=o(358);t.cut=k;var E=o(359);t.dedent=E;var I=o(360);t.dots=I;var x=o(361);t.enter=x;var T=o(362);t.eraser=T;var P=o(363);t.eye=P;var D=o(364);t.file=D;var z=o(365);t.folder=z;var A=o(366);t.font=A;var M=o(367);t.fontsize=M;var L=o(368);t.fullsize=L;var O=o(369);t.hr=O;var B=o(370);t.image=B;var R=o(371);t.indent=R;var N=o(372);t.info_circle=N;var q=o(373);t.italic=q;var H=o(374);t.justify=H;var F=o(375);t.left=F;var U=o(376);t.link=U;var W=o(377);t.lock=W;var V=o(378);t.menu=V;var Y=o(379);t.merge=Y;var K=o(380);t.ok=K;var G=o(381);t.ol=G;var J=o(382);t.omega=J;var X=o(383);t.outdent=X;var $=o(384);t.palette=$;var Z=o(385);t.paragraph=Z;var Q=o(386);t.paste=Q;var ee=o(387);t.pencil=ee;var te=o(388);t.plus=te;var oe=o(389);t.print=oe;var re=o(390);t.redo=re;var ie=o(391);t.resize=ie;var ne=o(392);t.resizer=ne;var ae=o(393);t.right=ae;var se=o(394);t.save=se;var le=o(395);t.search=le;var ce=o(396);t.select_all=ce;var ue=o(397);t.shrink=ue;var de=o(398);t.source=de;var pe=o(399);t.splitg=pe;var fe=o(400);t.splitv=fe;var he=o(401);t.strikethrough=he;var me=o(402);t.subscript=me;var ve=o(403);t.superscript=ve;var ge=o(404);t.table=ge;var ye=o(405);t.th=ye;var be=o(406);t.th_list=be;var _e=o(407);t.ul=_e;var we=o(408);t.underline=we;var Se=o(409);t.undo=Se;var Ce=o(410);t.unlink=Ce;var je=o(411);t.unlock=je;var ke=o(412);t.update=ke;var Ee=o(413);t.upload=Ee;var Ie=o(414);t.valign=Ie;var xe=o(415);t.video=xe;},e=>{e.exports='<svg viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"> <path d="M1088 1256v240q0 16-12 28t-28 12h-240q-16 0-28-12t-12-28v-240q0-16 12-28t28-12h240q16 0 28 12t12 28zm316-600q0 54-15.5 101t-35 76.5-55 59.5-57.5 43.5-61 35.5q-41 23-68.5 65t-27.5 67q0 17-12 32.5t-28 15.5h-240q-15 0-25.5-18.5t-10.5-37.5v-45q0-83 65-156.5t143-108.5q59-27 84-56t25-76q0-42-46.5-74t-107.5-32q-65 0-108 29-35 25-107 115-13 16-31 16-12 0-25-8l-164-125q-13-10-15.5-25t5.5-28q160-266 464-266 80 0 161 31t146 83 106 127.5 41 158.5z"/> </svg>';},e=>{e.exports='<svg viewBox="0 0 18.151 18.151" xmlns="http://www.w3.org/2000/svg"> <g> <g> <path stroke-width="0" d="M6.237,16.546H3.649V1.604h5.916v5.728c0.474-0.122,0.968-0.194,1.479-0.194 c0.042,0,0.083,0.006,0.125,0.006V0H2.044v18.15h5.934C7.295,17.736,6.704,17.19,6.237,16.546z"/> <path stroke-width="0" d="M11.169,8.275c-2.723,0-4.938,2.215-4.938,4.938s2.215,4.938,4.938,4.938s4.938-2.215,4.938-4.938 S13.892,8.275,11.169,8.275z M11.169,16.81c-1.983,0-3.598-1.612-3.598-3.598c0-1.983,1.614-3.597,3.598-3.597 s3.597,1.613,3.597,3.597C14.766,15.198,13.153,16.81,11.169,16.81z"/> <polygon stroke-width="0" points="11.792,11.073 10.502,11.073 10.502,12.578 9.03,12.578 9.03,13.868 10.502,13.868 10.502,15.352 11.792,15.352 11.792,13.868 13.309,13.868 13.309,12.578 11.792,12.578 "/> </g> </g> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 432 432"> <g> <g> <polygon points="203.688,96 0,96 0,144 155.688,144 "/> <polygon points="155.719,288 0,288 0,336 203.719,336 "/> <rect x="252" y="96"/> <rect/> <rect x="252" y="288"/> <rect y="384"/> <path d="M97.844,230.125c-3.701-3.703-5.856-8.906-5.856-14.141s2.154-10.438,5.856-14.141l9.844-9.844H0v48h107.719 L97.844,230.125z"/> <polygon points="232,176 232,96 112,216 232,336 232,256 432,256 432,176 "/> </g> </g> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M1395 736q0 13-10 23l-466 466q-10 10-23 10t-23-10l-466-466q-10-10-10-23t10-23l50-50q10-10 23-10t23 10l393 393 393-393q10-10 23-10t23 10l50 50q10 10 10 23z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M1203 544q0 13-10 23l-393 393 393 393q10 10 10 23t-10 23l-50 50q-10 10-23 10t-23-10l-466-466q-10-10-10-23t10-23l466-466q10-10 23-10t23 10l50 50q10 10 10 23z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M1171 960q0 13-10 23l-466 466q-10 10-23 10t-23-10l-50-50q-10-10-10-23t10-23l393-393-393-393q-10-10-10-23t10-23l50-50q10-10 23-10t23 10l466 466q10 10 10 23z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M1395 1184q0 13-10 23l-50 50q-10 10-23 10t-23-10l-393-393-393 393q-10 10-23 10t-23-10l-50-50q-10-10-10-23t10-23l466-466q10-10 23-10t23 10l466 466q10 10 10 23z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M1411 541l-355 355 355 355 144-144q29-31 70-14 39 17 39 59v448q0 26-19 45t-45 19h-448q-42 0-59-40-17-39 14-69l144-144-355-355-355 355 144 144q31 30 14 69-17 40-59 40h-448q-26 0-45-19t-19-45v-448q0-42 40-59 39-17 69 14l144 144 355-355-355-355-144 144q-19 19-45 19-12 0-24-5-40-17-40-59v-448q0-26 19-45t45-19h448q42 0 59 40 17 39-14 69l-144 144 355 355 355-355-144-144q-31-30-14-69 17-40 59-40h448q26 0 45 19t19 45v448q0 42-39 59-13 5-25 5-26 0-45-19z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M1792 896q0 26-19 45l-256 256q-19 19-45 19t-45-19-19-45v-128h-1024v128q0 26-19 45t-45 19-45-19l-256-256q-19-19-19-45t19-45l256-256q19-19 45-19t45 19 19 45v128h1024v-128q0-26 19-45t45-19 45 19l256 256q19 19 19 45z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M1596 1385q0 117-79 196t-196 79q-135 0-235-100l-777-776q-113-115-113-271 0-159 110-270t269-111q158 0 273 113l605 606q10 10 10 22 0 16-30.5 46.5t-46.5 30.5q-13 0-23-10l-606-607q-79-77-181-77-106 0-179 75t-73 181q0 105 76 181l776 777q63 63 145 63 64 0 106-42t42-106q0-82-63-145l-581-581q-26-24-60-24-29 0-48 19t-19 48q0 32 25 59l410 410q10 10 10 22 0 16-31 47t-47 31q-12 0-22-10l-410-410q-63-61-63-149 0-82 57-139t139-57q88 0 149 63l581 581q100 98 100 235z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M704 1376v-704q0-14-9-23t-23-9h-64q-14 0-23 9t-9 23v704q0 14 9 23t23 9h64q14 0 23-9t9-23zm256 0v-704q0-14-9-23t-23-9h-64q-14 0-23 9t-9 23v704q0 14 9 23t23 9h64q14 0 23-9t9-23zm256 0v-704q0-14-9-23t-23-9h-64q-14 0-23 9t-9 23v704q0 14 9 23t23 9h64q14 0 23-9t9-23zm-544-992h448l-48-117q-7-9-17-11h-317q-10 2-17 11zm928 32v64q0 14-9 23t-23 9h-96v948q0 83-47 143.5t-113 60.5h-832q-66 0-113-58.5t-47-141.5v-952h-96q-14 0-23-9t-9-23v-64q0-14 9-23t23-9h309l70-167q15-37 54-63t79-26h320q40 0 79 26t54 63l70 167h309q14 0 23 9t9 23z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M747 1521q74 32 140 32 376 0 376-335 0-114-41-180-27-44-61.5-74t-67.5-46.5-80.5-25-84-10.5-94.5-2q-73 0-101 10 0 53-.5 159t-.5 158q0 8-1 67.5t-.5 96.5 4.5 83.5 12 66.5zm-14-746q42 7 109 7 82 0 143-13t110-44.5 74.5-89.5 25.5-142q0-70-29-122.5t-79-82-108-43.5-124-14q-50 0-130 13 0 50 4 151t4 152q0 27-.5 80t-.5 79q0 46 1 69zm-541 889l2-94q15-4 85-16t106-27q7-12 12.5-27t8.5-33.5 5.5-32.5 3-37.5.5-34v-65.5q0-982-22-1025-4-8-22-14.5t-44.5-11-49.5-7-48.5-4.5-30.5-3l-4-83q98-2 340-11.5t373-9.5q23 0 68.5.5t67.5.5q70 0 136.5 13t128.5 42 108 71 74 104.5 28 137.5q0 52-16.5 95.5t-39 72-64.5 57.5-73 45-84 40q154 35 256.5 134t102.5 248q0 100-35 179.5t-93.5 130.5-138 85.5-163.5 48.5-176 14q-44 0-132-3t-132-3q-106 0-307 11t-231 12z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M896 1152q0-36-20-69-1-1-15.5-22.5t-25.5-38-25-44-21-50.5q-4-16-21-16t-21 16q-7 23-21 50.5t-25 44-25.5 38-15.5 22.5q-20 33-20 69 0 53 37.5 90.5t90.5 37.5 90.5-37.5 37.5-90.5zm512-128q0 212-150 362t-362 150-362-150-150-362q0-145 81-275 6-9 62.5-90.5t101-151 99.5-178 83-201.5q9-30 34-47t51-17 51.5 17 33.5 47q28 93 83 201.5t99.5 178 101 151 62.5 90.5q81 127 81 275z"/></svg>';},e=>{e.exports='<svg viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"> <g stroke="none" stroke-width="1"> <path d="M14,1.4 L12.6,0 L7,5.6 L1.4,0 L0,1.4 L5.6,7 L0,12.6 L1.4,14 L7,8.4 L12.6,14 L14,12.6 L8.4,7 L14,1.4 Z"/> </g> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M1792 1344v128q0 26-19 45t-45 19h-1664q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1664q26 0 45 19t19 45zm-384-384v128q0 26-19 45t-45 19h-896q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h896q26 0 45 19t19 45zm256-384v128q0 26-19 45t-45 19h-1408q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1408q26 0 45 19t19 45zm-384-384v128q0 26-19 45t-45 19h-640q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h640q26 0 45 19t19 45z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M503 1271l-256 256q-10 9-23 9-12 0-23-9-9-10-9-23t9-23l256-256q10-9 23-9t23 9q9 10 9 23t-9 23zm169 41v320q0 14-9 23t-23 9-23-9-9-23v-320q0-14 9-23t23-9 23 9 9 23zm-224-224q0 14-9 23t-23 9h-320q-14 0-23-9t-9-23 9-23 23-9h320q14 0 23 9t9 23zm1264 128q0 120-85 203l-147 146q-83 83-203 83-121 0-204-85l-334-335q-21-21-42-56l239-18 273 274q27 27 68 27.5t68-26.5l147-146q28-28 28-67 0-40-28-68l-274-275 18-239q35 21 56 42l336 336q84 86 84 204zm-617-724l-239 18-273-274q-28-28-68-28-39 0-68 27l-147 146q-28 28-28 67 0 40 28 68l274 274-18 240q-35-21-56-42l-336-336q-84-86-84-204 0-120 85-203l147-146q83-83 203-83 121 0 204 85l334 335q21 21 42 56zm633 84q0 14-9 23t-23 9h-320q-14 0-23-9t-9-23 9-23 23-9h320q14 0 23 9t9 23zm-544-544v320q0 14-9 23t-23 9-23-9-9-23v-320q0-14 9-23t23-9 23 9 9 23zm407 151l-256 256q-11 9-23 9t-23-9q-9-10-9-23t9-23l256-256q10-9 23-9t23 9q9 10 9 23t-9 23z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M1472 930v318q0 119-84.5 203.5t-203.5 84.5h-832q-119 0-203.5-84.5t-84.5-203.5v-832q0-119 84.5-203.5t203.5-84.5h832q63 0 117 25 15 7 18 23 3 17-9 29l-49 49q-10 10-23 10-3 0-9-2-23-6-45-6h-832q-66 0-113 47t-47 113v832q0 66 47 113t113 47h832q66 0 113-47t47-113v-254q0-13 9-22l64-64q10-10 23-10 6 0 12 3 20 8 20 29zm231-489l-814 814q-24 24-57 24t-57-24l-430-430q-24-24-24-57t24-57l110-110q24-24 57-24t57 24l263 263 647-647q24-24 57-24t57 24l110 110q24 24 24 57t-24 57z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M813 1299l614-614q19-19 19-45t-19-45l-102-102q-19-19-45-19t-45 19l-467 467-211-211q-19-19-45-19t-45 19l-102 102q-19 19-19 45t19 45l358 358q19 19 45 19t45-19zm851-883v960q0 119-84.5 203.5t-203.5 84.5h-960q-119 0-203.5-84.5t-84.5-203.5v-960q0-119 84.5-203.5t203.5-84.5h960q119 0 203.5 84.5t84.5 203.5z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 10 10"> <path d="M.941 4.523a.75.75 0 1 1 1.06-1.06l3.006 3.005 3.005-3.005a.75.75 0 1 1 1.06 1.06l-3.549 3.55a.75.75 0 0 1-1.168-.136L.941 4.523z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 16 16"> <path stroke-width="0" d="M16 9v-6h-3v-1c0-0.55-0.45-1-1-1h-11c-0.55 0-1 0.45-1 1v3c0 0.55 0.45 1 1 1h11c0.55 0 1-0.45 1-1v-1h2v4h-9v2h-0.5c-0.276 0-0.5 0.224-0.5 0.5v5c0 0.276 0.224 0.5 0.5 0.5h2c0.276 0 0.5-0.224 0.5-0.5v-5c0-0.276-0.224-0.5-0.5-0.5h-0.5v-1h9zM12 3h-11v-1h11v1z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M621 1280h595v-595zm-45-45l595-595h-595v595zm1152 77v192q0 14-9 23t-23 9h-224v224q0 14-9 23t-23 9h-192q-14 0-23-9t-9-23v-224h-864q-14 0-23-9t-9-23v-864h-224q-14 0-23-9t-9-23v-192q0-14 9-23t23-9h224v-224q0-14 9-23t23-9h192q14 0 23 9t9 23v224h851l246-247q10-9 23-9t23 9q9 10 9 23t-9 23l-247 246v851h224q14 0 23 9t9 23z"/> </svg>';},e=>{e.exports='<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"> <path d="M24.89,6.61H22.31V4.47A2.47,2.47,0,0,0,19.84,2H6.78A2.47,2.47,0,0,0,4.31,4.47V22.92a2.47,2.47,0,0,0,2.47,2.47H9.69V27.2a2.8,2.8,0,0,0,2.8,2.8h12.4a2.8,2.8,0,0,0,2.8-2.8V9.41A2.8,2.8,0,0,0,24.89,6.61ZM6.78,23.52a.61.61,0,0,1-.61-.6V4.47a.61.61,0,0,1,.61-.6H19.84a.61.61,0,0,1,.61.6V6.61h-8a2.8,2.8,0,0,0-2.8,2.8V23.52Zm19,3.68a.94.94,0,0,1-.94.93H12.49a.94.94,0,0,1-.94-.93V9.41a.94.94,0,0,1,.94-.93h12.4a.94.94,0,0,1,.94.93Z"/> <path d="M23.49,13.53h-9.6a.94.94,0,1,0,0,1.87h9.6a.94.94,0,1,0,0-1.87Z"/> <path d="M23.49,17.37h-9.6a.94.94,0,1,0,0,1.87h9.6a.94.94,0,1,0,0-1.87Z"/> <path d="M23.49,21.22h-9.6a.93.93,0,1,0,0,1.86h9.6a.93.93,0,1,0,0-1.86Z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M960 896q26 0 45 19t19 45-19 45-45 19-45-19-19-45 19-45 45-19zm300 64l507 398q28 20 25 56-5 35-35 51l-128 64q-13 7-29 7-17 0-31-8l-690-387-110 66q-8 4-12 5 14 49 10 97-7 77-56 147.5t-132 123.5q-132 84-277 84-136 0-222-78-90-84-79-207 7-76 56-147t131-124q132-84 278-84 83 0 151 31 9-13 22-22l122-73-122-73q-13-9-22-22-68 31-151 31-146 0-278-84-82-53-131-124t-56-147q-5-59 15.5-113t63.5-93q85-79 222-79 145 0 277 84 83 52 132 123t56 148q4 48-10 97 4 1 12 5l110 66 690-387q14-8 31-8 16 0 29 7l128 64q30 16 35 51 3 36-25 56zm-681-260q46-42 21-108t-106-117q-92-59-192-59-74 0-113 36-46 42-21 108t106 117q92 59 192 59 74 0 113-36zm-85 745q81-51 106-117t-21-108q-39-36-113-36-100 0-192 59-81 51-106 117t21 108q39 36 113 36 100 0 192-59zm178-613l96 58v-11q0-36 33-56l14-8-79-47-26 26q-3 3-10 11t-12 12q-2 2-4 3.5t-3 2.5zm224 224l96 32 736-576-128-64-768 431v113l-160 96 9 8q2 2 7 6 4 4 11 12t11 12l26 26zm704 416l128-64-520-408-177 138q-2 3-13 7z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M384 544v576q0 13-9.5 22.5t-22.5 9.5q-14 0-23-9l-288-288q-9-9-9-23t9-23l288-288q9-9 23-9 13 0 22.5 9.5t9.5 22.5zm1408 768v192q0 13-9.5 22.5t-22.5 9.5h-1728q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1728q13 0 22.5 9.5t9.5 22.5zm0-384v192q0 13-9.5 22.5t-22.5 9.5h-1088q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1088q13 0 22.5 9.5t9.5 22.5zm0-384v192q0 13-9.5 22.5t-22.5 9.5h-1088q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1088q13 0 22.5 9.5t9.5 22.5zm0-384v192q0 13-9.5 22.5t-22.5 9.5h-1728q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1728q13 0 22.5 9.5t9.5 22.5z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 24 24" > <circle cx="12" cy="12" r="2.2"/> <circle cx="12" cy="5" r="2.2"/> <circle cx="12" cy="19" r="2.2"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 128 128" xml:space="preserve"> <g> <polygon points="112.4560547,23.3203125 112.4560547,75.8154297 31.4853516,75.8154297 31.4853516,61.953125 16.0131836,72.6357422 0.5410156,83.3164063 16.0131836,93.9990234 31.4853516,104.6796875 31.4853516,90.8183594 112.4560547,90.8183594 112.4560547,90.8339844 127.4589844,90.8339844 127.4589844,23.3203125 "/> </g> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M832 1408l336-384h-768l-336 384h768zm1013-1077q15 34 9.5 71.5t-30.5 65.5l-896 1024q-38 44-96 44h-768q-38 0-69.5-20.5t-47.5-54.5q-15-34-9.5-71.5t30.5-65.5l896-1024q38-44 96-44h768q38 0 69.5 20.5t47.5 54.5z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M1664 960q-152-236-381-353 61 104 61 225 0 185-131.5 316.5t-316.5 131.5-316.5-131.5-131.5-316.5q0-121 61-225-229 117-381 353 133 205 333.5 326.5t434.5 121.5 434.5-121.5 333.5-326.5zm-720-384q0-20-14-34t-34-14q-125 0-214.5 89.5t-89.5 214.5q0 20 14 34t34 14 34-14 14-34q0-86 61-147t147-61q20 0 34-14t14-34zm848 384q0 34-20 69-140 230-376.5 368.5t-499.5 138.5-499.5-139-376.5-368q-20-35-20-69t20-69q140-229 376.5-368t499.5-139 499.5 139 376.5 368q20 35 20 69z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M1152 512v-472q22 14 36 28l408 408q14 14 28 36h-472zm-128 32q0 40 28 68t68 28h544v1056q0 40-28 68t-68 28h-1344q-40 0-68-28t-28-68v-1600q0-40 28-68t68-28h800v544z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M1728 608v704q0 92-66 158t-158 66h-1216q-92 0-158-66t-66-158v-960q0-92 66-158t158-66h320q92 0 158 66t66 158v32h672q92 0 158 66t66 158z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M789 559l-170 450q33 0 136.5 2t160.5 2q19 0 57-2-87-253-184-452zm-725 1105l2-79q23-7 56-12.5t57-10.5 49.5-14.5 44.5-29 31-50.5l237-616 280-724h128q8 14 11 21l205 480q33 78 106 257.5t114 274.5q15 34 58 144.5t72 168.5q20 45 35 57 19 15 88 29.5t84 20.5q6 38 6 57 0 4-.5 13t-.5 13q-63 0-190-8t-191-8q-76 0-215 7t-178 8q0-43 4-78l131-28q1 0 12.5-2.5t15.5-3.5 14.5-4.5 15-6.5 11-8 9-11 2.5-14q0-16-31-96.5t-72-177.5-42-100l-450-2q-26 58-76.5 195.5t-50.5 162.5q0 22 14 37.5t43.5 24.5 48.5 13.5 57 8.5 41 4q1 19 1 58 0 9-2 27-58 0-174.5-10t-174.5-10q-8 0-26.5 4t-21.5 4q-80 14-188 14z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M1744 1408q33 0 42 18.5t-11 44.5l-126 162q-20 26-49 26t-49-26l-126-162q-20-26-11-44.5t42-18.5h80v-1024h-80q-33 0-42-18.5t11-44.5l126-162q20-26 49-26t49 26l126 162q20 26 11 44.5t-42 18.5h-80v1024h80zm-1663-1279l54 27q12 5 211 5 44 0 132-2t132-2q36 0 107.5.5t107.5.5h293q6 0 21 .5t20.5 0 16-3 17.5-9 15-17.5l42-1q4 0 14 .5t14 .5q2 112 2 336 0 80-5 109-39 14-68 18-25-44-54-128-3-9-11-48t-14.5-73.5-7.5-35.5q-6-8-12-12.5t-15.5-6-13-2.5-18-.5-16.5.5q-17 0-66.5-.5t-74.5-.5-64 2-71 6q-9 81-8 136 0 94 2 388t2 455q0 16-2.5 71.5t0 91.5 12.5 69q40 21 124 42.5t120 37.5q5 40 5 50 0 14-3 29l-34 1q-76 2-218-8t-207-10q-50 0-151 9t-152 9q-3-51-3-52v-9q17-27 61.5-43t98.5-29 78-27q19-42 19-383 0-101-3-303t-3-303v-117q0-2 .5-15.5t.5-25-1-25.5-3-24-5-14q-11-12-162-12-33 0-93 12t-80 26q-19 13-34 72.5t-31.5 111-42.5 53.5q-42-26-56-44v-383z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 24 24" > <path stroke-width="0" d="M22,20.6L3.4,2H8V0H0v8h2V3.4L20.6,22H16v2h8v-8h-2V20.6z M16,0v2h4.7l-6.3,6.3l1.4,1.4L22,3.5V8h2V0H16z M8.3,14.3L2,20.6V16H0v8h8v-2H3.5l6.3-6.3L8.3,14.3z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M1600 736v192q0 40-28 68t-68 28h-1216q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h1216q40 0 68 28t28 68z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M576 576q0 80-56 136t-136 56-136-56-56-136 56-136 136-56 136 56 56 136zm1024 384v448h-1408v-192l320-320 160 160 512-512zm96-704h-1600q-13 0-22.5 9.5t-9.5 22.5v1216q0 13 9.5 22.5t22.5 9.5h1600q13 0 22.5-9.5t9.5-22.5v-1216q0-13-9.5-22.5t-22.5-9.5zm160 32v1216q0 66-47 113t-113 47h-1600q-66 0-113-47t-47-113v-1216q0-66 47-113t113-47h1600q66 0 113 47t47 113z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M352 832q0 14-9 23l-288 288q-9 9-23 9-13 0-22.5-9.5t-9.5-22.5v-576q0-13 9.5-22.5t22.5-9.5q14 0 23 9l288 288q9 9 9 23zm1440 480v192q0 13-9.5 22.5t-22.5 9.5h-1728q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1728q13 0 22.5 9.5t9.5 22.5zm0-384v192q0 13-9.5 22.5t-22.5 9.5h-1088q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1088q13 0 22.5 9.5t9.5 22.5zm0-384v192q0 13-9.5 22.5t-22.5 9.5h-1088q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1088q13 0 22.5 9.5t9.5 22.5zm0-384v192q0 13-9.5 22.5t-22.5 9.5h-1728q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1728q13 0 22.5 9.5t9.5 22.5z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M1152 1376v-160q0-14-9-23t-23-9h-96v-512q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v160q0 14 9 23t23 9h96v320h-96q-14 0-23 9t-9 23v160q0 14 9 23t23 9h448q14 0 23-9t9-23zm-128-896v-160q0-14-9-23t-23-9h-192q-14 0-23 9t-9 23v160q0 14 9 23t23 9h192q14 0 23-9t9-23zm640 416q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M384 1662l17-85q6-2 81.5-21.5t111.5-37.5q28-35 41-101 1-7 62-289t114-543.5 52-296.5v-25q-24-13-54.5-18.5t-69.5-8-58-5.5l19-103q33 2 120 6.5t149.5 7 120.5 2.5q48 0 98.5-2.5t121-7 98.5-6.5q-5 39-19 89-30 10-101.5 28.5t-108.5 33.5q-8 19-14 42.5t-9 40-7.5 45.5-6.5 42q-27 148-87.5 419.5t-77.5 355.5q-2 9-13 58t-20 90-16 83.5-6 57.5l1 18q17 4 185 31-3 44-16 99-11 0-32.5 1.5t-32.5 1.5q-29 0-87-10t-86-10q-138-2-206-2-51 0-143 9t-121 11z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M1792 1344v128q0 26-19 45t-45 19h-1664q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1664q26 0 45 19t19 45zm0-384v128q0 26-19 45t-45 19h-1664q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1664q26 0 45 19t19 45zm0-384v128q0 26-19 45t-45 19h-1664q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1664q26 0 45 19t19 45zm0-384v128q0 26-19 45t-45 19h-1664q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1664q26 0 45 19t19 45z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M1792 1344v128q0 26-19 45t-45 19h-1664q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1664q26 0 45 19t19 45zm-384-384v128q0 26-19 45t-45 19h-1280q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1280q26 0 45 19t19 45zm256-384v128q0 26-19 45t-45 19h-1536q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1536q26 0 45 19t19 45zm-384-384v128q0 26-19 45t-45 19h-1152q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1152q26 0 45 19t19 45z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M1520 1216q0-40-28-68l-208-208q-28-28-68-28-42 0-72 32 3 3 19 18.5t21.5 21.5 15 19 13 25.5 3.5 27.5q0 40-28 68t-68 28q-15 0-27.5-3.5t-25.5-13-19-15-21.5-21.5-18.5-19q-33 31-33 73 0 40 28 68l206 207q27 27 68 27 40 0 68-26l147-146q28-28 28-67zm-703-705q0-40-28-68l-206-207q-28-28-68-28-39 0-68 27l-147 146q-28 28-28 67 0 40 28 68l208 208q27 27 68 27 42 0 72-31-3-3-19-18.5t-21.5-21.5-15-19-13-25.5-3.5-27.5q0-40 28-68t68-28q15 0 27.5 3.5t25.5 13 19 15 21.5 21.5 18.5 19q33-31 33-73zm895 705q0 120-85 203l-147 146q-83 83-203 83-121 0-204-85l-206-207q-83-83-83-203 0-123 88-209l-88-88q-86 88-208 88-120 0-204-84l-208-208q-84-84-84-204t85-203l147-146q83-83 203-83 121 0 204 85l206 207q83 83 83 203 0 123-88 209l88 88q86-88 208-88 120 0 204 84l208 208q84 84 84 204z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M640 768h512v-192q0-106-75-181t-181-75-181 75-75 181v192zm832 96v576q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-576q0-40 28-68t68-28h32v-192q0-184 132-316t316-132 316 132 132 316v192h32q40 0 68 28t28 68z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M1664 1344v128q0 26-19 45t-45 19h-1408q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1408q26 0 45 19t19 45zm0-512v128q0 26-19 45t-45 19h-1408q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1408q26 0 45 19t19 45zm0-512v128q0 26-19 45t-45 19h-1408q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1408q26 0 45 19t19 45z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 312 312"> <g transform="translate(0.000000,312.000000) scale(0.100000,-0.100000)" stroke="none"> <path d="M50 3109 c0 -7 -11 -22 -25 -35 l-25 -23 0 -961 0 -961 32 -29 32 -30 501 -2 500 -3 3 -502 2 -502 31 -30 31 -31 958 0 958 0 23 25 c13 13 30 25 37 25 9 0 12 199 12 960 0 686 -3 960 -11 960 -6 0 -24 12 -40 28 l-29 27 -503 5 -502 5 -5 502 -5 503 -28 29 c-15 16 -27 34 -27 40 0 8 -274 11 -960 11 -710 0 -960 -3 -960 -11z m1738 -698 l2 -453 -40 -40 c-22 -22 -40 -43 -40 -47 0 -4 36 -42 79 -85 88 -87 82 -87 141 -23 l26 27 455 -2 454 -3 0 -775 0 -775 -775 0 -775 0 -3 450 -2 449 47 48 47 48 -82 80 c-44 44 -84 80 -87 80 -3 0 -25 -18 -48 -40 l-41 -40 -456 2 -455 3 -3 765 c-1 421 0 771 3 778 3 10 164 12 777 10 l773 -3 3 -454z"/> <path d="M607 2492 c-42 -42 -77 -82 -77 -87 0 -6 86 -96 190 -200 105 -104 190 -197 190 -205 0 -8 -41 -56 -92 -107 -65 -65 -87 -94 -77 -98 8 -3 138 -4 289 -3 l275 3 3 275 c1 151 0 281 -3 289 -4 10 -35 -14 -103 -82 -54 -53 -103 -97 -109 -97 -7 0 -99 88 -206 195 -107 107 -196 195 -198 195 -3 0 -39 -35 -82 -78z"/> <path d="M1470 1639 c-47 -49 -87 -91 -89 -94 -5 -6 149 -165 160 -165 9 0 189 179 189 188 0 12 -154 162 -165 161 -6 0 -48 -41 -95 -90z"/> <path d="M1797 1303 c-9 -8 -9 -568 0 -576 4 -4 50 36 103 88 54 52 101 95 106 95 5 0 95 -85 199 -190 104 -104 194 -190 200 -190 6 0 46 36 90 80 l79 79 -197 196 c-108 108 -197 199 -197 203 0 4 45 52 99 106 55 55 98 103 95 108 -6 10 -568 11 -577 1z"/> </g> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 32 32"> <path d="M27 4l-15 15-7-7-5 5 12 12 20-20z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path stroke-width="0" d="M381 1620q0 80-54.5 126t-135.5 46q-106 0-172-66l57-88q49 45 106 45 29 0 50.5-14.5t21.5-42.5q0-64-105-56l-26-56q8-10 32.5-43.5t42.5-54 37-38.5v-1q-16 0-48.5 1t-48.5 1v53h-106v-152h333v88l-95 115q51 12 81 49t30 88zm2-627v159h-362q-6-36-6-54 0-51 23.5-93t56.5-68 66-47.5 56.5-43.5 23.5-45q0-25-14.5-38.5t-39.5-13.5q-46 0-81 58l-85-59q24-51 71.5-79.5t105.5-28.5q73 0 123 41.5t50 112.5q0 50-34 91.5t-75 64.5-75.5 50.5-35.5 52.5h127v-60h105zm1409 319v192q0 13-9.5 22.5t-22.5 9.5h-1216q-13 0-22.5-9.5t-9.5-22.5v-192q0-14 9-23t23-9h1216q13 0 22.5 9.5t9.5 22.5zm-1408-899v99h-335v-99h107q0-41 .5-122t.5-121v-12h-2q-8 17-50 54l-71-76 136-127h106v404h108zm1408 387v192q0 13-9.5 22.5t-22.5 9.5h-1216q-13 0-22.5-9.5t-9.5-22.5v-192q0-14 9-23t23-9h1216q13 0 22.5 9.5t9.5 22.5zm0-512v192q0 13-9.5 22.5t-22.5 9.5h-1216q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1216q13 0 22.5 9.5t9.5 22.5z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 270 270"> <path d="m240.443652,220.45085l-47.410809,0l0,-10.342138c13.89973,-8.43655 25.752896,-19.844464 34.686646,-33.469923c11.445525,-17.455846 17.496072,-37.709239 17.496072,-58.570077c0,-59.589197 -49.208516,-108.068714 -109.693558,-108.068714s-109.69263,48.479517 -109.69263,108.069628c0,20.860839 6.050547,41.113316 17.497001,58.570077c8.93375,13.625459 20.787845,25.032458 34.686646,33.469008l0,10.342138l-47.412666,0c-10.256959,0 -18.571354,8.191376 -18.571354,18.296574c0,10.105198 8.314395,18.296574 18.571354,18.296574l65.98402,0c10.256959,0 18.571354,-8.191376 18.571354,-18.296574l0,-39.496814c0,-7.073455 -4.137698,-13.51202 -10.626529,-16.537358c-25.24497,-11.772016 -41.557118,-37.145704 -41.557118,-64.643625c0,-39.411735 32.545369,-71.476481 72.549922,-71.476481c40.004553,0 72.550851,32.064746 72.550851,71.476481c0,27.497006 -16.312149,52.87161 -41.557118,64.643625c-6.487902,3.026253 -10.6256,9.464818 -10.6256,16.537358l0,39.496814c0,10.105198 8.314395,18.296574 18.571354,18.296574l65.982163,0c10.256959,0 18.571354,-8.191376 18.571354,-18.296574c0,-10.105198 -8.314395,-18.296574 -18.571354,-18.296574z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M384 544v576q0 13-9.5 22.5t-22.5 9.5q-14 0-23-9l-288-288q-9-9-9-23t9-23l288-288q9-9 23-9 13 0 22.5 9.5t9.5 22.5zm1408 768v192q0 13-9.5 22.5t-22.5 9.5h-1728q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1728q13 0 22.5 9.5t9.5 22.5zm0-384v192q0 13-9.5 22.5t-22.5 9.5h-1088q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1088q13 0 22.5 9.5t9.5 22.5zm0-384v192q0 13-9.5 22.5t-22.5 9.5h-1088q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1088q13 0 22.5 9.5t9.5 22.5zm0-384v192q0 13-9.5 22.5t-22.5 9.5h-1728q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1728q13 0 22.5 9.5t9.5 22.5z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' x="0px" y="0px" viewBox="0 0 459 459"> <g> <g> <path d="M229.5,0C102,0,0,102,0,229.5S102,459,229.5,459c20.4,0,38.25-17.85,38.25-38.25c0-10.2-2.55-17.85-10.2-25.5 c-5.1-7.65-10.2-15.3-10.2-25.5c0-20.4,17.851-38.25,38.25-38.25h45.9c71.4,0,127.5-56.1,127.5-127.5C459,91.8,357,0,229.5,0z M89.25,229.5c-20.4,0-38.25-17.85-38.25-38.25S68.85,153,89.25,153s38.25,17.85,38.25,38.25S109.65,229.5,89.25,229.5z M165.75,127.5c-20.4,0-38.25-17.85-38.25-38.25S145.35,51,165.75,51S204,68.85,204,89.25S186.15,127.5,165.75,127.5z M293.25,127.5c-20.4,0-38.25-17.85-38.25-38.25S272.85,51,293.25,51s38.25,17.85,38.25,38.25S313.65,127.5,293.25,127.5z M369.75,229.5c-20.4,0-38.25-17.85-38.25-38.25S349.35,153,369.75,153S408,170.85,408,191.25S390.15,229.5,369.75,229.5z" /> </g> </g> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M1534 189v73q0 29-18.5 61t-42.5 32q-50 0-54 1-26 6-32 31-3 11-3 64v1152q0 25-18 43t-43 18h-108q-25 0-43-18t-18-43v-1218h-143v1218q0 25-17.5 43t-43.5 18h-108q-26 0-43.5-18t-17.5-43v-496q-147-12-245-59-126-58-192-179-64-117-64-259 0-166 88-286 88-118 209-159 111-37 417-37h479q25 0 43 18t18 43z"/></svg>';},e=>{e.exports='<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"> <path stroke-width="0" d="M10.5 20H2a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2h1V3l2.03-.4a3 3 0 0 1 5.94 0L13 3v1h1a2 2 0 0 1 2 2v1h-2V6h-1v1H3V6H2v12h5v2h3.5zM8 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm2 4h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8c0-1.1.9-2 2-2zm0 2v8h8v-8h-8z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M491 1536l91-91-235-235-91 91v107h128v128h107zm523-928q0-22-22-22-10 0-17 7l-542 542q-7 7-7 17 0 22 22 22 10 0 17-7l542-542q7-7 7-17zm-54-192l416 416-832 832h-416v-416zm683 96q0 53-37 90l-166 166-416-416 166-165q36-38 90-38 53 0 91 38l235 234q37 39 37 91z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"><path d="M1600 736v192q0 40-28 68t-68 28h-416v416q0 40-28 68t-68 28h-192q-40 0-68-28t-28-68v-416h-416q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h416v-416q0-40 28-68t68-28h192q40 0 68 28t28 68v416h416q40 0 68 28t28 68z"/></svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M448 1536h896v-256h-896v256zm0-640h896v-384h-160q-40 0-68-28t-28-68v-160h-640v640zm1152 64q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm128 0v416q0 13-9.5 22.5t-22.5 9.5h-224v160q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-160h-224q-13 0-22.5-9.5t-9.5-22.5v-416q0-79 56.5-135.5t135.5-56.5h64v-544q0-40 28-68t68-28h672q40 0 88 20t76 48l152 152q28 28 48 76t20 88v256h64q79 0 135.5 56.5t56.5 135.5z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M1664 256v448q0 26-19 45t-45 19h-448q-42 0-59-40-17-39 14-69l138-138q-148-137-349-137-104 0-198.5 40.5t-163.5 109.5-109.5 163.5-40.5 198.5 40.5 198.5 109.5 163.5 163.5 109.5 198.5 40.5q119 0 225-52t179-147q7-10 23-12 14 0 25 9l137 138q9 8 9.5 20.5t-7.5 22.5q-109 132-264 204.5t-327 72.5q-156 0-298-61t-245-164-164-245-61-298 61-298 164-245 245-164 298-61q147 0 284.5 55.5t244.5 156.5l130-129q29-31 70-14 39 17 39 59z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 24 24" > <g> <g transform="translate(-251.000000, -443.000000)"> <g transform="translate(215.000000, 119.000000)"/> <path d="M252,448 L256,448 L256,444 L252,444 L252,448 Z M257,448 L269,448 L269,446 L257,446 L257,448 Z M257,464 L269,464 L269,462 L257,462 L257,464 Z M270,444 L270,448 L274,448 L274,444 L270,444 Z M252,462 L252,466 L256,466 L256,462 L252,462 Z M270,462 L270,466 L274,466 L274,462 L270,462 Z M254,461 L256,461 L256,449 L254,449 L254,461 Z M270,461 L272,461 L272,449 L270,449 L270,461 Z"/> </g> </g> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M844 472q0 60-19 113.5t-63 92.5-105 39q-76 0-138-57.5t-92-135.5-30-151q0-60 19-113.5t63-92.5 105-39q77 0 138.5 57.5t91.5 135 30 151.5zm-342 483q0 80-42 139t-119 59q-76 0-141.5-55.5t-100.5-133.5-35-152q0-80 42-139.5t119-59.5q76 0 141.5 55.5t100.5 134 35 152.5zm394-27q118 0 255 97.5t229 237 92 254.5q0 46-17 76.5t-48.5 45-64.5 20-76 5.5q-68 0-187.5-45t-182.5-45q-66 0-192.5 44.5t-200.5 44.5q-183 0-183-146 0-86 56-191.5t139.5-192.5 187.5-146 193-59zm239-211q-61 0-105-39t-63-92.5-19-113.5q0-74 30-151.5t91.5-135 138.5-57.5q61 0 105 39t63 92.5 19 113.5q0 73-30 151t-92 135.5-138 57.5zm432-104q77 0 119 59.5t42 139.5q0 74-35 152t-100.5 133.5-141.5 55.5q-77 0-119-59t-42-139q0-74 35-152.5t100.5-134 141.5-55.5z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M1792 1344v128q0 26-19 45t-45 19h-1664q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1664q26 0 45 19t19 45zm0-384v128q0 26-19 45t-45 19h-1280q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1280q26 0 45 19t19 45zm0-384v128q0 26-19 45t-45 19h-1536q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1536q26 0 45 19t19 45zm0-384v128q0 26-19 45t-45 19h-1152q-26 0-45-19t-19-45v-128q0-26 19-45t45-19h1152q26 0 45 19t19 45z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M512 1536h768v-384h-768v384zm896 0h128v-896q0-14-10-38.5t-20-34.5l-281-281q-10-10-34-20t-39-10v416q0 40-28 68t-68 28h-576q-40 0-68-28t-28-68v-416h-128v1280h128v-416q0-40 28-68t68-28h832q40 0 68 28t28 68v416zm-384-928v-320q0-13-9.5-22.5t-22.5-9.5h-192q-13 0-22.5 9.5t-9.5 22.5v320q0 13 9.5 22.5t22.5 9.5h192q13 0 22.5-9.5t9.5-22.5zm640 32v928q0 40-28 68t-68 28h-1344q-40 0-68-28t-28-68v-1344q0-40 28-68t68-28h928q40 0 88 20t76 48l280 280q28 28 48 76t20 88z"/> </svg>';},e=>{e.exports='<?xml version="1.0" ?> <svg viewBox="0 0 500 500" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"> <path clip-rule="evenodd" d="M306.39,154.09c19.628,4.543,35.244,21.259,39.787,39.523 c1.551,8.54,8.998,14.989,17.904,14.989c9.991,0,18.168-8.175,18.168-18.17c0-13.083-10.991-32.98-25.985-47.881 c-14.719-14.537-32.252-24.802-46.695-24.802c-9.991,0-18.172,8.45-18.172,18.446C291.396,145.094,297.847,152.546,306.39,154.09z M56.629,392.312c-14.09,14.08-14.09,36.979,0,51.059c14.08,14.092,36.981,14.092,50.965,0l104.392-104.303 c24.347,15.181,53.062,23.991,83.953,23.991c87.857,0,158.995-71.142,158.995-158.999c0-87.854-71.138-158.995-158.995-158.995 c-87.856,0-158.995,71.141-158.995,158.995c0,30.802,8.819,59.606,23.992,83.953L56.629,392.312z M182.371,204.06 c0-62.687,50.875-113.568,113.568-113.568s113.569,50.881,113.569,113.568c0,62.694-50.876,113.569-113.569,113.569 S182.371,266.754,182.371,204.06z" fill-rule="evenodd"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 18 18"> <g fill-rule="evenodd" stroke="none" stroke-width="1"> <g transform="translate(-381.000000, -381.000000)"> <g transform="translate(381.000000, 381.000000)"> <path d="M0,2 L2,2 L2,0 C0.9,0 0,0.9 0,2 L0,2 Z M0,10 L2,10 L2,8 L0,8 L0,10 L0,10 Z M4,18 L6,18 L6,16 L4,16 L4,18 L4,18 Z M0,6 L2,6 L2,4 L0,4 L0,6 L0,6 Z M10,0 L8,0 L8,2 L10,2 L10,0 L10,0 Z M16,0 L16,2 L18,2 C18,0.9 17.1,0 16,0 L16,0 Z M2,18 L2,16 L0,16 C0,17.1 0.9,18 2,18 L2,18 Z M0,14 L2,14 L2,12 L0,12 L0,14 L0,14 Z M6,0 L4,0 L4,2 L6,2 L6,0 L6,0 Z M8,18 L10,18 L10,16 L8,16 L8,18 L8,18 Z M16,10 L18,10 L18,8 L16,8 L16,10 L16,10 Z M16,18 C17.1,18 18,17.1 18,16 L16,16 L16,18 L16,18 Z M16,6 L18,6 L18,4 L16,4 L16,6 L16,6 Z M16,14 L18,14 L18,12 L16,12 L16,14 L16,14 Z M12,18 L14,18 L14,16 L12,16 L12,18 L12,18 Z M12,2 L14,2 L14,0 L12,0 L12,2 L12,2 Z M4,14 L14,14 L14,4 L4,4 L4,14 L4,14 Z M6,6 L12,6 L12,12 L6,12 L6,6 L6,6 Z"/> </g> </g> </g> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M896 960v448q0 26-19 45t-45 19-45-19l-144-144-332 332q-10 10-23 10t-23-10l-114-114q-10-10-10-23t10-23l332-332-144-144q-19-19-19-45t19-45 45-19h448q26 0 45 19t19 45zm755-672q0 13-10 23l-332 332 144 144q19 19 19 45t-19 45-45 19h-448q-26 0-45-19t-19-45v-448q0-26 19-45t45-19 45 19l144 144 332-332q10-10 23-10t23 10l114 114q10 10 10 23z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M553 1399l-50 50q-10 10-23 10t-23-10l-466-466q-10-10-10-23t10-23l466-466q10-10 23-10t23 10l50 50q10 10 10 23t-10 23l-393 393 393 393q10 10 10 23t-10 23zm591-1067l-373 1291q-4 13-15.5 19.5t-23.5 2.5l-62-17q-13-4-19.5-15.5t-2.5-24.5l373-1291q4-13 15.5-19.5t23.5-2.5l62 17q13 4 19.5 15.5t2.5 24.5zm657 651l-466 466q-10 10-23 10t-23-10l-50-50q-10-10-10-23t10-23l393-393-393-393q-10-10-10-23t10-23l50-50q10-10 23-10t23 10l466 466q10 10 10 23t-10 23z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 48 48"> <path d="M6 42h4v-4h-4v4zm4-28h-4v4h4v-4zm-4 20h4v-4h-4v4zm8 8h4v-4h-4v4zm-4-36h-4v4h4v-4zm8 0h-4v4h4v-4zm16 0h-4v4h4v-4zm-8 8h-4v4h4v-4zm0-8h-4v4h4v-4zm12 28h4v-4h-4v4zm-16 8h4v-4h-4v4zm-16-16h36v-4h-36v4zm32-20v4h4v-4h-4zm0 12h4v-4h-4v4zm-16 16h4v-4h-4v4zm8 8h4v-4h-4v4zm8 0h4v-4h-4v4z"/><path d="M0 0h48v48h-48z" fill="none"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 48 48"> <path d="M6 18h4v-4h-4v4zm0-8h4v-4h-4v4zm8 32h4v-4h-4v4zm0-16h4v-4h-4v4zm-8 0h4v-4h-4v4zm0 16h4v-4h-4v4zm0-8h4v-4h-4v4zm8-24h4v-4h-4v4zm24 24h4v-4h-4v4zm-16 8h4v-36h-4v36zm16 0h4v-4h-4v4zm0-16h4v-4h-4v4zm0-20v4h4v-4h-4zm0 12h4v-4h-4v4zm-8-8h4v-4h-4v4zm0 32h4v-4h-4v4zm0-16h4v-4h-4v4z"/> <path d="M0 0h48v48h-48z" fill="none"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M1760 896q14 0 23 9t9 23v64q0 14-9 23t-23 9h-1728q-14 0-23-9t-9-23v-64q0-14 9-23t23-9h1728zm-1277-64q-28-35-51-80-48-97-48-188 0-181 134-309 133-127 393-127 50 0 167 19 66 12 177 48 10 38 21 118 14 123 14 183 0 18-5 45l-12 3-84-6-14-2q-50-149-103-205-88-91-210-91-114 0-182 59-67 58-67 146 0 73 66 140t279 129q69 20 173 66 58 28 95 52h-743zm507 256h411q7 39 7 92 0 111-41 212-23 55-71 104-37 35-109 81-80 48-153 66-80 21-203 21-114 0-195-23l-140-40q-57-16-72-28-8-8-8-22v-13q0-108-2-156-1-30 0-68l2-37v-44l102-2q15 34 30 71t22.5 56 12.5 27q35 57 80 94 43 36 105 57 59 22 132 22 64 0 139-27 77-26 122-86 47-61 47-129 0-84-81-157-34-29-137-71z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M1025 1369v167h-248l-159-252-24-42q-8-9-11-21h-3l-9 21q-10 20-25 44l-155 250h-258v-167h128l197-291-185-272h-137v-168h276l139 228q2 4 23 42 8 9 11 21h3q3-9 11-21l25-42 140-228h257v168h-125l-184 267 204 296h109zm639 217v206h-514l-4-27q-3-45-3-46 0-64 26-117t65-86.5 84-65 84-54.5 65-54 26-64q0-38-29.5-62.5t-70.5-24.5q-51 0-97 39-14 11-36 38l-105-92q26-37 63-66 80-65 188-65 110 0 178 59.5t68 158.5q0 66-34.5 118.5t-84 86-99.5 62.5-87 63-41 73h232v-80h126z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M1025 1369v167h-248l-159-252-24-42q-8-9-11-21h-3l-9 21q-10 20-25 44l-155 250h-258v-167h128l197-291-185-272h-137v-168h276l139 228q2 4 23 42 8 9 11 21h3q3-9 11-21l25-42 140-228h257v168h-125l-184 267 204 296h109zm637-679v206h-514l-3-27q-4-28-4-46 0-64 26-117t65-86.5 84-65 84-54.5 65-54 26-64q0-38-29.5-62.5t-70.5-24.5q-51 0-97 39-14 11-36 38l-105-92q26-37 63-66 83-65 188-65 110 0 178 59.5t68 158.5q0 56-24.5 103t-62 76.5-81.5 58.5-82 50.5-65.5 51.5-30.5 63h232v-80h126z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M576 1376v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm0-384v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm512 384v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm-512-768v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm512 384v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm512 384v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm-512-768v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm512 384v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm0-384v-192q0-14-9-23t-23-9h-320q-14 0-23 9t-9 23v192q0 14 9 23t23 9h320q14 0 23-9t9-23zm128-320v1088q0 66-47 113t-113 47h-1344q-66 0-113-47t-47-113v-1088q0-66 47-113t113-47h1344q66 0 113 47t47 113z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M512 1248v192q0 40-28 68t-68 28h-320q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h320q40 0 68 28t28 68zm0-512v192q0 40-28 68t-68 28h-320q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h320q40 0 68 28t28 68zm640 512v192q0 40-28 68t-68 28h-320q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h320q40 0 68 28t28 68zm-640-1024v192q0 40-28 68t-68 28h-320q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h320q40 0 68 28t28 68zm640 512v192q0 40-28 68t-68 28h-320q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h320q40 0 68 28t28 68zm640 512v192q0 40-28 68t-68 28h-320q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h320q40 0 68 28t28 68zm-640-1024v192q0 40-28 68t-68 28h-320q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h320q40 0 68 28t28 68zm640 512v192q0 40-28 68t-68 28h-320q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h320q40 0 68 28t28 68zm0-512v192q0 40-28 68t-68 28h-320q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h320q40 0 68 28t28 68z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M512 1248v192q0 40-28 68t-68 28h-320q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h320q40 0 68 28t28 68zm0-512v192q0 40-28 68t-68 28h-320q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h320q40 0 68 28t28 68zm1280 512v192q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h960q40 0 68 28t28 68zm-1280-1024v192q0 40-28 68t-68 28h-320q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h320q40 0 68 28t28 68zm1280 512v192q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h960q40 0 68 28t28 68zm0-512v192q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h960q40 0 68 28t28 68z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path stroke-width="0" d="M384 1408q0 80-56 136t-136 56-136-56-56-136 56-136 136-56 136 56 56 136zm0-512q0 80-56 136t-136 56-136-56-56-136 56-136 136-56 136 56 56 136zm1408 416v192q0 13-9.5 22.5t-22.5 9.5h-1216q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1216q13 0 22.5 9.5t9.5 22.5zm-1408-928q0 80-56 136t-136 56-136-56-56-136 56-136 136-56 136 56 56 136zm1408 416v192q0 13-9.5 22.5t-22.5 9.5h-1216q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1216q13 0 22.5 9.5t9.5 22.5zm0-512v192q0 13-9.5 22.5t-22.5 9.5h-1216q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1216q13 0 22.5 9.5t9.5 22.5z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M176 223q-37-2-45-4l-3-88q13-1 40-1 60 0 112 4 132 7 166 7 86 0 168-3 116-4 146-5 56 0 86-2l-1 14 2 64v9q-60 9-124 9-60 0-79 25-13 14-13 132 0 13 .5 32.5t.5 25.5l1 229 14 280q6 124 51 202 35 59 96 92 88 47 177 47 104 0 191-28 56-18 99-51 48-36 65-64 36-56 53-114 21-73 21-229 0-79-3.5-128t-11-122.5-13.5-159.5l-4-59q-5-67-24-88-34-35-77-34l-100 2-14-3 2-86h84l205 10q76 3 196-10l18 2q6 38 6 51 0 7-4 31-45 12-84 13-73 11-79 17-15 15-15 41 0 7 1.5 27t1.5 31q8 19 22 396 6 195-15 304-15 76-41 122-38 65-112 123-75 57-182 89-109 33-255 33-167 0-284-46-119-47-179-122-61-76-83-195-16-80-16-237v-333q0-188-17-213-25-36-147-39zm1488 1409v-64q0-14-9-23t-23-9h-1472q-14 0-23 9t-9 23v64q0 14 9 23t23 9h1472q14 0 23-9t9-23z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M1664 896q0 156-61 298t-164 245-245 164-298 61q-172 0-327-72.5t-264-204.5q-7-10-6.5-22.5t8.5-20.5l137-138q10-9 25-9 16 2 23 12 73 95 179 147t225 52q104 0 198.5-40.5t163.5-109.5 109.5-163.5 40.5-198.5-40.5-198.5-109.5-163.5-163.5-109.5-198.5-40.5q-98 0-188 35.5t-160 101.5l137 138q31 30 14 69-17 40-59 40h-448q-26 0-45-19t-19-45v-448q0-42 40-59 39-17 69 14l130 129q107-101 244.5-156.5t284.5-55.5q156 0 298 61t245 164 164 245 61 298z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M503 1271l-256 256q-10 9-23 9-12 0-23-9-9-10-9-23t9-23l256-256q10-9 23-9t23 9q9 10 9 23t-9 23zm169 41v320q0 14-9 23t-23 9-23-9-9-23v-320q0-14 9-23t23-9 23 9 9 23zm-224-224q0 14-9 23t-23 9h-320q-14 0-23-9t-9-23 9-23 23-9h320q14 0 23 9t9 23zm1264 128q0 120-85 203l-147 146q-83 83-203 83-121 0-204-85l-334-335q-21-21-42-56l239-18 273 274q27 27 68 27.5t68-26.5l147-146q28-28 28-67 0-40-28-68l-274-275 18-239q35 21 56 42l336 336q84 86 84 204zm-617-724l-239 18-273-274q-28-28-68-28-39 0-68 27l-147 146q-28 28-28 67 0 40 28 68l274 274-18 240q-35-21-56-42l-336-336q-84-86-84-204 0-120 85-203l147-146q83-83 203-83 121 0 204 85l334 335q21 21 42 56zm633 84q0 14-9 23t-23 9h-320q-14 0-23-9t-9-23 9-23 23-9h320q14 0 23 9t9 23zm-544-544v320q0 14-9 23t-23 9-23-9-9-23v-320q0-14 9-23t23-9 23 9 9 23zm407 151l-256 256q-11 9-23 9t-23-9q-9-10-9-23t9-23l256-256q10-9 23-9t23 9q9 10 9 23t-9 23z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M1728 576v256q0 26-19 45t-45 19h-64q-26 0-45-19t-19-45v-256q0-106-75-181t-181-75-181 75-75 181v192h96q40 0 68 28t28 68v576q0 40-28 68t-68 28h-960q-40 0-68-28t-28-68v-576q0-40 28-68t68-28h672v-192q0-185 131.5-316.5t316.5-131.5 316.5 131.5 131.5 316.5z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M1639 1056q0 5-1 7-64 268-268 434.5t-478 166.5q-146 0-282.5-55t-243.5-157l-129 129q-19 19-45 19t-45-19-19-45v-448q0-26 19-45t45-19h448q26 0 45 19t19 45-19 45l-137 137q71 66 161 102t187 36q134 0 250-65t186-179q11-17 53-117 8-23 30-23h192q13 0 22.5 9.5t9.5 22.5zm25-800v448q0 26-19 45t-45 19h-448q-26 0-45-19t-19-45 19-45l138-138q-148-137-349-137-134 0-250 65t-186 179q-11 17-53 117-8 23-30 23h-199q-13 0-22.5-9.5t-9.5-22.5v-7q65-268 270-434.5t480-166.5q146 0 284 55.5t245 156.5l130-129q19-19 45-19t45 19 19 45z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M1344 1472q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm256 0q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm128-224v320q0 40-28 68t-68 28h-1472q-40 0-68-28t-28-68v-320q0-40 28-68t68-28h427q21 56 70.5 92t110.5 36h256q61 0 110.5-36t70.5-92h427q40 0 68 28t28 68zm-325-648q-17 40-59 40h-256v448q0 26-19 45t-45 19h-256q-26 0-45-19t-19-45v-448h-256q-42 0-59-40-17-39 14-69l448-448q18-19 45-19t45 19l448 448q31 30 14 69z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M1216 320q0 26-19 45t-45 19h-128v1024h128q26 0 45 19t19 45-19 45l-256 256q-19 19-45 19t-45-19l-256-256q-19-19-19-45t19-45 45-19h128v-1024h-128q-26 0-45-19t-19-45 19-45l256-256q19-19 45-19t45 19l256 256q19 19 19 45z"/> </svg>';},e=>{e.exports='<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox="0 0 1792 1792"> <path d="M1792 352v1088q0 42-39 59-13 5-25 5-27 0-45-19l-403-403v166q0 119-84.5 203.5t-203.5 84.5h-704q-119 0-203.5-84.5t-84.5-203.5v-704q0-119 84.5-203.5t203.5-84.5h704q119 0 203.5 84.5t84.5 203.5v165l403-402q18-19 45-19 12 0 25 5 39 17 39 59z"/> </svg>';}],t={};function o(r){if(t[r])return t[r].exports;var i=t[r]={exports:{}};return e[r].call(i.exports,i,i.exports,o),i.exports}return o.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),o.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0});},o(0)})()}));
    });

    var Jodit$1 = /*@__PURE__*/getDefaultExportFromCjs(jodit_min);

    /* src\components\TextEdit.svelte generated by Svelte v3.31.2 */

    const { console: console_1, document: document_1 } = globals;
    const file$3 = "src\\components\\TextEdit.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[19] = list;
    	child_ctx[20] = i;
    	return child_ctx;
    }

    // (89:4) {#if bestPracticeEntry}
    function create_if_block$2(ctx) {
    	let i;
    	let t0;
    	let div0;
    	let label0;
    	let t2;
    	let input0;
    	let t3;
    	let div1;
    	let label1;
    	let t5;
    	let input1;
    	let t6;
    	let textarea;
    	let t7;
    	let div2;
    	let h2;
    	let t9;
    	let button;
    	let t11;
    	let mounted;
    	let dispose;
    	let each_value = /*bestPracticeEntry*/ ctx[2].surveyQuestions;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			i = element("i");
    			t0 = space();
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Title";
    			t2 = space();
    			input0 = element("input");
    			t3 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Tags";
    			t5 = space();
    			input1 = element("input");
    			t6 = space();
    			textarea = element("textarea");
    			t7 = space();
    			div2 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Survey questions";
    			t9 = space();
    			button = element("button");
    			button.textContent = "New";
    			t11 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(i, "class", "fa fa-save");
    			add_location(i, file$3, 89, 8, 2916);
    			attr_dev(label0, "for", "txtTitle");
    			add_location(label0, file$3, 96, 12, 3104);
    			attr_dev(input0, "id", "txtTitle");
    			attr_dev(input0, "class", "svelte-10dxyzu");
    			add_location(input0, file$3, 97, 12, 3153);
    			attr_dev(div0, "class", "bestPracticeProperties svelte-10dxyzu");
    			add_location(div0, file$3, 95, 8, 3054);
    			attr_dev(label1, "for", "txtTags");
    			add_location(label1, file$3, 100, 12, 3275);
    			attr_dev(input1, "id", "txtTags");
    			attr_dev(input1, "class", "svelte-10dxyzu");
    			add_location(input1, file$3, 101, 12, 3322);
    			attr_dev(div1, "class", "bestPracticeProperties svelte-10dxyzu");
    			add_location(div1, file$3, 99, 8, 3225);
    			attr_dev(textarea, "id", "editor");
    			attr_dev(textarea, "name", "editor");
    			attr_dev(textarea, "class", "svelte-10dxyzu");
    			add_location(textarea, file$3, 104, 8, 3395);
    			add_location(h2, file$3, 106, 12, 3483);
    			add_location(button, file$3, 107, 12, 3522);
    			attr_dev(div2, "id", "surveyQuestions");
    			add_location(div2, file$3, 105, 8, 3443);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, label0);
    			append_dev(div0, t2);
    			append_dev(div0, input0);
    			set_input_value(input0, /*titleHTML*/ ctx[1]);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label1);
    			append_dev(div1, t5);
    			append_dev(div1, input1);
    			set_input_value(input1, /*tagString*/ ctx[0]);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, textarea, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h2);
    			append_dev(div2, t9);
    			append_dev(div2, button);
    			append_dev(div2, t11);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(i, "click", /*click_handler*/ ctx[7], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen_dev(button, "click", /*newSurveyQuestion*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*titleHTML*/ 2 && input0.value !== /*titleHTML*/ ctx[1]) {
    				set_input_value(input0, /*titleHTML*/ ctx[1]);
    			}

    			if (dirty & /*tagString*/ 1 && input1.value !== /*tagString*/ ctx[0]) {
    				set_input_value(input1, /*tagString*/ ctx[0]);
    			}

    			if (dirty & /*deleteQuestion, bestPracticeEntry*/ 36) {
    				each_value = /*bestPracticeEntry*/ ctx[2].surveyQuestions;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(textarea);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(89:4) {#if bestPracticeEntry}",
    		ctx
    	});

    	return block;
    }

    // (109:12) {#each bestPracticeEntry.surveyQuestions as q, idx}
    function create_each_block$1(ctx) {
    	let div;
    	let input0;
    	let t0;
    	let input1;
    	let t1;
    	let button;
    	let t3;
    	let mounted;
    	let dispose;

    	function input0_input_handler_1() {
    		/*input0_input_handler_1*/ ctx[10].call(input0, /*each_value*/ ctx[19], /*idx*/ ctx[20]);
    	}

    	function input1_input_handler_1() {
    		/*input1_input_handler_1*/ ctx[11].call(input1, /*each_value*/ ctx[19], /*idx*/ ctx[20]);
    	}

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[12](/*idx*/ ctx[20], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			input0 = element("input");
    			t0 = space();
    			input1 = element("input");
    			t1 = space();
    			button = element("button");
    			button.textContent = "Delete";
    			t3 = space();
    			attr_dev(input0, "class", "svelte-10dxyzu");
    			add_location(input0, file$3, 110, 20, 3702);
    			attr_dev(input1, "class", "svelte-10dxyzu");
    			add_location(input1, file$3, 111, 20, 3757);
    			add_location(button, file$3, 112, 20, 3816);
    			attr_dev(div, "class", "questionLine");
    			add_location(div, file$3, 109, 16, 3654);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input0);
    			set_input_value(input0, /*q*/ ctx[18].question);
    			append_dev(div, t0);
    			append_dev(div, input1);
    			set_input_value(input1, /*q*/ ctx[18].howToMeasure);
    			append_dev(div, t1);
    			append_dev(div, button);
    			append_dev(div, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", input0_input_handler_1),
    					listen_dev(input1, "input", input1_input_handler_1),
    					listen_dev(button, "click", click_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*bestPracticeEntry*/ 4 && input0.value !== /*q*/ ctx[18].question) {
    				set_input_value(input0, /*q*/ ctx[18].question);
    			}

    			if (dirty & /*bestPracticeEntry*/ 4 && input1.value !== /*q*/ ctx[18].howToMeasure) {
    				set_input_value(input1, /*q*/ ctx[18].howToMeasure);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(109:12) {#each bestPracticeEntry.surveyQuestions as q, idx}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let t;
    	let link;
    	let if_block = /*bestPracticeEntry*/ ctx[2] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block) if_block.c();
    			t = space();
    			link = element("link");
    			add_location(main, file$3, 87, 0, 2871);
    			attr_dev(link, "type", "text/css");
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "build/jodit.min.css");
    			add_location(link, file$3, 120, 4, 4001);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block) if_block.m(main, null);
    			insert_dev(target, t, anchor);
    			append_dev(document_1.head, link);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*bestPracticeEntry*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(main, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t);
    			detach_dev(link);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function htmlDecode(input) {
    	var doc = new DOMParser().parseFromString(input, "text/html");
    	return doc.documentElement.textContent;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TextEdit", slots, []);
    	let { currentFile } = $$props;
    	let editor;
    	let title;
    	let tagString;
    	let titleHTML;
    	let tags;
    	let bestPracticeEntry;
    	

    	onMount(() => {
    		readDataFromFile(currentFile);
    	});

    	function readDataFromFile(file) {
    		Debug.log("TextEdit - readDataFromFile - Loading: " + file.path);
    		Debug.log(file.content);
    		$$invalidate(2, bestPracticeEntry = new BestPracticeEntry(atob(file.content)));
    		$$invalidate(0, tagString = bestPracticeEntry.tags.join(","));
    		$$invalidate(1, titleHTML = htmlDecode(bestPracticeEntry.titleHTML));

    		setTimeout(
    			function () {
    				initJodit();
    			},
    			1
    		);
    	}

    	function initJodit() {
    		Debug.log("initJodit");

    		if (!editor) {
    			editor = new Jodit$1.Jodit(document.getElementById("editor"),
    			{
    					uploader: { insertImageAsBase64URI: true },
    					extraButtons: [
    						{
    							name: "insertDate",
    							icon: "save",
    							tooltip: "Save and commit",
    							exec(editor) {
    								//editor.s.insertHTML(new Date().toDateString());
    								console.log(editor.value);

    								saveAndCommit();
    							}
    						}
    					],
    					"beautify-html": true
    				});
    		}

    		editor.value = bestPracticeEntry.descriptionHTML;
    	}

    	/**
     * Called when user presses SAVE button in Jodit (description html editor)
     */
    	function saveAndCommit() {
    		$$invalidate(2, bestPracticeEntry.descriptionHTML = editor.value, bestPracticeEntry);
    		$$invalidate(2, bestPracticeEntry.titleHTML = titleHTML, bestPracticeEntry);
    		$$invalidate(2, bestPracticeEntry.tags = tagString.split(","), bestPracticeEntry);

    		bestPracticeEntry.generateHTML().then(html => {
    			//@ts-ignore
    			html = html_beautify(html, {
    				indent_size: 2,
    				space_in_empty_paren: true
    			});

    			$$invalidate(6, currentFile.content = html, currentFile);

    			APIHelper.writeFile(currentFile).then(file => {
    				Debug.log("File committed");
    				Control.showInfolog("File saved and committed");
    				$$invalidate(6, currentFile.sha = file.sha, currentFile);
    			});
    		});
    	}

    	function newSurveyQuestion() {
    		bestPracticeEntry.surveyQuestions.push(new SurveyQuestion());
    		$$invalidate(2, bestPracticeEntry);
    	}

    	function deleteQuestion(idx) {
    		bestPracticeEntry.surveyQuestions.splice(idx, 1);
    		$$invalidate(2, bestPracticeEntry);
    	}

    	const writable_props = ["currentFile"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<TextEdit> was created with unknown prop '${key}'`);
    	});

    	const click_handler = x => {
    		saveAndCommit();
    	};

    	function input0_input_handler() {
    		titleHTML = this.value;
    		$$invalidate(1, titleHTML);
    	}

    	function input1_input_handler() {
    		tagString = this.value;
    		$$invalidate(0, tagString);
    	}

    	function input0_input_handler_1(each_value, idx) {
    		each_value[idx].question = this.value;
    		$$invalidate(2, bestPracticeEntry);
    	}

    	function input1_input_handler_1(each_value, idx) {
    		each_value[idx].howToMeasure = this.value;
    		$$invalidate(2, bestPracticeEntry);
    	}

    	const click_handler_1 = (idx, x) => deleteQuestion(idx);

    	$$self.$$set = $$props => {
    		if ("currentFile" in $$props) $$invalidate(6, currentFile = $$props.currentFile);
    	};

    	$$self.$capture_state = () => ({
    		currentFile,
    		editor,
    		title,
    		tagString,
    		titleHTML,
    		tags,
    		bestPracticeEntry,
    		APIHelper,
    		onMount,
    		Jodit: Jodit$1,
    		BestPracticeEntry,
    		SurveyQuestion,
    		Control,
    		Debug,
    		readDataFromFile,
    		initJodit,
    		saveAndCommit,
    		newSurveyQuestion,
    		deleteQuestion,
    		htmlDecode
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentFile" in $$props) $$invalidate(6, currentFile = $$props.currentFile);
    		if ("editor" in $$props) editor = $$props.editor;
    		if ("title" in $$props) title = $$props.title;
    		if ("tagString" in $$props) $$invalidate(0, tagString = $$props.tagString);
    		if ("titleHTML" in $$props) $$invalidate(1, titleHTML = $$props.titleHTML);
    		if ("tags" in $$props) tags = $$props.tags;
    		if ("bestPracticeEntry" in $$props) $$invalidate(2, bestPracticeEntry = $$props.bestPracticeEntry);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		tagString,
    		titleHTML,
    		bestPracticeEntry,
    		saveAndCommit,
    		newSurveyQuestion,
    		deleteQuestion,
    		currentFile,
    		click_handler,
    		input0_input_handler,
    		input1_input_handler,
    		input0_input_handler_1,
    		input1_input_handler_1,
    		click_handler_1
    	];
    }

    class TextEdit extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { currentFile: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextEdit",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*currentFile*/ ctx[6] === undefined && !("currentFile" in props)) {
    			console_1.warn("<TextEdit> was created without expected prop 'currentFile'");
    		}
    	}

    	get currentFile() {
    		throw new Error("<TextEdit>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentFile(value) {
    		throw new Error("<TextEdit>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-accessible-dialog\src\components\DialogPortal.svelte generated by Svelte v3.31.2 */
    const file$4 = "node_modules\\svelte-accessible-dialog\\src\\components\\DialogPortal.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			add_location(div, file$4, 20, 0, 445);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[3](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[3](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DialogPortal", slots, ['default']);
    	let ref;
    	let portal;

    	onMount(() => {
    		// Create and append a DOM node to `document.body`
    		// and render the component into it.
    		portal = document.createElement("div");

    		portal.setAttribute("data-svelte-dialog-portal", "true");
    		document.body.appendChild(portal);
    		portal.appendChild(ref);

    		return () => {
    			document.body.removeChild(portal);
    		};
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DialogPortal> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			ref = $$value;
    			$$invalidate(0, ref);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ onMount, ref, portal });

    	$$self.$inject_state = $$props => {
    		if ("ref" in $$props) $$invalidate(0, ref = $$props.ref);
    		if ("portal" in $$props) portal = $$props.portal;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [ref, $$scope, slots, div_binding];
    }

    class DialogPortal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DialogPortal",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* node_modules\svelte-accessible-dialog\src\components\TrapScreenReader.svelte generated by Svelte v3.31.2 */

    function create_fragment$5(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TrapScreenReader", slots, ['default']);
    	let { enabled } = $$props;
    	let originalAttributes = [];

    	const hideFromScreenReader = node => {
    		originalAttributes.push({
    			ariaHidden: node.getAttribute("aria-hidden"),
    			inert: node.getAttribute("inert")
    		});

    		node.setAttribute("aria-hidden", "true");
    		node.setAttribute("inert", "true");
    	};

    	const exposeToScreenReader = (node, i) => {
    		const { ariaHidden, inert } = originalAttributes[i];

    		if (!ariaHidden) {
    			node.removeAttribute("aria-hidden");
    		} else {
    			node.setAttribute("aria-hidden", ariaHidden);
    		}

    		if (!inert) {
    			node.removeAttribute("inert");
    		}
    	};

    	onMount(() => {
    		if (!enabled) {
    			// `DialogContent` has the `aria-modal` attribute. This indicates to screen readers
    			// that only content contained within the dialog should be accessible to the user.
    			// Modern screen readers respect this attribute. In cases where support is inadequate,
    			// this legacy workaround can be enabled.
    			return;
    		}

    		// Grab all children in the `body` except for the dialog portal
    		const children = document.querySelectorAll("body > *:not([data-svelte-dialog-portal])");

    		children.forEach(hideFromScreenReader);

    		return () => {
    			children.forEach(exposeToScreenReader);
    		};
    	});

    	const writable_props = ["enabled"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TrapScreenReader> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("enabled" in $$props) $$invalidate(0, enabled = $$props.enabled);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		enabled,
    		originalAttributes,
    		hideFromScreenReader,
    		exposeToScreenReader
    	});

    	$$self.$inject_state = $$props => {
    		if ("enabled" in $$props) $$invalidate(0, enabled = $$props.enabled);
    		if ("originalAttributes" in $$props) originalAttributes = $$props.originalAttributes;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [enabled, $$scope, slots];
    }

    class TrapScreenReader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { enabled: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TrapScreenReader",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*enabled*/ ctx[0] === undefined && !("enabled" in props)) {
    			console.warn("<TrapScreenReader> was created without expected prop 'enabled'");
    		}
    	}

    	get enabled() {
    		throw new Error("<TrapScreenReader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set enabled(value) {
    		throw new Error("<TrapScreenReader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-accessible-dialog\src\components\TrapFocus.svelte generated by Svelte v3.31.2 */
    const file$5 = "node_modules\\svelte-accessible-dialog\\src\\components\\TrapFocus.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			add_location(div, file$5, 69, 0, 1757);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[6](div);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "keydown", /*handleKeydown*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[6](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TrapFocus", slots, ['default']);
    	let { initialFocusElement } = $$props;
    	let { returnFocusElement } = $$props;
    	let ref;
    	let tabbableChildren;
    	let firstTabbableChild;
    	let lastTabbableChild;
    	let returnFocusElem;

    	onMount(async () => {
    		returnFocusElem = returnFocusElement || document.activeElement;
    		tabbableChildren = [...ref.querySelectorAll("*")].filter(node => node.tabIndex >= 0);
    		firstTabbableChild = tabbableChildren[0];
    		lastTabbableChild = tabbableChildren[tabbableChildren.length - 1];

    		// Wait for children to mount before trying to focus `initialFocusElement`
    		await tick();

    		if (initialFocusElement) {
    			initialFocusElement.focus();
    		} else {
    			const initialFocusElem = ref.querySelector("[autofocus]") || firstTabbableChild || ref.querySelector("[data-svelte-dialog-content]");
    			initialFocusElem.focus();
    		}
    	});

    	onDestroy(() => {
    		if (returnFocusElem) {
    			returnFocusElem.focus();
    		}
    	});

    	// We can't test keyboard semantics in `jsdom`, so it doesn't
    	// make sense to include this function in the coverage report.
    	// istanbul ignore next
    	const handleKeydown = event => {
    		if (event.key !== "Tab") {
    			return;
    		}

    		if (tabbableChildren.length === 0) {
    			event.preventDefault();
    		}

    		if (event.shiftKey) {
    			// Handle shift + tab
    			if (document.activeElement === firstTabbableChild) {
    				event.preventDefault();
    				lastTabbableChild.focus();
    			}
    		} else {
    			if (document.activeElement === lastTabbableChild) {
    				event.preventDefault();
    				firstTabbableChild.focus();
    			}
    		}
    	};

    	const writable_props = ["initialFocusElement", "returnFocusElement"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TrapFocus> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			ref = $$value;
    			$$invalidate(0, ref);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("initialFocusElement" in $$props) $$invalidate(2, initialFocusElement = $$props.initialFocusElement);
    		if ("returnFocusElement" in $$props) $$invalidate(3, returnFocusElement = $$props.returnFocusElement);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		tick,
    		initialFocusElement,
    		returnFocusElement,
    		ref,
    		tabbableChildren,
    		firstTabbableChild,
    		lastTabbableChild,
    		returnFocusElem,
    		handleKeydown
    	});

    	$$self.$inject_state = $$props => {
    		if ("initialFocusElement" in $$props) $$invalidate(2, initialFocusElement = $$props.initialFocusElement);
    		if ("returnFocusElement" in $$props) $$invalidate(3, returnFocusElement = $$props.returnFocusElement);
    		if ("ref" in $$props) $$invalidate(0, ref = $$props.ref);
    		if ("tabbableChildren" in $$props) tabbableChildren = $$props.tabbableChildren;
    		if ("firstTabbableChild" in $$props) firstTabbableChild = $$props.firstTabbableChild;
    		if ("lastTabbableChild" in $$props) lastTabbableChild = $$props.lastTabbableChild;
    		if ("returnFocusElem" in $$props) returnFocusElem = $$props.returnFocusElem;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		ref,
    		handleKeydown,
    		initialFocusElement,
    		returnFocusElement,
    		$$scope,
    		slots,
    		div_binding
    	];
    }

    class TrapFocus extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			initialFocusElement: 2,
    			returnFocusElement: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TrapFocus",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*initialFocusElement*/ ctx[2] === undefined && !("initialFocusElement" in props)) {
    			console.warn("<TrapFocus> was created without expected prop 'initialFocusElement'");
    		}

    		if (/*returnFocusElement*/ ctx[3] === undefined && !("returnFocusElement" in props)) {
    			console.warn("<TrapFocus> was created without expected prop 'returnFocusElement'");
    		}
    	}

    	get initialFocusElement() {
    		throw new Error("<TrapFocus>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set initialFocusElement(value) {
    		throw new Error("<TrapFocus>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get returnFocusElement() {
    		throw new Error("<TrapFocus>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set returnFocusElement(value) {
    		throw new Error("<TrapFocus>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-accessible-dialog\src\components\LockScroll.svelte generated by Svelte v3.31.2 */

    function create_fragment$7(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LockScroll", slots, ['default']);

    	onMount(() => {
    		const { body, documentElement: html } = document;
    		const scrollBarWidth = window.innerWidth - html.clientWidth;
    		const bodyPaddingRight = parseInt(window.getComputedStyle(body).getPropertyValue("padding-right")) || 0;

    		// 1. Fixes a bug in iOS and desktop Safari whereby setting `overflow: hidden` on
    		//    the html/body does not prevent scrolling.
    		// 2. Fixes a bug in desktop Safari where `overflowY` does not prevent scroll if an
    		//   `overflow-x` style is also applied to the body.
    		html.style.position = "relative"; // [1]

    		html.style.overflow = "hidden"; // [2]
    		body.style.position = "relative"; // [1]
    		body.style.overflow = "hidden"; // [2]
    		body.style.paddingRight = `${bodyPaddingRight + scrollBarWidth}px`;

    		return () => {
    			html.style.position = "";
    			html.style.overflow = "";
    			body.style.position = "";
    			body.style.overflow = "";
    			body.style.paddingRight = "";
    		};
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LockScroll> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ onMount });
    	return [$$scope, slots];
    }

    class LockScroll extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LockScroll",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* node_modules\svelte-accessible-dialog\src\components\DialogOverlayInner.svelte generated by Svelte v3.31.2 */
    const file$6 = "node_modules\\svelte-accessible-dialog\\src\\components\\DialogOverlayInner.svelte";

    // (39:4) <LockScroll>
    function create_default_slot_2(ctx) {
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);
    	let div_levels = [/*$$restProps*/ ctx[5], { "data-svelte-dialog-overlay": "" }];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			toggle_class(div, "svelte-64d8vk", true);
    			add_location(div, file$6, 39, 6, 798);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", self$1(stop_propagation(/*handleClick*/ ctx[3])), false, false, true);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 256) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 32 && /*$$restProps*/ ctx[5],
    				{ "data-svelte-dialog-overlay": "" }
    			]));

    			toggle_class(div, "svelte-64d8vk", true);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(39:4) <LockScroll>",
    		ctx
    	});

    	return block;
    }

    // (38:2) <TrapFocus {initialFocusElement} {returnFocusElement}>
    function create_default_slot_1(ctx) {
    	let lockscroll;
    	let current;

    	lockscroll = new LockScroll({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(lockscroll.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(lockscroll, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const lockscroll_changes = {};

    			if (dirty & /*$$scope, $$restProps*/ 288) {
    				lockscroll_changes.$$scope = { dirty, ctx };
    			}

    			lockscroll.$set(lockscroll_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lockscroll.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lockscroll.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(lockscroll, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(38:2) <TrapFocus {initialFocusElement} {returnFocusElement}>",
    		ctx
    	});

    	return block;
    }

    // (37:0) <TrapScreenReader enabled={ariaModalLegacy}>
    function create_default_slot(ctx) {
    	let trapfocus;
    	let current;

    	trapfocus = new TrapFocus({
    			props: {
    				initialFocusElement: /*initialFocusElement*/ ctx[0],
    				returnFocusElement: /*returnFocusElement*/ ctx[1],
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(trapfocus.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(trapfocus, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const trapfocus_changes = {};
    			if (dirty & /*initialFocusElement*/ 1) trapfocus_changes.initialFocusElement = /*initialFocusElement*/ ctx[0];
    			if (dirty & /*returnFocusElement*/ 2) trapfocus_changes.returnFocusElement = /*returnFocusElement*/ ctx[1];

    			if (dirty & /*$$scope, $$restProps*/ 288) {
    				trapfocus_changes.$$scope = { dirty, ctx };
    			}

    			trapfocus.$set(trapfocus_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(trapfocus.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(trapfocus.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(trapfocus, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(37:0) <TrapScreenReader enabled={ariaModalLegacy}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let trapscreenreader;
    	let current;
    	let mounted;
    	let dispose;

    	trapscreenreader = new TrapScreenReader({
    			props: {
    				enabled: /*ariaModalLegacy*/ ctx[2],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(trapscreenreader.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(trapscreenreader, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "keydown", /*handleKeydown*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const trapscreenreader_changes = {};
    			if (dirty & /*ariaModalLegacy*/ 4) trapscreenreader_changes.enabled = /*ariaModalLegacy*/ ctx[2];

    			if (dirty & /*$$scope, initialFocusElement, returnFocusElement, $$restProps*/ 291) {
    				trapscreenreader_changes.$$scope = { dirty, ctx };
    			}

    			trapscreenreader.$set(trapscreenreader_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(trapscreenreader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(trapscreenreader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(trapscreenreader, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	const omit_props_names = ["onDismiss","initialFocusElement","returnFocusElement","ariaModalLegacy"];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DialogOverlayInner", slots, ['default']);
    	let { onDismiss } = $$props;
    	let { initialFocusElement } = $$props;
    	let { returnFocusElement } = $$props;
    	let { ariaModalLegacy } = $$props;

    	const handleClick = () => {
    		onDismiss();
    	};

    	const handleKeydown = event => {
    		if (event.key === "Escape") {
    			onDismiss();
    		}
    	};

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(5, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("onDismiss" in $$new_props) $$invalidate(6, onDismiss = $$new_props.onDismiss);
    		if ("initialFocusElement" in $$new_props) $$invalidate(0, initialFocusElement = $$new_props.initialFocusElement);
    		if ("returnFocusElement" in $$new_props) $$invalidate(1, returnFocusElement = $$new_props.returnFocusElement);
    		if ("ariaModalLegacy" in $$new_props) $$invalidate(2, ariaModalLegacy = $$new_props.ariaModalLegacy);
    		if ("$$scope" in $$new_props) $$invalidate(8, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		TrapScreenReader,
    		TrapFocus,
    		LockScroll,
    		onDismiss,
    		initialFocusElement,
    		returnFocusElement,
    		ariaModalLegacy,
    		handleClick,
    		handleKeydown
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("onDismiss" in $$props) $$invalidate(6, onDismiss = $$new_props.onDismiss);
    		if ("initialFocusElement" in $$props) $$invalidate(0, initialFocusElement = $$new_props.initialFocusElement);
    		if ("returnFocusElement" in $$props) $$invalidate(1, returnFocusElement = $$new_props.returnFocusElement);
    		if ("ariaModalLegacy" in $$props) $$invalidate(2, ariaModalLegacy = $$new_props.ariaModalLegacy);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		initialFocusElement,
    		returnFocusElement,
    		ariaModalLegacy,
    		handleClick,
    		handleKeydown,
    		$$restProps,
    		onDismiss,
    		slots,
    		$$scope
    	];
    }

    class DialogOverlayInner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			onDismiss: 6,
    			initialFocusElement: 0,
    			returnFocusElement: 1,
    			ariaModalLegacy: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DialogOverlayInner",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onDismiss*/ ctx[6] === undefined && !("onDismiss" in props)) {
    			console.warn("<DialogOverlayInner> was created without expected prop 'onDismiss'");
    		}

    		if (/*initialFocusElement*/ ctx[0] === undefined && !("initialFocusElement" in props)) {
    			console.warn("<DialogOverlayInner> was created without expected prop 'initialFocusElement'");
    		}

    		if (/*returnFocusElement*/ ctx[1] === undefined && !("returnFocusElement" in props)) {
    			console.warn("<DialogOverlayInner> was created without expected prop 'returnFocusElement'");
    		}

    		if (/*ariaModalLegacy*/ ctx[2] === undefined && !("ariaModalLegacy" in props)) {
    			console.warn("<DialogOverlayInner> was created without expected prop 'ariaModalLegacy'");
    		}
    	}

    	get onDismiss() {
    		throw new Error("<DialogOverlayInner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onDismiss(value) {
    		throw new Error("<DialogOverlayInner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get initialFocusElement() {
    		throw new Error("<DialogOverlayInner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set initialFocusElement(value) {
    		throw new Error("<DialogOverlayInner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get returnFocusElement() {
    		throw new Error("<DialogOverlayInner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set returnFocusElement(value) {
    		throw new Error("<DialogOverlayInner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ariaModalLegacy() {
    		throw new Error("<DialogOverlayInner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ariaModalLegacy(value) {
    		throw new Error("<DialogOverlayInner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-accessible-dialog\src\components\DialogOverlay.svelte generated by Svelte v3.31.2 */

    // (13:0) {#if isOpen}
    function create_if_block$3(ctx) {
    	let dialogportal;
    	let current;

    	dialogportal = new DialogPortal({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(dialogportal.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(dialogportal, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const dialogportal_changes = {};

    			if (dirty & /*$$scope, $$restProps, onDismiss, initialFocusElement, returnFocusElement, ariaModalLegacy*/ 190) {
    				dialogportal_changes.$$scope = { dirty, ctx };
    			}

    			dialogportal.$set(dialogportal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dialogportal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dialogportal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dialogportal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(13:0) {#if isOpen}",
    		ctx
    	});

    	return block;
    }

    // (15:4) <DialogOverlayInner       {...$$restProps}       {onDismiss}       {initialFocusElement}       {returnFocusElement}       {ariaModalLegacy}     >
    function create_default_slot_1$1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 128) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[7], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(15:4) <DialogOverlayInner       {...$$restProps}       {onDismiss}       {initialFocusElement}       {returnFocusElement}       {ariaModalLegacy}     >",
    		ctx
    	});

    	return block;
    }

    // (14:2) <DialogPortal>
    function create_default_slot$1(ctx) {
    	let dialogoverlayinner;
    	let current;

    	const dialogoverlayinner_spread_levels = [
    		/*$$restProps*/ ctx[5],
    		{ onDismiss: /*onDismiss*/ ctx[1] },
    		{
    			initialFocusElement: /*initialFocusElement*/ ctx[2]
    		},
    		{
    			returnFocusElement: /*returnFocusElement*/ ctx[3]
    		},
    		{
    			ariaModalLegacy: /*ariaModalLegacy*/ ctx[4]
    		}
    	];

    	let dialogoverlayinner_props = {
    		$$slots: { default: [create_default_slot_1$1] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < dialogoverlayinner_spread_levels.length; i += 1) {
    		dialogoverlayinner_props = assign(dialogoverlayinner_props, dialogoverlayinner_spread_levels[i]);
    	}

    	dialogoverlayinner = new DialogOverlayInner({
    			props: dialogoverlayinner_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(dialogoverlayinner.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(dialogoverlayinner, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const dialogoverlayinner_changes = (dirty & /*$$restProps, onDismiss, initialFocusElement, returnFocusElement, ariaModalLegacy*/ 62)
    			? get_spread_update(dialogoverlayinner_spread_levels, [
    					dirty & /*$$restProps*/ 32 && get_spread_object(/*$$restProps*/ ctx[5]),
    					dirty & /*onDismiss*/ 2 && { onDismiss: /*onDismiss*/ ctx[1] },
    					dirty & /*initialFocusElement*/ 4 && {
    						initialFocusElement: /*initialFocusElement*/ ctx[2]
    					},
    					dirty & /*returnFocusElement*/ 8 && {
    						returnFocusElement: /*returnFocusElement*/ ctx[3]
    					},
    					dirty & /*ariaModalLegacy*/ 16 && {
    						ariaModalLegacy: /*ariaModalLegacy*/ ctx[4]
    					}
    				])
    			: {};

    			if (dirty & /*$$scope*/ 128) {
    				dialogoverlayinner_changes.$$scope = { dirty, ctx };
    			}

    			dialogoverlayinner.$set(dialogoverlayinner_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dialogoverlayinner.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dialogoverlayinner.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dialogoverlayinner, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(14:2) <DialogPortal>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*isOpen*/ ctx[0] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*isOpen*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*isOpen*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	const omit_props_names = [
    		"isOpen","onDismiss","initialFocusElement","returnFocusElement","ariaModalLegacy"
    	];

    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DialogOverlay", slots, ['default']);
    	let { isOpen } = $$props;
    	let { onDismiss } = $$props;
    	let { initialFocusElement = null } = $$props;
    	let { returnFocusElement = null } = $$props;
    	let { ariaModalLegacy = false } = $$props;

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(5, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("isOpen" in $$new_props) $$invalidate(0, isOpen = $$new_props.isOpen);
    		if ("onDismiss" in $$new_props) $$invalidate(1, onDismiss = $$new_props.onDismiss);
    		if ("initialFocusElement" in $$new_props) $$invalidate(2, initialFocusElement = $$new_props.initialFocusElement);
    		if ("returnFocusElement" in $$new_props) $$invalidate(3, returnFocusElement = $$new_props.returnFocusElement);
    		if ("ariaModalLegacy" in $$new_props) $$invalidate(4, ariaModalLegacy = $$new_props.ariaModalLegacy);
    		if ("$$scope" in $$new_props) $$invalidate(7, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		DialogPortal,
    		DialogOverlayInner,
    		isOpen,
    		onDismiss,
    		initialFocusElement,
    		returnFocusElement,
    		ariaModalLegacy
    	});

    	$$self.$inject_state = $$new_props => {
    		if ("isOpen" in $$props) $$invalidate(0, isOpen = $$new_props.isOpen);
    		if ("onDismiss" in $$props) $$invalidate(1, onDismiss = $$new_props.onDismiss);
    		if ("initialFocusElement" in $$props) $$invalidate(2, initialFocusElement = $$new_props.initialFocusElement);
    		if ("returnFocusElement" in $$props) $$invalidate(3, returnFocusElement = $$new_props.returnFocusElement);
    		if ("ariaModalLegacy" in $$props) $$invalidate(4, ariaModalLegacy = $$new_props.ariaModalLegacy);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		isOpen,
    		onDismiss,
    		initialFocusElement,
    		returnFocusElement,
    		ariaModalLegacy,
    		$$restProps,
    		slots,
    		$$scope
    	];
    }

    class DialogOverlay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			isOpen: 0,
    			onDismiss: 1,
    			initialFocusElement: 2,
    			returnFocusElement: 3,
    			ariaModalLegacy: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DialogOverlay",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*isOpen*/ ctx[0] === undefined && !("isOpen" in props)) {
    			console.warn("<DialogOverlay> was created without expected prop 'isOpen'");
    		}

    		if (/*onDismiss*/ ctx[1] === undefined && !("onDismiss" in props)) {
    			console.warn("<DialogOverlay> was created without expected prop 'onDismiss'");
    		}
    	}

    	get isOpen() {
    		throw new Error("<DialogOverlay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isOpen(value) {
    		throw new Error("<DialogOverlay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onDismiss() {
    		throw new Error("<DialogOverlay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onDismiss(value) {
    		throw new Error("<DialogOverlay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get initialFocusElement() {
    		throw new Error("<DialogOverlay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set initialFocusElement(value) {
    		throw new Error("<DialogOverlay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get returnFocusElement() {
    		throw new Error("<DialogOverlay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set returnFocusElement(value) {
    		throw new Error("<DialogOverlay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ariaModalLegacy() {
    		throw new Error("<DialogOverlay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ariaModalLegacy(value) {
    		throw new Error("<DialogOverlay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-accessible-dialog\src\components\DialogContent.svelte generated by Svelte v3.31.2 */

    const file$7 = "node_modules\\svelte-accessible-dialog\\src\\components\\DialogContent.svelte";

    function create_fragment$a(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	let div_levels = [
    		/*$$restProps*/ ctx[0],
    		{ "data-svelte-dialog-content": "" },
    		{ "aria-modal": "true" },
    		{ role: "dialog" },
    		{ tabindex: "-1" }
    	];

    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			toggle_class(div, "svelte-1472bc8", true);
    			add_location(div, file$7, 10, 0, 137);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*$$restProps*/ 1 && /*$$restProps*/ ctx[0],
    				{ "data-svelte-dialog-content": "" },
    				{ "aria-modal": "true" },
    				{ role: "dialog" },
    				{ tabindex: "-1" }
    			]));

    			toggle_class(div, "svelte-1472bc8", true);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	const omit_props_names = [];
    	let $$restProps = compute_rest_props($$props, omit_props_names);
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DialogContent", slots, ['default']);

    	$$self.$$set = $$new_props => {
    		$$props = assign(assign({}, $$props), exclude_internal_props($$new_props));
    		$$invalidate(0, $$restProps = compute_rest_props($$props, omit_props_names));
    		if ("$$scope" in $$new_props) $$invalidate(1, $$scope = $$new_props.$$scope);
    	};

    	return [$$restProps, $$scope, slots];
    }

    class DialogContent extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DialogContent",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\components\PopupDialog.svelte generated by Svelte v3.31.2 */
    const file$8 = "src\\components\\PopupDialog.svelte";

    // (22:8) {#if showinput}
    function create_if_block_2$1(ctx) {
    	let div;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			attr_dev(input, "class", "svelte-ax1iep");
    			add_location(input, file$8, 23, 16, 688);
    			attr_dev(div, "id", "divPopupInput");
    			attr_dev(div, "class", "svelte-ax1iep");
    			add_location(div, file$8, 22, 12, 646);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*inputText*/ ctx[4]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[7]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*inputText*/ 16 && input.value !== /*inputText*/ ctx[4]) {
    				set_input_value(input, /*inputText*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(22:8) {#if showinput}",
    		ctx
    	});

    	return block;
    }

    // (27:8) {#if showCancelButton}
    function create_if_block_1$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Cancel";
    			add_location(button, file$8, 27, 12, 801);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(27:8) {#if showCancelButton}",
    		ctx
    	});

    	return block;
    }

    // (30:8) {#if showOKButton}
    function create_if_block$4(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "OK";
    			add_location(button, file$8, 30, 12, 922);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(30:8) {#if showOKButton}",
    		ctx
    	});

    	return block;
    }

    // (18:4) <DialogContent aria-label="Announcement">
    function create_default_slot_1$2(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let if_block2_anchor;
    	let if_block0 = /*showinput*/ ctx[2] && create_if_block_2$1(ctx);
    	let if_block1 = /*showCancelButton*/ ctx[1] && create_if_block_1$1(ctx);
    	let if_block2 = /*showOKButton*/ ctx[0] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(/*popupText*/ ctx[3]);
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    			attr_dev(div, "id", "divPopupText");
    			add_location(div, file$8, 18, 8, 543);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			insert_dev(target, t1, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*popupText*/ 8) set_data_dev(t0, /*popupText*/ ctx[3]);

    			if (/*showinput*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					if_block0.m(t2.parentNode, t2);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*showCancelButton*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					if_block1.m(t3.parentNode, t3);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*showOKButton*/ ctx[0]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block$4(ctx);
    					if_block2.c();
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(18:4) <DialogContent aria-label=\\\"Announcement\\\">",
    		ctx
    	});

    	return block;
    }

    // (17:0) <DialogOverlay isOpen={true} onDismiss={(x) => doClosePopup("Cancel")}>
    function create_default_slot$2(ctx) {
    	let dialogcontent;
    	let current;

    	dialogcontent = new DialogContent({
    			props: {
    				"aria-label": "Announcement",
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(dialogcontent.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(dialogcontent, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const dialogcontent_changes = {};

    			if (dirty & /*$$scope, showOKButton, showCancelButton, inputText, showinput, popupText*/ 2079) {
    				dialogcontent_changes.$$scope = { dirty, ctx };
    			}

    			dialogcontent.$set(dialogcontent_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dialogcontent.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dialogcontent.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dialogcontent, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(17:0) <DialogOverlay isOpen={true} onDismiss={(x) => doClosePopup(\\\"Cancel\\\")}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let dialogoverlay;
    	let current;

    	dialogoverlay = new DialogOverlay({
    			props: {
    				isOpen: true,
    				onDismiss: /*func*/ ctx[10],
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(dialogoverlay.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(dialogoverlay, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const dialogoverlay_changes = {};

    			if (dirty & /*$$scope, showOKButton, showCancelButton, inputText, showinput, popupText*/ 2079) {
    				dialogoverlay_changes.$$scope = { dirty, ctx };
    			}

    			dialogoverlay.$set(dialogoverlay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dialogoverlay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dialogoverlay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dialogoverlay, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PopupDialog", slots, []);
    	let { closePopup } = $$props;
    	let { showOKButton } = $$props;
    	let { showCancelButton } = $$props;
    	let { showinput } = $$props;
    	let { popupText } = $$props;
    	let inputText;

    	function doClosePopup(button) {
    		if (closePopup) {
    			closePopup(button, inputText);
    		}

    		Control.closePopup();
    	}

    	const writable_props = ["closePopup", "showOKButton", "showCancelButton", "showinput", "popupText"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PopupDialog> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		inputText = this.value;
    		$$invalidate(4, inputText);
    	}

    	const click_handler = x => doClosePopup("Cancel");
    	const click_handler_1 = x => doClosePopup("OK");
    	const func = x => doClosePopup("Cancel");

    	$$self.$$set = $$props => {
    		if ("closePopup" in $$props) $$invalidate(6, closePopup = $$props.closePopup);
    		if ("showOKButton" in $$props) $$invalidate(0, showOKButton = $$props.showOKButton);
    		if ("showCancelButton" in $$props) $$invalidate(1, showCancelButton = $$props.showCancelButton);
    		if ("showinput" in $$props) $$invalidate(2, showinput = $$props.showinput);
    		if ("popupText" in $$props) $$invalidate(3, popupText = $$props.popupText);
    	};

    	$$self.$capture_state = () => ({
    		closePopup,
    		showOKButton,
    		showCancelButton,
    		showinput,
    		popupText,
    		inputText,
    		DialogOverlay,
    		DialogContent,
    		Control,
    		doClosePopup
    	});

    	$$self.$inject_state = $$props => {
    		if ("closePopup" in $$props) $$invalidate(6, closePopup = $$props.closePopup);
    		if ("showOKButton" in $$props) $$invalidate(0, showOKButton = $$props.showOKButton);
    		if ("showCancelButton" in $$props) $$invalidate(1, showCancelButton = $$props.showCancelButton);
    		if ("showinput" in $$props) $$invalidate(2, showinput = $$props.showinput);
    		if ("popupText" in $$props) $$invalidate(3, popupText = $$props.popupText);
    		if ("inputText" in $$props) $$invalidate(4, inputText = $$props.inputText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		showOKButton,
    		showCancelButton,
    		showinput,
    		popupText,
    		inputText,
    		doClosePopup,
    		closePopup,
    		input_input_handler,
    		click_handler,
    		click_handler_1,
    		func
    	];
    }

    class PopupDialog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			closePopup: 6,
    			showOKButton: 0,
    			showCancelButton: 1,
    			showinput: 2,
    			popupText: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PopupDialog",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*closePopup*/ ctx[6] === undefined && !("closePopup" in props)) {
    			console.warn("<PopupDialog> was created without expected prop 'closePopup'");
    		}

    		if (/*showOKButton*/ ctx[0] === undefined && !("showOKButton" in props)) {
    			console.warn("<PopupDialog> was created without expected prop 'showOKButton'");
    		}

    		if (/*showCancelButton*/ ctx[1] === undefined && !("showCancelButton" in props)) {
    			console.warn("<PopupDialog> was created without expected prop 'showCancelButton'");
    		}

    		if (/*showinput*/ ctx[2] === undefined && !("showinput" in props)) {
    			console.warn("<PopupDialog> was created without expected prop 'showinput'");
    		}

    		if (/*popupText*/ ctx[3] === undefined && !("popupText" in props)) {
    			console.warn("<PopupDialog> was created without expected prop 'popupText'");
    		}
    	}

    	get closePopup() {
    		throw new Error("<PopupDialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closePopup(value) {
    		throw new Error("<PopupDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showOKButton() {
    		throw new Error("<PopupDialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showOKButton(value) {
    		throw new Error("<PopupDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showCancelButton() {
    		throw new Error("<PopupDialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showCancelButton(value) {
    		throw new Error("<PopupDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showinput() {
    		throw new Error("<PopupDialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showinput(value) {
    		throw new Error("<PopupDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get popupText() {
    		throw new Error("<PopupDialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set popupText(value) {
    		throw new Error("<PopupDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\App.svelte generated by Svelte v3.31.2 */

    const { document: document_1$1 } = globals;
    const file$9 = "src\\components\\App.svelte";

    // (73:1) {#if infologShown}
    function create_if_block_4(ctx) {
    	let infolog;
    	let current;

    	infolog = new Infolog({
    			props: { message: /*infologMessage*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(infolog.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(infolog, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const infolog_changes = {};
    			if (dirty & /*infologMessage*/ 16) infolog_changes.message = /*infologMessage*/ ctx[4];
    			infolog.$set(infolog_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(infolog.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(infolog.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(infolog, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(73:1) {#if infologShown}",
    		ctx
    	});

    	return block;
    }

    // (97:1) {:else}
    function create_else_block_1$1(ctx) {
    	let authpage;
    	let current;
    	authpage = new AuthPage({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(authpage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(authpage, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(authpage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(authpage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(authpage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(97:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (77:1) {#if authenticated}
    function create_if_block_1$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*currentContents*/ ctx[5] && create_if_block_2$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*currentContents*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*currentContents*/ 32) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(77:1) {#if authenticated}",
    		ctx
    	});

    	return block;
    }

    // (78:2) {#if currentContents}
    function create_if_block_2$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_3$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*currentContents*/ ctx[5].type == "file") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(78:2) {#if currentContents}",
    		ctx
    	});

    	return block;
    }

    // (93:3) {:else}
    function create_else_block$1(ctx) {
    	let gitexplorer;
    	let current;

    	gitexplorer = new GitExplorer({
    			props: {
    				currentContents: /*currentContents*/ ctx[5]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(gitexplorer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gitexplorer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const gitexplorer_changes = {};
    			if (dirty & /*currentContents*/ 32) gitexplorer_changes.currentContents = /*currentContents*/ ctx[5];
    			gitexplorer.$set(gitexplorer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gitexplorer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gitexplorer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gitexplorer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(93:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (80:3) {#if currentContents.type == "file"}
    function create_if_block_3$1(ctx) {
    	let div;
    	let i;
    	let t;
    	let textedit;
    	let current;
    	let mounted;
    	let dispose;

    	textedit = new TextEdit({
    			props: {
    				currentFile: /*currentContents*/ ctx[5].file
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			i = element("i");
    			t = space();
    			create_component(textedit.$$.fragment);
    			attr_dev(i, "class", "fa fa-arrow-circle-left");
    			add_location(i, file$9, 81, 5, 2496);
    			attr_dev(div, "id", "editorback");
    			attr_dev(div, "class", "svelte-10hjznx");
    			add_location(div, file$9, 80, 4, 2468);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, i);
    			insert_dev(target, t, anchor);
    			mount_component(textedit, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(i, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const textedit_changes = {};
    			if (dirty & /*currentContents*/ 32) textedit_changes.currentFile = /*currentContents*/ ctx[5].file;
    			textedit.$set(textedit_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textedit.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textedit.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t);
    			destroy_component(textedit, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(80:3) {#if currentContents.type == \\\"file\\\"}",
    		ctx
    	});

    	return block;
    }

    // (101:1) {#if popupOpen && popupControl}
    function create_if_block$5(ctx) {
    	let popupdialog;
    	let current;

    	popupdialog = new PopupDialog({
    			props: {
    				popupText: /*popupControl*/ ctx[3].popupText,
    				showOKButton: /*popupControl*/ ctx[3].popupShowOK,
    				showCancelButton: /*popupControl*/ ctx[3].popupShowCancel,
    				showinput: /*popupControl*/ ctx[3].popupShowInput,
    				closePopup: /*popupControl*/ ctx[3].popupOnclose
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(popupdialog.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(popupdialog, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const popupdialog_changes = {};
    			if (dirty & /*popupControl*/ 8) popupdialog_changes.popupText = /*popupControl*/ ctx[3].popupText;
    			if (dirty & /*popupControl*/ 8) popupdialog_changes.showOKButton = /*popupControl*/ ctx[3].popupShowOK;
    			if (dirty & /*popupControl*/ 8) popupdialog_changes.showCancelButton = /*popupControl*/ ctx[3].popupShowCancel;
    			if (dirty & /*popupControl*/ 8) popupdialog_changes.showinput = /*popupControl*/ ctx[3].popupShowInput;
    			if (dirty & /*popupControl*/ 8) popupdialog_changes.closePopup = /*popupControl*/ ctx[3].popupOnclose;
    			popupdialog.$set(popupdialog_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(popupdialog.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(popupdialog.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(popupdialog, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(101:1) {#if popupOpen && popupControl}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let main;
    	let t0;
    	let current_block_type_index;
    	let if_block1;
    	let t1;
    	let t2;
    	let link;
    	let script;
    	let script_src_value;
    	let current;
    	let if_block0 = /*infologShown*/ ctx[1] && create_if_block_4(ctx);
    	const if_block_creators = [create_if_block_1$2, create_else_block_1$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*authenticated*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block2 = /*popupOpen*/ ctx[2] && /*popupControl*/ ctx[3] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			link = element("link");
    			script = element("script");
    			attr_dev(main, "class", "svelte-10hjznx");
    			add_location(main, file$9, 71, 0, 2274);
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css");
    			add_location(link, file$9, 111, 1, 3160);
    			if (script.src !== (script_src_value = "https://cdn.rawgit.com/beautify-web/js-beautify/v1.13.5/js/lib/beautify-html.js")) attr_dev(script, "src", script_src_value);
    			add_location(script, file$9, 114, 3, 3283);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t0);
    			if_blocks[current_block_type_index].m(main, null);
    			append_dev(main, t1);
    			if (if_block2) if_block2.m(main, null);
    			insert_dev(target, t2, anchor);
    			append_dev(document_1$1.head, link);
    			append_dev(document_1$1.head, script);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*infologShown*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*infologShown*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(main, t1);
    			}

    			if (/*popupOpen*/ ctx[2] && /*popupControl*/ ctx[3]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*popupOpen, popupControl*/ 12) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$5(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(main, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if_blocks[current_block_type_index].d();
    			if (if_block2) if_block2.d();
    			if (detaching) detach_dev(t2);
    			detach_dev(link);
    			detach_dev(script);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let parsed = queryString.parse(location.search);
    	let authenticated = false;
    	let infologShown = false;
    	let popupOpen = false;
    	let popupControl;
    	let infologMessage;
    	let currentContents = Control.currentContents;

    	function checkAuthentication() {
    		let cookies = cookie.parse(document.cookie);

    		if (cookies.nfrGitToken && cookies.nfrGitUser && cookies.nfrGitRepo) {
    			APIHelper.token = cookies.nfrGitToken;
    			APIHelper.user = cookies.nfrGitUser;
    			APIHelper.repo = cookies.nfrGitRepo;
    			$$invalidate(0, authenticated = true);

    			if (parsed && parsed.path) {
    				Control.openPath(parsed.path.toString());
    			} else {
    				Control.openPath(ROOT_FOLDER);
    			}
    		} else {
    			$$invalidate(0, authenticated = false);
    		}
    	}

    	Control.stateChange.subscribe(what => {
    		if (!what) {
    			Debug.log("APP - state changed what undefined: ", what);
    			return;
    		}

    		Debug.log("APP - state changed: ", what.action);

    		switch (what.action) {
    			case "signalAuthChanged":
    				checkAuthentication();
    				break;
    			case "showInfolog":
    				$$invalidate(4, infologMessage = what.infolog);
    				$$invalidate(1, infologShown = true);
    				setTimeout(
    					function () {
    						$$invalidate(1, infologShown = false);
    						$$invalidate(4, infologMessage = undefined);
    					},
    					2000
    				);
    				break;
    			case "showPopup":
    				$$invalidate(2, popupOpen = true);
    				$$invalidate(3, popupControl = what);
    				break;
    			case "closePopup":
    				$$invalidate(2, popupOpen = false);
    				$$invalidate(3, popupControl = undefined);
    				break;
    			case "pathChanged":
    				$$invalidate(5, currentContents = Control.currentContents);
    				break;
    		}
    	});

    	checkAuthentication();
    	Control.initOnPopState();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = x => {
    		Control.openPath(currentContents.parentPath(), true);
    	};

    	$$self.$capture_state = () => ({
    		queryString,
    		StringifyOptions: queryString.StringifyOptions,
    		cookie,
    		APIHelper,
    		AuthPage,
    		Control,
    		Debug,
    		Infolog,
    		GitExplorer,
    		ROOT_FOLDER,
    		TextEdit,
    		PopupDialog,
    		parsed,
    		authenticated,
    		infologShown,
    		popupOpen,
    		popupControl,
    		infologMessage,
    		currentContents,
    		checkAuthentication
    	});

    	$$self.$inject_state = $$props => {
    		if ("parsed" in $$props) parsed = $$props.parsed;
    		if ("authenticated" in $$props) $$invalidate(0, authenticated = $$props.authenticated);
    		if ("infologShown" in $$props) $$invalidate(1, infologShown = $$props.infologShown);
    		if ("popupOpen" in $$props) $$invalidate(2, popupOpen = $$props.popupOpen);
    		if ("popupControl" in $$props) $$invalidate(3, popupControl = $$props.popupControl);
    		if ("infologMessage" in $$props) $$invalidate(4, infologMessage = $$props.infologMessage);
    		if ("currentContents" in $$props) $$invalidate(5, currentContents = $$props.currentContents);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		authenticated,
    		infologShown,
    		popupOpen,
    		popupControl,
    		infologMessage,
    		currentContents,
    		click_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
