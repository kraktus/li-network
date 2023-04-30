import * as d3 from 'd3';
import { getInfo } from './lichess.ts';

export interface PlayerNode extends d3.SimulationNodeDatum {
  userId: string; // lichess id
  status: 'tos' | 'disabled' | 'good' | undefined;
  alreadyDl: boolean;
  games: number; // number of games this user has played on Lichess
  involvement: number; // number of games this user has played against other players of the network
}

interface GameLink extends d3.SimulationLinkDatum<PlayerNode> {
  games: number; // number of games between the two players
  score: number; // score from the first player perspective (sorted alphabetically)
  createdAt: any; // timestamp of the last game checked, used to ensure we don't check twice the same game (is it necessary?)
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
      fx: width / 2,
      fy: height / 2,
    };
    this.links = {};
  }

  getInfo(playerIds: string[]) {
    getInfo(playerIds).then((res: any) => {
      res.map((user: any) => {
        //console.log("user api status", user)
        if (user.tosViolation) {
          this.nodes[user.id].status = 'tos';
        } else if (user.disabled) {
          this.nodes[user.id].status = 'disabled';
        } else {
          this.nodes[user.id].status = 'good';
        }
        try {
          this.nodes[user.id].games = Object.keys(user.perfs)
            .filter(x => !['puzzle', 'storm', 'streak', 'racer'].includes(x))
            .map(perfT => user.perfs[perfT].games)
            .reduce((a, b) => a + b);
        } catch (e) {
          this.nodes[user.id].games = 0;
          console.error(e, 'when trying to count games of ', user.id, user);
        }
      });
    });
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
        involvement: 0,
        status: undefined,
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
