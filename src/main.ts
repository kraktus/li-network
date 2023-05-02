import './style.css';
import './github.css';
import './graph.ts';
import { Config, defaultConfig } from './config.ts';
import { Graph } from './graph.ts';

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
const footer = h('div.dropup', [
  h('button.dropbtn', 'v: latest'),
  h('div.dropup-content', [
    h(
      'a',
      {
        attrs: {
          href: '/v0.1',
        },
      },
      'v: 0.1'
    ),
  ]),
]);
const rangeInput = (
  min: number,
  max: number,
  step: number,
  value: number,
  onInput: (e: any) => void = _ => {}
) =>
  h('input', {
    attrs: {
      type: 'range',
      min: min,
      max: max,
      step: step,
      value: value,
    },
    on: { input: onInput },
  });

class Controller {
  searchButtonLabel: 'Start' | 'Pause' | 'Restart';
  config: Config;
  inputValue: string; // temporary variable storage for `config.lichessId`
  graph?: Graph; // current graph if search is ongoing

  old: HTMLElement | VNode;

  constructor(elem: HTMLElement) {
    this.config = defaultConfig;
    this.searchButtonLabel = 'Start';
    this.old = elem;
    this.inputValue = this.config.lichessId;
  }
  redraw() {
    this.old = patch(this.old, this.view());
  }
  view(): VNode {
    const lichessIdInput = h('input', {
      attrs: {
        id: 'lichessId',
        type: 'text',
        autocomplete: 'off',
        value: this.config.lichessId,
      },
      on: {
        input: (e: any) => {
          this.inputValue = (e.target as HTMLInputElement).value;
          if (this.inputValue == this.config.lichessId) {
            this.config.searchOngoing
              ? (this.searchButtonLabel = 'Pause')
              : (this.searchButtonLabel = 'Restart');
          } else if (this.config.searchOngoing) {
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
            click: async () => {
              this.config.lichessId = this.inputValue.toLowerCase();
              console.log('inputValue', this.inputValue);

              if (this.searchButtonLabel == 'Restart') {
                this.searchButtonLabel = 'Pause';
              } else {
                if (this.searchButtonLabel == 'Pause') {
                  this.searchButtonLabel = 'Start';
                } else {
                  this.searchButtonLabel = 'Pause';
                }
                this.config.searchOngoing = !this.config.searchOngoing;
              }
              this.redraw();
              if (this.config.searchOngoing) {
                this.graph = new Graph(this.config);
                await this.graph.start();
                console.log('search stopped');
              }
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

    const advanced = label(
      h('details', [
        h('summary', strong('Advanced')),
        h('div', 'Alpha target: ' + this.config.simulation.alphaTarget),
        rangeInput(
          0,
          1,
          0.01,
          this.config.simulation.alphaTarget,
          this.simpleSimulUpdate('alphaTarget')
        ),
        h('div', 'Alpha decay: ' + this.config.simulation.alphaDecay),
        rangeInput(
          0.001,
          0.06,
          0.001,
          this.config.simulation.alphaDecay,
          this.simpleSimulUpdate('alphaDecay')
        ),
        h('div', 'Repulsion strength: ' + -this.config.simulation.strength),
        rangeInput(1, 200, 1, -this.config.simulation.strength, (e: any) => {
          // minus is important here!
          this.config.simulation.strength = -Number(
            (e.target as HTMLInputElement).value
          );
          this.redraw();
          this.graph?.redraw();
        }),
      ])
    );
    return controls(force(api), force(advanced), footer);
  }

  private simpleSimulUpdate(key: any) {
    return (e: any) => {
      // @ts-ignore
      console.log(key, this[key]);
      // @ts-ignore
      this.config.simulation[key] = Number(
        (e.target as HTMLInputElement).value
      );
      this.redraw();
      console.log('redrawn');
      this.graph?.redraw();
    };
  }
}

console.log('v0.2-dev');
const container = document.getElementById('container')!;
const ctrl = new Controller(container);
ctrl.redraw();
