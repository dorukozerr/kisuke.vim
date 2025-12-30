fu! kisuke#buffer#open()
  if g:kisuke.state.job ==# v:null
    cal kisuke#server#start_process()
  en

  if bufexists(g:kisuke.state.buf_nr)
    cal kisuke#buffer#restore({ 'type': 'initialize' })
  el
    cal kisuke#buffer#create()
  en
endfu

fu! kisuke#buffer#create()
  exe 'vsplit ' . g:kisuke.state.buf_name

  let g:kisuke.state.buf_nr = bufnr('%')

  cal kisuke#buffer#prepare_menu_buffer()

  cal ch_sendraw(job_getchannel(g:kisuke.state.job), json_encode({ 'type': 'initialize' }))
endfu

fu! kisuke#buffer#restore(payload = v:null)
  let l:checks = [
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first' },
        \ { 'condition': g:kisuke.state.is_pending, 'message': 'Please wait for server to finish its job' }
        \ ]

  if kisuke#utils#validate(l:checks)
    let l:wid = bufwinid(g:kisuke.state.buf_nr)

    if l:wid ==# -1
      exe 'vsplit | buffer ' . g:kisuke.state.buf_nr
    el
      cal win_gotoid(l:wid)
    en

    if a:payload != v:null
      cal ch_sendraw(job_getchannel(g:kisuke.state.job), json_encode(a:payload))
    en
  en
endfu

fu! kisuke#buffer#mark_focused_file()
  let l:current_file = expand('%:p')

  let l:checks = [
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first, or press <leader>ko' },
        \ { 'condition': g:kisuke.state.is_pending, 'message': 'Please wait for server to finish its job' },
        \ { 'condition': bufnr('%') ==# g:kisuke.state.buf_nr, 'message': 'Cannot mark Kisuke chat buffer' },
        \ { 'condition': bufwinid(g:kisuke.state.buf_nr) ==# -1, 'message': 'Please run :KisukeOpen first, or press <leader>ko '},
        \ { 'condition': empty(l:current_file), 'message': 'This file cannot be marked '}
        \ ]

  if kisuke#utils#validate(l:checks)
    let l:file_index = -1
    let l:index = 0

    cal kisuke#buffer#restore()
    cal kisuke#buffer#clear_marked_content()

    for entry in g:kisuke.state.marked_files
      if entry.file_path ==# l:current_file
        let l:file_index = l:index
      en

      let l:index += 1
    endfo

    if l:file_index ==# -1
      cal add(g:kisuke.state.marked_files, {'file_path': l:current_file, 'scope': 'all'})
    el
      cal remove(g:kisuke.state.marked_files, l:file_index)
    en

    if len(g:kisuke.state.marked_files) || len(g:kisuke.state.marked_code_blocks)
      cal kisuke#buffer#render_marked_content()
    en
  en
endfu

fu! kisuke#buffer#mark_highlighted_code() range
  let l:current_file = expand('%:p')

  let l:checks = [
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first' },
        \ { 'condition': g:kisuke.state.is_pending, 'message': 'Please wait for server to finish its job' },
        \ { 'condition': bufnr('%') ==# g:kisuke.state.buf_nr, 'message': 'Cannot mark Kisuke chat buffer' },
        \ { 'condition': bufwinid(g:kisuke.state.buf_nr) ==# -1, 'message': 'Please run :KisukeOpen first' },
        \ { 'condition': empty(l:current_file), 'message': 'This file cannot be marked'},
        \ ]

  if kisuke#utils#validate(l:checks)
    let l:highlighted = getline(a:firstline, a:lastline)
    let l:file_type = &filetype

    cal kisuke#buffer#restore()
    cal kisuke#buffer#clear_marked_content()

    cal add(g:kisuke.state.marked_code_blocks, {
          \ 'file_path': l:current_file,
          \ 'file_type': l:file_type,
          \ 'start_line_nr': a:firstline,
          \ 'end_line_nr': a:lastline,
          \ 'scope': 'block',
          \ 'highlighted_code': json_encode(l:highlighted),
          \ })

    cal kisuke#buffer#render_marked_content()
  en
endfu

fu! kisuke#buffer#remove_last_marked_code_block()
  let l:checks = [
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Please run :KisukeOpen first'},
        \ { 'condition': g:kisuke.state.is_pending, 'message': 'Please wait for server to finish its job'},
        \ { 'condition': bufwinid(g:kisuke.state.buf_nr) ==# -1, 'message': 'Please run :KisukeOpen first'},
        \ { 'condition': len(g:kisuke.state.marked_code_blocks) ==# 0, 'message': 'You have no marked code block'},
        \ ]

  if kisuke#utils#validate(l:checks)
    cal kisuke#buffer#restore()
    cal kisuke#buffer#clear_marked_content()

    cal remove(g:kisuke.state.marked_code_blocks, len(g:kisuke.state.marked_code_blocks) - 1)

    if len(g:kisuke.state.marked_files) || len(g:kisuke.state.marked_code_blocks)
      cal kisuke#buffer#render_marked_content()
    en
  en
endfu

fu! kisuke#buffer#clear_marked_content()
  let l:highlighted_code_count = 0

  if len(g:kisuke.state.marked_code_blocks)
    for marked_code_block in g:kisuke.state.marked_code_blocks
      let l:highlighted_code_count += 1
      let l:highlighted_code_count += marked_code_block.end_line_nr - marked_code_block.start_line_nr + 3
    endfo
  en

  let l:marked_files_start_line_nr = v:null
  let l:marked_files_end_line_nr = v:null

  if empty(split(getbufoneline(g:kisuke.state.buf_nr, line('$'))))
    let l:marked_files_start_line_nr = line('$') - len(g:kisuke.state.marked_files) - l:highlighted_code_count - 1

    if len(g:kisuke.state.marked_files) && len(g:kisuke.state.marked_code_blocks)
      let l:marked_files_start_line_nr -= 2
    en
  elsei split(getbufoneline(g:kisuke.state.buf_nr, line('$')), ' ')[0] ==# 'Prompt'
    let l:marked_files_start_line_nr = line('$') - len(g:kisuke.state.marked_files) - l:highlighted_code_count - 2

    if len(g:kisuke.state.marked_files) && len(g:kisuke.state.marked_code_blocks)
      let l:marked_files_start_line_nr -= 2
    en
  en

  if empty(split(getbufoneline(g:kisuke.state.buf_nr, line('$'))))
    let l:marked_files_end_line_nr = line('$')
  elsei split(getbufoneline(g:kisuke.state.buf_nr, line('$')), ' ')[0] ==# 'Prompt'
    let l:marked_files_end_line_nr = line('$') - 1
  en

  if len(g:kisuke.state.marked_files) || len(g:kisuke.state.marked_code_blocks)
    cal deletebufline(g:kisuke.state.buf_nr, l:marked_files_start_line_nr, l:marked_files_end_line_nr)
  en
endfu

fu! kisuke#buffer#render_marked_content()
  if len(g:kisuke.state.marked_files)
    if empty(split(getbufoneline(g:kisuke.state.buf_nr, line('$'))))
      cal appendbufline(g:kisuke.state.buf_nr, line('$'), '> Marked File Count - ' . len(g:kisuke.state.marked_files))
    el
      cal appendbufline(g:kisuke.state.buf_nr, line('$') - 1, '> Marked File Count - ' . len(g:kisuke.state.marked_files))
    en

    let l:index = 0

    for entry in g:kisuke.state.marked_files
      if empty(split(getbufoneline(g:kisuke.state.buf_nr, line('$'))))
        cal appendbufline(g:kisuke.state.buf_nr, line('$'), '> File Path - ' . entry.file_path)
      elsei split(getbufoneline(g:kisuke.state.buf_nr, line('$')), ' ')[0] ==# 'Prompt'
        cal appendbufline(g:kisuke.state.buf_nr, line('$') - 1, '> File Path - ' . entry.file_path)
      el
        cal appendbufline(g:kisuke.state.buf_nr, line('$'), '> File Path - ' . entry.file_path)
      en

      let l:index += 1

      if l:index ==# len(g:kisuke.state.marked_files)
        if split(getbufoneline(g:kisuke.state.buf_nr, line('$')), ' ')[0] ==# 'Prompt'
          cal appendbufline(g:kisuke.state.buf_nr, line('$') - 1, ' ')
        el
          cal appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
        en
      en
    endfo
  en

  if len(g:kisuke.state.marked_code_blocks)
    if empty(split(getbufoneline(g:kisuke.state.buf_nr, line('$'))))
      cal appendbufline(g:kisuke.state.buf_nr, line('$'), '> Marked Code Blocks - ' . len(g:kisuke.state.marked_code_blocks))
    el
      cal appendbufline(g:kisuke.state.buf_nr, line('$') - 1, '> Marked Code Blocks - ' . len(g:kisuke.state.marked_code_blocks))
    en

    let l:index = 0

    for code_block in g:kisuke.state.marked_code_blocks
      if empty(split(getbufoneline(g:kisuke.state.buf_nr, line('$'))))
        cal appendbufline(g:kisuke.state.buf_nr, line('$'), '> From - ' . code_block.file_path)
        cal appendbufline(g:kisuke.state.buf_nr, line('$'), '```' . code_block.file_type)
        cal appendbufline(g:kisuke.state.buf_nr, line('$'), json_decode(code_block.highlighted_code))
        cal appendbufline(g:kisuke.state.buf_nr, line('$'), '```')
      elsei split(getbufoneline(g:kisuke.state.buf_nr, line('$')), ' ')[0] ==# 'Prompt'
        cal appendbufline(g:kisuke.state.buf_nr, line('$') - 1, '> From - ' . code_block.file_path)
        cal appendbufline(g:kisuke.state.buf_nr, line('$') - 1, '```' . code_block.file_type)
        cal appendbufline(g:kisuke.state.buf_nr, line('$') - 1, json_decode(code_block.highlighted_code))
        cal appendbufline(g:kisuke.state.buf_nr, line('$') - 1, '```')
      el
        cal appendbufline(g:kisuke.state.buf_nr, line('$'), '> From - ' . code_block.file_path)
        cal appendbufline(g:kisuke.state.buf_nr, line('$'), '```' . code_block.file_type)
        cal appendbufline(g:kisuke.state.buf_nr, line('$'), json_decode(code_block.highlighted_code))
        cal appendbufline(g:kisuke.state.buf_nr, line('$'), '```')
      en

      let l:index += 1

      if l:index ==# len(g:kisuke.state.marked_code_blocks)
        if split(getbufoneline(g:kisuke.state.buf_nr, line('$')), ' ')[0] ==# 'Prompt'
          cal appendbufline(g:kisuke.state.buf_nr, line('$') - 1, ' ')
        el
          cal appendbufline(g:kisuke.state.buf_nr, line('$'), ' ')
        en
      en
    endfo
  en
endfu

fu! kisuke#buffer#on_submit(prompt)
  let l:checks = [
        \ { 'condition': a:prompt ==# '', 'message': 'Cannot submit empty prompt, please write something' },
        \ { 'condition': g:kisuke.state.is_pending, 'message': 'Please wait for server to finish its job' },
        \ { 'condition': g:kisuke.state.job ==# v:null, 'message': 'Server is not running, try restarting vim' },
        \ ]

  if kisuke#utils#validate(l:checks)
    let g:kisuke.state.is_pending = 1

     let l:payload = { 'type': 'sandbox' }

    " let l:payload = {
    "       \ 'type': 'prompt',
    "       \ 'sessionId': g:kisuke.state.session_id,
    "       \ 'payload': a:prompt,
    "       \ }

    " let l:payload = len(g:kisuke.state.marked_files) || len(g:kisuke.state.marked_code_blocks)
    "       \ ? extend(l:payload, { 'context': g:kisuke.state.marked_files + g:kisuke.state.marked_code_blocks })
    "       \ : l:payload

    cal ch_sendraw(job_getchannel(g:kisuke.state.job), json_encode(l:payload))
  en
endfu

fu! kisuke#buffer#prepare_chat_buffer()
  setl
        \ buftype=prompt
        \ noswapfile
        \ wrap
        \ modifiable
        \ nobuflisted
        \ nonumber
        \ norelativenumber
        \ filetype=kisuke_chat

  cal prompt_setprompt(bufnr('%'), 'Prompt > ')
  cal prompt_setcallback(bufnr('%'), function('kisuke#buffer#on_submit'))

  let g:kisuke.state.buf_nr = bufnr('%')

  unlet! b:kisuke_syntax_initialized
  unlet! b:kisuke_base_syntax_applied
  unlet! b:last_processed_line

  cal kisuke#syntax#setup()

  augroup KisukeChatBuffer
    autocmd! * <buffer>
    autocmd TextChanged,TextChangedI <buffer> setl nomodified
  augroup END
endfu

fu! kisuke#buffer#prepare_menu_buffer()
  setl
        \ buftype=nofile
        \ bufhidden=hide
        \ noswapfile
        \ modifiable
        \ nobuflisted
        \ nowrap
        \ nonumber
        \ norelativenumber
        \ filetype=kisuke_menu

  cal kisuke#syntax#setup_menu()
endfu
