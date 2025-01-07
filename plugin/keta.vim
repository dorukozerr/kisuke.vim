if exists('g:loaded_keta')
  finish
endif

let g:loaded_keta = 1

let s:job = v:null
let s:buf_name = 'KetaBuffer'
let s:buf_nr = -1

function! s:HandleMessage(channel, msg)
  try
    let l:data = json_decode(a:msg)

    if bufexists(s:buf_nr)
      call setbufline(s:buf_nr, 1, l:data.content)
    endif
  catch
    if bufexists(s:buf_nr)
      call setbufline(s:buf_nr, 1, a:msg)
    endif
  endtry
endfunction

function! s:StartServer()
  if has('nvim')
    let l:job = jobstart(['node', 'dist/index.js'], {
          \ 'on_stdout': {_, data -> s:HandleMessage(_, join(data, "\n"))},
          \ 'cwd': getcwd(),
          \ })

    if type(l:job) == v:t_number && l:job <= 0
      echoerr "Failed to start TypeScript server"

      return v:null
    endif
  else
    let l:job = job_start(['node', 'dist/index.js'], {
          \ 'out_cb': function('s:HandleMessage'),
          \ 'cwd': getcwd(),
          \ })

    if type(l:job) != v:t_job
      echoerr "Failed to start TypeScript server"

      return v:null
    endif
  endif

  return l:job
endfunction

function! s:SendInitMessage()
  if s:job != v:null
    let l:msg = json_encode({'type': 'init'}) . "\n"

    if has('nvim')
      call chansend(s:job, l:msg)
    else
      call ch_sendraw(job_getchannel(s:job), l:msg)
    endif
  endif
endfunction

function! s:OpenKeta()
  if bufexists(s:buf_nr)
    let l:winid = bufwinid(s:buf_nr)

    if l:winid == -1
      execute 'vsplit'
      execute 'buffer ' . s:buf_nr
    else
      call win_gotoid(l:winid)
    endif
  else
    execute 'vsplit ' . s:buf_name
    let s:buf_nr = bufnr('%')

    setlocal buftype=nofile
    setlocal noswapfile
    setlocal nobuflisted
  endif

  if s:job == v:null
    let s:job = s:StartServer()

    if s:job == v:null
      return
    endif
  endif

  call s:SendInitMessage()
endfunction

command! Keta call s:OpenKeta()
