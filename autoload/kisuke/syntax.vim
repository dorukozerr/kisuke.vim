func! kisuke#syntax#setup_menu()
  syntax clear

  syntax match KisukeMenuHeader /^•• ━━━━━━━━━━ ⟡ KISUKE ⟡ ━━━━━━━━━━ ••$/
  syntax match KisukeMenuItem /^✦ .*$/

  hi def link KisukeMenuHeader Title
  hi def link KisukeMenuItem Statement
endfunc

func! kisuke#syntax#setup()
  let l:current_buf = bufnr('%')

  if !exists('b:kisuke_syntax_initialized')
    syntax clear
    unlet! b:current_syntax
    unlet! b:kisuke_base_syntax_applied
    unlet! b:last_processed_line
    let b:included_langs = {}
    let b:kisuke_syntax_initialized = 1
  endif

  call s:setup_base_syntax()
  call s:process_code_blocks(l:current_buf)
endfunc

func! kisuke#syntax#setup_incremental()
  let l:current_buf = bufnr('%')

  if l:current_buf !=# g:kisuke.state.buf_nr
    return
  endif

  call s:setup_base_syntax()

  call s:process_new_code_blocks(l:current_buf)
endfunc

func! s:setup_base_syntax()
  syntax match KisukePrompt /^Prompt >/
  syntax match KisukeResponse /^Kisuke >/
  syntax match KisukeSystem /^> .*$/
  syntax match KisukeSearch /^\[SEARCH\].*$/
  syntax match KisukeFetch /^\[FETCH\].*$/
  syntax match KisukeInfo /^\[INFO\].*$/
  syntax match KisukeUsage /^\[USAGE\].*$/

  hi def link KisukePrompt Statement
  hi def link KisukeResponse Identifier
  hi def link KisukeSystem Special
  hi def link KisukeSearch WarningMsg
  hi def link KisukeFetch Function
  hi def link KisukeInfo Comment
  hi def link KisukeUsage Type
  hi def link KisukeCodeDelimiter Delimiter
endfunc

func! s:process_code_blocks(buf_nr)
  let l:lines = getbufline(a:buf_nr, 1, '$')
  let l:code_blocks = []
  let l:line_nr = 0
  let l:in_code_block = 0
  let l:code_block_start = 0
  let l:current_lang = ''

  for line in l:lines
    let l:line_nr += 1

    if line =~# '^```\S*'
      if !l:in_code_block
        let l:in_code_block = 1
        let l:code_block_start = l:line_nr
        let l:current_lang = matchstr(line, '^```\s*\(\S\+\)')
        let l:current_lang = substitute(l:current_lang, '^```\s*', '', '')

        execute 'syntax match KisukeCodeDelimiter /\%' . l:line_nr . 'l^```\S*$/'
      else
        let l:in_code_block = 0
        if !empty(l:current_lang)
          call add(l:code_blocks, {'start': l:code_block_start, 'end': l:line_nr, 'lang': l:current_lang})
        endif

        execute 'syntax match KisukeCodeDelimiter /\%' . l:line_nr . 'l^```$/'
      endif
    endif
  endfor

  for block in l:code_blocks
    call s:apply_syntax_to_block(block.lang, block.start, block.end)
  endfor
endfunc

func! s:process_new_code_blocks(buf_nr)
  if !exists('b:last_processed_line')
    let b:last_processed_line = 1
  endif

  let l:total_lines = getbufinfo(a:buf_nr)[0]['linecount']
  if l:total_lines <= b:last_processed_line
    return
  endif

  let l:new_lines = getbufline(a:buf_nr, b:last_processed_line, l:total_lines)
  let l:line_nr = b:last_processed_line - 1

  for line in l:new_lines
    let l:line_nr += 1

    if line =~# '^```\S*'
      execute 'syntax match KisukeCodeDelimiter /\%' . l:line_nr . 'l^```.*$/'

      let l:lang = matchstr(line, '^```\s*\(\S\+\)')
      let l:lang = substitute(l:lang, '^```\s*', '', '')

      if !empty(l:lang)
        call s:find_and_highlight_complete_block(l:line_nr, l:lang)
      endif
    elseif line =~# '^```$'
      execute 'syntax match KisukeCodeDelimiter /\%' . l:line_nr . 'l^```$/'
      call s:find_and_highlight_complete_block(l:line_nr, '')
    endif
  endfor

  let b:last_processed_line = l:total_lines
endfunc

func! s:find_and_highlight_complete_block(end_line, lang)
  let l:lines = getbufline(g:kisuke.state.buf_nr, 1, a:end_line)
  let l:start_line = 0
  let l:found_lang = a:lang

  for i in range(len(l:lines) - 1, 0, -1)
    let l:line = l:lines[i]
    if l:line =~# '^```\S*' && i < a:end_line - 1
      let l:start_line = i + 1
      if empty(a:lang)
        let l:found_lang = matchstr(l:line, '^```\s*\(\S\+\)')
        let l:found_lang = substitute(l:found_lang, '^```\s*', '', '')
      endif
      break
    endif
  endfor

  if l:start_line > 0 && a:end_line > l:start_line && !empty(l:found_lang)
    call s:apply_syntax_to_block(l:found_lang, l:start_line, a:end_line)
  endif
endfunc

func! s:apply_syntax_to_block(lang, start_line, end_line)
  if empty(a:lang)
    return
  endif

  let l:lang = substitute(a:lang, '[^a-zA-Z0-9_]', '', 'g')
  let l:block_id = a:start_line . '_' . a:end_line
  let l:group_name = 'KisukeCode_' . l:block_id
  let l:syntax_file = 'syntax/' . l:lang . '.vim'

  let l:syntax_paths = split(globpath(&runtimepath, l:syntax_file), '\n')
  if empty(l:syntax_paths)
    return
  endif

  try
    if !exists('b:included_langs')
      let b:included_langs = {}
    endif

    if !has_key(b:included_langs, l:lang)
      let l:saved_syntax = exists('b:current_syntax') ? b:current_syntax : ''
      unlet! b:current_syntax

      execute 'syntax include @Kisuke_' . l:lang . ' ' . l:syntax_file
      let b:included_langs[l:lang] = 1

      if !empty(l:saved_syntax)
        let b:current_syntax = l:saved_syntax
      endif
    endif

    execute printf('syntax region %s start=/\%%%dl/ end=/\%%%dl/ contains=@Kisuke_%s keepend',
          \ l:group_name,
          \ a:start_line + 1,
          \ a:end_line,
          \ l:lang)
  catch
  endtry
endfunc
