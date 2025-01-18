func! kisuke#utils#validate(checks)
  for check in a:checks
    if check.condition
      echoerr check.message

      return v:false
    endif
  endfor

  return v:true
endfunc
