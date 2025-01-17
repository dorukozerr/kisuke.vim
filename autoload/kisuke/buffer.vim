func! kisuke#buffer#open()
  if g:kisuke.state.job == v:null
    call kisuke#server#start_process()
  endif

  let g:kisuke.state.is_pending = 1

  if bufexists(g:kisuke.state.buf_nr)
    call kisuke#buffer#focus({ 'type': 'initialize' })
  else
    call kisuke#buffer#create()
  endif
endfunc

func! kisuke#buffer#create()
  exe 'vsplit ' . g:kisuke.state.buf_name

  let g:kisuke.state.buf_nr = bufnr('%')

  setlocal
        \ buftype=prompt
        \ noswapfile
        \ nobuflisted
        \ syntax=markdown

  call kisuke#syntax#setup()

  call prompt_setprompt(g:kisuke.state.buf_nr, 'Prompt > ')
  call prompt_setcallback(g:kisuke.state.buf_nr, function('kisuke#buffer#on_submit'))
  call ch_sendraw(job_getchannel(g:kisuke.state.job), json_encode({ 'type': 'initialize' }))

  augroup g:kisuke_buf_name
    autocmd!
    autocmd TextChanged,TextChangedI <buffer> setlocal nomodified
  augroup END

  augroup KisukeSyntax
    autocmd!
    autocmd TextChanged,TextChangedI,CursorMoved,CursorMovedI <buffer> call kisuke#syntax#setup()
  augroup END
endfunc

func! kisuke#buffer#focus(message = v:null)
  let l:wid = bufwinid(g:kisuke.state.buf_nr)

  if l:wid == -1
    exe 'vsplit'
    exe 'buffer ' . g:kisuke.state.buf_nr
  else
    call win_gotoid(l:wid)
  endif

  if a:message != v:null
    call ch_sendraw(job_getchannel(g:kisuke.state.job), json_encode(a:message))
  endif
endfunc

func! kisuke#buffer#render_marked_content()
  if empty(split(getbufoneline(g:kisuke.state.buf_nr, line('$'))))
    call appendbufline(g:kisuke.state.buf_nr, line('$'), '> Marked File Count - ' . len(g:kisuke.state.marked_files))
  else
    call appendbufline(g:kisuke.state.buf_nr, line('$') - 1, '> Marked File Count - ' . len(g:kisuke.state.marked_files))
  endif

  let l:index = 0

  for entry in g:kisuke.state.marked_files
    if empty(split(getbufoneline(g:kisuke.state.buf_nr, line('$'))))
      call appendbufline(g:kisuke.state.buf_nr, line('$'), '> File Path - ' . entry.file_path)
    elseif split(getbufoneline(g:kisuke.state.buf_nr, line('$')), ' ')[0] ==# 'Prompt'
      call appendbufline(g:kisuke.state.buf_nr, line('$') - 1, '> File Path - ' . entry.file_path)
    else
      call appendbufline(g:kisuke.state.buf_nr, line('$'), '> File Path - ' . entry.file_path)
    endif

    let l:index += 1

    if l:index ==# len(g:kisuke.state.marked_files)
      if split(getbufoneline(g:kisuke.state.buf_nr, line('$')), ' ')[0] ==# 'Prompt'
        call appendbufline(g:kisuke.state.buf_nr, line('$') - 1, ' ')
      else
        call appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
      endif
    endif
  endfor
endfunc

func! s:MarkCurrentFile()
  if s:job == v:null
    echoerr 'Please run :Kisuke first '

    return
  endif

  if bufnr('%') == s:kisuke_buf_nr
    echoerr 'Cannot mark Kisuke chat buffer'

    return
  endif

  if s:is_pending
    echoerr 'Cannot mark a file while server generating response'

    return
  endif

  let l:wid=bufwinid(s:kisuke_buf_nr)
  let l:current_file = expand('%:p')
  let l:file_index = -1
  let l:index = 0
  let l:marked_files_start_line_nr = v:null
  let l:marked_files_end_line_nr = v:null

  for i in range(len(s:marked_files))
    if s:marked_files[i].file_path == l:current_file
      let l:file_index = i

      break
    endif
  endfor

  if l:wid == -1
    exe 'vsplit'
    exe 'buffer ' . s:kisuke_buf_nr

    let s:is_pending = 1

    call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'initialize' }))
  else
    call win_gotoid(l:wid)
  endif

  if empty(split(getbufoneline(s:kisuke_buf_nr, line('$'))))
    let l:marked_files_start_line_nr = line('$') - len(s:marked_files) - 1
    let l:marked_files_end_line_nr = line('$')

    if len(s:marked_files)
      call deletebufline(s:kisuke_buf_nr, l:marked_files_start_line_nr, l:marked_files_end_line_nr)
    endif
  elseif split(getbufoneline(s:kisuke_buf_nr, line('$')), ' ')[0] ==# 'Prompt'
    let l:marked_files_start_line_nr = line('$') - len(s:marked_files) - 2
    let l:marked_files_end_line_nr = line('$') - 1

    if len(s:marked_files)
      call deletebufline(s:kisuke_buf_nr, l:marked_files_start_line_nr, l:marked_files_end_line_nr)
    endif
  endif

  if l:file_index == -1
    call add(s:marked_files, {'file_path': l:current_file, 'scope': 'all'})
  else
    call remove(s:marked_files, l:file_index)
  endif

  if len(s:marked_files)
    call s:DisplayMarkedContent()
  endif
endfunc


func! s:MarkHighlightedCode() range
  if s:job == v:null
    echoerr 'Please run :Kisuke first'

    return
  endif

  if bufnr('%') == s:kisuke_buf_nr
    echoerr 'Cannot mark Kisuke chat buffer'

    return
  endif

  if s:is_pending
    echoerr 'Cannot mark code while server generating response'

    return
  endif

  let l:highlighted = getline(a:firstline, a:lastline)
  let l:current_file = expand('%:p')

  echom 'l:highlighted ' . json_encode(l:highlighted)
endfunc

func! kisuke#buffer#on_submit(prompt)
  let l:checks = [
        \ {'condition': a:prompt == '', 'message': 'Cannot submit empty prompt, please write something'},
        \ {'condition': g:kisuke.state.is_pending, 'message': 'Cannot submit a new prompt while server generating a response'},
        \ {'condition': g:kisuke.state.job == v:null, 'message': 'Server is not running, try restarting vim'},
        \ ]

  if !kisuke#utils#validate(l:checks)
    return
  endif

  let g:kisuke.state.is_pending = 1

  let l:payload = {
        \ 'type': 'prompt',
        \ 'sessionId': g:kisuke.state.g:kisuke.state.session_id,
        \ 'payload': a:prompt,
        \ }

  let l:payload = len(g:kisuke.state.marked_files)
        \ ? extend(l:payload, {'context': g:kisuke.state.marked_files})
        \ : l:payload

  call ch_sendraw(job_getchannel(g:kisuke.state.job), json_encode(l:payload))
endfunc

