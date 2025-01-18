
func! kisuke#server#start_process()
  let paths = split(&runtimepath, ',')
  let plugin_root = ''

  for path in paths
    if path =~ 'kisuke\.vim$'
      let plugin_root = path

      break
    endif
  endfor

  if empty(plugin_root)
    echoerr "Could not find kisuke.vim in runtimepath"

    return
  endif

  let node_script = plugin_root . '/dist/index.js'

  let g:kisuke.state.job = job_start(['node', node_script], {
        \ 'out_cb': function('kisuke#server#parse_reply'),
        \ })
endfunc

" TODO - update config file name to config.json instead of auth.json, also add
" model selection logic to configure function steps
func! kisuke#server#configure()
  let l:api_key = input('Enter your Claude API key: ')

  let l:checks = [
        \ {'condition': g:kisuke.state.job == v:null, 'message': 'Please run :KisukeOpen first, or press <leader>ko'},
        \ {'condition': empty(l:api_key), 'message': 'Please provide a valid api key'},
        \ ]

  if !kisuke#utils#validate(l:checks)
    return
  endif

  call writefile([json_encode({ 'apiKey': l:api_key })], expand('~/.config/kisuke/auth.json'))
  call kisuke#buffer#focus({ 'type': 'initialize' })
endfunc

func! kisuke#server#parse_reply(channel, reply)
  let l:reply = json_decode(a:reply)

  if l:reply.type ==# 'initialize'
    silent! %delete

    let g:kisuke.state.session_id = l:reply.sessionInfo.id
    let g:kisuke.state.total_sessions = l:reply.totalSessions

    call appendbufline(g:kisuke.state.buf_nr, line('$') - 1, '> ' . 'Kisuke initialized')
    call appendbufline(g:kisuke.state.buf_nr, line('$') - 1, '> ' . 'Session ' . l:reply.currentSession . '/' . g:kisuke.state.total_sessions)

    for entry in l:reply.payload.messages
      if entry.sender ==# 'Kisuke'
        let g:kisuke.state.response_start_line = line('$') + 1
        let l:index = 0

        for line in split(entry.message, '\n')
          if l:index ==# 0
            call setbufline(g:kisuke.state.buf_nr, g:kisuke.state.response_start_line + l:index, 'Kisuke > ' . line)
          else
            call setbufline(g:kisuke.state.buf_nr, g:kisuke.state.response_start_line + l:index, line)
          endif

          let l:index += 1
        endfor

        let g:kisuke.state.response_start_line = v:null

        call setbufline(g:kisuke.state.buf_nr, line('$') + 1, ' ')
      elseif entry.sender ==# 'User'
        let l:index = 0

        if entry.referenceCount > 0
          call appendbufline(g:kisuke.state.buf_nr, line('$'), '> References Added - ' . entry.referenceCount)
          call appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
        endif

        call appendbufline(g:kisuke.state.buf_nr, line('$'), 'Prompt > ' . entry.message)
        call setbufline(g:kisuke.state.buf_nr, line('$') + 1, ' ')
      endif
    endfor

    if len(g:kisuke.state.marked_files)
      call kisuke#buffer#render_marked_content()
    endif

    let g:kisuke.state.is_pending = 0

    call kisuke#syntax#setup()

  elseif l:reply.type ==# 'response'
    if l:reply.payload ==# 'stream_start'
      call setbufline(g:kisuke.state.buf_nr, line('$'), ' ')

      let g:kisuke.state.response_start_line = line('$') + 1
    elseif l:reply.payload ==# 'stream_end'
      let g:kisuke.state.is_pending = 0
      let g:kisuke.state.stream_response = ''
      let g:kisuke.state.response_start_line = v:null
      let g:kisuke.state.marked_files = []

      call setbufline(g:kisuke.state.buf_nr, line('$') + 1, ' ')
    else
      let g:kisuke.state.stream_response = g:kisuke.state.stream_response . l:reply.payload
      let l:index = 0

      for line in split(g:kisuke.state.stream_response, '\n')
        if l:index ==# 0
          call setbufline(g:kisuke.state.buf_nr, g:kisuke.state.response_start_line + l:index, 'Kisuke > ' . line)
        else
          call setbufline(g:kisuke.state.buf_nr, g:kisuke.state.response_start_line + l:index, line)
        endif

        normal! G

        let l:index += 1
      endfor
    endif
  elseif l:reply.type ==# 'newSession'
    silent! %delete

    let g:kisuke.state.session_id = l:reply.sessionInfo.id
    let g:kisuke.state.total_sessions = l:reply.totalSessions

    call setbufline(g:kisuke.state.buf_nr, 1, '> ' . 'Kisuke initialized')
    call setbufline(g:kisuke.state.buf_nr, 2, '> ' . 'Session ' . l:reply.currentSession . '/' . g:kisuke.state.total_sessions)

    for entry in l:reply.payload.messages
      call setbufline(g:kisuke.state.buf_nr, 3, ' ')
      call setbufline(g:kisuke.state.buf_nr, 4, 'Kisuke > ' . entry.message)
    endfor

    call setbufline(g:kisuke.state.buf_nr, 5, ' ')

    let g:kisuke.state.is_pending = 0
  elseif l:reply.type ==# 'switchSession'
    silent! %delete

    let g:kisuke.state.session_id = l:reply.sessionInfo.id
    let l:line_num = 2

    call appendbufline(g:kisuke.state.buf_nr, 0, '> ' . 'Kisuke initialized')
    call appendbufline(g:kisuke.state.buf_nr, 1, '> ' . 'Session ' . l:reply.currentSession . '/' . g:kisuke.state.total_sessions)

    for entry in l:reply.payload.messages
      if entry.sender ==# 'Kisuke'
        let g:kisuke.state.response_start_line = line('$') + 1
        let l:index = 0

        for line in split(entry.message, '\n')
          if l:index ==# 0
            call setbufline(g:kisuke.state.buf_nr, g:kisuke.state.response_start_line + l:index, 'Kisuke > ' . line)
          else
            call setbufline(g:kisuke.state.buf_nr, g:kisuke.state.response_start_line + l:index, line)
          endif

          let l:index += 1
        endfor

        let g:kisuke.state.response_start_line = v:null

        call setbufline(g:kisuke.state.buf_nr, line('$') + 1, ' ')
      elseif entry.sender ==# 'User'
        let l:index = 0

        if entry.referenceCount > 0
          call appendbufline(g:kisuke.state.buf_nr, line('$'), '> References Added - ' . entry.referenceCount)
          call appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
        endif

        call appendbufline(g:kisuke.state.buf_nr, line('$'), 'Prompt > ' . entry.message)
        call setbufline(g:kisuke.state.buf_nr, line('$') + 1, ' ')
      endif
    endfor

    let g:kisuke.state.is_pending = 0
  elseif l:reply.type ==# 'error'
    let g:kisuke.state.is_pending = 0

    call appendbufline(g:kisuke.state.buf_nr, line('$') - 1, 'Server error > ' . l:reply.payload)
  endif
endfunc
