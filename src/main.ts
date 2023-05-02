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
const div = (...nodes: VNode[]) => h('div', nodes);
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
  searchButtonLabel: 'Start' | 'Stop' | 'Restart';
  config: Config;
  inputValue: string; // temporary variable storage for `config.lichessId`
  seniorityValue: number; // temporary variable storage for `config.maxAccountSeniority`
  graph?: Graph; // current graph if search is ongoing

  old: HTMLElement | VNode;

  constructor(elem: HTMLElement) {
    this.config = defaultConfig;
    this.searchButtonLabel = 'Start';
    this.old = elem;
    this.inputValue = this.config.lichessId;
    this.seniorityValue = 1000; // hack to display a value even when `maxAccountSeniority` is undefined
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
              ? (this.searchButtonLabel = 'Stop')
              : (this.searchButtonLabel = 'Restart');
          } else if (this.config.searchOngoing) {
            this.searchButtonLabel = 'Restart';
          }
          this.redraw();
        },
      },
    });
    const isStopLabel = this.searchButtonLabel == 'Stop';
    const startButton = h(
      'div',
      h(
        'button.chunky',
        {
          class: {
            stop: isStopLabel,
            start: !isStopLabel,
          },
          on: {
            click: async () => {
              this.config.lichessId = this.inputValue.toLowerCase();
              console.log('inputValue', this.inputValue);

              if (this.searchButtonLabel == 'Restart') {
                this.searchButtonLabel = 'Stop';
              } else {
                if (this.searchButtonLabel == 'Stop') {
                  this.searchButtonLabel = 'Start';
                } else {
                  this.searchButtonLabel = 'Stop';
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

    const api = div(
      strong('Api'),
      h('div', 'Lichess username'),
      lichessIdInput,
      startButton,
      h('div', 'Max number of games fetched by player: ' + this.config.maxGame),
      rangeInput(
        50,
        1000,
        10,
        this.config.maxGame,
        this.simpleConfigUpdate('maxGame')
      )
    );

    const filters = div(
      strong('Filters'),
      h(
        'div',
        'Minimum number of games played against each other: ' +
          this.config.minVsGame
      ),
      rangeInput(
        1,
        20,
        1,
        this.config.minVsGame,
        this.simpleConfigUpdate('minVsGame')
      ),
      h('div', 'Max mean number of plies: ' + this.config.maxMeanPlies),
      rangeInput(
        1,
        200,
        1,
        this.config.maxMeanPlies,
        this.simpleConfigUpdate('maxMeanPlies')
      ),
      h(
        'div',
        'Max number of total games played, for the account with the least games in the match: ' +
          this.seniorityValue
      ),
      h('div', [
        h('input', {
          attrs: {
            type: 'checkbox',
            checked: typeof this.config.maxAccountSeniority !== 'undefined',
          },
          on: {
            click: this.bind((_: any) => {
              if (typeof this.config.maxAccountSeniority === 'undefined') {
                this.config.maxAccountSeniority = this.seniorityValue;
              } else {
                this.config.maxAccountSeniority = undefined;
              }
            }),
          },
        }),
        h('span', 'Enable'),
      ]),
      rangeInput(
        100,
        10000,
        100,
        this.seniorityValue,
        this.bind(
          (e: any) =>
            (this.seniorityValue = Number((e.target as HTMLInputElement).value))
        )
      )
    );

    const display = div(
      strong('Display'),
      h('div', `Refresh interval: ${this.config.refreshInterval}s`),
      rangeInput(
        0.1,
        5,
        0.2,
        this.config.refreshInterval,
        this.simpleConfigUpdate('refreshInterval')
      ),
      h('div', [
        h('input', {
          attrs: {
            type: 'checkbox',
            checked: this.config.showUsernames,
          },
          on: {
            click: this.bind((_: any) => {
              this.config.showUsernames = !this.config.showUsernames;
            }),
          },
        }),
        h('span', 'Show usernames'),
      ]),
      h('div', [
        h('input', {
          attrs: {
            type: 'checkbox',
            checked: this.config.draggableNodes,
          },
          on: {
            click: this.bind((_: any) => {
              this.config.draggableNodes = !this.config.draggableNodes;
            }),
          },
        }),
        h('span', 'Draggable user nodes'),
      ])
    );

    const advanced = div(
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
        h('div', 'Repulsion strength: ' + this.config.simulation.strength),
        rangeInput(
          1,
          200,
          1,
          this.config.simulation.strength,
          this.simpleSimulUpdate('strength')
        ),
        h('div', 'Link distance: ' + this.config.simulation.linkDistance),
        rangeInput(
          1,
          100,
          1,
          this.config.simulation.linkDistance,
          this.simpleSimulUpdate('linkDistance')
        ),
      ])
    );
    return controls(
      force(api),
      force(filters),
      force(display),
      force(advanced),
      footer
    );
  }

  private bind(f: (e: any) => void) {
    return (e: any) => {
      // @ts-ignore
      f(e);
      this.redraw();
      this.graph?.redraw();
    };
  }

  private simpleSimulUpdate(key: string) {
    return this.bind((e: any) => {
      // @ts-ignore
      this.config[key] = Number((e.target as HTMLInputElement).value);
    });
  }

  private simpleConfigUpdate(key: any) {
    return this.bind((e: any) => {
      // @ts-ignore
      this.config.simulation[key] = Number(
        (e.target as HTMLInputElement).value
      );
    });
  }
}

console.log('v0.2-dev');
const container = document.getElementById('container')!;
const ctrl = new Controller(container);
ctrl.redraw();
