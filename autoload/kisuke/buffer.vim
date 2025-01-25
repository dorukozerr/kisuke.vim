func! kisuke#buffer#open()
  exe g:kisuke.state.job ==# v:null
        \ ? 'call kisuke#server#start_process()'
        \ : ''

  let g:kisuke.state.is_pending = 1

  exe bufexists(g:kisuke.state.buf_nr)
        \ ? 'call kisuke#buffer#focus({ "type": "initialize" })'
        \ : 'call kisuke#buffer#create()'
endfunc

func! kisuke#buffer#create()
  exe 'vsplit ' . g:kisuke.state.buf_name

  let g:kisuke.state.buf_nr = bufnr('%')

  setlocal
        \ buftype=prompt
        \ noswapfile
        \ nobuflisted

  call kisuke#syntax#setup()

  call prompt_setprompt(g:kisuke.state.buf_nr, 'Prompt > ')
  call prompt_setcallback(g:kisuke.state.buf_nr, function('kisuke#buffer#on_submit'))
  call ch_sendraw(job_getchannel(g:kisuke.state.job), json_encode({ 'type': 'initialize' }))

  augroup g:kisuke.state.buf_name
    autocmd!
    autocmd TextChanged,TextChangedI <buffer> setlocal nomodified
  augroup END

  augroup KisukeSyntax
    autocmd!
    autocmd BufEnter,TextChanged <buffer>
          \ let b:syntax_setup_done = 0 | call kisuke#syntax#setup()
  augroup END
endfunc

func! kisuke#buffer#focus(payload = v:null)
  let l:wid = bufwinid(g:kisuke.state.buf_nr)

  exe l:wid ==# -1
        \ ? 'vsplit | buffer ' . g:kisuke.state.buf_nr
        \ : 'call win_gotoid(l:wid)'

  exe a:payload ==# v:null
        \ ? ''
        \ : 'call ch_sendraw(job_getchannel(g:kisuke.state.job), json_encode(a:payload))'
endfunc

func! kisuke#buffer#mark_focused_file()
  let l:current_file = expand('%:p')

  let l:checks = [
        \ {'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first, or press <leader>ko'},
        \ {'condition': g:kisuke.state.is_pending, 'message': 'Cannot mark a file while server generating response'},
        \ {'condition': bufnr('%') ==# g:kisuke.state.buf_nr, 'message': 'Cannot mark Kisuke chat buffer'},
        \ {'condition': bufwinid(g:kisuke.state.buf_nr) ==# -1, 'message': 'Please run :KisukeOpen first, or press <leader>ko'},
        \ {'condition': empty(l:current_file), 'message': 'This file cannot be marked'},
        \ ]


  exe kisuke#utils#validate(l:checks)
        \ ? ''
        \ : 'return'

  let l:file_index = -1
  let l:index = 0

  call kisuke#buffer#focus()
  call kisuke#buffer#clear_marked_content()

  for entry in g:kisuke.state.marked_files
    exe entry.file_path ==# l:current_file
          \ ? 'let l:file_index = ' . l:index
          \ : ''

    let l:index += 1
  endfor

  exe l:file_index ==# -1
        \ ? 'call add(g:kisuke.state.marked_files, {"file_path": l:current_file, "scope": "all"})'
        \ : 'call remove(g:kisuke.state.marked_files, l:file_index)'

  exe len(g:kisuke.state.marked_files)
        \ ? 'call kisuke#buffer#render_marked_content()'
        \ : ''
endfunc

func! kisuke#buffer#mark_highlighted_code() range
  let l:current_file = expand('%:p')

  let l:checks = [
        \ {'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first, or press <leader>ko'},
        \ {'condition': g:kisuke.state.is_pending, 'message': 'Cannot mark code while server generating response'},
        \ {'condition': bufnr('%') ==# g:kisuke.state.buf_nr, 'message': 'Cannot mark Kisuke chat buffer'},
        \ {'condition': bufwinid(g:kisuke.state.buf_nr) ==# -1, 'message': 'Please run :KisukeOpen first, or press <leader>ko'},
        \ {'condition': empty(l:current_file), 'message': 'This file cannot be marked'},
        \ ]

  exe kisuke#utils#validate(l:checks)
        \ ? ''
        \ : 'return'

  let l:highlighted = getline(a:firstline, a:lastline)

  echom 'l:highlighted ' . json_encode(l:highlighted)
endfunc

func! kisuke#buffer#clear_marked_content()
  let l:marked_files_start_line_nr = empty(split(getbufoneline(g:kisuke.state.buf_nr, line('$'))))
        \ ? line('$') - len(g:kisuke.state.marked_files) - 1
        \ : split(getbufoneline(g:kisuke.state.buf_nr, line('$')), ' ')[0] ==# 'Prompt'
        \ ? line('$') - len(g:kisuke.state.marked_files) - 2
        \ : v:null

  let l:marked_files_end_line_nr = empty(split(getbufoneline(g:kisuke.state.buf_nr, line('$'))))
        \ ? line('$')
        \ : split(getbufoneline(g:kisuke.state.buf_nr, line('$')), ' ')[0] ==# 'Prompt'
        \ ? line('$') - 1
        \ : v:null

  exe len(g:kisuke.state.marked_files)
        \ ? 'call deletebufline(g:kisuke.state.buf_nr, l:marked_files_start_line_nr, l:marked_files_end_line_nr)'
        \ : ''
endfunc

func! kisuke#buffer#render_marked_content()
  exe empty(split(getbufoneline(g:kisuke.state.buf_nr, line('$'))))
        \ ? 'call appendbufline(g:kisuke.state.buf_nr, line(''$''), "> Marked File Count - " . len(g:kisuke.state.marked_files))'
        \ : 'call appendbufline(g:kisuke.state.buf_nr, line(''$'') - 1, "> Marked File Count - " . len(g:kisuke.state.marked_files))'

  let l:index = 0

  for entry in g:kisuke.state.marked_files
    exe empty(split(getbufoneline(g:kisuke.state.buf_nr, line('$'))))
          \ ? 'call appendbufline(g:kisuke.state.buf_nr, line(''$''), "> File Path - " . entry.file_path)'
          \ : split(getbufoneline(g:kisuke.state.buf_nr, line('$')), ' ')[0] ==# 'Prompt'
          \ ? 'call appendbufline(g:kisuke.state.buf_nr, line(''$'') - 1, "> File Path - " . entry.file_path)'
          \ : 'call appendbufline(g:kisuke.state.buf_nr, line(''$''), "> File Path - " . entry.file_path)'

    let l:index += 1

    exe l:index ==# len(g:kisuke.state.marked_files)
          \ ? split(getbufoneline(g:kisuke.state.buf_nr, line('$')), ' ')[0] ==# 'Prompt'
          \ ? 'call appendbufline(g:kisuke.state.buf_nr, line(''$'') - 1, " ")'
          \ : 'call appendbufline(g:kisuke.state.buf_nr, line(''$''), " ")'
          \ : ''
  endfor
endfunc

func! kisuke#buffer#on_submit(prompt)
  let l:checks = [
        \ { 'condition': a:prompt ==# '', 'message': 'Cannot submit empty prompt, please write something' },
        \ { 'condition': g:kisuke.state.is_pending, 'message': 'Cannot submit a new prompt while server generating a response' },
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Server is not running, try restarting vim' },
        \ ]

  exe kisuke#utils#validate(l:checks)
        \ ? 'let g:kisuke.state.is_pending = 1'
        \ : 'return'

  let l:payload = {
        \ 'type': 'prompt',
        \ 'sessionId': g:kisuke.state.session_id,
        \ 'payload': a:prompt,
        \ }

  let l:payload = len(g:kisuke.state.marked_files)
        \ ? extend(l:payload, { 'context': g:kisuke.state.marked_files })
        \ : l:payload

  call ch_sendraw(job_getchannel(g:kisuke.state.job), json_encode(l:payload))
endfunc
