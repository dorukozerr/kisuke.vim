export const INITIAL_SESSION_DATA = {
  messages: [
    {
      sender: 'Kisuke' as const,
      message: 'How can I help you?'
    }
  ]
};

export const SESSION_MAME_GENERATION_SYSTEM_PROMPT =
  'Create a brief session title (max 8 words) describing the main programming topic from the user message. Output ONLY the title, no explanations or formatting. Examples: "TypeScript Error Handling", "React Component Optimization", "Database Query Performance". Your job on this prompt is only generating a title for the active session, do not generate and include a answer for user prompt to your output. Your output must be session name only nothing else.';
