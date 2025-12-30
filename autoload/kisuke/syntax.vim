fu! kisuke#syntax#setup_menu()
  syntax clear

  syntax match KisukeMenuHeader /^•• ━━━━━━━━━━ ⟡ KISUKE ⟡ ━━━━━━━━━━ ••$/
  syntax match KisukeMenuItem /^✦ .*$/

  hi def link KisukeMenuHeader Title
  hi def link KisukeMenuItem Statement
endfu

fu! kisuke#syntax#setup()
  let l:current_buf = bufnr('%')

  if !exists('b:kisuke_syntax_initialized')
    syntax clear
    unlet! b:current_syntax
    unlet! b:kisuke_base_syntax_applied
    unlet! b:last_processed_line

    let b:included_langs = {}
    let b:kisuke_syntax_initialized = 1
    let b:syntax_content_hash = ''
  en

  cal s:setup_base_syntax()

  let l:current_content = join(getbufline(l:current_buf, 1, '$'), "\n")
  let l:content_hash = string(len(l:current_content)) . '_' . string(getbufinfo(l:current_buf)[0]['changedtick'])

  if b:syntax_content_hash !=# l:content_hash
    cal s:process_code_blocks(l:current_buf)

    let b:syntax_content_hash = l:content_hash
  en
endfu

fu! kisuke#syntax#setup_incremental()
  let l:current_buf = bufnr('%')

  if l:current_buf !=# g:kisuke.state.buf_nr
    retu
  en

  cal s:setup_base_syntax()

  cal s:process_new_code_blocks(l:current_buf)
endfu

fu! s:setup_base_syntax()
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
endfu

fu! s:process_code_blocks(buf_nr)
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

        exe 'syntax match KisukeCodeDelimiter /\%' . l:line_nr . 'l^```\S*$/'
      else
        let l:in_code_block = 0

        if !empty(l:current_lang)
          cal add(l:code_blocks, {'start': l:code_block_start, 'end': l:line_nr, 'lang': l:current_lang})
        en

        exe 'syntax match KisukeCodeDelimiter /\%' . l:line_nr . 'l^```$/'
      en
    en
  endfo

  for block in l:code_blocks
    cal s:apply_syntax_to_block(block.lang, block.start, block.end)
  endfo
endfu

fu! s:process_new_code_blocks(buf_nr)
  if !exists('b:last_processed_line')
    let b:last_processed_line = 1
  en

  let l:total_lines = getbufinfo(a:buf_nr)[0]['linecount']
  if l:total_lines <= b:last_processed_line
    retu
  en

  let l:new_lines = getbufline(a:buf_nr, b:last_processed_line, l:total_lines)
  let l:line_nr = b:last_processed_line - 1

  for line in l:new_lines
    let l:line_nr += 1

    if line =~# '^```\S*'
      exe 'syntax match KisukeCodeDelimiter /\%' . l:line_nr . 'l^```.*$/'

      let l:lang = matchstr(line, '^```\s*\(\S\+\)')
      let l:lang = substitute(l:lang, '^```\s*', '', '')

      if !empty(l:lang)
        cal s:find_and_highlight_complete_block(l:line_nr, l:lang)
      en
    elsei line =~# '^```$'
      exe 'syntax match KisukeCodeDelimiter /\%' . l:line_nr . 'l^```$/'

      cal s:find_and_highlight_complete_block(l:line_nr, '')
    en
  endfo

  let b:last_processed_line = l:total_lines
endfu

fu! s:find_and_highlight_complete_block(end_line, lang)
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
      en

      brea
    en
  endfo

  if l:start_line > 0 && a:end_line > l:start_line && !empty(l:found_lang)
    cal s:apply_syntax_to_block(l:found_lang, l:start_line, a:end_line)
  en
endfu

fu! s:apply_syntax_to_block(lang, start_line, end_line)
  if empty(a:lang)
    retu
  en

  let l:lang = substitute(a:lang, '[^a-zA-Z0-9_]', '', 'g')
  let l:block_id = a:start_line . '_' . a:end_line
  let l:group_name = 'KisukeCode_' . l:block_id
  let l:syntax_file = 'syntax/' . l:lang . '.vim'

  let l:syntax_paths = split(globpath(&runtimepath, l:syntax_file), '\n')

  if empty(l:syntax_paths)
    retu
  en

  try
    if !exists('b:included_langs')
      let b:included_langs = {}
    en

    if !has_key(b:included_langs, l:lang)
      let l:saved_syntax = exists('b:current_syntax') ? b:current_syntax : ''

      unlet! b:current_syntax

      exe 'syntax include @Kisuke_' . l:lang . ' ' . l:syntax_file

      let b:included_langs[l:lang] = 1

      if !empty(l:saved_syntax)
        let b:current_syntax = l:saved_syntax
      en
    en

    exe printf('syntax region %s start=/\%%%dl/ end=/\%%%dl/ contains=@Kisuke_%s keepend',
          \ l:group_name,
          \ a:start_line + 1,
          \ a:end_line,
          \ l:lang
          \ )
  catch
  endtry
endfu
