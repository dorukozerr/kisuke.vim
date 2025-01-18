" ============================================================ "
"                                                              "
" ██╗  ██╗██╗███████╗██╗   ██╗██╗  ██╗███████╗                 "
" ██║ ██╔╝██║██╔════╝██║   ██║██║ ██╔╝██╔════╝                 "
" █████╔╝ ██║███████╗██║   ██║█████╔╝ █████╗                   "
" ██╔═██╗ ██║╚════██║██║   ██║██╔═██╗ ██╔══╝                   "
" ██║  ██╗██║███████║╚██████╔╝██║  ██╗███████╗                 "
" ╚═╝  ╚═╝╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝                 "
"                                                              "
" ============================================================ "
" Author:      Doruk Özer <dorukozer@protonmail.com>           "
" License:     MIT                                             "
" Version:     1.0.0                                           "
" Description: Kisuke - Your Shopkeeper for Vim AI Operations  "
" Repository:  https://github.com/dorukozerr/kisuke.vim        "
" ============================================================ "

func! kisuke#session#create_new_session()
  return s:prepare_session_context() ?
        \ kisuke#buffer#focus({ 'type': 'newSession' }) :
        \ v:null
endfunc

func! kisuke#session#go_to_next_session()
  return s:prepare_session_context() ?
        \ kisuke#buffer#focus({ 'type': 'nextSession' }) :
        \ v:null
endfunc

func! kisuke#session#go_to_previous_session()
  return s:prepare_session_context() ?
        \ kisuke#buffer#focus({ 'type': 'prevSession' }) :
        \ v:null
endfunc


func! kisuke#session#delete_current_session()
  return s:prepare_session_context() ?
        \ kisuke#buffer#focus({ 'type': 'deleteSession', 'payload': g:kisuke.state.session_id }) :
        \ v:null
endfunc

func s:prepare_session_context()
  let l:checks = [
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first, or press <leader>ko' },
        \ ]

  if !kisuke#utils#validate(l:checks)
    return 0
  endif

  let g:kisuke.state.marked_files = []
  let g:kisuke.state.is_pending = 1

  return 1
endfunc
