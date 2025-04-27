func! kisuke#session#create_new_session()
  if s:check_conditions()
    call kisuke#buffer#restore({ 'type': 'new_session' })
  endif
endfunc

func! kisuke#session#delete_current_session()
  if s:check_conditions()
    call kisuke#buffer#restore({ 'type': 'delete_session', 'payload': g:kisuke.state.session_id })
  endif
endfunc

func s:check_conditions()
  let l:checks = [
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first' },
        \ { 'condition': bufwinid(g:kisuke.state.buf_nr) ==# -1, 'message': 'Please run :KisukeOpen first' },
        \ { 'condition': g:kisuke.state.is_pending, 'message': 'Please wait for server to finish its job' },
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first' },
        \ ]

  if kisuke#utils#validate(l:checks)
    let g:kisuke.state.marked_files = []
    let g:kisuke.state.marked_code_blocks = []

    return 1
  else
    return 0
  endif
endfunc
