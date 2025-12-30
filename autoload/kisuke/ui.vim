let s:kisuke = {}
let s:kisuke.state = {
      \ 'menu_items': [],
      \ 'menu_actions': {},
      \ 'current_provider': '',
      \ 'current_model': '',
      \ 'session_count': 0,
      \ 'previous_chats': []
      \ }

fu! kisuke#ui#render_buffer_menu(state, ...) abort
  cal kisuke#buffer#prepare_menu_buffer()

  silent! %delete

  let s:providers = kisuke#llm#get_options()

  let g:kisuke.state.menu_items = []
  let g:kisuke.state.menu_actions = {}

  cal setbufline(g:kisuke.state.buf_nr, line('$'), '•• ━━━━━━━━━━ ⟡ KISUKE ⟡ ━━━━━━━━━━ ••')
  cal appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')

  if a:state ==# "not_configured"
    cal s:add_menu_item('Configure the plugin', 'kisuke#ui#render_buffer_menu', 'configure_plugin')
  elsei a:state ==# "missing_api_key"
    let s:kisuke.state.current_provider = a:1
    let s:kisuke.state.current_model = a:2

    cal appendbufline(g:kisuke.state.buf_nr, line('$'), [
          \ 'API key is missing for ' . s:kisuke.state.current_provider,
          \ 'Selected Model - ' . s:kisuke.state.current_model,
          \ ' '
          \ ])

    cal s:add_menu_item('Save API key', 'kisuke#server#configure')
    cal s:add_menu_item('Configure the plugin', 'kisuke#ui#render_buffer_menu', 'configure_plugin')
  elsei a:state ==# "eligible"
    let s:kisuke.state.current_provider = a:1
    let s:kisuke.state.current_model = a:2
    let s:kisuke.state.session_count = a:3

    cal appendbufline(g:kisuke.state.buf_nr, line('$'), [
          \ 'Selected Provider - ' . s:kisuke.state.current_provider,
          \ 'Selected Model - ' . s:kisuke.state.current_model,
          \ ' '
          \ ])

    cal s:add_menu_item('Start new session', 'kisuke#buffer#restore', { 'type': 'new_session' })

    if s:kisuke.state.session_count > 0
      cal s:add_menu_item('Resume last session', 'kisuke#buffer#restore', { 'type': 'resume_last_session' })

      if s:kisuke.state.session_count > 1
        cal s:add_menu_item('Load previous sessions', 'kisuke#buffer#restore', { 'type': 'load_sessions' })
      en
    en

    cal s:add_menu_item('Configure the plugin', 'kisuke#ui#render_buffer_menu', 'configure_plugin')
  elsei a:state ==# 'configure_plugin'
    cal appendbufline(g:kisuke.state.buf_nr, line('$'), 'Select AI Provider:')
    cal appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')

    for provider in s:providers
      cal s:add_menu_item(provider.name, 'kisuke#ui#select_provider', provider.name)
    endfo

    cal appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
    cal s:add_menu_item('Go back to main menu', 'kisuke#buffer#restore', { 'type': 'initialize' })
  elsei a:state ==# 'select_model'
    let l:models = []

    for provider in s:providers
      if provider.name ==# s:kisuke.state.current_provider
        let l:models = provider.models

        brea
      en
    endfo

    cal appendbufline(g:kisuke.state.buf_nr, line('$'), 'Select Model for ' . s:kisuke.state.current_provider . ':')
    cal appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')

    for model in models
      cal s:add_menu_item(model, 'kisuke#ui#select_model', model)
    endfo

    cal appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
    cal s:add_menu_item('Go back to main menu', 'kisuke#buffer#restore', { 'type': 'initialize' })
  elsei a:state ==# 'render_sessions'
    let l:sessions = a:1

    for session in l:sessions
      let l:cleaned_session_name = substitute(session.name, '\%x00', '', 'g')

      cal s:add_menu_item(l:cleaned_session_name, 'kisuke#buffer#restore', {
            \ 'type': 'restore_session',
            \ 'payload': session.id
            \ })
    endfo

    cal appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
    cal s:add_menu_item('Go back to main menu', 'kisuke#buffer#restore', { 'type': 'initialize' })
  en

  cal appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
  cal appendbufline(g:kisuke.state.buf_nr, line('$'), 'Press Enter to select an option')

  nnoremap <buffer> <CR> :cal kisuke#ui#select_menu_option()<CR>
  nnoremap <buffer> j j
  nnoremap <buffer> k k

  setl nomodifiable
endfu

fu! s:add_menu_item(text, action, ...) abort
  let item_text = '✦ ' . a:text

  cal add(g:kisuke.state.menu_items, item_text)

  let g:kisuke.state.menu_actions[item_text] = a:action

  if a:0 > 0
    let g:kisuke.state.menu_actions[item_text . '_data'] = a:1
  en

  cal appendbufline(g:kisuke.state.buf_nr, line('$'), item_text)
endfu

fu! kisuke#ui#select_menu_option() abort
  let line = getline('.')

  if stridx(line, '✦ ') != 0
    echo 'Not a valid menu option'
    retu
  en

  if has_key(g:kisuke.state.menu_actions, line)
    let Action = function(g:kisuke.state.menu_actions[line])

    if has_key(g:kisuke.state.menu_actions, line . '_data')
      cal Action(g:kisuke.state.menu_actions[line . '_data'])
    else
      cal Action()
    en
  else
    echo 'Unhandled menu option: ' . line
  en
endfu

fu! kisuke#ui#select_provider(provider) abort
  let s:kisuke.state.current_provider = a:provider

  cal kisuke#ui#render_buffer_menu('select_model')
endfu

fu! kisuke#ui#select_model(model) abort
  let s:kisuke.state.current_model = a:model

  cal kisuke#server#configure(s:kisuke.state.current_provider, s:kisuke.state.current_model)
endfu
