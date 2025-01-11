if exists('g:is_kisuke_initialized')
  finish
endif

let g:is_kisuke_initialized=1
let s:kisuke_buf_name='Kisuke'
let s:kisuke_buf_nr=-1
let s:job=v:null
let s:is_pending=0
let s:sessionId=v:null

func! s:OnSubmit(prompt)
  if a:prompt==''
    call append(line('$') - 1, 'Cannot submit empty prompt')
  elseif s:is_pending
    call append(line('$') - 1, 'Cannot enter new prompt untill server finishes the job')
  elseif s:job!=v:null
    let s:is_pending=1
    call ch_sendraw(job_getchannel(s:job), json_encode({
          \ 'type': 'prompt',
          \ 'sessionId': s:sessionId,
          \ 'payload': a:prompt,
          \ }))
  else
    call append(line('$') - 1, 'Server is not running')
  endif
endfunc

func! s:ParseReply(channel, reply)
  let s:is_pending=0
  let l:reply = json_decode(a:reply)
  if l:reply.type==#'initialize'
    let s:sessionId=l:reply.sessionInfo.id
    call append(line('$') - 1, '> ' . 'Kisuke initialized')
    call append(line('$') - 1, '> ' . 'Session ' . l:reply.sessionInfo.name)
    call append(line('$') - 1, '> ' . 'Total sessions - ' . l:reply.totalSessions)
    for entry in l:reply.payload.messages
      call append(line('$') - 1, '> ' . entry.message)
    endfor
  elseif l:reply.type==#'response'
    call append(line('$') - 1, '> ' . l:reply.payload)
  elseif l:reply.type==#'newSession'
    let s:sessionId=l:reply.sessionInfo.id
    silent! %delete _
    call append(0, '> ' . 'Kisuke initialized')
    call append(1, '> ' . 'Session ' . l:reply.sessionInfo.name)
    call append(2, '> ' . 'Total sessions - ' . l:reply.totalSessions)
    let l:line_num = 3
    for entry in l:reply.payload.messages
      call append(l:line_num, '> ' . entry.message)
      let l:line_num += 1
    endfor
  elseif l:reply.type==#'error'
    call append(line('$') - 1, 'Server error > ' . l:reply.payload)
  endif
endfunc

func! s:OpenKisuke()
  if s:job==v:null
    let s:job=job_start(['node', 'dist/index.js'], {
          \ 'out_cb': function('s:ParseReply'),
          \ })
  endif
  call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'initialize' }))
  let s:is_pending=1
  if bufexists(s:kisuke_buf_nr)
    let l:wid=bufwinid(s:kisuke_buf_nr)
    if l:wid==-1
      exe 'vsplit'
      exe 'buffer ' . s:kisuke_buf_nr
      startinsert!
    else
      call win_gotoid(l:wid)
    endif
  else
    exe 'vsplit ' . s:kisuke_buf_name
    let s:kisuke_buf_nr=bufnr('%')
    setlocal
          \ buftype=prompt
          \ noswapfile
          \ nobuflisted
    call prompt_setprompt(s:kisuke_buf_nr, 'Prompt: ')
    call prompt_setcallback(s:kisuke_buf_nr, function('s:OnSubmit'))
    augroup g:kisuke_buf_name
      autocmd!
      autocmd TextChanged,TextChangedI <buffer> setlocal nomodified
    augroup END
  endif
endfunc

func! s:NewSession()
  if s:job==v:null
    echom "Please run :Kisuke first "
  else
    call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'newSession' }))
  endif
endfunc

command! Kisuke call s:OpenKisuke()
command! KisukeNewSession call s:NewSession()
