const stdin = process.stdin;
const stdout = process.stdout;

stdin.resume();
stdin.setEncoding('utf-8');

stdin.on('data', async (data: string) => {
  try {
    const payload = JSON.parse(data);

    await delay(2000);

    if (payload.type === 'initialize') {
      sendReply({
        type: 'initialize',
        payload: 'Server initialized.'
      });
    }

    if (payload.type === 'prompt') {
      sendReply({
        type: 'response',
        payload: `Received: ${payload.input}`
      });
    }
  } catch (error) {
    sendReply({
      type: 'error',
      payload: `Unknown server error, ${(error as { message?: string })?.message}`
    });
  }
});

const sendReply = (reply: { type: string; payload: string }) => {
  stdout.write(JSON.stringify(reply) + '\n');
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
