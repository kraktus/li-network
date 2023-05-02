export interface Config {
  searchOngoing: boolean;
  lichessId: string;
  maxGame: number;
  showUsernames: boolean;
  minVsGame: number;
  maxMeanPlies: number;
  maxAccountSeniority?: number; // max number of games the user has played
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
  simulation: {
    alphaTarget: 0.3,
    alphaDecay: 0.0228, // default value: https://devdocs.io/d3~7/d3-force#simulation_alphadecay
    strength: 120,
    linkDistance: 30,
  },
};
