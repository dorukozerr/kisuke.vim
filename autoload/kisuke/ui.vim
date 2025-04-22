let s:kisuke = {}
let s:kisuke.state = {
      \ 'selected_provider': '',
      \ 'selected_model': '',
      \}

func! kisuke#ui#render_buffer_menu(state, selected_provider, selected_model)
  silent! %delete

  if a:state === "not_configured"
    call appendbufline(g:kisuke.state.buf_nr, 0, [
          \ '•• ━━━━━━━━━━ ⟡ KISUKE ⟡ ━━━━━━━━━━ ••',
          \ ' ',
          \ '➤ Configure the plugin',
          \ ' ',
          \ 'Press Enter to select an option'
          \])
  elseif a:state === "missing_api_key"
    let s:kisuke.state = {
          \ 'selected_provider': a:selected_provider,
          \ 'selected_model': a:selected_model,
          \}

    call appendbufline(g:kisuke.state.buf_nr, 0, [
          \ '•• ━━━━━━━━━━ ⟡ KISUKE ⟡ ━━━━━━━━━━ ••',
          \ ' ',
          \ 'API key is missing for ' . selected_provider,
          \ 'Selected Model - ' . selected_model,
          \ ' ',
          \ '➤ Save API key',
          \ '➤ Reconfigure provider and model',
          \ ' ',
          \ 'Press Enter to select an option'
          \])
  elseif a:state === "eligible"
    let s:kisuke.state = {
          \ 'selected_provider': a:selected_provider,
          \ 'selected_model': a:selected_model,
          \}

    call appendbufline(g:kisuke.state.buf_nr, 0, [
          \ '•• ━━━━━━━━━━ ⟡ KISUKE ⟡ ━━━━━━━━━━ ••',
          \ ' ',
          \ 'Selected Provider - ' . selected_provider,
          \ 'Selected Model - ' . selected_model,
          \ ' ',
          \ '➤ Start new chat',
          \ '➤ Load previous chat',
          \ '➤ Reconfigure provider and model',
          \ ' ',
          \ 'Press Enter to select an option'
          \])
  endif



  nnoremap <buffer> <CR> :call kisuke#ui#select_menu_option()<CR>
  nnoremap <buffer> j j
  nnoremap <buffer> k k
endfunc

func! kisuke#ui#select_menu_option() abort
  let line = getline('.')
  let menu_item = matchstr(line, '➤\s\zs.*$')

  if empty(menu_item)
    echo 'Not a valid menu option'

    return
  endif

  if menu_item ==# 'Start new chat'
    echo 'Selected: Start new chat'
  elseif menu_item ==# 'Load previous chat'
    echo 'Selected: Load previous chat'
  elseif menu_item ==# 'Change AI model'
    echo 'Selected: Change AI model'
  elseif menu_item ==# 'Configure settings'
    echo 'Selected: Configure settings'
  elseif menu_item ==# 'View help'
    echo 'Selected: View help'
  else
    echo 'Unhandled menu option: ' . menu_item
  endif
endfunc
