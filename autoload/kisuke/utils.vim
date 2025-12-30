fu! kisuke#utils#validate(checks)
  if type(a:checks) ==# 3
    for check in a:checks
      if check.condition
        echom check.message

        retu 0
      en
    endfo

    retu 1
  el
    echom 'Error: Parameter must be a List'

    retu 0
  en
endfu
