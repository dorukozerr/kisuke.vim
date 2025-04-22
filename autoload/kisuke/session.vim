func! kisuke#session#create_new_session()
  if s:check_conditions()
    call kisuke#buffer#focus({ 'type': 'newSession' })
  endif
endfunc

func! kisuke#session#go_to_next_session()
  if s:check_conditions()
    call kisuke#buffer#focus({ 'type': 'next_session' })
  endif
endfunc

func! kisuke#session#go_to_previous_session()
  if s:check_conditions()
    call kisuke#buffer#focus({ 'type': 'prev_session' })
  endif
endfunc


func! kisuke#session#delete_current_session()
  if s:check_conditions()
    call kisuke#buffer#focus({ 'type': 'delete_session', 'payload': g:kisuke.state.session_id })
  endif
endfunc

func s:check_conditions()
  let l:checks = [
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first, or press <leader>ko' },
        \ { 'condition': g:kisuke.state.is_pending, 'message': 'Cannot mark a file while server generating response' },
        \ { 'condition': bufwinid(g:kisuke.state.buf_nr) ==# -1, 'message': 'Please run :KisukeOpen first, or press <leader>ko' },
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first, or press <leader>ko' },
        \ ]

  if kisuke#utils#validate(l:checks)
    let g:kisuke.state.marked_files = []
    let g:kisuke.state.marked_code_blocks = []
    let g:kisuke.state.is_pending = 1

    return 1
  else
    return 0
  endif
endfunc
