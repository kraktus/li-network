export interface Config {
  searchOngoing: boolean;
  lichessId: string;
  maxGame: number; // max number of games to fetch per player
  showUsernames: boolean;
  refreshInterval: number; // in seconds, time between two refresh
  minVsGame: number;
  maxMeanPlies: number;
  maxAccountSeniority?: number; // max number of games the user has played
  draggableNodes: boolean;
  simulation: Simulation;
}

interface Simulation {
  alphaTarget: number;
  alphaDecay: number;
  strength: number; // absolute value of the repulsive force between nodes
  linkDistance: number;
}

export const defaultConfig = {
  lichessId:
    new URLSearchParams(window.location.search).get('user') || 'german11',
  searchOngoing: false,
  maxGame: 200,
  showUsernames: false,
  minVsGame: 2,
  maxMeanPlies: 100,
  refreshInterval: 1.5,
  draggableNodes: true,
  simulation: {
    alphaTarget: 0.15,
    alphaDecay: 0.0228, // default value: https://devdocs.io/d3~7/d3-force#simulation_alphadecay
    strength: 120,
    linkDistance: 30,
  },
};
