" ============================================================================= "
"                                                                               "
"                 ██ ▄█▀ ██▓  ██████  █    ██  ██ ▄█▀▓█████                     "
"                  ██▄█▒ ▓██▒▒██    ▒  ██  ▓██▒ ██▄█▒ ▓█   ▀                    "
"                 ▓███▄░ ▒██▒░ ▓██▄   ▓██  ▒██░▓███▄░ ▒███                      "
"                 ▓██ █▄ ░██░  ▒   ██▒▓▓█  ░██░▓██ █▄ ▒▓█  ▄                    "
"                 ▒██▒ █▄░██░▒██████▒▒▒▒█████▓ ▒██▒ █▄░▒████▒                   "
"                 ▒ ▒▒ ▓▒░▓  ▒ ▒▓▒ ▒ ░░▒▓▒ ▒ ▒ ▒ ▒▒ ▓▒░░ ▒░ ░                   "
"                 ░ ░▒ ▒░ ▒ ░░ ░▒  ░ ░░░▒░ ░ ░ ░ ░▒ ▒░ ░ ░  ░                   "
"                 ░ ░░ ░  ▒ ░░  ░  ░   ░░░ ░ ░ ░ ░░ ░    ░                      "
"                 ░  ░    ░        ░     ░     ░  ░      ░  ░                   "
"                                                                               "
" ============================================================================= "
" Author:      Doruk Özer <dorukozer@protonmail.com>                            "
" License:     MIT                                                              "
" Version:     0.3.0                                                            "
"                                                                               "
" At first this project was my sandbox environment for vim script, then I set   "
" some simple and primitive goals while feeling like its beyond my scope and I  "
" can't finish them. Now I'm unemployed again and I'm trying to turn this into  "
" my goth waifu AI girlfriend like my life depends on it. My only goal is       "
" building something that gonna keep me in this inefficient, meaningless,       "
" delusional, poser, tryhard, fake state I just can't or don't or not prefer    "
" to let go.                                                                    "
"                                                                               "
" Repository:  https://github.com/dorukozerr/kisuke.vim                         "
" ============================================================================= "

if exists('g:kisuke_initialized')
  fini
en

let g:kisuke_initialized = 1
let g:kisuke = {}
let g:kisuke.state = {
      \ 'job': v:null,
      \ 'buf_name': 'Kisuke',
      \ 'buf_nr': -1,
      \ 'init_response': v:null,
      \ 'is_pending': 0,
      \ 'session_id': v:null,
      \ 'total_sessions': v:null,
      \ 'marked_files': [],
      \ 'marked_code_blocks': []
      \ }

com! KisukeOpen                                   cal kisuke#buffer#open()
com! KisukeMarkFocusedFile                        cal kisuke#buffer#mark_focused_file()
com! -range KisukeMarkHighlighted <line1>,<line2> cal kisuke#buffer#mark_highlighted_code()
com! KisukeRemoveLastMarkedCodeBlock              cal kisuke#buffer#remove_last_marked_code_block()
com! KisukeCreateNewSession                       cal kisuke#session#create_new_session()
com! KisukeDeleteSession                          cal kisuke#session#delete_current_session()
com! KisukeResumeLastSession                      cal kisuke#buffer#restore({ 'type': 'resume_last_session' })
com! KisukeNextSession                            cal kisuke#session#go_to_next_session()
com! KisukePreviousSession                        cal kisuke#session#go_to_previous_session()
com! KisukeRestart                                cal kisuke#server#restart()
