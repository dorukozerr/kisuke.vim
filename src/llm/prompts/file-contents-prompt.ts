export const fileContentsPrompt = (context: string, prompt: string) =>
  `Contextual information for this request:
File contexts (type 'all' = complete file, type 'block' = code snippet): ${context}
User's request: ${prompt}`;
