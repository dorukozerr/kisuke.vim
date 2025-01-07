if exists('g:loaded_keta')
  finish
endif

let s:config_dir = expand('~/.config/keta')
let s:config_file = s:config_dir . '/config.json'
let g:loaded_keta = 1
let s:job = v:null
let s:buf_name = 'KetaBuffer'
let s:buf_nr = -1
let s:input_start_line = 1
let s:is_sending = 0
let s:stream_buffer = ''
let s:is_streaming = 0
let s:stream_start_line = -1

function! s:EnsureConfigDir()
  if !isdirectory(s:config_dir)
    call mkdir(s:config_dir, 'p')
  endif
endfunction

function! s:SaveConfig(config)
  call s:EnsureConfigDir()
  call writefile([json_encode(a:config)], s:config_file)
endfunction

function! s:LoadConfig()
  if filereadable(s:config_file)
    let l:content = readfile(s:config_file)
    if !empty(l:content)
      return json_decode(l:content[0])
    endif
  endif
  return {}
endfunction

function! s:SetupKeta()
  let l:config = s:LoadConfig()

  " Prompt for API key
  let l:api_key = input('Enter your Claude API key: ')

  " Save if not empty
  if !empty(l:api_key)
    let l:config['apiKey'] = l:api_key
    call s:SaveConfig(l:config)
    echo "\nAPI key saved successfully!"
  else
    echo "\nSetup cancelled - no API key provided"
    return
  endif

  " If server is running, restart it with new config
  if s:job != v:null
    if has('nvim')
      call jobstop(s:job)
    else
      call job_stop(s:job)
    endif
    let s:job = s:StartServer()
    if s:job != v:null
      call s:SendInitMessage()
    endif
  endif
endfunction

function! s:StartServer()
  let l:config = s:LoadConfig()
  if empty(l:config)
    echoerr "Please run :KetaSetup first to configure the plugin"
    return v:null
  endif

  if has('nvim')
    let l:job = jobstart(['node', 'dist/index.js', json_encode(l:config)], {
          \ 'on_stdout': {_, data -> s:HandleMessage(_, join(data, "\n"))},
          \ 'cwd': getcwd(),
          \ })
    if type(l:job) == v:t_number && l:job <= 0
      echoerr "Failed to start TypeScript server"
      return v:null
    endif
  else
    let l:job = job_start(['node', 'dist/index.js', json_encode(l:config)], {
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

    " Handle different message types
    if l:data.type == 'stream_start'
      let s:is_streaming = 1
      let s:stream_buffer = ''
      " Add initial response line
      let l:cur_line = line('$')
      call setline(l:cur_line, '> ')
      let s:stream_start_line = l:cur_line

    elseif l:data.type == 'stream_chunk'
      if s:is_streaming
        " Append to buffer
        let s:stream_buffer .= l:data.content

        " Split into lines
        let l:lines = split(s:stream_buffer, "\n")

        " Update first line
        call setline(s:stream_start_line, '> ' . l:lines[0])

        " Update/append remaining lines
        let l:line_num = s:stream_start_line
        for l:idx in range(1, len(l:lines) - 1)
          let l:line_num += 1
          if l:line_num <= line('$')
            call setline(l:line_num, '  ' . l:lines[l:idx])
          else
            call append(l:line_num - 1, '  ' . l:lines[l:idx])
          endif
        endfor

        " If there are newlines, update buffer to just the partial last line
        if len(l:lines) > 1
          let s:stream_buffer = l:lines[-1]
        endif

        " Move cursor to end
        call cursor(line('$'), col('$'))
      endif

    elseif l:data.type == 'stream_end'
      let s:is_streaming = 0
      " Add new prompt
      call append(line('$'), '')
      call append(line('$'), '$ ')
      let s:input_start_line = line('$')
      call cursor(line('$'), col('$'))

    elseif l:data.type == 'error'
      " Handle error messages
      call append(line('$'), '> Error: ' . l:data.content)
      call append(line('$'), '$ ')
      let s:input_start_line = line('$')
      call cursor(line('$'), col('$'))

    elseif l:data.type == 'init'
      " Handle init message
      call append(line('$'), '> ' . l:data.content)
      call append(line('$'), '$ ')
      let s:input_start_line = line('$')
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

command! KetaSetup call s:SetupKeta()
command! Keta call s:OpenKeta()
