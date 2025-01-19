func! kisuke#server#start_process()
  let paths = split(&runtimepath, ',')
  let plugin_root = ''

  for path in paths
    if path =~'kisuke\.vim$'
      let plugin_root = path

      break
    endif
  endfor

  if empty(plugin_root)
    echoerr "Could not find kisuke.vim in runtimepath"

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

  exe kisuke#utils#validate(l:checks)
        \ ? 'call writefile([json_encode({ "apiKey": l:api_key })], expand("~/.config/kisuke/config.json"))'
        \ . ' | call kisuke#buffer#focus({ "type": "initialize" })'
        \ . ' | redraw!'
        \ . ' | echom "Api key saved"'
        \ : ''
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

  exe has_key(l:handlers, l:reply.type)
        \ ? 'call l:handlers[l:reply.type](l:reply)'
        \ : 'echoerr "Unknown message type"'

  let g:kisuke.state.is_pending = 0
endfunc
