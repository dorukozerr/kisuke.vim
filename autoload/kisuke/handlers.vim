let s:kisuke = {}
let s:kisuke.state = {
      \ 'response_start_line': v:null,
      \ 'stream_response': '',
      \ }

func! kisuke#handlers#initialize(reply)
  silent! %delete

  let g:kisuke.state.session_id = a:reply.sessionInfo.id
  let g:kisuke.state.total_sessions = a:reply.totalSessions

  call appendbufline(g:kisuke.state.buf_nr, line('$') - 1, '> ' . 'Kisuke initialized')
  call appendbufline(g:kisuke.state.buf_nr, line('$') - 1, '> ' . 'Session ' . a:reply.currentSession . '/' . g:kisuke.state.total_sessions)
  call s:process_session_history(a:reply.payload.messages)

  exe len(g:kisuke.state.marked_files)
        \ ? 'call kisuke#buffer#render_marked_content()'
        \ : ''

  call kisuke#syntax#setup()
endfunc

func! kisuke#handlers#response(reply)
  exe a:reply.payload ==# 'stream_start'
        \ ? 'call s:handle_stream_start()'
        \ : a:reply.payload ==# 'stream_end'
        \ ? 'call s:handle_stream_end()'
        \ : 'call s:handle_stream(a:reply)'
endfunc

func! s:handle_stream_start()
  call setbufline(g:kisuke.state.buf_nr, line('$'), ' ')

  let s:kisuke.state.response_start_line = line('$') + 1
endfunc

func! s:handle_stream_end()
  let g:kisuke.state.marked_files = []
  let s:kisuke.state.stream_response = ''
  let s:kisuke.state.response_start_line = v:null

  call setbufline(g:kisuke.state.buf_nr, line('$') + 1, ' ')
endfunc

func s:handle_stream(reply)
  let s:kisuke.state.stream_response = s:kisuke.state.stream_response . a:reply.payload
  let l:index = 0

  for line in split(s:kisuke.state.stream_response, '\n')
    exe l:index ==# 0
          \ ? 'call setbufline(g:kisuke.state.buf_nr, s:kisuke.state.response_start_line + l:index, "Kisuke > " . line)'
          \ : 'call setbufline(g:kisuke.state.buf_nr, s:kisuke.state.response_start_line + l:index, line)'

    normal! G

    let l:index += 1
  endfor
endfunc

func! kisuke#handlers#new_session(reply)
  silent! %delete

  let g:kisuke.state.session_id = a:reply.sessionInfo.id
  let g:kisuke.state.total_sessions = a:reply.totalSessions

  call setbufline(g:kisuke.state.buf_nr, 1, '> ' . 'Kisuke initialized')
  call setbufline(g:kisuke.state.buf_nr, 2, '> ' . 'Session ' . a:reply.currentSession . '/' . g:kisuke.state.total_sessions)

  for entry in a:reply.payload.messages
    call setbufline(g:kisuke.state.buf_nr, 3, ' ')
    call setbufline(g:kisuke.state.buf_nr, 4, 'Kisuke > ' . entry.message)
  endfor

  call setbufline(g:kisuke.state.buf_nr, 5, ' ')
endfunc

func! kisuke#handlers#switch_session(reply)
  silent! %delete

  let g:kisuke.state.session_id = a:reply.sessionInfo.id
  let l:line_num = 2

  call appendbufline(g:kisuke.state.buf_nr, 0, '> ' . 'Kisuke initialized')
  call appendbufline(g:kisuke.state.buf_nr, 1, '> ' . 'Session ' . a:reply.currentSession . '/' . g:kisuke.state.total_sessions)
  call s:process_session_history(a:reply.payload.messages)
endfunc

func! kisuke#handlers#error(reply)
  call appendbufline(g:kisuke.state.buf_nr, line('$') - 1, 'Server error > ' . a:reply.payload)
endfunc

func! s:process_session_history(messages)
  for entry in a:messages
    exe entry.sender ==# 'Kisuke'
          \ ? 'call s:render_kisuke_response(entry)'
          \ : entry.sender ==# 'User'
          \ ? 'call s:render_user_prompt(entry)'
          \ : ''
  endfor
endfunc

func! s:render_kisuke_response(entry)
  let s:kisuke.state.response_start_line = line('$') + 1
  let l:index = 0

  for line in split(a:entry.message, '\n')
    exe l:index ==# 0
          \ ? 'call setbufline(g:kisuke.state.buf_nr, s:kisuke.state.response_start_line + l:index, "Kisuke > " . line)'
          \ : 'call setbufline(g:kisuke.state.buf_nr, s:kisuke.state.response_start_line + l:index, line)'

    let l:index += 1
  endfor

  let s:kisuke.state.response_start_line = v:null

  call setbufline(g:kisuke.state.buf_nr, line('$') + 1, ' ')
endfunc

func! s:render_user_prompt(entry)
  exe a:entry.referenceCount > 0
        \ ? 'call appendbufline(g:kisuke.state.buf_nr, line("$"), "> References Added - " . a:entry.referenceCount)'
        \ . ' | call appendbufline(g:kisuke.state.buf_nr, line("$"), " ")'
        \ : ''

  call appendbufline(g:kisuke.state.buf_nr, line('$'), 'Prompt > ' . a:entry.message)
  call setbufline(g:kisuke.state.buf_nr, line('$') + 1, ' ')
endfunc

