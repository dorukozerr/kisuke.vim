// import { Anthropic } from '@anthropic-ai/sdk';
// import { TextDelta, InputJSONDelta } from '@anthropic-ai/sdk/resources';
//
// let config: { apiKey: string } | null = null;
// let anthropicClient: Anthropic | null = null;
//
// const stdin = process.stdin;
// const stdout = process.stdout;
//
// if (process.argv.length > 2) {
//   try {
//     config = JSON.parse(process.argv[2]);
//
//     if (config?.apiKey) {
//       anthropicClient = new Anthropic({
//         apiKey: config.apiKey
//       });
//     }
//   } catch (e) {
//     console.error('Error parsing config:', e);
//   }
// }
//
// stdin.resume();
// stdin.setEncoding('utf-8');
//
// stdin.on('data', async (data: string) => {
//   try {
//     const message = JSON.parse(data.trim());
//
//     if (message.type === 'init') {
//       sendResponse({
//         type: 'init',
//         content: 'Connected to TypeScript server!'
//       });
//     } else if (message.type === 'message') {
//       if (!anthropicClient) {
//         sendResponse({
//           type: 'error',
//           content:
//             'Error: Claude API not configured. Please run :KetaSetup first.'
//         });
//         return;
//       }
//
//       try {
//         const stream = anthropicClient.messages.stream({
//           model: 'claude-3-5-sonnet-latest',
//           max_tokens: 1024,
//           messages: [{ role: 'user', content: message.content }]
//         });
//
//         sendResponse({ type: 'stream_start' });
//
//         for await (const chunk of stream) {
//           if (chunk.type === 'content_block_delta') {
//             sendResponse({
//               type: 'stream_chunk',
//               content: (chunk.delta as { text: string }).text
//             });
//           }
//         }
//
//         sendResponse({ type: 'stream_end' });
//       } catch (e) {
//         sendResponse({
//           type: 'error',
//           content: `Error calling Claude API: ${(e as { message: string })?.message}`
//         });
//       }
//     }
//   } catch (e) {
//     console.error('Error processing message:', e);
//   }
// });
//
// const sendResponse = (response: {
//   type: string;
//   content?: string | TextDelta | InputJSONDelta;
// }) => {
//   stdout.write(JSON.stringify(response) + '\n');
// };

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
