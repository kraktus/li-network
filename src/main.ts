import './style.css';
import './graph.ts';

import {
  init,
  classModule,
  propsModule,
  attributesModule,
  styleModule,
  eventListenersModule,
  h,
  VNode,
} from 'snabbdom';

const patch = init([
  // Init patch function with chosen modules
  classModule, // makes it easy to toggle classes
  propsModule, // for setting properties on DOM elements
  attributesModule,
  styleModule, // handles styling on elements with support for animations
  eventListenersModule, // attaches event listeners
]);

const controls = (...nodes: VNode[]) => h('div.controls', nodes);
const force = (...nodes: VNode[]) => h('div.force', nodes);
const label = (...nodes: VNode[]) => h('label', nodes);
const strong = (v: string | VNode) => h('strong', v);

export interface Config {
  searchOngoing: boolean;
  lichessId: string;
}

export const defaultConfig: Config = {
  lichessId:
    new URLSearchParams(window.location.search).get('user') || 'german11',
  searchOngoing: false,
};

class Controller {
  searchButtonLabel: 'Start' | 'Pause' | 'Restart';
  config: Config;
  old: HTMLElement | VNode;

  constructor(elem: HTMLElement) {
    this.config = defaultConfig;
    this.searchButtonLabel = 'Start';
    this.old = elem;
  }
  redraw() {
    this.old = patch(this.old, this.view());
  }
  view(): VNode {
    let inputValue = this.config.lichessId;
    const lichessIdInput = h('input', {
      attrs: {
        id: 'lichessId',
        type: 'text',
        autocomplete: 'off',
        value: this.config.lichessId,
      },
      on: {
        input: (e: any) => {
          inputValue = (e.target as HTMLInputElement).value;
          if (inputValue == this.config.lichessId) {
            this.config.searchOngoing
              ? (this.searchButtonLabel = 'Pause')
              : (this.searchButtonLabel = 'Restart');
          } else {
            this.searchButtonLabel = 'Restart';
          }
          this.redraw();
        },
      },
    });
    const isPauseLabel = this.searchButtonLabel == 'Pause';
    const startButton = h(
      'div',
      h(
        'button.chunky',
        {
          class: {
            pause: isPauseLabel,
            start: !isPauseLabel,
          },
          on: {
            click: () => {
              this.config.lichessId = inputValue;

              if (this.searchButtonLabel == 'Restart') {
                this.searchButtonLabel = 'Start';
              } else {
                if (this.searchButtonLabel == 'Pause') {
                  this.searchButtonLabel = 'Start';
                } else {
                  this.searchButtonLabel = 'Pause';
                }
                this.config.searchOngoing = !this.config.searchOngoing;
              }
              this.redraw();
            },
          },
        },
        this.searchButtonLabel
      )
    );

    const api = label(
      strong('Api'),
      h('div', 'Lichess username'),
      lichessIdInput,
      startButton
    );
    return controls(force(api));
  }
}

console.log('v0.2-dev');
const container = document.getElementById('container')!;
const ctrl = new Controller(container);
ctrl.redraw();
