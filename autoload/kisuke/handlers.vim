let s:kisuke = {}
let s:kisuke.state = {
      \ 'response_start_line': v:null,
      \ 'stream_response': ''
      \ }

function! kisuke#handlers#initialize(reply)
  let g:kisuke.state.init_response = a:reply.payload

  let l:res = a:reply.payload

  if l:res ==# 'not_configured'
    call kisuke#ui#render_buffer_menu('not_configured')
  elsei l:res ==# 'missing_api_key'
    call kisuke#ui#render_buffer_menu('missing_api_key', a:reply.provider, a:reply.model)
  elsei l:res ==# 'eligible'
    call kisuke#ui#render_buffer_menu('eligible', a:reply.provider, a:reply.model, a:reply.session_count)
  endif
endfunction

function! kisuke#handlers#response(reply)
  if a:reply.payload ==# 'stream_start'
    call s:handle_stream_start()
  elsei a:reply.payload ==# 'stream_end'
    call s:handle_stream_end()
  else
    call s:handle_stream(a:reply)
  endif
endfunction

function! kisuke#handlers#new_session(reply)
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
endfunction

function! kisuke#handlers#resume_last_session(reply)
  echomsg "handlers#resume_last_session"
  call kisuke#buffer#prepare_chat_buffer()

  silent! %delete

  let g:kisuke.state.session_id = a:reply.session_info.id

  let l:session_count = a:reply.session_info.current_index + 1 . '/' . a:reply.session_info.total_count
  let l:cleaned_session_name = substitute(a:reply.session_info.name, '\%x00', '', 'g')

  call appendbufline(g:kisuke.state.buf_nr, 0, '> ' . 'Kisuke initialized ' . l:session_count)
  call appendbufline(g:kisuke.state.buf_nr, 1, '> ' . l:cleaned_session_name)

  call s:process_session_history(a:reply.payload.messages)
  call kisuke#syntax#setup()
endfunction

function! kisuke#handlers#load_sessions(reply)
  call kisuke#ui#render_buffer_menu('render_sessions', a:reply.payload)
endfunction

function! kisuke#handlers#restore_session(reply)
  echomsg "handlers#restore_session"

  call kisuke#buffer#prepare_chat_buffer()

  silent! %delete

  let g:kisuke.state.session_id = a:reply.session_info.id
  let l:session_count = a:reply.session_info.current_index + 1 . '/' . a:reply.session_info.total_count
  let l:cleaned_session_name = substitute(a:reply.session_info.name, '\%x00', '', 'g')

  call appendbufline(g:kisuke.state.buf_nr, 0, '> ' . 'Kisuke initialized ' . l:session_count)
  call appendbufline(g:kisuke.state.buf_nr, 1, '> ' . l:cleaned_session_name)

  call s:process_session_history(a:reply.payload.messages)
  call kisuke#syntax#setup()
endfunction

function! kisuke#handlers#error(reply)
  call appendbufline(g:kisuke.state.buf_nr, line('$'), 'Server error > ' . a:reply.payload)
endfunction

function! kisuke#handlers#next_session(reply)
  call kisuke#buffer#prepare_chat_buffer()

  silent! %delete

  let g:kisuke.state.session_id = a:reply.session_info.id

  let l:session_count = a:reply.session_info.current_index + 1 . '/' . a:reply.session_info.total_count
  let l:cleaned_session_name = substitute(a:reply.session_info.name, '\%x00', '', 'g')

  call appendbufline(g:kisuke.state.buf_nr, 0, '> ' . 'Kisuke initialized ' . l:session_count)
  call appendbufline(g:kisuke.state.buf_nr, 1, '> ' . l:cleaned_session_name)

  call s:process_session_history(a:reply.payload.messages)
  call kisuke#syntax#setup()

  redraw!

  echomsg 'Navigated to next session: ' . l:cleaned_session_name
endfunction

function! kisuke#handlers#previous_session(reply)
  call kisuke#buffer#prepare_chat_buffer()

  silent! %delete

  let g:kisuke.state.session_id = a:reply.session_info.id
  let l:session_count = a:reply.session_info.current_index + 1 . '/' . a:reply.session_info.total_count
  let l:cleaned_session_name = substitute(a:reply.session_info.name, '\%x00', '', 'g')

  call appendbufline(g:kisuke.state.buf_nr, 0, '> ' . 'Kisuke initialized ' . l:session_count)
  call appendbufline(g:kisuke.state.buf_nr, 1, '> ' . l:cleaned_session_name)

  call s:process_session_history(a:reply.payload.messages)
  call kisuke#syntax#setup()

  redraw!

  echomsg 'Navigated to previous session: ' . l:cleaned_session_name
endfunction

function! kisuke#handlers#sandbox(reply)
  call kisuke#buffer#prepare_chat_buffer()

  silent! %delete

  call appendbufline(g:kisuke.state.buf_nr, '$', '> ' . 'sandbox ' . a:reply.qweqwe)
endfunction

function! kisuke#handlers#request_approval(reply)
  let l:message = a:reply.message
  let l:request_id = a:reply.requestId
  let l:choice = confirm('Request Approval "' . l:message . '"?', "&Yes\n&No", 2)
  let l:approved = l:choice == 1 ? v:true : v:false
  let l:response = {
        \ 'type': 'request_approval_response',
        \ 'requestId': l:request_id,
        \ 'approved': l:approved
        \ }

  call ch_sendraw(g:kisuke.state.job, json_encode(l:response) . "\n")
endfunction

function! s:handle_stream(reply)
  let s:kisuke.state.stream_response = s:kisuke.state.stream_response . a:reply.payload
  let l:index = 0

  for line in split(s:kisuke.state.stream_response, '\n')
    " Handle \r by keeping only content after the last \r
    let l:display_line = s:resolve_carriage_return(line)

    if l:index ==# 0
      call setbufline(g:kisuke.state.buf_nr, s:kisuke.state.response_start_line + l:index, 'Kisuke > ' . l:display_line)
    else
      call setbufline(g:kisuke.state.buf_nr, s:kisuke.state.response_start_line + l:index, l:display_line)
    endif

    let l:index += 1
  endfor
endfunction

function! s:resolve_carriage_return(line)
  if stridx(a:line, "\r") >= 0
    let l:parts = split(a:line, "\r", 1)
    return l:parts[-1]
  endif
  return a:line
endfunction

function! s:handle_incremental_syntax()
  if exists('*kisuke#syntax#setup_incremental')
    call kisuke#syntax#setup_incremental()
  endif
endfunction

function! s:handle_stream_start()
  call setbufline(g:kisuke.state.buf_nr, line('$'), ' ')
  let s:kisuke.state.response_start_line = line('$') + 1
endfunction

function! s:handle_stream_end()
  let g:kisuke.state.marked_files = []
  let g:kisuke.state.marked_code_blocks = []
  let s:kisuke.state.stream_response = ''
  let s:kisuke.state.response_start_line = v:null

  call setbufline(g:kisuke.state.buf_nr, line('$') + 1, ' ')
  call kisuke#syntax#setup()
endfunction

function! s:process_session_history(messages)
  for entry in a:messages
    if entry.sender ==# 'Kisuke'
      call s:render_kisuke_response(entry)
    elsei entry.sender ==# 'User'
      call s:render_user_prompt(entry)
    endif
  endfor
endfunction

function! s:render_kisuke_response(entry)
  let l:bufnr = g:kisuke.state.buf_nr
  let s:kisuke.state.response_start_line = line('$') + 1
  let l:lines = split(a:entry.message, '\n')
  let l:buffer_lines = []
  let l:index = 0

  for line in l:lines
    if l:index == 0
      call add(l:buffer_lines, 'Kisuke > ')
      call add(l:buffer_lines, line)
      let l:index += 1
    else
      call add(l:buffer_lines, line)
    endif

    let l:index += 1
  endfor

  let s:kisuke.state.response_start_line = v:null

  call add(l:buffer_lines, ' ')
  call appendbufline(l:bufnr, line('$'), l:buffer_lines)
endfunction

function! s:render_user_prompt(entry)
  if has_key(a:entry, 'referenceCount') && a:entry.referenceCount > 0
    call appendbufline(g:kisuke.state.buf_nr, line('$'), '> References Added - ' . a:entry.referenceCount)
    call appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
  endif

  call appendbufline(g:kisuke.state.buf_nr, line('$'), 'Prompt > ' . a:entry.message)
  call setbufline(g:kisuke.state.buf_nr, line('$') + 1, ' ')
endfunction
