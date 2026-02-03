" ================================================================ "
"                                                                  "
"          ██╗  ██╗██╗███████╗██╗   ██╗██╗  ██╗███████╗            "
"          ██║ ██╔╝██║██╔════╝██║   ██║██║ ██╔╝██╔════╝            "
"          █████╔╝ ██║███████╗██║   ██║█████╔╝ █████╗              "
"          ██╔═██╗ ██║╚════██║██║   ██║██╔═██╗ ██╔══╝              "
"          ██║  ██╗██║███████║╚██████╔╝██║  ██╗███████╗            "
"          ╚═╝  ╚═╝╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝            "
"                                                                  "
" ================================================================ "
" Author:      Doruk Özer <dorukozer@protonmail.com>               "
" License:     MIT                                                 "
" Version:     0.3.0                                               "
" Description: Kisuke - Simple AI plugin for Vim                   "
"                                                                  "
" This is just my personal playground. I try to learn VimScript    "
" by building this plugin. There are some solid options for this   "
" functionality, but I wanted to build something myself.           "
"                                                                  "
" Repository:  https://github.com/dorukozerr/kisuke.vim            "
" ================================================================ "

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
