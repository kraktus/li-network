export interface Config {
  searchOngoing: boolean;
  lichessId: string;
  maxGame: number;
  showUsernames: boolean;
  minVsGame: number;
  maxMeanPlies: number;
  maxAccountSeniority?: number; // max number of games the user has played

}

export const defaultConfig = {
  lichessId:
    new URLSearchParams(window.location.search).get('user') || 'german11',
  searchOngoing: false,
  maxGame: 200,
  showUsernames: false,
  minVsGame: 2,
  maxMeanPlies: 100
};
