import './style.css';

import {
  init,
  classModule,
  propsModule,
  styleModule,
  eventListenersModule,
  h,
  VNode,
} from 'snabbdom';

const patch = init([
  // Init patch function with chosen modules
  classModule, // makes it easy to toggle classes
  propsModule, // for setting properties on DOM elements
  styleModule, // handles styling on elements with support for animations
  eventListenersModule, // attaches event listeners
]);

const container = document.getElementById('container')!;

const controls = (...nodes: VNode[]) => h('div.controls', nodes);
const force = (...nodes: VNode[]) => h('div.force', nodes);
const label = (...nodes: VNode[]) => h('label', nodes);

// <input type="text" id="lichessId" autocomplete="off" />

const lichessId = h('input', {
  attrs: { name: 'lichessId', autocomplete: 'off' },
});
const startButton = h('div', h('button.start', 'Start'));

const api = label(
  h('strong', 'Api'),
  h('div', 'Lichess username'),
  lichessId,
  startButton
);
patch(container, controls(force(api)));
