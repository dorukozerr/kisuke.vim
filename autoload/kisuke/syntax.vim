func! kisuke#syntax#setup()
  if exists('b:syntax_setup_done') && b:syntax_setup_done
    return
  endif

  " Clear any existing syntax and state
  syntax clear
  unlet! b:current_syntax
  unlet! b:included_langs

  " Basic syntax patterns
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
      " Process each code block
      for code_block in l:code_blocks
        let l:lang = matchstr(getbufline(g:kisuke.state.buf_nr, code_block.start_line_nr)[0], '^```\s*\(\w\+\)')
        let l:lang = substitute(l:lang, '^```\s*', '', '')

        if !empty(l:lang)
          call s:SetupSyntaxForCodeBlock(l:lang, code_block.start_line_nr, code_block.end_line_nr)
        endif
      endfor
    endif
  endif

  " Link highlight groups
  hi def link KisukePrompt Statement
  hi def link KisukeResponse Identifier
  hi def link KisukeSystem Special
  hi def link KisukeCodeDelimiter Delimiter

  let b:syntax_setup_done = 1
endfunc

func! s:SetupSyntaxForCodeBlock(lang, start_line, end_line)
  let l:group_name = 'KisukeCode_' . a:lang . '_' . a:start_line . '_' . a:end_line

  let l:syntax_file = 'syntax/' . a:lang . '.vim'
  let l:syntax_paths = split(globpath(&runtimepath, l:syntax_file), '\n')

  if empty(l:syntax_paths)
    return
  endif

  try
    if exists('b:current_syntax')
      unlet b:current_syntax
    endif

    execute 'syntax include @' . l:group_name . ' ' . l:syntax_file

    execute printf('syntax region %s start=/\%%%dl/ end=/\%%%dl/ contains=@%s keepend',
          \ l:group_name,
          \ a:start_line + 1,
          \ a:end_line,
          \ l:group_name)
  catch /^Vim\%((\a\+)\)\=:E403/
    if exists('b:current_syntax')
      unlet b:current_syntax
    endif
    return
  catch /.*/
    return
  endtry
endfunc
