func! kisuke#menu#unconfigured_menu()
  return [
        \ '> Welcome to Urahara candy shop',
        \ ' ',
        \ '➤ Select Provider',
        \ ' ',
        \ 'Press Enter to select an option'
        \ ]
endfunc

func! kisuke#menu#provider_selection()
  return [
        \ '> Welcome to Urahara candy shop',
        \ ' ',
        \ '➤ Anthropic',
        \ ' ',
        \ '➤ Back',
        \ 'Press Enter to select an option'
        \ ]
endfunc

func! kisuke#menu#model_selection()
  return [
        \ '> Welcome to Urahara candy shop',
        \ ' ',
        \ '➤ claude-haiku-3-5-latest',
        \ '➤ claude-sonnet-3-5-latest',
        \ '➤ claude-3-opus-latest',
        \ ' ',
        \ '➤ Back',
        \ 'Press Enter to select an option'
        \ ]
endfunc

func! kisuke#menu#api_key_setup()
  return [
        \ '> Welcome to Urahara candy shop',
        \ ' ',
        \ '➤ Enter API Key',
        \ ' ',
        \ '➤ Back',
        \ 'Press Enter to select an option'
        \ ]
endfunc

func! kisuke#menu#main()
  return [
        \ '> Welcome to Urahara candy shop',
        \ ' ',
        \ '➤ Create new session',
        \ '➤ Load last session',
        \ '➤ List all sessions',
        \ '➤ Configure settings',
        \ ' ',
        \ 'Press Enter to select an option'
        \ ]
endfunc




