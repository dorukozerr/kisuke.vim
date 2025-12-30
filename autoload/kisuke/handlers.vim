let s:kisuke = {}
let s:kisuke.state = {
      \ 'response_start_line': v:null,
      \ 'stream_response': ''
      \ }

fu! kisuke#handlers#initialize(reply)
  let g:kisuke.state.init_response = a:reply.payload

  let l:res = a:reply.payload

  if l:res ==# 'not_configured'
    cal kisuke#ui#render_buffer_menu('not_configured')
  elsei l:res ==# 'missing_api_key'
    cal kisuke#ui#render_buffer_menu('missing_api_key', a:reply.provider, a:reply.model)
  elsei l:res ==# 'eligible'
    cal kisuke#ui#render_buffer_menu('eligible', a:reply.provider, a:reply.model, a:reply.session_count)
  en
endfu

fu! kisuke#handlers#response(reply)
  if a:reply.payload ==# 'stream_start'
    cal s:handle_stream_start()
  elsei a:reply.payload ==# 'stream_end'
    cal s:handle_stream_end()
  else
    cal s:handle_stream(a:reply)
  en
endfu

fu! kisuke#handlers#new_session(reply)
  cal kisuke#buffer#prepare_chat_buffer()

  silent! %delete

  let g:kisuke.state.session_id = a:reply.session_info.id

  let l:session_count = a:reply.session_info.current_index + 1 . '/' . a:reply.session_info.total_count
  let l:cleaned_session_name = substitute(a:reply.session_info.name, '\%x00', '', 'g')

  cal appendbufline(g:kisuke.state.buf_nr, 0, '> ' . 'Kisuke initialized ' . l:session_count)
  cal appendbufline(g:kisuke.state.buf_nr, 1, '> ' . l:cleaned_session_name)

  for entry in a:reply.payload.messages
    cal appendbufline(g:kisuke.state.buf_nr, line('$'), 'Kisuke > ' . entry.message)
  endfo

  cal appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
endfu

fu! kisuke#handlers#resume_last_session(reply)
  cal kisuke#buffer#prepare_chat_buffer()

  silent! %delete

  let g:kisuke.state.session_id = a:reply.session_info.id

  let l:session_count = a:reply.session_info.current_index + 1 . '/' . a:reply.session_info.total_count
  let l:cleaned_session_name = substitute(a:reply.session_info.name, '\%x00', '', 'g')

  cal appendbufline(g:kisuke.state.buf_nr, 0, '> ' . 'Kisuke initialized ' . l:session_count)
  cal appendbufline(g:kisuke.state.buf_nr, 1, '> ' . l:cleaned_session_name)

  cal s:process_session_history(a:reply.payload.messages)
  cal kisuke#syntax#setup()
endfu

fu! kisuke#handlers#load_sessions(reply)
  cal kisuke#ui#render_buffer_menu('render_sessions', a:reply.payload)
endfu

fu! kisuke#handlers#restore_session(reply)
  cal kisuke#buffer#prepare_chat_buffer()

  silent! %delete

  let g:kisuke.state.session_id = a:reply.session_info.id

  let l:session_count = a:reply.session_info.current_index + 1 . '/' . a:reply.session_info.total_count
  let l:cleaned_session_name = substitute(a:reply.session_info.name, '\%x00', '', 'g')

  cal appendbufline(g:kisuke.state.buf_nr, 0, '> ' . 'Kisuke initialized ' . l:session_count)
  cal appendbufline(g:kisuke.state.buf_nr, 1, '> ' . l:cleaned_session_name)

  cal s:process_session_history(a:reply.payload.messages)
  cal kisuke#syntax#setup()
endfu

fu! kisuke#handlers#error(reply)
  cal appendbufline(g:kisuke.state.buf_nr, line('$'), 'Server error > ' . a:reply.payload)
endfu

fu! kisuke#handlers#next_session(reply)
  cal kisuke#buffer#prepare_chat_buffer()

  silent! %delete

  let g:kisuke.state.session_id = a:reply.session_info.id

  let l:session_count = a:reply.session_info.current_index + 1 . '/' . a:reply.session_info.total_count
  let l:cleaned_session_name = substitute(a:reply.session_info.name, '\%x00', '', 'g')

  cal appendbufline(g:kisuke.state.buf_nr, 0, '> ' . 'Kisuke initialized ' . l:session_count)
  cal appendbufline(g:kisuke.state.buf_nr, 1, '> ' . l:cleaned_session_name)

  cal s:process_session_history(a:reply.payload.messages)
  call kisuke#syntax#setup()

  redraw!
  echom 'Navigated to next session: ' . l:cleaned_session_name
endfu

fu! kisuke#handlers#previous_session(reply)
  cal kisuke#buffer#prepare_chat_buffer()

  silent! %delete

  let g:kisuke.state.session_id = a:reply.session_info.id

  let l:session_count = a:reply.session_info.current_index + 1 . '/' . a:reply.session_info.total_count
  let l:cleaned_session_name = substitute(a:reply.session_info.name, '\%x00', '', 'g')

  cal appendbufline(g:kisuke.state.buf_nr, 0, '> ' . 'Kisuke initialized ' . l:session_count)
  cal appendbufline(g:kisuke.state.buf_nr, 1, '> ' . l:cleaned_session_name)

  cal s:process_session_history(a:reply.payload.messages)
  cal kisuke#syntax#setup()

  redraw!
  echom 'Navigated to previous session: ' . l:cleaned_session_name
endfu

fu! s:handle_stream(reply)
  let s:kisuke.state.stream_response = s:kisuke.state.stream_response . a:reply.payload
  let l:index = 0

  for line in split(s:kisuke.state.stream_response, '\n')
    if l:index ==# 0
      cal setbufline(g:kisuke.state.buf_nr, s:kisuke.state.response_start_line + l:index, 'Kisuke > ' . line)
    else
      cal setbufline(g:kisuke.state.buf_nr, s:kisuke.state.response_start_line + l:index, line)
    en

    let l:index += 1
  endfo
endfu

fu! s:handle_incremental_syntax()
  if exists('*kisuke#syntax#setup_incremental')
    cal kisuke#syntax#setup_incremental()
  en
endfu

fu! s:handle_stream_start()
  cal setbufline(g:kisuke.state.buf_nr, line('$'), ' ')

  let s:kisuke.state.response_start_line = line('$') + 1
endfu

fu! s:handle_stream_end()
  let g:kisuke.state.marked_files = []
  let g:kisuke.state.marked_code_blocks = []
  let s:kisuke.state.stream_response = ''
  let s:kisuke.state.response_start_line = v:null

  cal setbufline(g:kisuke.state.buf_nr, line('$') + 1, ' ')
  cal kisuke#syntax#setup()
endfu

fu! s:process_session_history(messages)
  for entry in a:messages
    if entry.sender ==# 'Kisuke'
      cal s:render_kisuke_response(entry)
    elsei entry.sender ==# 'User'
      cal s:render_user_prompt(entry)
    en
  endfo
endfu

fu! s:render_kisuke_response(entry)
  let l:bufnr = g:kisuke.state.buf_nr

  let s:kisuke.state.response_start_line = line('$') + 1
  let l:lines = split(a:entry.message, '\n')

  let l:buffer_lines = []
  let l:index = 0

  for line in l:lines
    if l:index == 0
      cal add(l:buffer_lines, 'Kisuke > ' . line)
    else
      cal add(l:buffer_lines, line)
    en
    let l:index += 1
  endfo

  let s:kisuke.state.response_start_line = v:null

  cal add(l:buffer_lines, ' ')
  cal appendbufline(l:bufnr, line('$'), l:buffer_lines)
endfu

fu! s:render_user_prompt(entry)
  if has_key(a:entry, 'referenceCount') && a:entry.referenceCount > 0
    cal appendbufline(g:kisuke.state.buf_nr, line('$'), '> References Added - ' . a:entry.referenceCount)
    cal appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
  en

  cal appendbufline(g:kisuke.state.buf_nr, line('$'), 'Prompt > ' . a:entry.message)
  cal setbufline(g:kisuke.state.buf_nr, line('$') + 1, ' ')
endfu
