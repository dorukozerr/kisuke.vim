" Author - Doruk Özer <dorukozer@protonmail.com>
"
" Kisuke, another AI plugin for vim
"
" License - MIT
"
" TODO - Refactor the project later on, Trying to setup core functionalities
" properly first. There is a lot duplicate code that can be refactored to
" their own functions.
" TODO - Syntax highlighting doesn't work properly, when code start delimeter
" is out of screen highlighting breaks. Also I want to find a way to highlight
" based on language not just 1 color for the code blocks.

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

let g:is_kisuke_initialized = 1
let s:kisuke_buf_name       = 'Kisuke'
let s:kisuke_buf_nr         = -1
let s:job                   = v:null
let s:is_pending            = 0
let s:sessionId             = v:null
let s:totalSessions         = v:null
let s:stream_response       = ''
let s:response_start_line   = v:null
let s:marked_files          = []



func! s:ParseReply(channel, reply)
endfunc


func! s:NewSession()
  if s:job == v:null
    echoerr 'Please run :Kisuke first '
  else
    let l:wid=bufwinid(s:kisuke_buf_nr)
    let s:marked_files = []
    let s:is_pending = 1

    if l:wid == -1
      exe 'vsplit'
      exe 'buffer ' . s:kisuke_buf_nr

      call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'newSession' }))
    else
      call win_gotoid(l:wid)
      call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'newSession' }))
    endif
  endif
endfunc

func! s:SwitchToNextSession()
  if s:job == v:null
    echoerr 'Please run :Kisuke first '
  else
    let l:wid=bufwinid(s:kisuke_buf_nr)
    let s:marked_files = []
    let s:is_pending = 1

    if l:wid == -1
      exe 'vsplit'
      exe 'buffer ' . s:kisuke_buf_nr

      call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'nextSession' }))

      startinsert!
    else
      call win_gotoid(l:wid)
      call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'nextSession' }))
    endif
  endif
endfunc

func! s:SwitchToPreviousSession()
  if s:job == v:null
    echoerr 'Please run :Kisuke first '
  else
    let l:wid=bufwinid(s:kisuke_buf_nr)
    let s:marked_files = []
    let s:is_pending = 1

    if l:wid == -1
      exe 'vsplit'
      exe 'buffer ' . s:kisuke_buf_nr

      call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'prevSession' }))

      startinsert!
    else
      call win_gotoid(l:wid)
      call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'prevSession' }))
    endif
  endif
endfunc

func! s:Auth()
  if s:job == v:null
    echoerr 'Please run :Kisuke first '
  else
    let l:api_key = input('Enter your Claude API key: ')

    if empty(l:api_key)
      echoerr 'Please provide a valid api key'
    else
      let l:wid=bufwinid(s:kisuke_buf_nr)

      if l:wid == -1
        exe 'vsplit'
        exe 'buffer ' . s:kisuke_buf_nr

        let s:is_pending = 1

        call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'initialize' }))

        startinsert!
      else
        call win_gotoid(l:wid)
      endif

      call writefile([json_encode({ 'apiKey': l:api_key })], expand('~/.config/kisuke/auth.json'))
    endif
  endif
endfunc

func! s:DeleteSession()
  if s:job == v:null
    echoerr 'Please run :Kisuke first '
  else
    let l:wid=bufwinid(s:kisuke_buf_nr)
    let s:marked_files = []
    let s:is_pending = 1

    if l:wid == -1
      exe 'vsplit'
      exe 'buffer ' . s:kisuke_buf_nr

      let s:is_pending = 1

      call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'deleteSession', 'payload': s:sessionId }))

      startinsert!
    else
      call win_gotoid(l:wid)
      call ch_sendraw(job_getchannel(s:job), json_encode({ 'type': 'deleteSession', 'payload': s:sessionId }))
    endif
  endif
endfunc


command! Kisuke call s:OpenKisuke()
command! KisukeNewSession call s:NewSession()
command! KisukeNextSession call s:SwitchToNextSession()
command! KisukePreviousSession call s:SwitchToPreviousSession()
command! KisukeAuth call s:Auth()
command! KisukeDeleteSession call s:DeleteSession()
command! KisukeMarkCurrentFile call s:MarkCurrentFile()
command! -range KisukeMarkHighlighted <line1>,<line2>call s:MarkHighlightedCode()

nnoremap <Leader>ko :Kisuke<CR>
nnoremap <Leader>kc :KisukeNewSession<CR>
nnoremap <Leader>kn :KisukeNextSession<CR>
nnoremap <Leader>kp :KisukePreviousSession<CR>
nnoremap <Leader>ka :KisukeAuth<CR>
nnoremap <Leader>kd :KisukeDeleteSession<CR>
nnoremap <Leader>km :KisukeMarkCurrentFile<CR>
vnoremap <Leader>kh :KisukeMarkHighlighted<CR>
