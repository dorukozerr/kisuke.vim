" ============================================== "
" Author - Doruk Özer <dorukozer@protonmail.com> "
" Kisuke, another AI plugin for vim              "
" License - MIT                                  "
" ============================================== "

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
      \ 'response_start_line': v:null,
      \ 'stream_response': '',
      \ 'marked_files': [],
      \ }

command! KisukeConfiguration call kisuke#server#configure()
command! KisukeOpen call kisuke#buffer#open()
command! KisukeMarkFocusedFile call kisuke#buffer#mark_focused_file()
command! -range KisukeMarkHighlighted <line1>,<line2>call kisuke#buffer#mark_highlighted_code()
command! KisukeCreateNewSession call kisuke#session#create_new_session()
command! KisukeNextSession call kisuke#session#go_to_next_session()
command! KisukePreviousSession call kisuke#session#go_to_previous_session()
command! KisukeDeleteSession call kisuke#session#delete_current_session()

nnoremap <Leader>ka :KisukeConfiguration<CR>
nnoremap <Leader>ko :KisukeOpen<CR>
nnoremap <Leader>km :KisukeMarkFocusedFile<CR>
vnoremap <Leader>kh :KisukeMarkHighlighted<CR>
nnoremap <Leader>kc :KisukeCreateNewSession<CR>
nnoremap <Leader>kn :KisukeNextSession<CR>
nnoremap <Leader>kp :KisukePreviousSession<CR>
nnoremap <Leader>kd :KisukeDeleteSession<CR>
