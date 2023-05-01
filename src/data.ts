import * as d3 from 'd3';
import { Config } from './config.ts';
import { getInfo, getGames } from './lichess.ts';

interface Info {
  status: 'tos' | 'disabled' | 'good';
  games: number; // number of games this user has played on Lichess
}

export interface PlayerNode extends d3.SimulationNodeDatum {
  userId: string; // lichess id
  info?: Info;
  alreadyDl: boolean; // if the games of the players have already been imported, not the info!
  involvement: number; // number of games this user has played against other players of the network
}

interface GameLink extends d3.SimulationLinkDatum<PlayerNode> {
  games: number; // number of games between the two players
  score: number; // score from the first player perspective (sorted alphabetically)
  createdAt: number; // timestamp of the last game checked, used to ensure we don't check twice the same game (is it necessary?)
  plies: number; // total number of plies
}

export class Data {
  // keys are Lichess user id
  nodes: Record<string, PlayerNode>;
  // keys are `<first player sorted alphabitically>/<second player>`
  links: Record<string, GameLink>;

  constructor(readonly config: Config) {
    this.nodes = {};
    this.nodes[config.lichessId] = {
      userId: config.lichessId,
      fx: window.innerWidth / 2,
      fy: window.innerHeight / 2,
      alreadyDl: false,
      involvement: 0,
    };
    this.links = {};
  }

  private getInfo(playerIds: string[]) {
    getInfo(playerIds).then((res: any) => {
      res.map((user: any) => {
        let status: 'tos' | 'disabled' | 'good';
        let games;
        if (user.tosViolation) {
          status = 'tos';
        } else if (user.disabled) {
          status = 'disabled';
        } else {
          status = 'good';
        }
        try {
          games = Object.keys(user.perfs)
            .filter(x => !['puzzle', 'storm', 'streak', 'racer'].includes(x))
            .map(perfT => user.perfs[perfT].games)
            .reduce((a, b) => a + b);
        } catch (e) {
          games = 0;
          console.error(e, 'when trying to count games of ', user.id, user);
        }
        this.nodes[user.id].info = {
          status: status,
          games: games,
        };
      });
    });
  }

  async startSearch() {
    while (this.config.searchOngoing) {
      const userId = this.chooseNewPlayerDl();
      this.nodes[userId].alreadyDl = true;
      await getGames(userId, this.config.maxGame, this.onGame.bind(this));

      const usersWithoutInfo = Object.values(this.nodes)
        .filter((node: PlayerNode) => node.info === undefined)
        .map((node: PlayerNode) => node.userId);
      chunkArray(usersWithoutInfo, 300).forEach(this.getInfo.bind(this));
    }
  }

  private chooseNewPlayerDl(): string {
    return (
      Object.entries(this.nodes)
        .filter(entry => !entry[1].alreadyDl)
        // max_by of the poor
        .reduce((p1, p2) =>
          p1[1].involvement > p2[1].involvement ? p1 : p2
        )[0]
    );
  }

  private onGame(game: any) {
    // sorted alphabetically
    const players = [
      [game.players.white, 'white'],
      [game.players.black, 'black'],
    ].sort((a, b) => a[0].user.id.localeCompare(b[0].user.id));
    // store the outcome compared to the first player
    let score = 0;
    const plies = game.moves.split(' ').length;
    if (game.winner === undefined) {
      score = 0.5;
    } else if (game.winner === players[0][1]) {
      score = 1;
    }
    const linkId = `${players[0][0].user.id}/${players[1][0].user.id}`;
    let playerLink = this.links[linkId];
    // sanity check, look if we've already treated the game
    // do NOT change state of a global before
    if ((playerLink?.createdAt || game.createdAt) < game.createdAt) {
      return;
    }
    // update players' involvment
    players.forEach(p => {
      let id = p[0].user.id;
      this.nodes[id] = this.nodes[id] || {
        userId: id,
        involvement: 0,
      };
      this.nodes[id].involvement += 1;
    });
    if (playerLink === undefined) {
      playerLink = {
        games: 1,
        score: score,
        createdAt: game.createdAt,
        plies: plies,
        source: players[0][0].user.id,
        target: players[1][0].user.id,
      };
    } else {
      playerLink.games += 1;
      playerLink.score += score;
      playerLink.createdAt = game.createdAt;
      playerLink.plies += plies;
    }
    this.links[linkId] = playerLink;
  }
}

function chunkArray<T>(myArray: T[], chunk_size: number): T[][] {
  let index = 0;
  let buf = [];
  for (index = 0; index < myArray.length; index += chunk_size) {
    const myChunk = myArray.slice(index, index + chunk_size);
    buf.push(myChunk);
  }
  return buf;
}
