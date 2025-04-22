let s:kisuke = {}
let s:kisuke.state = {
      \ 'selected_provider': '',
      \ 'selected_model': '',
      \}

func! kisuke#ui#render_buffer_menu(state, ...)
  setlocal modifiable

  silent! %delete

  if a:state ==# "not_configured"
    call appendbufline(g:kisuke.state.buf_nr, 0, [
          \ '•• ━━━━━━━━━━ ⟡ KISUKE ⟡ ━━━━━━━━━━ ••',
          \ ' ',
          \ '➤ Configure the plugin',
          \ ' ',
          \ 'Press Enter to select an option'
          \])
  elseif a:state ==# "missing_api_key"
    let s:kisuke.state = {
          \ 'selected_provider': a:0,
          \ 'selected_model': a:1,
          \}

    call appendbufline(g:kisuke.state.buf_nr, 0, [
          \ '•• ━━━━━━━━━━ ⟡ KISUKE ⟡ ━━━━━━━━━━ ••',
          \ ' ',
          \ 'API key is missing for ' . s:kisuke.state.selected_provider,
          \ 'Selected Model - ' . s:kisuke.state.selected_model,
          \ ' ',
          \ '➤ Save API key',
          \ '➤ Reconfigure provider or model',
          \ ' ',
          \ 'Press Enter to select an option'
          \])
  elseif a:state ==# "eligible"
    let s:kisuke.state = {
          \ 'selected_provider': a:0,
          \ 'selected_model': a:1,
          \}

    call appendbufline(g:kisuke.state.buf_nr, 0, [
          \ '•• ━━━━━━━━━━ ⟡ KISUKE ⟡ ━━━━━━━━━━ ••',
          \ ' ',
          \ 'Selected Provider - ' . s:kisuke.s:kisuke.state.selected_provider,
          \ 'Selected Model - ' . s:kisuke.state.selected_model,
          \ ' ',
          \ '➤ Start new chat',
          \ '➤ Load previous chats',
          \ '➤ Reconfigure provider or model',
          \ ' ',
          \ 'Press Enter to select an option'
          \])
  elseif a:state ==# 'configure_plugin'
    call appendbufline(g:kisuke.state.buf_nr, 0, [
          \ '•• ━━━━━━━━━━ ⟡ KISUKE ⟡ ━━━━━━━━━━ ••',
          \ ' ',
          \ '➤ Choose provider',
          \ '➤ if provider chosen show choose model option here',
          \ ' ',
          \ 'Press Enter to select an option'
          \])
  endif

  nnoremap <buffer> <CR> :call kisuke#ui#select_menu_option()<CR>
  nnoremap <buffer> j j
  nnoremap <buffer> k k

  setlocal nomodifiable
endfunc

func! kisuke#ui#select_menu_option() abort
  let line = getline('.')
  let menu_item = matchstr(line, '➤\s\zs.*$')

  if empty(menu_item)
    echo 'Not a valid menu option'

    return
  endif

  if menu_item ==# 'Configure the plugin'
    echo 'Selected: Configure the plugin'
  elseif menu_item ==# 'Save API key'
    echo 'Selected: Save API key'
  elseif menu_item ==# 'Reconfigure provider or model'
    echo 'Selected:  Reconfigure provider or model'
  elseif menu_item ==# 'Start new chat'
    echo 'Selected: Start new chat'
  elseif menu_item ==# 'Load previous chats'
    echo 'Selected: Load previous chats'
  else
    echo 'Unhandled menu option: ' . menu_item
  endif
endfunc
