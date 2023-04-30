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

function chunkArray<T>(myArray: T[], chunk_size: number): T[][] {
  let index = 0;
  let buf = [];
  for (index = 0; index < myArray.length; index += chunk_size) {
    const myChunk = myArray.slice(index, index + chunk_size);
    buf.push(myChunk);
  }
  return buf;
}

export async function getGames(
  userId: string,
  maxGame: number,
  handler: (game: any) => void
) {
  console.log('player searching', userId);
  return await fetch(
    `https://lichess.org/api/games/user/${userId}?max=${maxGame}&rated=true&tags=false`,
    options
  ).then(readStream(handler));
}

export async function getInfo(playerIds: string[]) {
  const response = await fetch('https://lichess.org/api/users', {
    method: 'POST',
    body: playerIds.join(),
  });
  return response.json();
}
