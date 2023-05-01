const headers = new Headers({
  accept: 'application/x-ndjson',
});
const options = {
  headers: headers,
};

// @ts-ignore
const readStream = processLine => response => {
  const stream = response.body.getReader();
  const matcher = /\r?\n/;
  const decoder = new TextDecoder();
  let buf = '';
  const loop = () =>
    stream.read().then(({ done, value }: { done: boolean; value: any }) => {
      if (done) {
        if (buf.length > 0) processLine(JSON.parse(buf));
      } else {
        const chunk = decoder.decode(value, {
          stream: true,
        });
        buf += chunk;

        const parts = buf.split(matcher);
        buf = parts.pop()!;
        for (const i of parts.filter(p => p)) processLine(JSON.parse(i));
        return loop();
      }
    });

  return loop();
};

export async function getGames(
  userId: string,
  maxGame: number
  //handler: (game: any) => void
) {
  console.log('player searching', userId);
  const response = await fetch(
    `https://lichess.org/api/games/user/${userId}?max=${maxGame}&rated=true&tags=false`,
    options
  );
  console.log('to text');
  const text = await response.text();
  console.log(text);
  console.log('to games');
  console.log(text.split('\n'));
  let gamesArray = text.split('\n');
  gamesArray.pop(); // last line is empty
  console.log('after games');
  return gamesArray.map(t => JSON.parse(t));
}

export async function getInfo(playerIds: string[]) {
  const response = await fetch('https://lichess.org/api/users', {
    method: 'POST',
    body: playerIds.join(),
  });
  return await response.json();
}
