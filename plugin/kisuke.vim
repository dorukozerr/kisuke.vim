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

func! s:OnSubmit(prompt)
  if a:prompt == ''
    call appendbufline(s:kisuke_buf_nr, line('$') - 1, 'Cannot submit empty prompt')
  elseif s:is_pending
    call appendbufline(s:kisuke_buf_nr, line('$') - 1, 'Cannot enter new prompt untill server finishes the job')
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
  let s:is_pending = 0
  let l:reply = json_decode(a:reply)

  if l:reply.type ==# 'initialize'
    silent! %delete

    let s:sessionId = l:reply.sessionInfo.id
    let s:totalSessions = l:reply.totalSessions

    call appendbufline(s:kisuke_buf_nr, line('$') - 1, '> ' . 'Kisuke initialized')
    call appendbufline(s:kisuke_buf_nr, line('$') - 1, '> ' . 'Session ' . l:reply.currentSession . '/' . s:totalSessions)

    for entry in l:reply.payload.messages
      call appendbufline(s:kisuke_buf_nr, line('$') - 1, '> ' . entry.message)
    endfor
  elseif l:reply.type ==# 'response'
    echom 'Response => ' . a:reply
    if l:reply.payload != 'stream_start' && l:reply.payload != 'stream_end'
      for line in split(l:reply.payload, '\n')
        if empty(line)
          call appendbufline(s:kisuke_buf_nr, line('$'), '')

          continue
        endif

        let current_line = getbufline(s:kisuke_buf_nr, line('$'))[0]

        if empty(current_line)
          call setbufline(s:kisuke_buf_nr, line('$'), line)
        else
          call setbufline(s:kisuke_buf_nr, line('$'), current_line . line)
        endif
      endfor
    endif
  elseif l:reply.type ==# 'newSession'
    silent! %delete

    let s:sessionId = l:reply.sessionInfo.id
    let s:totalSessions = l:reply.totalSessions
    let l:line_num = 2

    call appendbufline(s:kisuke_buf_nr, 0, '> ' . 'Kisuke initialized')
    call appendbufline(s:kisuke_buf_nr, 1, '> ' . 'Session ' . l:reply.currentSession . '/' . s:totalSessions)

    for entry in l:reply.payload.messages
      call appendbufline(s:kisuke_buf_nr, l:line_num, '> ' . entry.message)

      let l:line_num += 1
    endfor
  elseif l:reply.type ==# 'switchSession'
    silent! %delete

    let s:sessionId = l:reply.sessionInfo.id
    let l:line_num = 2

    call appendbufline(s:kisuke_buf_nr, 0, '> ' . 'Kisuke initialized')
    call appendbufline(s:kisuke_buf_nr, 1, '> ' . 'Session ' . l:reply.currentSession . '/' . s:totalSessions)

    for entry in l:reply.payload.messages
      call appendbufline(s:kisuke_buf_nr, l:line_num, '> ' . entry.message)

      let l:line_num += 1
    endfor
  elseif l:reply.type ==# 'error'
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

    call prompt_setprompt(s:kisuke_buf_nr, 'Prompt: ')
    call prompt_setcallback(s:kisuke_buf_nr, function('s:OnSubmit'))
    call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'initialize' }))

    augroup g:kisuke_buf_name
      autocmd!
      autocmd TextChanged,TextChangedI <buffer> setlocal nomodified
    augroup END
  endif
endfunc

func! s:NewSession()
  if s:job == v:null
    echom "Please run :Kisuke first "
  else
    call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'newSession' }))
  endif
endfunc

func! s:SwitchToNextSession()
  if s:job == v:null
    echom "Please run :Kisuke first "
  else
    call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'nextSession' }))
  endif
endfunc

func! s:SwitchToPreviousSession()
  if s:job == v:null
    echom "Please run :Kisuke first "
  else
    call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'prevSession' }))
  endif
endfunc

func! s:KisukeAuth()
  if s:job == v:null
    echom "Please run :Kisuke first "
  else
    let l:api_key = input('Enter your Claude API key: ')

    if empty(l:api_key)
      echo 'Please provide a valid api key'
    else
      call writefile([json_encode({ 'apiKey': l:api_key })], expand('~/.config/kisuke/auth.json'))
      call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'initialize' }))
    endif
  endif
endfunc

command! Kisuke call s:OpenKisuke()
command! KisukeNewSession call s:NewSession()
command! KisukeNextSession call s:SwitchToNextSession()
command! KisukePreviousSession call s:SwitchToPreviousSession()
command! KisukeAuth call s:KisukeAuth()
