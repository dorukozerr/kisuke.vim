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
" Author:      Doruk Özer <dorukozerr@protonmail.com>              "
" License:     MIT                                                 "
" Version:     0.1.0                                               "
" Description: Kisuke - Simple AI plugin for Vim                   "
"                                                                  "
" This is just my personal playground. I try to learn VimScript    "
" by building this plugin. There are some solid options for this   "
" functionality, but I wanted to build something myself.           "
"                                                                  "
" Repository:  https://github.com/dorukozerr/kisuke.vim            "
" ================================================================ "

if exists('g:kisuke_initialized')
  finish
endif

let g:kisuke_initialized = 1
let g:kisuke = {}
let g:kisuke.state = {
      \ 'job': v:null,
      \ 'buf_name': 'Kisuke',
      \ 'buf_nr': -1,
      \ 'is_pending': 0,
      \ 'session_id': v:null,
      \ 'total_sessions': v:null,
      \ 'marked_files': [],
      \ 'marked_code_blocks': [],
      \ }

command! KisukeConfiguration call kisuke#server#configure()
command! KisukeOpen call kisuke#buffer#open()
command! KisukeMarkFocusedFile call kisuke#buffer#mark_focused_file()
command! -range KisukeMarkHighlighted <line1>,<line2>call kisuke#buffer#mark_highlighted_code()
command! KisukeRemoveLastMarkedCodeBlock call kisuke#buffer#remove_last_marked_code_block()
command! KisukeCreateNewSession call kisuke#session#create_new_session()
command! KisukeNextSession call kisuke#session#go_to_next_session()
command! KisukePreviousSession call kisuke#session#go_to_previous_session()
command! KisukeDeleteSession call kisuke#session#delete_current_session()
