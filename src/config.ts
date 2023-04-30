export interface Config {
  searchOngoing: boolean;
  lichessId: string;
}

export const defaultConfig = {
  lichessId:
    new URLSearchParams(window.location.search).get('user') || 'german11',
  searchOngoing: false,
};
