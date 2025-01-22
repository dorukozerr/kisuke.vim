func! kisuke#utils#validate(checks)
  for check in a:checks
    exe check.condition
          \ ? 'echom check.message'
          \ . ' | return 0'
          \ : ''
  endfor

  return 1
endfunc
