func! kisuke#ui#render_main_page()
  call appendbufline(g:kisuke.state.buf_nr, 0, [
        \ '•• ━━━━━━━━━━ ⟡ KISUKE ⟡ ━━━━━━━━━━ ••',
        \ ' ',
        \ '➤ Start new chat',
        \ '➤ Load previous chat',
        \ '➤ Change AI model',
        \ '➤ Configure settings',
        \ '➤ View help',
        \ ' ',
        \ 'Press Enter to select an option'
        \])


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
