if exists('g:loaded_keta')
    finish
endif

let g:loaded_keta=1

let s:job_id=0

function! s:HandleMessage(channel, msg)
    let l:data = json_decode(a:msg)

    if l:data.type == 'response'
        call setbufline(bufnr('%'), 1, l:data.content)
    endif
endfunction

function! s:StartTypeScriptProcess()
    if has('nvim')
        let s:job_id = jobstart(['node', 'dist/index.js'], {
            \ 'on_stdout': {j,d,e -> s:HandleMessage(j, join(d))},
            \ })
    else
        let s:job_id = job_start(['node', 'dist/index.js'], {
            \ 'out_cb': function('s:HandleMessage'),
            \ })
    endif
endfunction

function! s:OpenKeta()
    vnew
    setlocal buftype=nofile
    setlocal bufhidden=hide
    setlocal noswapfile

    if s:job_id==0
        call s:StartTypeScriptProcess()
    endif

    let l:msg = json_encode({'type': 'init'})

    if has('nvim')
        call chansend(s:job_id, l:msg . "\n")
    else
        call ch_sendraw(job_getchannel(s:job_id), l:msg . "\n")
    endif
endfunction

command! Keta call s:OpenKeta()
