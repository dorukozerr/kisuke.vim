if exists('g:loaded_keta')
  finish
endif

let g:loaded_keta = 1
let s:job_id = v:null
let s:keta_bufnr = -1

function! s:HandleMessage(channel, msg)
  let l:data = json_decode(a:msg)

  if l:data.type == 'response'
    call setbufline(s:keta_bufnr, 1, l:data.content)
  endif
endfunction

function! s:IsJobRunning()
  if has('nvim')
    return s:job_id != v:null && jobwait([s:job_id], 0)[0] == -1
  else
    return s:job_id != v:null && job_status(s:job_id) == 'run'
  endif
endfunction

function! s:StopTypeScriptProcess()
  if s:job_id != v:null
    if has('nvim')
      try
        call jobstop(s:job_id)
      catch
        " Handle potential errors silently
      endtry
    else
      try
        call job_stop(s:job_id)
      catch
        " Handle potential errors silently
      endtry
    endif
    let s:job_id = v:null
  endif
endfunction

function! s:StartTypeScriptProcess()
  call s:StopTypeScriptProcess()

  if has('nvim')
    let s:job_id = jobstart(['node', 'dist/index.js'], {
          \ 'on_stdout': {j,d,e -> s:HandleMessage(j, join(d))},
          \ 'on_exit': {j,d,e -> s:StopTypeScriptProcess()},
          \ })
  else
    let s:job_id = job_start(['node', 'dist/index.js'], {
          \ 'out_cb': function('s:HandleMessage'),
          \ 'exit_cb': {j,s -> s:StopTypeScriptProcess()},
          \ })
  endif

  if s:job_id == 0 || s:job_id == -1
    echoerr "Failed to start TypeScript process"

    let s:job_id = v:null

    return 0
  endif

  return 1
endfunction

function! s:CleanupKeta()
  call s:StopTypeScriptProcess()

  let s:keta_bufnr = -1
endfunction

function! s:OpenKeta()
  if bufexists(s:keta_bufnr)
    execute 'buffer ' . s:keta_bufnr

    return
  endif

  vnew

  let s:keta_bufnr = bufnr('%')

  setlocal buftype=nofile
  setlocal bufhidden=wipe
  setlocal noswapfile
  setlocal nobuflisted
  execute 'file Keta-' . s:keta_bufnr

  augroup KetaBuffer
    autocmd! * <buffer>
    autocmd BufWipeout <buffer> call s:CleanupKeta()
  augroup END

  if !s:IsJobRunning()
    if !s:StartTypeScriptProcess()
      return
    endif
  endif

  let l:msg = json_encode({'type': 'init'})

  if has('nvim')
    call chansend(s:job_id, l:msg . "\n")
  else
    call ch_sendraw(job_getchannel(s:job_id), l:msg . "\n")
  endif
endfunction

command! Keta call s:OpenKeta()
