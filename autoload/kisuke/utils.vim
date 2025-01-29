func! kisuke#utils#validate(checks)
  if type(a:checks) ==# 3
    for check in a:checks
      if check.condition
        echom check.message

        return 0
      endif
    endfor

    return 1
  else
    echom 'Error: Parameter must be a List'

    return 0
  endif
endfunc
