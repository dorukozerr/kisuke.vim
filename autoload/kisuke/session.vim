func! kisuke#session#create_new_session()
  let l:checks = [
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first, or press <leader>ko' },
        \ ]

  if !kisuke#utils#validate(l:checks)
    return
  endif

  let g:kisuke.state.marked_files = []
  let g:kisuke.state.is_pending = 1

  call kisuke#buffer#focus({ 'type': 'newSession' })
endfunc

func! kisuke#session#go_to_next_session()
  let l:checks = [
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first, or press <leader>ko' },
        \ ]

  if !kisuke#utils#validate(l:checks)
    return
  endif

  let g:kisuke.state.marked_files = []
  let g:kisuke.state.is_pending = 1

  call kisuke#buffer#focus({ 'type': 'nextSession' })
endfunc

func! kisuke#session#go_to_previous_session()
  let l:checks = [
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first, or press <leader>ko' },
        \ ]

  if !kisuke#utils#validate(l:checks)
    return
  endif

  let g:kisuke.state.marked_files = []
  let g:kisuke.state.is_pending = 1

  call kisuke#buffer#focus({ 'type': 'prevSession' })
endfunc


func! kisuke#session#delete_current_session()
  let l:checks = [
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first, or press <leader>ko' },
        \ ]

  if !kisuke#utils#validate(l:checks)
    return
  endif

  let g:kisuke.state.marked_files = []
  let g:kisuke.state.is_pending = 1

  call kisuke#buffer#focus({ 'type': 'deleteSession', 'payload': g:kisuke.state.session_id })
endfunc

