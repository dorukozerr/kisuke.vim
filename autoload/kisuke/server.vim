func! kisuke#server#start_process()
  let l:paths = split(&runtimepath, ',')
  let l:plugin_root = ''

  for path in l:paths
    if path =~ 'kisuke\.vim$'
      let l:plugin_root = path

      break
    endif
  endfor

  if empty(l:plugin_root)
    echoerr 'could not find kisuke.vim in runtimepath'

    return
  endif

  let node_script = plugin_root . '/dist/index.js'

  let g:kisuke.state.job = job_start(['node', node_script], {
        \ 'out_cb': function('kisuke#server#parse_reply'),
        \ })
endfunc

func! kisuke#server#configure()
  let l:api_key = input('Enter your Claude API key: ')

  let l:checks = [
        \ {'condition': g:kisuke.state.job == v:null, 'message': 'Please run :KisukeOpen first, or press <leader>ko'},
        \ {'condition': empty(l:api_key), 'message': 'Please provide a valid api key'},
        \ ]

  if kisuke#utils#validate(l:checks)
    call writefile([json_encode({ 'apiKey': l:api_key })], expand('~/.config/kisuke/config.json'))
    call kisuke#buffer#focus({ 'type': 'initialize' })

    redraw!

    echom 'Api key saved'
  endif
endfunc

func! kisuke#server#parse_reply(channel, reply)
  let l:reply = json_decode(a:reply)

  let l:handlers = {
        \ 'initialize': function('kisuke#handlers#initialize'),
        \ 'response': function('kisuke#handlers#response'),
        \ 'newSession': function('kisuke#handlers#new_session'),
        \ 'switchSession': function('kisuke#handlers#switch_session'),
        \ 'error': function('kisuke#handlers#error'),
        \ }

  if has_key(l:handlers, l:reply.type)
    call l:handlers[l:reply.type](l:reply)
  else
    echoerr 'Unknown message type'
  endif

  let g:kisuke.state.is_pending = 0
endfunc
