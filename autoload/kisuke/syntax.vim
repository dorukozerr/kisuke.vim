func! kisuke#syntax#setup()
  syntax clear

  syn match KisukePrompt /^Prompt >/
  syn match KisukeResponse /^Kisuke >/
  syn match KisukeSystem /^> .*$/

  syn region KisukeCodeBlock matchgroup=KisukeCodeDelimiter
        \ start=/^```.*$/
        \ end=/^```$/
        \ keepend

  hi def link KisukePrompt Statement
  hi def link KisukeResponse Identifier
  hi def link KisukeSystem Special
  hi def link KisukeCodeDelimiter Delimiter
  hi def link KisukeCodeBlock String
endfunc
