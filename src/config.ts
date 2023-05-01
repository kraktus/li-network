export interface Config {
  searchOngoing: boolean;
  lichessId: string;
  maxGame: number;
}

export const defaultConfig = {
  lichessId:
    new URLSearchParams(window.location.search).get('user') || 'german11',
  searchOngoing: false,
  maxGame: 3,
};
