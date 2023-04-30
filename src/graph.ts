//import { select } from 'd3-selection';
import * as d3 from 'd3';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  label: string;
  level: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  strength: number;
}

const baseNodes: Node[] = [
  { id: 'mammal', group: 0, label: 'Mammals', level: 1 },
  { id: 'dog', group: 0, label: 'Dogs', level: 2 },
  { id: 'cat', group: 0, label: 'Cats', level: 2 },
  { id: 'fox', group: 0, label: 'Foxes', level: 2 },
  { id: 'elk', group: 0, label: 'Elk', level: 2 },
  { id: 'insect', group: 1, label: 'Insects', level: 1 },
  { id: 'ant', group: 1, label: 'Ants', level: 2 },
  { id: 'bee', group: 1, label: 'Bees', level: 2 },
  { id: 'fish', group: 2, label: 'Fish', level: 1 },
  { id: 'carp', group: 2, label: 'Carp', level: 2 },
  { id: 'pike', group: 2, label: 'Pikes', level: 2 },
];

const baseLinks: Link[] = [
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

const nodes = [...baseNodes];
let links = [...baseLinks];

function getNeighbors(node: Node) {
  console.log('selected node', node);
  return baseLinks.reduce(
    function (neighbors: string[], link: Link) {
      console.log(link);
      // @ts-ignore
      if (link.target.id === node.id) {
        // @ts-ignore
        neighbors.push(link.source.id);
        // @ts-ignore
      } else if (link.source.id === node.id) {
        // @ts-ignore
        neighbors.push(link.target.id);
      }
      return neighbors;
    },
    [node.id]
  );
}

function isNeighborLink(node: Node, link: any) {
  return link.target.id === node.id || link.source.id === node.id;
}

function getNodeColor(node: Node, neighbors: string[]) {
  if (neighbors.indexOf(node.id) > -1) {
    return node.level === 1 ? 'blue' : 'green';
  }

  return node.level === 1 ? 'red' : 'gray';
}

function getLinkColor(node: Node, link: any) {
  return isNeighborLink(node, link) ? 'green' : '#E5E5E5';
}

function getTextColor(node: Node, neighbors: any) {
  return Array.isArray(neighbors) && neighbors.indexOf(node.id) > -1
    ? 'green'
    : 'black';
}

const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select('svg');
svg.attr('width', width).attr('height', height);

let linkElements: any;
let nodeElements: any;
let textElements: any;

// we use svg groups to logically group the elements together
const linkGroup = svg.append('g').attr('class', 'links');
const nodeGroup = svg.append('g').attr('class', 'nodes');
const textGroup = svg.append('g').attr('class', 'texts');

// we use this reference to select/deselect
// after clicking the same element twice
let selectedId: any;

// simulation setup with all forces
const linkForce = d3
  .forceLink()
  .id(function (link: any) {
    return link.id;
  })
  .strength(function (link: any) {
    return link.strength;
  });

const simulation = d3
  .forceSimulation()
  .force('link', linkForce)
  .force('charge', d3.forceManyBody().strength(-120))
  .force('center', d3.forceCenter(width / 2, height / 2));

// const dragDrop = d3
//   .drag()
//   .on('start', function (node: Node) {
//     node.fx = node.x;
//     node.fy = node.y;
//   })
//   .on('drag', function (node: Node) {
//     // simulation.alphaTarget(0.7).restart();
//     // node.fx = d3.event.x;
//     // node.fy = d3.event.y;
//   });
// .on('end', function (node) {
//   if (!d3.event.active) {
//     simulation.alphaTarget(0);
//   }
//   node.fx = null;
//   node.fy = null;
// });

// select node is called on every click
// we either update the data according to the selection
// or reset the data if the same node is clicked twice
function selectNode(_: MouseEvent, selectedNode: Node) {
  if (selectedId === selectedNode.id) {
    selectedId = undefined;
    resetData();
    updateSimulation();
  } else {
    selectedId = selectedNode.id;
    updateData(selectedNode);
    updateSimulation();
  }

  const neighbors = getNeighbors(selectedNode);
  console.log('neighbors', neighbors);

  // we modify the styles to highlight selected nodes
  nodeElements.attr('fill', function (node: Node) {
    return getNodeColor(node, neighbors);
  });
  textElements.attr('fill', function (node: Node) {
    return getTextColor(node, neighbors);
  });
  linkElements.attr('stroke', function (link: Link) {
    return getLinkColor(selectedNode, link);
  });
}

// this helper simple adds all nodes and links
// that are missing, to recreate the initial state
function resetData() {
  const nodeIds = nodes.map(function (node: Node) {
    return node.id;
  });

  baseNodes.forEach(function (node: Node) {
    if (nodeIds.indexOf(node.id) === -1) {
      nodes.push(node);
    }
  });

  links = baseLinks;
}

// diffing and mutating the data
function updateData(selectedNode: Node) {
  const neighbors = getNeighbors(selectedNode);
  const newNodes = baseNodes.filter(function (node: Node) {
    return neighbors.indexOf(node.id) > -1 || node.level === 1;
  });

  const diff = {
    removed: nodes.filter(function (node: Node) {
      return newNodes.indexOf(node) === -1;
    }),
    added: newNodes.filter(function (node: Node) {
      return nodes.indexOf(node) === -1;
    }),
  };

  diff.removed.forEach(function (node: Node) {
    nodes.splice(nodes.indexOf(node), 1);
  });
  diff.added.forEach(function (node: Node) {
    nodes.push(node);
  });

  links = baseLinks.filter(function (link: any) {
    return (
      link.target.id === selectedNode.id || link.source.id === selectedNode.id
    );
  });
}

function updateGraph() {
  // links
  linkElements = linkGroup
    .selectAll('line')
    .data(links, function (link: any) {
      return link.target.id + link.source.id;
    })
    .join('line')
    .attr('stroke-width', 1)
    .attr('stroke', 'rgba(50, 50, 50, 0.2)');
  // nodes
  nodeElements = nodeGroup
    .selectAll('circle')
    .data(nodes, (node: any) => node.id)
    .join('circle')
    .attr('r', 10)
    .attr('fill', function (node: Node) {
      return node.level === 1 ? 'red' : 'gray';
    })
    //.call(dragDrop)
    // we link the selectNode method here
    // to update the graph on every click
    .on('click', selectNode);

  // texts
  textElements = textGroup
    .selectAll('text')
    .data(nodes, (node: any) => node.id)
    .join('text')
    .text(function (node: Node) {
      return node.label;
    })
    .attr('font-size', 15)
    .attr('dx', 15)
    .attr('dy', 4);
}

function updateSimulation() {
  updateGraph();

  simulation.nodes(nodes).on('tick', () => {
    nodeElements
      .attr('cx', (node: Node) => node.x)
      .attr('cy', (node: Node) => node.y);
    textElements
      .attr('x', (node: Node) => node.x)
      .attr('y', (node: Node) => node.y);
    linkElements
      .attr('x1', (link: any) => link.source.x)
      .attr('y1', (link: any) => link.source.y)
      .attr('x2', (link: any) => link.target.x)
      .attr('y2', (link: any) => link.target.y);
  });

  // @ts-ignore
  simulation.force('link')!.links(links);
  simulation.alphaTarget(0.7).restart();
}

// last but not least, we call updateSimulation
// to trigger the initial render
updateSimulation();
