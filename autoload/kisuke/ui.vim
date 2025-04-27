let s:providers = [
      \ { 'name': 'Anthropic', 'models': ['Sonnet', 'Haiku', 'Opus'] },
      \ { 'name': 'Google', 'models': ['Pro-2.5-exp', 'Flash-2.0-exp','Flash-1.5', 'Flash-1.5-8b', 'Pro-1.5'] },
      \ { 'name': 'OpenAI', 'models': ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'] },
      \ ]

let s:kisuke = {}
let s:kisuke.state = {
      \ 'menu_items': [],
      \ 'menu_actions': {},
      \ 'current_provider': '',
      \ 'current_model': '',
      \ 'session_count': 0,
      \ 'previous_chats': []
      \}

func! kisuke#ui#render_buffer_menu(state, ...) abort
  call kisuke#buffer#prepare_menu_buffer()

  silent! %delete

  let g:kisuke.state.menu_items = []
  let g:kisuke.state.menu_actions = {}

  call setbufline(g:kisuke.state.buf_nr, line('$'), '•• ━━━━━━━━━━ ⟡ KISUKE ⟡ ━━━━━━━━━━ ••')
  call appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')

  if a:state ==# "not_configured"
    call s:add_menu_item('Configure the plugin', 'kisuke#ui#render_buffer_menu', 'configure_plugin')
  elseif a:state ==# "missing_api_key"
    let s:kisuke.state.current_provider = a:1
    let s:kisuke.state.current_model = a:2

    call appendbufline(g:kisuke.state.buf_nr, line('$'), [
          \ 'API key is missing for ' . s:kisuke.state.current_provider,
          \ 'Selected Model - ' . s:kisuke.state.current_model,
          \ ' '
          \ ])

    call s:add_menu_item('Save API key', 'kisuke#server#configure')
    call s:add_menu_item('Configure the plugin', 'kisuke#ui#render_buffer_menu', 'configure_plugin')
  elseif a:state ==# "eligible"
    let s:kisuke.state.current_provider = a:1
    let s:kisuke.state.current_model = a:2
    let s:kisuke.state.session_count = a:3

    call appendbufline(g:kisuke.state.buf_nr, line('$'), [
          \ 'Selected Provider - ' . s:kisuke.state.current_provider,
          \ 'Selected Model - ' . s:kisuke.state.current_model,
          \ ' '
          \ ])

    call s:add_menu_item('Start new session', 'kisuke#buffer#restore', { 'type': 'new_session' })

    if s:kisuke.state.session_count > 0
      call s:add_menu_item('Resume last session', 'kisuke#buffer#restore', { 'type': 'resume_last_session' })

      if s:kisuke.state.session_count > 1
        call s:add_menu_item('Load previous sessions', 'kisuke#buffer#restore', { 'type': 'load_sessions' })
      endif
    endif

    call s:add_menu_item('Configure the plugin', 'kisuke#ui#render_buffer_menu', 'configure_plugin')
  elseif a:state ==# 'configure_plugin'
    call appendbufline(g:kisuke.state.buf_nr, line('$'), 'Select AI Provider:')
    call appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')

    for provider in s:providers
      call s:add_menu_item(provider.name, 'kisuke#ui#select_provider', provider.name)
    endfor

    call appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
    call s:add_menu_item('Go back to main menu', 'kisuke#buffer#restore', { 'type': 'initialize' })
  elseif a:state ==# 'select_model'
    let l:models = []

    for provider in s:providers
      if provider.name ==# s:kisuke.state.current_provider
        let l:models = provider.models

        break
      endif
    endfor

    call appendbufline(g:kisuke.state.buf_nr, line('$'), 'Select Model for ' . s:kisuke.state.current_provider . ':')
    call appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')

    for model in models
      call s:add_menu_item(model, 'kisuke#ui#select_model', model)
    endfor

    call appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
    call s:add_menu_item('Go back to main menu', 'kisuke#buffer#restore', { 'type': 'initialize' })
  elseif a:state ==# 'render_sessions'
    let l:sessions = a:1

    for session in l:sessions
      call s:add_menu_item(session.name, 'kisuke#buffer#restore', {
            \ 'type': 'restore_session',
            \ 'payload': session.id
            \ })
    endfor

    call appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
    call s:add_menu_item('Go back to main menu', 'kisuke#buffer#restore', { 'type': 'initialize' })
  endif

  call appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
  call appendbufline(g:kisuke.state.buf_nr, line('$'), 'Press Enter to select an option')

  nnoremap <buffer> <CR> :call kisuke#ui#select_menu_option()<CR>
  nnoremap <buffer> j j
  nnoremap <buffer> k k

  setlocal nomodifiable
endfunc

func! s:add_menu_item(text, action, ...) abort
  let item_text = '✦ ' . a:text

  call add(g:kisuke.state.menu_items, item_text)

  let g:kisuke.state.menu_actions[item_text] = a:action

  if a:0 > 0
    let g:kisuke.state.menu_actions[item_text . '_data'] = a:1
  endif

  call appendbufline(g:kisuke.state.buf_nr, line('$'), item_text)
endfunc

func! kisuke#ui#select_menu_option() abort
  let line = getline('.')

  if stridx(line, '✦ ') != 0
    echo 'Not a valid menu option'

    return
  endif

  if has_key(g:kisuke.state.menu_actions, line)
    let Action = function(g:kisuke.state.menu_actions[line])

    if has_key(g:kisuke.state.menu_actions, line . '_data')
      call Action(g:kisuke.state.menu_actions[line . '_data'])
    else
      call Action()
    endif
  else
    echo 'Unhandled menu option: ' . line
  endif
endfunc

func! kisuke#ui#select_provider(provider) abort
  let s:kisuke.state.current_provider = a:provider

  call kisuke#ui#render_buffer_menu('select_model')
endfunc

func! kisuke#ui#select_model(model) abort
  let s:kisuke.state.current_model = a:model

  call kisuke#server#configure(s:kisuke.state.current_provider, s:kisuke.state.current_model)
endfunc
