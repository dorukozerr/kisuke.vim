func! kisuke#utils#validate(checks)
  for check in a:checks
    if check.condition
      echom check.message

      return 0
    endif
  endfor

  return 1
endfunc
