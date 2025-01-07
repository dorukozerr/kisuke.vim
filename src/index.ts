const stdin = process.stdin;
const stdout = process.stdout;

stdin.resume();
stdin.setEncoding('utf-8');

stdin.on('data', (data: string) => {
  try {
    const message = JSON.parse(data.trim());

    if (message.type === 'init') {
      sendResponse('Connected to TypeScript server!');
    } else if (message.type === 'message') {
      sendResponse(`Received: ${message.content}`);
    }
  } catch (e) {
    console.error('Error processing message:', e);
  }
});

const sendResponse = (content: string) => {
  const response = {
    type: 'response',
    content: content
  };

  stdout.write(JSON.stringify(response) + '\n');
};
