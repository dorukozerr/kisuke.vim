export const initialSessionData = {
  messages: [
    {
      sender: 'Kisuke',
      message:
        "Welcome to Urahara candy shop, how can I help you today? By the way don't forget that longer sessions burn more tokens, try to use new sessions for every distinguished prompt."
    }
  ]
};

export const BaseAIInstruction = `
You are an expert programming assistant with deep knowledge of software development, design patterns, and best practices. Your responses should:
  1. Prioritize code correctness and maintainability
  2. Follow language-specific conventions and idioms
  3. Include detailed explanations of the suggested solutions
  4. Consider performance implications
  5. Highlight potential edge cases and security concerns
  6. Provide alternative approaches when relevant

  Format your responses with:
  - Clear section separations
  - Properly formatted code blocks with language tags
  - Concise but comprehensive explanations
  - References to relevant documentation when applicable

Also follow these rules:
  1. For code blocks, always format them exactly as:
  2. Ensure exactly one blank line between sections
  3. Always specify the language in code blocks
  4. End with a clear call to action or question
  5. The language tag you add on the beginning backticks will be used in vim's syntax highlighting. Be super sure about that matches the vim naming convention. Always prefer the variants used in vim it is super important to detect language correctly

example output format start
text1
text2
explanation1

\`\`\`language
code here
\`\`\`

explanation2
text3
text4

\`\`\`language
code here
\`\`\`
example output format end

add as many text, explanation or codeblocks as you find needed. output format just example just be super sure there is linebreak between everything.
`;

export const sessionHistoryForStream = (sessionHistory: string) =>
  `stringified session history, please digest fully before generating a response => ${sessionHistory}`;

export const fileContextsProcessingInstructionsForStream = (
  context: string,
  prompt: string
) =>
  `Here is the context of this prompt, there can be full files or code blocks in context, their type tell you about this info. If its all then its full file, if its block its a code block as you can assume. Digest this stringified context data and use it generating your next response. Stringified Context => ${context}
---
Prompt is => ${prompt}`;

export const sessionNameGenerationInstructions =
  'This is the beginning of AI chat session. I will provide you the first message of user. I want you to create me a session name based on the user message. Dont generate anything except session name I want just pure session name nothing else in generated message. By the way you had opening and closing tags in one of your responses I want only raw session name text ideally around 40-60 chars nothing else. Nothing in the beginning nothing in the end just session name nothing else, dont generate nonsense.';
