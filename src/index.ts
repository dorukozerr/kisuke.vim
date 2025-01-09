const stdin = process.stdin;
const stdout = process.stdout;

stdin.resume();
stdin.setEncoding('utf-8');

stdin.on('data', async (data: string) => {
  try {
    const message = JSON.parse(data);

    await delay(2000);

    if (message.type === 'init') {
      sendResponse({
        type: 'init',
        content: 'init testing'
      });
    } else if (message.type === 'message') {
      sendResponse({
        type: 'response',
        content: `Received: ${message.content}`
      });
    }
  } catch (e) {
    console.error('Error processing message:', e);
  }
});

const sendResponse = (response: { type: string; content: string }) => {
  stdout.write(JSON.stringify(response) + '\n');
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
