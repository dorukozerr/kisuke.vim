func! kisuke#syntax#setup()
  if exists('b:syntax_setup_done') && b:syntax_setup_done
    return
  endif

  syntax clear

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
      for code_block in l:code_blocks
        let l:lang = matchstr(getbufline(g:kisuke.state.buf_nr, code_block.start_line_nr)[0], '^```\s*\(\w\+\)')
        let l:lang = substitute(l:lang, '^```\s*', '', '')

        if !empty(l:lang)
          execute 'syntax include @' . l:lang . ' syntax/' . l:lang . '.vim'
          execute printf('syntax region KisukeCode_%s start=/\%%%dl/ end=/\%%%dl/ contains=@%s keepend',
                \ l:lang,
                \ code_block.start_line_nr + 1,
                \ code_block.end_line_nr,
                \ l:lang)
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
