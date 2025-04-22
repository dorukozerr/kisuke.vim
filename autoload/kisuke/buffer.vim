func! kisuke#buffer#open()
  if g:kisuke.state.job ==# v:null
    call kisuke#server#start_process()
  endif

  let g:kisuke.state.is_pending = 1

  if bufexists(g:kisuke.state.buf_nr)
    call kisuke#buffer#focus({ 'type': 'initialize' })
  else
    call kisuke#buffer#create()
  endif
endfunc

func! kisuke#buffer#create()
  exe 'vsplit ' . g:kisuke.state.buf_name

  let g:kisuke.state.buf_nr = bufnr('%')

  setlocal
        \ buftype=nofile
        \ bufhidden=hide
        \ nomodifiable
        \ noswapfile
        \ nobuflisted
        \ nowrap
        \ nonumber
        \ norelativenumber
        \ filetype=kisuke_menu

  call ch_sendraw(job_getchannel(g:kisuke.state.job), json_encode({ 'type': 'initialize' }))
endfunc

func! kisuke#buffer#focus(payload = v:null)
  let l:wid = bufwinid(g:kisuke.state.buf_nr)

  if l:wid ==# -1
    exe 'vsplit | buffer ' . g:kisuke.state.buf_nr
  else
    call win_gotoid(l:wid)
  endif

  if a:payload != v:null
    call ch_sendraw(job_getchannel(g:kisuke.state.job), json_encode(a:payload))
  endif
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

  if kisuke#utils#validate(l:checks)
    let l:file_index = -1
    let l:index = 0

    call kisuke#buffer#focus()
    call kisuke#buffer#clear_marked_content()

    for entry in g:kisuke.state.marked_files
      if entry.file_path ==# l:current_file
        let l:file_index = l:index
      endif

      let l:index += 1
    endfor

    if l:file_index ==# -1
      call add(g:kisuke.state.marked_files, {'file_path': l:current_file, 'scope': 'all'})
    else
      call remove(g:kisuke.state.marked_files, l:file_index)
    endif

    if len(g:kisuke.state.marked_files) || len(g:kisuke.state.marked_code_blocks)
      call kisuke#buffer#render_marked_content()
    endif
  endif
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

  if kisuke#utils#validate(l:checks)
    let l:highlighted = getline(a:firstline, a:lastline)
    let l:file_type = &filetype

    call kisuke#buffer#focus()
    call kisuke#buffer#clear_marked_content()

    call add(g:kisuke.state.marked_code_blocks, {
          \ 'file_path': l:current_file,
          \ 'file_type': l:file_type,
          \ 'start_line_nr': a:firstline,
          \ 'end_line_nr': a:lastline,
          \ 'scope': 'block',
          \ 'highlighted_code': json_encode(l:highlighted),
          \ })

    call kisuke#buffer#render_marked_content()
  endif
endfunc

func! kisuke#buffer#remove_last_marked_code_block()
  let l:checks = [
        \ {'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first, or press <leader>ko'},
        \ {'condition': g:kisuke.state.is_pending, 'message': 'Cannot mark code while server generating response'},
        \ {'condition': bufwinid(g:kisuke.state.buf_nr) ==# -1, 'message': 'Please run :KisukeOpen first, or press <leader>ko'},
        \ {'condition': len(g:kisuke.state.marked_code_blocks) ==# 0, 'message': 'You have no marked code block'},
        \ ]

  if kisuke#utils#validate(l:checks)
    call kisuke#buffer#focus()
    call kisuke#buffer#clear_marked_content()

    call remove(g:kisuke.state.marked_code_blocks, len(g:kisuke.state.marked_code_blocks) - 1)

    if len(g:kisuke.state.marked_files) || len(g:kisuke.state.marked_code_blocks)
      call kisuke#buffer#render_marked_content()
    endif
  endif
endfunc

func! kisuke#buffer#clear_marked_content()
  let l:highlighted_code_count = 0

  if len(g:kisuke.state.marked_code_blocks)
    for marked_code_block in g:kisuke.state.marked_code_blocks
      let l:highlighted_code_count += 1
      let l:highlighted_code_count += marked_code_block.end_line_nr - marked_code_block.start_line_nr + 3
    endfor
  endif

  let l:marked_files_start_line_nr = v:null
  let l:marked_files_end_line_nr = v:null

  if empty(split(getbufoneline(g:kisuke.state.buf_nr, line('$'))))
    let l:marked_files_start_line_nr = line('$') - len(g:kisuke.state.marked_files) - l:highlighted_code_count - 1

    if len(g:kisuke.state.marked_files) && len(g:kisuke.state.marked_code_blocks)
      let l:marked_files_start_line_nr -= 2
    endif
  elseif split(getbufoneline(g:kisuke.state.buf_nr, line('$')), ' ')[0] ==# 'Prompt'
    let l:marked_files_start_line_nr = line('$') - len(g:kisuke.state.marked_files) - l:highlighted_code_count - 2

    if len(g:kisuke.state.marked_files) && len(g:kisuke.state.marked_code_blocks)
      let l:marked_files_start_line_nr -= 2
    endif
  endif

  if empty(split(getbufoneline(g:kisuke.state.buf_nr, line('$'))))
    let l:marked_files_end_line_nr = line('$')
  elseif split(getbufoneline(g:kisuke.state.buf_nr, line('$')), ' ')[0] ==# 'Prompt'
    let l:marked_files_end_line_nr = line('$') - 1
  endif

  if len(g:kisuke.state.marked_files) || len(g:kisuke.state.marked_code_blocks)
    call deletebufline(g:kisuke.state.buf_nr, l:marked_files_start_line_nr, l:marked_files_end_line_nr)
  endif
endfunc

func! kisuke#buffer#render_marked_content()
  if len(g:kisuke.state.marked_files)
    if empty(split(getbufoneline(g:kisuke.state.buf_nr, line('$'))))
      call appendbufline(g:kisuke.state.buf_nr, line('$'), '> Marked File Count - ' . len(g:kisuke.state.marked_files))
    else
      call appendbufline(g:kisuke.state.buf_nr, line('$') - 1, '> Marked File Count - ' . len(g:kisuke.state.marked_files))
    endif

    let l:index = 0

    for entry in g:kisuke.state.marked_files
      if empty(split(getbufoneline(g:kisuke.state.buf_nr, line('$'))))
        call appendbufline(g:kisuke.state.buf_nr, line('$'), '> File Path - ' . entry.file_path)
      elseif split(getbufoneline(g:kisuke.state.buf_nr, line('$')), ' ')[0] ==# 'Prompt'
        call appendbufline(g:kisuke.state.buf_nr, line('$') - 1, '> File Path - ' . entry.file_path)
      else
        call appendbufline(g:kisuke.state.buf_nr, line('$'), '> File Path - ' . entry.file_path)
      endif

      let l:index += 1

      if l:index ==# len(g:kisuke.state.marked_files)
        if split(getbufoneline(g:kisuke.state.buf_nr, line('$')), ' ')[0] ==# 'Prompt'
          call appendbufline(g:kisuke.state.buf_nr, line('$') - 1, ' ')
        else
          call appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
        endif
      endif
    endfor
  endif

  if len(g:kisuke.state.marked_code_blocks)
    if empty(split(getbufoneline(g:kisuke.state.buf_nr, line('$'))))
      call appendbufline(g:kisuke.state.buf_nr, line('$'), '> Marked Code Blocks - ' . len(g:kisuke.state.marked_code_blocks))
    else
      call appendbufline(g:kisuke.state.buf_nr, line('$') - 1, '> Marked Code Blocks - ' . len(g:kisuke.state.marked_code_blocks))
    endif

    let l:index = 0

    for code_block in g:kisuke.state.marked_code_blocks
      if empty(split(getbufoneline(g:kisuke.state.buf_nr, line('$'))))
        call appendbufline(g:kisuke.state.buf_nr, line('$'), '> From - ' . code_block.file_path)
        call appendbufline(g:kisuke.state.buf_nr, line('$'), '```' . code_block.file_type)
        call appendbufline(g:kisuke.state.buf_nr, line('$'), json_decode(code_block.highlighted_code))
        call appendbufline(g:kisuke.state.buf_nr, line('$'), '```')
      elseif split(getbufoneline(g:kisuke.state.buf_nr, line('$')), ' ')[0] ==# 'Prompt'
        call appendbufline(g:kisuke.state.buf_nr, line('$') - 1, '> From - ' . code_block.file_path)
        call appendbufline(g:kisuke.state.buf_nr, line('$') - 1, '```' . code_block.file_type)
        call appendbufline(g:kisuke.state.buf_nr, line('$') - 1, json_decode(code_block.highlighted_code))
        call appendbufline(g:kisuke.state.buf_nr, line('$') - 1, '```')
      else
        call appendbufline(g:kisuke.state.buf_nr, line('$'), '> From - ' . code_block.file_path)
        call appendbufline(g:kisuke.state.buf_nr, line('$'), '```' . code_block.file_type)
        call appendbufline(g:kisuke.state.buf_nr, line('$'), json_decode(code_block.highlighted_code))
        call appendbufline(g:kisuke.state.buf_nr, line('$'), '```')
      endif

      let l:index += 1

      if l:index ==# len(g:kisuke.state.marked_code_blocks)
        if split(getbufoneline(g:kisuke.state.buf_nr, line('$')), ' ')[0] ==# 'Prompt'
          call appendbufline(g:kisuke.state.buf_nr, line('$') - 1, ' ')
        else
          call appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
        endif
      endif
    endfor
  endif
endfunc

func! kisuke#buffer#on_submit(prompt)
  let l:checks = [
        \ { 'condition': a:prompt ==# '', 'message': 'Cannot submit empty prompt, please write something' },
        \ { 'condition': g:kisuke.state.is_pending, 'message': 'Cannot submit a new prompt while server generating a response' },
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Server is not running, try restarting vim' },
        \ ]

  if kisuke#utils#validate(l:checks)
    let g:kisuke.state.is_pending = 1

    let l:payload = {
          \ 'type': 'prompt',
          \ 'sessionId': g:kisuke.state.session_id,
          \ 'payload': a:prompt,
          \ }

    let l:payload = len(g:kisuke.state.marked_files) || len(g:kisuke.state.marked_code_blocks)
          \ ? extend(l:payload, { 'context': g:kisuke.state.marked_files + g:kisuke.state.marked_code_blocks })
          \ : l:payload

    call ch_sendraw(job_getchannel(g:kisuke.state.job), json_encode(l:payload))
  endif
endfunc
