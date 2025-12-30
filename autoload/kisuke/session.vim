fu! s:check_conditions()
  let l:checks = [
        \ { 'condition': g:kisuke.state.init_response !=# 'eligible', 'message': 'Not eligible for this action' },
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first' },
        \ { 'condition': bufwinid(g:kisuke.state.buf_nr) ==# -1, 'message': 'Please run :KisukeOpen first' },
        \ { 'condition': g:kisuke.state.is_pending, 'message': 'Please wait for server to finish its job' },
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first' }
        \ ]

  if kisuke#utils#validate(l:checks)
    let g:kisuke.state.marked_files = []
    let g:kisuke.state.marked_code_blocks = []

    retu 1
  else
    retu 0
  en
endfu

fu! kisuke#session#create_new_session()
  if s:check_conditions()
    cal kisuke#buffer#restore({ 'type': 'new_session' })
  en
endfu

fu! kisuke#session#delete_current_session()
  if s:check_conditions()
    cal kisuke#buffer#restore({ 'type': 'delete_session', 'payload': g:kisuke.state.session_id })
  en
endfu

fu! kisuke#session#go_to_next_session()
  if s:check_conditions()
    cal kisuke#buffer#restore({ 'type': 'next_session', 'currentSessionId': g:kisuke.state.session_id })
  en
endfu

fu! kisuke#session#go_to_previous_session()
  if s:check_conditions()
    cal kisuke#buffer#restore({ 'type': 'previous_session', 'currentSessionId': g:kisuke.state.session_id })
  en
endfu
