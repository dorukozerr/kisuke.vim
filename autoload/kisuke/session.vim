func! kisuke#session#create_new_session()
  exe s:prepare_session_context()
        \ ? 'call kisuke#buffer#focus({ "type": "newSession" })'
        \ : ''
endfunc

func! kisuke#session#go_to_next_session()
  exe s:prepare_session_context()
        \ ? 'call kisuke#buffer#focus({ "type": "nextSession" })'
        \ : ''
endfunc

func! kisuke#session#go_to_previous_session()
  exe s:prepare_session_context()
        \ ? 'call kisuke#buffer#focus({ "type": "prevSession" })'
        \ : ''
endfunc


func! kisuke#session#delete_current_session()
  exe s:prepare_session_context()
        \ ? 'call kisuke#buffer#focus({ "type": "deleteSession", "payload": g:kisuke.state.session_id })'
        \ : ''
endfunc

func s:prepare_session_context()
  let l:checks = [
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first, or press <leader>ko' },
        \ { 'condition': g:kisuke.state.is_pending, 'message': 'Cannot mark a file while server generating response' },
        \ { 'condition': bufwinid(g:kisuke.state.buf_nr) ==# -1, 'message': 'Please run :KisukeOpen first, or press <leader>ko' },
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first, or press <leader>ko' },
        \ ]

  exe kisuke#utils#validate(l:checks)
        \ ? 'let g:kisuke.state.marked_files = []'
        \ . ' | let g:kisuke.state.marked_code_blocks = []'
        \ . ' | let g:kisuke.state.is_pending = 1'
        \ . ' | return 1'
        \ : 'return 0'
endfunc
