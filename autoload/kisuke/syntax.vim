func! kisuke#syntax#setup()
  if exists('b:syntax_setup_done') && b:syntax_setup_done
    return
  endif

  syntax clear

  unlet! b:current_syntax
  unlet! b:included_langs

  syntax match KisukePrompt /^Prompt >/
  syntax match KisukeResponse /^Kisuke >/
  syntax match KisukeSystem /^> .*$/
  syntax match KisukeCodeDelimiter /^```\w*$/

  let l:lines = getbufline(g:kisuke.state.buf_nr, 1, '$')

  if !empty(l:lines)
    let l:line_nr = 0
    let l:delimeter_count = 0
    let l:code_block_start_line_nr = v:null
    let l:code_blocks = []
    let l:included_syntaxes = {}

    for line in l:lines
      let l:line_nr += 1

      if line[0:2] ==# '```'
        let l:delimeter_count += 1

        if l:delimeter_count % 2 ==# 1
          let l:code_block_start_line_nr = l:line_nr
        elseif l:delimeter_count % 2 ==# 0
          call add(l:code_blocks, { 'start_line_nr': l:code_block_start_line_nr, 'end_line_nr': l:line_nr })
        endif
      endif
    endfor

    if !empty(l:code_blocks)
      for code_block in l:code_blocks
        let l:lang = matchstr(getbufline(g:kisuke.state.buf_nr, code_block.start_line_nr)[0], '^```\s*\(\w\+\)')
        let l:lang = substitute(l:lang, '^```\s*', '', '')

        if !empty(l:lang)
          call s:setup_syntax_for_code_block(l:lang, code_block.start_line_nr, code_block.end_line_nr, l:included_syntaxes)
        endif
      endfor
    endif
  endif

  hi def link KisukePrompt Statement
  hi def link KisukeResponse Identifier
  hi def link KisukeSystem Special
  hi def link KisukeCodeDelimiter Delimiter

  let b:syntax_setup_done = 1
endfunc

func! s:setup_syntax_for_code_block(lang, start_line, end_line, included_syntaxes)
  let l:block_id = a:start_line . '_' . a:end_line
  let l:group_name = 'KisukeCode_' . l:block_id

  let l:syntax_file = 'syntax/' . a:lang . '.vim'
  let l:syntax_paths = split(globpath(&runtimepath, l:syntax_file), '\n')

  if empty(l:syntax_paths)
    return
  endif

  try
    if !has_key(a:included_syntaxes, a:lang)
      let l:had_syntax = exists('b:current_syntax')
      let l:prev_syntax = l:had_syntax ? b:current_syntax : ''

      if l:had_syntax
        unlet b:current_syntax
      endif

      execute 'syntax include @Kisuke_' . a:lang . ' ' . l:syntax_file

      let a:included_syntaxes[a:lang] = 1

      if l:had_syntax
        let b:current_syntax = l:prev_syntax
      endif
    endif

    execute printf('syntax region %s start=/\%%%dl/ end=/\%%%dl/ contains=@Kisuke_%s keepend',
          \ l:group_name,
          \ a:start_line + 1,
          \ a:end_line,
          \ a:lang)
  catch /^Vim\%((\\a\+)\)\=:E403/
    if exists('b:current_syntax')
      unlet b:current_syntax
    endif
    return
  catch /.*/
    return
  endtry
endfunc
