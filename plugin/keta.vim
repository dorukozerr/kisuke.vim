if exists('g:is_keta_initialized')
  finish
endif

let g:is_keta_initialized=1
let g:keta_buf_name='Keta'
let g:keta_buf_nr=-1

func! PromptSubmit(prompt)
  echom 'PromptSubmit -> ' . a:prompt
endfunc

func! KetaOpen()
  if bufexists(g:keta_buf_nr)
    let l:wid=bufwinid(g:keta_buf_nr)

    if l:wid == -1
      exe 'vsplit'
      exe 'buffer ' . g:keta_buf_nr
    else
      call win_gotoid(l:wid)
    endif
  else
    exe 'vsplit ' . g:keta_buf_name

    let g:keta_buf_nr=bufnr('%')

    setlocal
          \ buftype=prompt
          \ noswapfile
          \ nobuflisted

    call prompt_setprompt(g:keta_buf_nr, 'Prompt: ')
    call prompt_setcallback(g:keta_buf_nr, function('PromptSubmit'))

    augroup g:keta_buf_name
      autocmd!
      autocmd TextChanged,TextChangedI <buffer> setlocal nomodified
    augroup END

    startinsert!
  endif
endfunc

command! Keta call KetaOpen()
