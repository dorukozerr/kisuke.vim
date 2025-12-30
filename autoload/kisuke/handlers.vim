let s:kisuke = {}
let s:kisuke.state = {
      \ 'response_start_line': v:null,
      \ 'stream_response': '',
      \ }

func! kisuke#handlers#initialize(reply)
  let l:eligiblityState = a:reply.payload

  if l:eligiblityState ==# 'not_configured'
    call kisuke#ui#render_buffer_menu('not_configured')
  elseif l:eligiblityState ==# 'missing_api_key'
    call kisuke#ui#render_buffer_menu('missing_api_key', a:reply.provider, a:reply.model)
  elseif l:eligiblityState ==# 'eligible'
    call kisuke#ui#render_buffer_menu('eligible', a:reply.provider, a:reply.model, a:reply.session_count)
  endif
endfunc

func! kisuke#handlers#response(reply)
  if a:reply.payload ==# 'stream_start'
    call s:handle_stream_start()
  elseif a:reply.payload ==# 'stream_end'
    call s:handle_stream_end()
  else
    call s:handle_stream(a:reply)
  endif
endfunc

func! kisuke#handlers#new_session(reply)
  call kisuke#buffer#prepare_chat_buffer()

  silent! %delete

  let g:kisuke.state.session_id = a:reply.session_info.id

  let l:session_count = a:reply.session_info.current_index + 1 . '/' . a:reply.session_info.total_count
  let l:cleaned_session_name = substitute(a:reply.session_info.name, '\%x00', '', 'g')

  call appendbufline(g:kisuke.state.buf_nr, 0, '> ' . 'Kisuke initialized ' . l:session_count)
  call appendbufline(g:kisuke.state.buf_nr, 1, '> ' . l:cleaned_session_name)

  for entry in a:reply.payload.messages
    call appendbufline(g:kisuke.state.buf_nr, line('$'), 'Kisuke > ' . entry.message)
  endfor

  call appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
endfunc

func! kisuke#handlers#resume_last_session(reply)
  call kisuke#buffer#prepare_chat_buffer()

  silent! %delete

  let g:kisuke.state.session_id = a:reply.session_info.id

  let l:session_count = a:reply.session_info.current_index + 1 . '/' . a:reply.session_info.total_count
  let l:cleaned_session_name = substitute(a:reply.session_info.name, '\%x00', '', 'g')

  call appendbufline(g:kisuke.state.buf_nr, 0, '> ' . 'Kisuke initialized ' . l:session_count)
  call appendbufline(g:kisuke.state.buf_nr, 1, '> ' . l:cleaned_session_name)

  call s:process_session_history(a:reply.payload.messages)
  call kisuke#syntax#setup()
endfunc

func! kisuke#handlers#load_sessions(reply)
  call kisuke#ui#render_buffer_menu('render_sessions', a:reply.payload)
endfunc

func! kisuke#handlers#restore_session(reply)
  call kisuke#buffer#prepare_chat_buffer()

  silent! %delete

  let g:kisuke.state.session_id = a:reply.session_info.id

  let l:session_count = a:reply.session_info.current_index + 1 . '/' . a:reply.session_info.total_count
  let l:cleaned_session_name = substitute(a:reply.session_info.name, '\%x00', '', 'g')

  call appendbufline(g:kisuke.state.buf_nr, 0, '> ' . 'Kisuke initialized ' . l:session_count)
  call appendbufline(g:kisuke.state.buf_nr, 1, '> ' . l:cleaned_session_name)

  call s:process_session_history(a:reply.payload.messages)
  call kisuke#syntax#setup()
endfunc

func! kisuke#handlers#error(reply)
  call appendbufline(g:kisuke.state.buf_nr, line('$'), 'Server error > ' . a:reply.payload)
endfunc

func s:handle_stream(reply)
  let s:kisuke.state.stream_response = s:kisuke.state.stream_response . a:reply.payload
  let l:index = 0

  for line in split(s:kisuke.state.stream_response, '\n')
    if l:index ==# 0
      call setbufline(g:kisuke.state.buf_nr, s:kisuke.state.response_start_line + l:index, 'Kisuke > ' . line)
    else
      call setbufline(g:kisuke.state.buf_nr, s:kisuke.state.response_start_line + l:index, line)
    endif

    let l:index += 1
  endfor

endfunc

func! s:handle_incremental_syntax()
  if exists('*kisuke#syntax#setup_incremental')
    call kisuke#syntax#setup_incremental()
  endif
endfunc

func! s:handle_stream_start()
  call setbufline(g:kisuke.state.buf_nr, line('$'), ' ')

  let s:kisuke.state.response_start_line = line('$') + 1
endfunc

func! s:handle_stream_end()
  let g:kisuke.state.marked_files = []
  let g:kisuke.state.marked_code_blocks = []
  let s:kisuke.state.stream_response = ''
  let s:kisuke.state.response_start_line = v:null

  call setbufline(g:kisuke.state.buf_nr, line('$') + 1, ' ')
  call kisuke#syntax#setup()
endfunc

func! s:process_session_history(messages)
  for entry in a:messages
    if entry.sender ==# 'Kisuke'
      call s:render_kisuke_response(entry)
    elseif entry.sender ==# 'User'
      call s:render_user_prompt(entry)
    endif
  endfor
endfunc

func! s:render_kisuke_response(entry)
  let l:bufnr = g:kisuke.state.buf_nr

  let s:kisuke.state.response_start_line = line('$') + 1
  let l:lines = split(a:entry.message, '\n')

  let l:buffer_lines = []
  let l:index = 0

  for line in l:lines
    if l:index == 0
      call add(l:buffer_lines, 'Kisuke > ' . line)
    else
      call add(l:buffer_lines, line)
    endif
    let l:index += 1
  endfor

  let s:kisuke.state.response_start_line = v:null

  call add(l:buffer_lines, ' ')
  call appendbufline(l:bufnr, line('$'), l:buffer_lines)
endfunc

func! s:render_user_prompt(entry)
  if has_key(a:entry, 'referenceCount') && a:entry.referenceCount > 0
    call appendbufline(g:kisuke.state.buf_nr, line('$'), '> References Added - ' . a:entry.referenceCount)
    call appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
  endif

  call appendbufline(g:kisuke.state.buf_nr, line('$'), 'Prompt > ' . a:entry.message)
  call setbufline(g:kisuke.state.buf_nr, line('$') + 1, ' ')
endfunc
