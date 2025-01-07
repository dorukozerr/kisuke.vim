if exists('g:loaded_keta')
    finish
endif

let g:loaded_keta = 1

let s:job_id = 0
let s:keta_bufnr = -1

function! s:HandleMessage(channel, msg)
    let l:data = json_decode(a:msg)
    if l:data.type == 'response'
        call setbufline(s:keta_bufnr, 1, l:data.content)
    endif
endfunction

function! s:StopTypeScriptProcess()
    if s:job_id != 0
        if has('nvim')
            call jobstop(s:job_id)
        else
            call job_stop(s:job_id)
        endif
        let s:job_id = 0
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

    if s:job_id == 0
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
