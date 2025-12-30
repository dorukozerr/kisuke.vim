" TODO: Update models with ai sdk provider options for major providers
fu! kisuke#llm#get_options()
  retu [
        \ { 'name': 'Anthropic', 'models': [ 'Opus-4.5', 'Opus-4.1', 'Opus-4', 'Sonnet-4.5', 'Sonnet-4', 'Sonnet-3.7', 'Haiku-3.7', 'Opus-3.7' ] },
        \ { 'name': 'Google', 'models': [ 'gemini-2.5-pro', 'gemini-2.5-flash' ] },
        \ { 'name': 'OpenAI', 'models': [ 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo' ] },
        \ { 'name': 'Grok', 'models': [ 'Grok-4' ] }
        \ ]
endfu
