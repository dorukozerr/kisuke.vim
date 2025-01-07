const stdin = process.stdin;
const stdout = process.stdout;

stdin.resume();
stdin.setEncoding('utf-8');

stdin.on('data', (data: string) => {
  const message = JSON.parse(data);

  if (message.type === 'init') {
    stdout.write(
      JSON.stringify({
        type: 'response',
        content: 'Hello from TypeScript!'
      }) + '\n'
    );
  }
});
