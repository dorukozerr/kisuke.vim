if exists('g:is_kisuke_initialized')
  finish
endif

let g:is_kisuke_initialized=1
let s:kisuke_buf_name='Kisuke'
let s:kisuke_buf_nr=-1
let s:job=v:null

func! s:PromptSubmit(prompt)
  if a:prompt == ''
    echom 'Prompt is empty'
  else
    if s:job!=v:null
      let l:msg = json_encode({
            \ 'type': 'message',
            \ 'content': a:prompt,
            \ })
      call ch_sendraw(job_getchannel(s:job), l:msg)
      setlocal nomodifiable
      stopinsert!
    endif
  endif
endfunc

func! s:HandleServerResponse(channel, response)
  setlocal modifiable
  let l:response = json_decode(a:response)
  call append(line('$') - 1, l:response.content)
  startinsert!
endfunc

func! s:OpenKisuke()
  if s:job==v:null
    let s:job=job_start(['node', 'dist/index.js'], {
          \ 'out_cb': function('s:HandleServerResponse'),
          \ })
  endif
  if bufexists(s:kisuke_buf_nr)
    let l:wid=bufwinid(s:kisuke_buf_nr)
    if l:wid == -1
      exe 'vsplit'
      exe 'buffer ' . s:kisuke_buf_nr
      startinsert!
    else
      call win_gotoid(l:wid)
      startinsert!
    endif
  else
    exe 'vsplit ' . s:kisuke_buf_name
    let s:kisuke_buf_nr=bufnr('%')
    setlocal
          \ buftype=prompt
          \ noswapfile
          \ nobuflisted
    call prompt_setprompt(s:kisuke_buf_nr, 'Prompt: ')
    call prompt_setcallback(s:kisuke_buf_nr, function('s:PromptSubmit'))
    augroup g:kisuke_buf_name
      autocmd!
      autocmd TextChanged,TextChangedI <buffer> setlocal nomodified
    augroup END
    startinsert!
  endif
endfunc

command! Kisuke call s:OpenKisuke()
