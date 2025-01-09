if exists('g:is_kisuke_initialized')
  finish
endif

let g:is_kisuke_initialized=1
let s:kisuke_buf_name='Kisuke'
let s:kisuke_buf_nr=-1
let s:job=v:null
let s:is_pending=0

func! s:OnSubmit(prompt)
  if a:prompt==''
    call append(line('$') - 1, 'Cannot submit empty prompt')
  elseif s:is_pending
    call append(line('$') - 1, 'Cannot enter new prompt untill server finishes the job')
  elseif s:job!=v:null
    let s:is_pending=1
    call ch_sendraw(job_getchannel(s:job), json_encode({
          \ 'type': 'prompt',
          \ 'input': a:prompt,
          \ }))
  else
    call append(line('$') - 1, 'Server is not running')
  endif
endfunc

func! s:ParseReply(channel, reply)
  let s:is_pending=0
  let l:reply = json_decode(a:reply)
  call append(line('$') - 1, l:reply.payload)
endfunc

func! s:OpenKisuke()
  if s:job==v:null
    let s:job=job_start(['node', 'dist/index.js'], {
          \ 'out_cb': function('s:ParseReply'),
          \ })
    call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'initialize' }))
    let s:is_pending=1
  endif
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

command! Kisuke call s:OpenKisuke()
