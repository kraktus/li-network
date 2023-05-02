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
    this.simulation = d3.forceSimulation();
    this.updateForces();
    //.force('collide', d3.forceCollide());
  }

  private updateForces() {
    // how does link `source` and `target` correlates to `nodes`, via `userId`
    const linkForce = d3
      .forceLink()
      .id((node: any) => node.userId)
      .distance(this.config.simulation.linkDistance);
    this.simulation
      .force('link', linkForce)
      .force(
        'charge',
        d3
          .forceManyBody()
          .strength(-this.config.simulation.strength)
          .distanceMax(2000)
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .alphaDecay(this.config.simulation.alphaDecay)
      .alphaTarget(this.config.simulation.alphaTarget);
  }

  // filtered out nodes and links
  private updateGraph(nodes: PlayerNode[], links: GameLink[]) {
    // @ts-ignore
    const colors = d3.scaleLinear().domain([0, 50]).range(['grey', 'red']);

    this.linkElements = this.linkGroup
      .selectAll('line')
      .data(
        links,
        (link: GameLink<PlayerNode>) => link.source.userId + link.target.userId
      )
      .join('line')
      .attr('stroke-width', (link: GameLink<PlayerNode>) => link.games)
      .attr('stroke', (link: GameLink<PlayerNode>) =>
        colors(Math.abs(link.score / link.games - 0.5) * 100)
      )
      .on('click', (_: MouseEvent, link: GameLink<PlayerNode>) => {
        window.open(
          `https://lichess.org/@/${link.source.userId}/search?players.a=${link.source.userId}&players.b=${link.target.userId}&mode=1`,
          '_blank'
        );
      });
    this.linkElements
      .append('title')
      .text(
        (link: GameLink<PlayerNode>) =>
          `${link.source}: ${link.score}/${link.games}`
      );

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
    this.nodeElements.append('title').text((node: PlayerNode) => node.userId);

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
        .scaleExtent([0.1, 8])
        .on('zoom', zoomed)
    );
  }

  async start() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.fireInterval(this.config.refreshInterval);
    await this.data.startSearch();
  }

  // in seconds
  private fireInterval(refreshInterval: number) {
    this.intervalId = setInterval(() => {
      if (
        this.config.searchOngoing &&
        this.config.refreshInterval == refreshInterval
      ) {
        this.redraw();
        console.log('refreshInterval', refreshInterval);
      } else {
        clearInterval(this.intervalId);
        this.intervalId = undefined;
        if (this.config.refreshInterval != refreshInterval) {
          this.fireInterval(this.config.refreshInterval);
        }
      }
    }, refreshInterval * 1000);
  }

  redraw() {
    const [nodes, links] = this.data.nodesAndLinks();
    try {
      this.updateGraph(nodes, links);
    } catch (e) {
      console.error('during update graph', e);
    }
    // forces need to be updated before setting links! (and maybe nodes, so be conservative)
    this.updateForces();

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

    this.simulation.restart();
  }
}
