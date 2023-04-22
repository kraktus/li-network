import './style.css';

import { init, classModule, propsModule, styleModule, eventListenersModule, h } from 'snabbdom';

const patch = init([
  // Init patch function with chosen modules
  classModule, // makes it easy to toggle classes
  propsModule, // for setting properties on DOM elements
  styleModule, // handles styling on elements with support for animations
  eventListenersModule, // attaches event listeners
]);

const container = document.getElementById('container');

const vnode = h('div#container.two.classes', { on: { click: console.log('test') } }, [
  h('span', { style: { fontWeight: 'bold' } }, 'This is bold'),
  ' and this is just normal text',
  h('a', { props: { href: '/foo' } }, "I'll take you places!"),
]);
// Patch into empty DOM element – this modifies the DOM as a side effect
patch(container, vnode);

// <input type="text" id="lichessId" autocomplete="off" />

const lichessId = h('input', {
  on: { click: console.log('test-bar') },
  attrs: { id: 'lichessId', autocomplete: 'off' },
});
const startButton = h(
  'button.start',
  'test'
);
const newVnode = h('div', [lichessId, startButton]);
// Second `patch` invocation
patch(vnode, newVnode); // Snabbdom efficiently updates the old view to the new state
