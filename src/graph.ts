//import { select } from 'd3-selection';
import * as d3 from 'd3';
import { Config, defaultConfig } from './main.ts';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  label: string;
  level: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  strength: number;
}

const width = window.innerWidth;
const height = window.innerHeight;

const nodes: Node[] = [
  { id: 'mammal', group: 0, label: 'Mammals', level: 1 },
  { id: 'dog', group: 0, label: 'Dogs', level: 2 },
  { id: 'cat', group: 0, label: 'Cats', level: 2 },
  { id: 'fox', group: 0, label: 'Foxes', level: 2 },
  { id: 'elk', group: 0, label: 'Elk', level: 2 },
  { id: 'insect', group: 1, label: 'Insects', level: 1 },
  { id: 'ant', group: 1, label: 'Ants', level: 2 },
  { id: 'bee', group: 1, label: 'Bees', level: 2 },
  {
    id: 'fish',
    group: 2,
    label: 'Fish',
    level: 1,
    fx: width / 2,
    fy: height / 2,
  },
  { id: 'carp', group: 2, label: 'Carp', level: 2 },
  { id: 'pike', group: 2, label: 'Pikes', level: 2 },
];

const links: Link[] = [
  { target: 'mammal', source: 'dog', strength: 0.7 },
  { target: 'mammal', source: 'cat', strength: 0.7 },
  { target: 'mammal', source: 'fox', strength: 0.7 },
  { target: 'mammal', source: 'elk', strength: 0.7 },
  { target: 'insect', source: 'ant', strength: 0.7 },
  { target: 'insect', source: 'bee', strength: 0.7 },
  { target: 'fish', source: 'carp', strength: 0.7 },
  { target: 'fish', source: 'pike', strength: 0.7 },
  { target: 'cat', source: 'elk', strength: 0.1 },
  { target: 'carp', source: 'ant', strength: 0.1 },
  { target: 'elk', source: 'bee', strength: 0.1 },
  { target: 'dog', source: 'cat', strength: 0.1 },
  { target: 'fox', source: 'ant', strength: 0.1 },
  { target: 'pike', source: 'cat', strength: 0.1 },
];

class Graph {
  //readonly config: Config;

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

  constructor(readonly config: Config) {
    this.svg = d3.select('svg');
    this.svg.attr('width', width).attr('height', height);
    this.svg.append('g').attr('class', 'links');
    this.linkGroup = this.svg.append('g').attr('class', 'links');
    this.nodeGroup = this.svg.append('g').attr('class', 'nodes');
    this.textGroup = this.svg.append('g').attr('class', 'texts');
    // simulation setup with all forces
    const linkForce = d3
      .forceLink()
      .id((link: any) => link.id)
      .strength((link: any) => link.strength);
    this.simulation = d3
      .forceSimulation()
      .force('link', linkForce)
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2));
  }

  private updateGraph() {
    this.linkElements = this.linkGroup
      .selectAll('line')
      .data(links, (link: any) => link.target.id + link.source.id)
      .join('line')
      .attr('stroke-width', 1)
      .attr('stroke', 'rgba(50, 50, 50, 0.2)');

    this.nodeElements = this.nodeGroup
      .selectAll('circle')
      .data(nodes, (node: any) => node.id)
      .join('circle')
      .attr('r', 10)
      .attr('fill', (node: Node) => (node.level === 1 ? 'red' : 'gray'));

    this.textElements = this.textGroup
      .selectAll('text')
      .data(nodes, (node: any) => node.id)
      .join('text')
      .text((node: Node) => node.label)
      .attr('font-size', 15)
      .attr('dx', 15)
      .attr('dy', 4);

    const zoomed = (x: any) => {
      this.nodeGroup.attr('transform', x.transform);
      this.linkGroup.attr('transform', x.transform);
      this.textElements.attr('transform', x.transform);
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

  redraw() {
    this.updateGraph();

    this.simulation.nodes(nodes).on('tick', () => {
      this.nodeElements
        .attr('cx', (node: Node) => node.x)
        .attr('cy', (node: Node) => node.y);
      this.textElements
        .attr('x', (node: Node) => node.x)
        .attr('y', (node: Node) => node.y);
      this.linkElements
        .attr('x1', (link: any) => link.source.x)
        .attr('y1', (link: any) => link.source.y)
        .attr('x2', (link: any) => link.target.x)
        .attr('y2', (link: any) => link.target.y);
    });

    // @ts-ignore
    this.simulation.force('link')!.links(links);
    this.simulation.alphaTarget(0.7).restart();
  }
}

// last but not least, we call updateSimulation
// to trigger the initial render
new Graph(defaultConfig).redraw();
