import { generateText, stepCountIs, streamText } from 'ai';

// import { cleanup } from '~/index';
import { stdOutput } from '~/index';
import { PromptPayload } from '~/types';
import {
  getConfig,
  getHistory,
  getSession,
  writeError,
  writeFile,
  writeMcpLog
  // writeTempJson
} from '~/utils/file-operations';
import { SESSION_MAME_GENERATION_SYSTEM_PROMPT } from '~/utils/initials';
// import { setupMCPClients } from '~/llm/mcp/client';
import { KISUKE_SYSTEM_PROMPT } from '~/llm/prompts/system';
import {
  getAnthropicProdiver,
  getGoogleProdiver,
  getOpenAIProdiver,
  getXAIProdiver
} from '~/llm/providers';

export const processPrompt = async ({
  sessionId,
  prompt,
  context: _
}: PromptPayload) => {
  try {
    const [config, session] = await Promise.all([
      getConfig(),
      getSession(sessionId)
    ]);

    if (!session) throw new Error('Invalid session');
    if (!config || !('provider' in config) || !('model' in config))
      throw new Error('Invalid config');
    if (!('messages' in session)) throw new Error('Invalid session');

    const providerConfig = { apiKey: config.apiKeys[config.provider] };

    const model = {
      anthropic: getAnthropicProdiver(providerConfig),
      google: getGoogleProdiver(providerConfig),
      openai: getOpenAIProdiver(providerConfig),
      xai: getXAIProdiver(providerConfig)
    }[config.provider](config.model);

    // const { tools } = await setupMCPClients();

    const result = streamText({
      model,
      stopWhen: stepCountIs(10),
      // experimental_telemetry: { isEnabled: true },
      // tools,
      messages: [
        { role: 'system', content: KISUKE_SYSTEM_PROMPT },
        ...session.messages.map(
          ({ sender, message }) =>
            ({
              role: sender === 'Kisuke' ? 'assistant' : 'user',
              content: message
            }) as const
        ),
        { role: 'user', content: prompt }
      ]
    });

    let res = '';
    let toolCallCount = 0;
    let toolResultCount = 0;

    const output = (chunk: string) => {
      res += chunk;
      stdOutput({ type: 'response', payload: chunk });
    };

    const outputToolProgress = () => {
      const prefix = toolCallCount === 1 && toolResultCount === 0 ? '' : '\r';
      const status =
        toolResultCount === toolCallCount ? 'Complete' : 'Executing';
      stdOutput({
        type: 'response',
        payload: `${prefix}${toolResultCount}/${toolCallCount} Tools ${status}`
      });
    };

    stdOutput({ type: 'response', payload: 'stream_start' });

    for await (const part of result.fullStream) {
      switch (part.type) {
        case 'reasoning-start':
          output('Thinking: ');
          break;

        case 'reasoning-delta':
          output(part.text);
          break;

        case 'reasoning-end':
          output('\n');
          break;

        case 'text-start':
          break;

        case 'text-delta':
          output(part.text);
          break;

        case 'text-end':
          output('\n');
          break;

        case 'tool-approval-request':
          output(`⏳ Awaiting approval: ${part.toolCall.toolName}\n`);
          break;

        case 'tool-input-start':
          break;

        case 'tool-input-delta':
          break;

        case 'tool-input-end':
          break;

        case 'tool-call':
          toolCallCount++;
          outputToolProgress();
          break;

        case 'tool-result':
          toolResultCount++;
          outputToolProgress();
          break;

        case 'tool-error':
          // output(
          //   `✗ ${part.toolName}: ${
          //     part.error instanceof Error
          //       ? part.error.message
          //       : JSON.stringify(part.error)
          //   }\n`
          // );
          await writeMcpLog('tool-error', part);
          toolResultCount++;
          outputToolProgress();
          break;

        case 'error':
          output(
            `Error: ${
              part.error instanceof Error
                ? `${part.error.name}: ${part.error.message}`
                : JSON.stringify(part.error)
            }\n`
          );
          await writeError(part.error, 'llm_stream_text');
          break;

        case 'abort':
          output(`\nAborted: ${part.reason}\n`);
          break;
      }
    }

    await writeFile(
      `${sessionId}.json`,
      JSON.stringify({
        messages: [
          ...session.messages,
          { sender: 'User', message: prompt },
          { sender: 'Kisuke', message: res }
        ]
      })
    );

    if (session.messages.length === 1) {
      const history = await getHistory();

      if (history) {
        const { text: sessionName } = await generateText({
          model,
          messages: [
            { role: 'system', content: SESSION_MAME_GENERATION_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ]
        });

        const updatedHistory = history.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                name: `${new Date().toLocaleDateString()} - ${sessionName}`
              }
            : session
        );

        await writeFile(
          'history.json',
          JSON.stringify({ sessions: updatedHistory })
        );
      }
    }

    stdOutput({ type: 'response', payload: 'stream_end' });
    // await cleanup();
  } catch (error) {
    const e =
      error instanceof Error
        ? `${error.name} - ${error.message} - ${error.stack}`
        : JSON.stringify(error);

    await writeError(e, 'stream_error');

    stdOutput({ type: 'error', payload: e });

    // await cleanup();
  }
};
