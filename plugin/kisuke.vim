if exists('g:is_kisuke_initialized')
  finish
endif

let g:is_kisuke_initialized = 1
let s:kisuke_buf_name       = 'Kisuke'
let s:kisuke_buf_nr         = -1
let s:job                   = v:null
let s:is_pending            = 0
let s:sessionId             = v:null
let s:totalSessions         = v:null
let s:stream_response       = ''
let s:response_start_line   = v:null
let s:marked_files          = []

func! s:SetupKisukeSyntax()
  syntax clear

  syn match KisukePrompt /^Prompt >/
  syn match KisukeResponse /^Kisuke >/
  syn match KisukeSystem /^> .*$/

  syn region KisukeCodeBlock matchgroup=KisukeCodeDelimiter
        \ start=/^```.*$/
        \ end=/^```$/
        \ keepend

  hi def link KisukePrompt Statement
  hi def link KisukeResponse Identifier
  hi def link KisukeSystem Special
  hi def link KisukeCodeDelimiter Delimiter
  hi def link KisukeCodeBlock String
endfunc

func! s:OnSubmit(prompt)
  if a:prompt == ''
    echoerr 'Cannot submit empty prompt, please write something'
  elseif s:is_pending
    echoerr 'Cannot submit a new prompt while server generating a response to earlier prompt'
  elseif s:job != v:null
    let s:is_pending = 1

    call ch_sendraw(job_getchannel(s:job), json_encode({
          \ 'type': 'prompt',
          \ 'sessionId': s:sessionId,
          \ 'payload': a:prompt,
          \ }))
  else
    call appendbufline(s:kisuke_buf_nr, line('$') - 1, 'Server is not running')
  endif
endfunc

func! s:ParseReply(channel, reply)
  let l:reply = json_decode(a:reply)

  if l:reply.type ==# 'initialize'
    silent! %delete

    let s:is_pending = 0
    let s:sessionId = l:reply.sessionInfo.id
    let s:totalSessions = l:reply.totalSessions

    call appendbufline(s:kisuke_buf_nr, line('$') - 1, '> ' . 'Kisuke initialized')
    call appendbufline(s:kisuke_buf_nr, line('$') - 1, '> ' . 'Session ' . l:reply.currentSession . '/' . s:totalSessions)

    for entry in l:reply.payload.messages
      if entry.sender ==# 'Kisuke'
        let s:response_start_line = line('$') + 1
        let l:index = 0

        for line in split(entry.message, '\n')
          if l:index ==# 0
            call setbufline(s:kisuke_buf_nr, s:response_start_line + l:index, 'Kisuke > ' . line)
          else
            call setbufline(s:kisuke_buf_nr, s:response_start_line + l:index, line)
          endif

          let l:index += 1
        endfor

        let s:response_start_line = v:null

        call setbufline(s:kisuke_buf_nr, line('$') + 1, ' ')
      elseif entry.sender ==# 'User'
        call appendbufline(s:kisuke_buf_nr, line('$'), 'Prompt > ' . entry.message)
        call setbufline(s:kisuke_buf_nr, line('$') + 1, ' ')
      endif
    endfor
  elseif l:reply.type ==# 'response'
    if l:reply.payload ==# 'stream_start'
      call setbufline(s:kisuke_buf_nr, line('$'), ' ')

      let s:response_start_line = line('$') + 1
    elseif l:reply.payload ==# 'stream_end'
      let s:is_pending = 0
      let s:stream_response = ''
      let s:response_start_line = v:null

      call setbufline(s:kisuke_buf_nr, line('$') + 1, ' ')
    else
      let s:stream_response = s:stream_response . l:reply.payload
      let l:index = 0

      for line in split(s:stream_response, '\n')
        if l:index ==# 0
          call setbufline(s:kisuke_buf_nr, s:response_start_line + l:index, 'Kisuke > ' . line)
        else
          call setbufline(s:kisuke_buf_nr, s:response_start_line + l:index, line)
        endif

        normal! G

        let l:index += 1
      endfor
    endif
  elseif l:reply.type ==# 'newSession'
    silent! %delete

    let s:sessionId = l:reply.sessionInfo.id
    let s:totalSessions = l:reply.totalSessions

    call setbufline(s:kisuke_buf_nr, 1, '> ' . 'Kisuke initialized')
    call setbufline(s:kisuke_buf_nr, 2, '> ' . 'Session ' . l:reply.currentSession . '/' . s:totalSessions)

    for entry in l:reply.payload.messages
      call setbufline(s:kisuke_buf_nr, 3, ' ')
      call setbufline(s:kisuke_buf_nr, 4, 'Kisuke > ' . entry.message)
    endfor

    call setbufline(s:kisuke_buf_nr, 5, ' ')

    let s:is_pending = 0
  elseif l:reply.type ==# 'switchSession'
    silent! %delete

    let s:sessionId = l:reply.sessionInfo.id
    let l:line_num = 2

    call appendbufline(s:kisuke_buf_nr, 0, '> ' . 'Kisuke initialized')
    call appendbufline(s:kisuke_buf_nr, 1, '> ' . 'Session ' . l:reply.currentSession . '/' . s:totalSessions)

    for entry in l:reply.payload.messages
      if entry.sender ==# 'Kisuke'
        let s:response_start_line = line('$') + 1
        let l:index = 0

        for line in split(entry.message, '\n')
          if l:index ==# 0
            call setbufline(s:kisuke_buf_nr, s:response_start_line + l:index, 'Kisuke > ' . line)
          else
            call setbufline(s:kisuke_buf_nr, s:response_start_line + l:index, line)
          endif

          let l:index += 1
        endfor

        let s:response_start_line = v:null

        call setbufline(s:kisuke_buf_nr, line('$') + 1, ' ')
      elseif entry.sender ==# 'User'
        call appendbufline(s:kisuke_buf_nr, line('$'), 'Prompt > ' . entry.message)
        call setbufline(s:kisuke_buf_nr, line('$') + 1, ' ')
      endif
    endfor

    let s:is_pending = 0
  elseif l:reply.type ==# 'error'
    let s:is_pending = 0

    call appendbufline(s:kisuke_buf_nr, line('$') - 1, 'Server error > ' . l:reply.payload)
  endif
endfunc

func! s:OpenKisuke()
  if s:job == v:null
    let s:job=job_start(['node', 'dist/index.js'], {
          \ 'out_cb': function('s:ParseReply'),
          \ })
  endif

  if bufexists(s:kisuke_buf_nr)
    let l:wid=bufwinid(s:kisuke_buf_nr)

    if l:wid == -1
      exe 'vsplit'
      exe 'buffer ' . s:kisuke_buf_nr

      let s:is_pending = 1

      call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'initialize' }))

      startinsert!
    else
      call win_gotoid(l:wid)
    endif
  else
    exe 'vsplit ' . s:kisuke_buf_name

    let s:kisuke_buf_nr = bufnr('%')
    let s:is_pending = 1

    setlocal
          \ buftype=prompt
          \ noswapfile
          \ nobuflisted
          \ syntax=markdown

    "         \ conceallevel=0
    "         \ concealcursor=

    call s:SetupKisukeSyntax()

    call prompt_setprompt(s:kisuke_buf_nr, 'Prompt > ')
    call prompt_setcallback(s:kisuke_buf_nr, function('s:OnSubmit'))
    call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'initialize' }))

    augroup g:kisuke_buf_name
      autocmd!
      autocmd TextChanged,TextChangedI <buffer> setlocal nomodified
    augroup END

     augroup KisukeSyntax
       autocmd!
       autocmd TextChanged,TextChangedI,CursorMoved,CursorMovedI <buffer> call s:SetupKisukeSyntax()
     augroup END
  endif
endfunc

func! s:NewSession()
  if s:job == v:null
    echoerr "Please run :Kisuke first "
  else
    let l:wid=bufwinid(s:kisuke_buf_nr)

    if l:wid == -1
      exe 'vsplit'
      exe 'buffer ' . s:kisuke_buf_nr

      let s:is_pending = 1

      call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'newSession' }))

      startinsert!
    else
      call win_gotoid(l:wid)
      call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'newSession' }))
    endif
  endif
endfunc

func! s:SwitchToNextSession()
  if s:job == v:null
    echoerr "Please run :Kisuke first "
  else
    let l:wid=bufwinid(s:kisuke_buf_nr)

    if l:wid == -1
      exe 'vsplit'
      exe 'buffer ' . s:kisuke_buf_nr

      let s:is_pending = 1

      call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'nextSession' }))

      startinsert!
    else
      call win_gotoid(l:wid)
      call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'nextSession' }))
    endif
  endif
endfunc

func! s:SwitchToPreviousSession()
  if s:job == v:null
    echoerr "Please run :Kisuke first "
  else
    let l:wid=bufwinid(s:kisuke_buf_nr)

    if l:wid == -1
      exe 'vsplit'
      exe 'buffer ' . s:kisuke_buf_nr

      let s:is_pending = 1

      call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'prevSession' }))

      startinsert!
    else
      call win_gotoid(l:wid)
      call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'prevSession' }))
    endif
  endif
endfunc

func! s:Auth()
  if s:job == v:null
    echoerr "Please run :Kisuke first "
  else
    let l:api_key = input('Enter your Claude API key: ')

    if empty(l:api_key)
      echoerr 'Please provide a valid api key'
    else
      let l:wid=bufwinid(s:kisuke_buf_nr)

      if l:wid == -1
        exe 'vsplit'
        exe 'buffer ' . s:kisuke_buf_nr

        let s:is_pending = 1

        call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'initialize' }))

        startinsert!
      else
        call win_gotoid(l:wid)
      endif

      call writefile([json_encode({ 'apiKey': l:api_key })], expand('~/.config/kisuke/auth.json'))
    endif
  endif
endfunc

func! s:DeleteSession()
  if s:job == v:null
    echoerr "Please run :Kisuke first "
  else
    let l:wid=bufwinid(s:kisuke_buf_nr)

    if l:wid == -1
      exe 'vsplit'
      exe 'buffer ' . s:kisuke_buf_nr

      let s:is_pending = 1

      call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'deleteSession', 'payload': s:sessionId }))

      startinsert!
    else
      call win_gotoid(l:wid)
      call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'deleteSession', 'payload': s:sessionId }))
    endif
  endif
endfunc

func! s:MarkCurrentFile()
  let l:wid=bufwinid(s:kisuke_buf_nr)
  let l:current_file = expand('%:p')
  let l:file_index = index(s:marked_files, l:current_file)
  let l:index = 0
  let l:marked_files_start_line_nr = v:null
  let l:marked_files_end_line_nr = v:null

  if l:wid == -1
    exe 'vsplit'
    exe 'buffer ' . s:kisuke_buf_nr
  else
    call win_gotoid(l:wid)
  endif

  echom 'CurrentFile ' . l:current_file

  if empty(split(getbufoneline(s:kisuke_buf_nr, line('$'))))
    let l:marked_files_start_line_nr = line('$') - len(s:marked_files)
    let l:marked_files_end_line_nr = line('$')

    if len(s:marked_files)
      call deletebufline(s:kisuke_buf_nr, l:marked_files_start_line_nr, l:marked_files_end_line_nr)
    endif
  elseif split(getbufoneline(s:kisuke_buf_nr, line('$')), ' ')[0] ==# 'Prompt'
    let l:marked_files_start_line_nr = line('$') - len(s:marked_files) - 1
    let l:marked_files_end_line_nr = line('$') - 1

    if len(s:marked_files)
      call deletebufline(s:kisuke_buf_nr, l:marked_files_start_line_nr, l:marked_files_end_line_nr)
    endif
  endif

  if l:file_index == -1
    call add(s:marked_files, l:current_file)
  else
    call remove(s:marked_files, l:file_index)
  endif

  if len(s:marked_files)
    for file_path in s:marked_files
      echom 'FilePath ' . file_path
      call appendbufline(s:kisuke_buf_nr, l:marked_files_start_line_nr + l:index, '> File reference ' . file_path)

      let l:index += 1

      if l:index ==# len(s:marked_files)
        echom 'l:index ==# len s:marked_files'

        call appendbufline(s:kisuke_buf_nr, l:marked_files_end_line_nr + l:index, ' ')
      endif
    endfor
  endif
endfunc

command! Kisuke call s:OpenKisuke()
command! KisukeNewSession call s:NewSession()
command! KisukeNextSession call s:SwitchToNextSession()
command! KisukePreviousSession call s:SwitchToPreviousSession()
command! KisukeAuth call s:Auth()
command! KisukeDeleteSession call s:DeleteSession()
command! KisukeMarkCurrentFile call s:MarkCurrentFile()

nnoremap <Leader>ko :Kisuke<CR>
nnoremap <Leader>kc :KisukeNewSession<CR>
nnoremap <Leader>kn :KisukeNextSession<CR>
nnoremap <Leader>kp :KisukePreviousSession<CR>
nnoremap <Leader>ka :KisukeAuth<CR>
nnoremap <Leader>kd :KisukeDeleteSession<CR>
nnoremap <Leader>km :KisukeMarkCurrentFile<CR>
