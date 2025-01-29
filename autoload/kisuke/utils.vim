func! kisuke#utils#validate(checks)
  exe type(a:checks) != 3
        \ ? 'echom "Error: Parameter must be a List"'
        \ . ' | return 0'
        \ : ''

  for check in a:checks
    exe check.condition
          \ ? 'echom check.message'
          \ . ' | return 0'
          \ : ''
  endfor

  return 1
endfunc
