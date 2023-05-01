//import { select } from 'd3-selection';
import * as d3 from 'd3';
import { Config } from './config.ts';
import { Data, PlayerNode, GameLink } from './data.ts';

const width = window.innerWidth;
const height = window.innerHeight;

export class Graph {
  svg: any;
  // SVG Elements
  linkElements: any;
  nodeElements: any;
  textElements: any;
  // we use svg groups to logically group the elements together
  linkGroup: any;
  nodeGroup: any;
  textGroup: any;
  simulation: any;
  data: Data;

  intervalId?: ReturnType<typeof setInterval>;

  constructor(readonly config: Config) {
    this.data = new Data(config);
    this.svg = d3.select('svg');
    this.svg.selectAll('*').remove();
    this.svg.attr('width', width).attr('height', height);
    this.svg.append('g').attr('class', 'links');
    this.linkGroup = this.svg.append('g').attr('class', 'links');
    this.nodeGroup = this.svg.append('g').attr('class', 'nodes');
    this.textGroup = this.svg.append('g').attr('class', 'texts');
    // how does link `source` and `target` correlates to `nodes`
    const linkForce = d3.forceLink().id((node: any) => node.userId);
    //.strength((link: any) => link.strength);
    this.simulation = d3
      .forceSimulation()
      .force('link', linkForce)
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2));
  }

  // filtered out nodes and links
  private updateGraph(nodes: PlayerNode[], links: GameLink[]) {
    this.linkElements = this.linkGroup
      .selectAll('line')
      .data(
        links,
        (link: GameLink<PlayerNode>) => link.source.userId + link.target.userId
      )
      .join('line')
      .attr('stroke-width', 1)
      .attr('stroke', 'rgba(50, 50, 50, 0.2)');

    this.nodeElements = this.nodeGroup
      .selectAll('circle')
      .data(nodes, (node: PlayerNode) => node.userId)
      .join('circle')
      .attr('r', 10)
      .attr('fill', (node: PlayerNode) => {
        if (node.userId == this.config.lichessId) {
          return 'blue';
        }
        switch (node.info?.status) {
          case 'tos':
            return 'orange';
          case 'disabled':
            return 'black';
          case 'good':
            return 'green';
          case undefined:
            return 'grey';
        }
      })
      .on('click', (_: MouseEvent, node: PlayerNode) =>
        window.open(`https://lichess.org/@/${node.userId}`, '_blank')
      );

    console.log('nodeElements', this.nodeElements);

    if (this.config.showUsernames) {
      this.textElements = this.textGroup
        .selectAll('text')
        .data(nodes, (node: PlayerNode) => node.userId)
        .join('text')
        .text((node: PlayerNode) => node.userId)
        .attr('font-size', 15)
        .attr('dx', 15)
        .attr('dy', 4);
    } else {
      this.textElements = this.textGroup.selectAll('text').remove();
    }

    const zoomed = ({ transform }: any) => {
      this.nodeGroup.attr('transform', transform);
      this.linkGroup.attr('transform', transform);
      this.textElements.attr('transform', transform);
    };

    this.svg.call(
      d3
        .zoom()
        .extent([
          [0, 0],
          [width, height],
        ])
        .scaleExtent([1, 8])
        .on('zoom', zoomed)
    );
  }

  async start() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.intervalId = setInterval(() => {
      if (this.config.searchOngoing) {
        this.redraw();
      } else {
        clearInterval(this.intervalId);
        this.intervalId = undefined;
      }
    }, 2000);
    await this.data.startSearch();
  }

  redraw() {
    const [nodes, links] = this.data.nodesAndLinks();
    console.log('nodes', nodes, 'links', links);
    try {
      this.updateGraph(nodes, links);
    } catch (e) {
      console.error('during update graph', e);
    }
    this.simulation.nodes(nodes).on('tick', () => {
      this.nodeElements
        .attr('cx', (node: PlayerNode) => node.x)
        .attr('cy', (node: PlayerNode) => node.y);
      this.textElements
        .attr('x', (node: PlayerNode) => node.x)
        .attr('y', (node: PlayerNode) => node.y);
      this.linkElements
        .attr('x1', (link: GameLink<PlayerNode>) => link.source.x)
        .attr('y1', (link: GameLink<PlayerNode>) => link.source.y)
        .attr('x2', (link: GameLink<PlayerNode>) => link.target.x)
        .attr('y2', (link: GameLink<PlayerNode>) => link.target.y);
    });

    // @ts-ignore
    try {
      this.simulation.force('link')!.links(links);
    } catch (e) {
      console.error('during force link', e);
    }
    this.simulation.alphaTarget(0.7).restart();
  }
}

//[
//   { userId: german11, fx: 720, fy: 160, alreadyDl: true, involvement: 39 },
//   { userId: alexchess1, involvement: 1 },
// ][
//   ({
//     games: 1,
//     score: 1,
//     createdAt: 1682938532891,
//     plies: 54,
//     source: alexchess1,
//     target: german11,
//   },
//   {
//     games: 1,
//     score: 0,
//     createdAt: 1682938411480,
//     plies: 21,
//     source: german11,
//     target: teddybasuel28,
//   })
// ];