import { stdOutput } from '~/index';
import {
  // getConfig,
  writeError,
  writeTempJson
} from '~/utils/file-operations';
// import { getAnthropic } from '~/llm/providers/index.js';

export const llmSandbox = async () => {
  try {
    // const config = await getConfig();
    // const anthropic = getAnthropic({ apiKey: config.apiKeys.anthropic });

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
