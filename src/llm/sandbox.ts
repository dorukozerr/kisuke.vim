// import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

import { stdOutput } from '~/index';
import {
  // getConfig,
  writeError,
  writeTempJson
} from '~/utils/file-operations';
// import { getAnthropic } from '~/llm/providers/index.js';
// import { stdioMcpClient } from '~/llm/mcp/client/stdio-client';

// import '~/llm/mcp/server/elicitation-example';

export const llmSandbox = async () => {
  try {
    // const config = await getConfig();
    // const anthropic = getAnthropic({ apiKey: config.apiKeys.anthropic });
    // const client = await stdioMcpClient();

    // const wtf1 = await client.listTools();
    // const wtf2 = client.getServerCapabilities();

    // const toolResult = await client.request(
    //   {
    //     method: 'tools/call',
    //     params: { name: 'select_favorite_editor', arguments: {} }
    //   },
    //   CallToolResultSchema
    // );

    // console.info(JSON.stringify({ wtf1, wtf2, toolResult }, null, 2));

    stdOutput({ type: 'response', payload: 'stream_start' });
    await writeTempJson({ type: 'response', payload: 'stream_start' });

    stdOutput({ type: 'response', payload: 'temp' });
    await writeTempJson({ type: 'response', payload: 'temp' });

    stdOutput({ type: 'response', payload: 'stream_end' });
    await writeTempJson({ type: 'response', payload: 'stream_end' });

    // const result = streamText({
    //   model: anthropic('claude-opus-4-5'),
    //   messages: [
    //     {
    //       role: 'system',
    //       content:
    //         BaseAIInstruction + sessionHistoryForStream(JSON.stringify(session))
    //     },
    //     {
    //       role: 'user',
    //       content: context
    //         ? fileContextsProcessingInstructionsForStream(
    //             JSON.stringify(context),
    //             prompt
    //           )
    //         : prompt
    //     }
    //   ]
    // });

    // let res = '';

    // for await (const textPart of result.textStream) {
    //   res += textPart;
    //   stdOutput({ type: 'response', payload: textPart });
    // }

    // await writeFile(
    //   `${sessionId}.json`,
    //   JSON.stringify({
    //     messages: [
    //       ...session.messages,
    //       {
    //         sender: 'User',
    //         message: prompt,
    //         ...(context.length ? { referenceCount: context.length } : {})
    //       },
    //       {
    //         sender: 'Kisuke',
    //         message: res
    //       }
    //     ]
    //   })
    // );
  } catch (error) {
    const e =
      error instanceof Error
        ? `${error.name} - ${error.message}`
        : JSON.stringify(error);

    await writeError(e, 'stream_error');

    stdOutput({ type: 'error', payload: e });
  }
};
