if exists('g:loaded_keta')
  finish
endif

let g:loaded_keta = 1
let s:job = v:null
let s:buf_name = 'KetaBuffer'
let s:buf_nr = -1
let s:input_start_line = 1
let s:is_sending = 0

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

function! s:SendMessage(msg)
  if s:job != v:null
    let l:msg = json_encode({
          \ 'type': 'message',
          \ 'content': a:msg
          \ }) . "\n"
    if has('nvim')
      call chansend(s:job, l:msg)
    else
      call ch_sendraw(job_getchannel(s:job), l:msg)
    endif
  endif
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

function! s:HandleMessage(channel, msg)
  try
    let l:data = json_decode(a:msg)
    if bufexists(s:buf_nr)
      let l:lines = split(l:data.content, "\n")
      let l:cur_line = line('$')

      " Add the response lines
      call setline(l:cur_line, '> ' . l:lines[0])
      for l:line in l:lines[1:]
        call append(l:cur_line, '  ' . l:line)
        let l:cur_line += 1
      endfor

      " Add new prompt and update input start line
      call append(l:cur_line, '$ ')
      let s:input_start_line = l:cur_line + 1
      call cursor(line('$'), col('$'))
    endif
  catch
    echom "Error handling message: " . v:exception
  endtry
endfunction

function! s:GetCurrentInput()
  let l:current_line = line('.')
  let l:lines = []

  " Find the last prompt line before the current position
  let l:start_line = l:current_line
  while l:start_line > 0
    let l:line = getline(l:start_line)
    if l:line[0:1] == '$ '
      break
    endif
    let l:start_line -= 1
  endwhile

  " Collect all lines from prompt to current position
  let l:lines = []
  let l:first_line = getline(l:start_line)[2:] " Remove the '$ ' from first line
  if !empty(l:first_line)
    call add(l:lines, l:first_line)
  endif

  for l:idx in range(l:start_line + 1, l:current_line)
    let l:line = getline(l:idx)
    call add(l:lines, l:line)
  endfor

  return join(l:lines, "\n")
endfunction

function! s:SendCurrentInput()
  if s:is_sending
    return
  endif

  let s:is_sending = 1
  let l:message = s:GetCurrentInput()

  if !empty(l:message)
    call append(line('$'), '')
    call s:SendMessage(l:message)
  endif

  let s:is_sending = 0
endfunction

function! s:HandleEnter()
  " Just create a new line, don't send
  return "\<CR>"
endfunction

function! s:SetupBuffer()
  setlocal buftype=nofile
  setlocal noswapfile
  setlocal nobuflisted

  " Initialize with input line
  call setline(1, '$ ')

  " Set up mappings
  " Enter for new line
  inoremap <buffer><expr> <CR> <SID>HandleEnter()

  " Send messages with <ctrl> + s
  inoremap <buffer><silent> <C-s> <ESC>:call <SID>SendCurrentInput()<CR>a
  nnoremap <buffer><silent> <C-s> :call <SID>SendCurrentInput()<CR>
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
    call s:SetupBuffer()
  endif

  if s:job == v:null
    let s:job = s:StartServer()
    if s:job == v:null
      return
    endif
    call s:SendInitMessage()
  endif

  call cursor(line('$'), col('$'))
  startinsert!
endfunction

command! Keta call s:OpenKeta()
