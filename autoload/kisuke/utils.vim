" ============================================================ "
"                                                              "
" ██╗  ██╗██╗███████╗██╗   ██╗██╗  ██╗███████╗                 "
" ██║ ██╔╝██║██╔════╝██║   ██║██║ ██╔╝██╔════╝                 "
" █████╔╝ ██║███████╗██║   ██║█████╔╝ █████╗                   "
" ██╔═██╗ ██║╚════██║██║   ██║██╔═██╗ ██╔══╝                   "
" ██║  ██╗██║███████║╚██████╔╝██║  ██╗███████╗                 "
" ╚═╝  ╚═╝╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝                 "
"                                                              "
" ============================================================ "
" Author:      Doruk Özer <dorukozer@protonmail.com>           "
" License:     MIT                                             "
" Version:     1.0.0                                           "
" Description: Kisuke - Your Shopkeeper for Vim AI Operations  "
" Repository:  https://github.com/dorukozerr/kisuke.vim        "
" ============================================================ "

func! kisuke#utils#validate(checks)
  for check in a:checks
    if check.condition
      echoerr check.message

      return v:false
    endif
  endfor

  return v:true
endfunc
