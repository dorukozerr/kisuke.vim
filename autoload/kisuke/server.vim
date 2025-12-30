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

  " call mkdir(expand('~/.config/kisuke'), 'p')
  " let log_file = expand('~/.config/kisuke/output_log')
  " let cmd = 'node ' . node_script . ' 2>&1 | tee -a ' . log_file

  let cmd = 'node ' . node_script

  let g:kisuke.state.job = job_start(['sh', '-c', cmd], {
        \ 'out_cb': function('kisuke#server#parse_reply'),
        \ })
endfunc

func! kisuke#server#configure(provider, model)
  let l:config_file = expand('~/.config/kisuke/config.json')
  let l:config = kisuke#server#load()
  let l:lower_provider = tolower(a:provider)
  let l:api_key = ''

  if has_key(l:config, 'apiKeys')
        \ && has_key(l:config.apiKeys, l:lower_provider)
        \ && !empty(l:config.apiKeys[l:lower_provider])

    let l:api_key = l:config.apiKeys[l:lower_provider]

    echom 'Using existing API key for ' . a:provider
  else
    let l:api_key = input('Enter your ' . a:provider . ' API key: ')
  endif

  let l:checks = [
        \ {'condition': g:kisuke.state.job == v:null, 'message': 'Please run :KisukeOpen first, or press <leader>ko'},
        \ {'condition': empty(l:api_key), 'message': 'API key cannot be empty. Please provide a valid key.'},
        \ {'condition': empty(a:provider), 'message': 'Please provide a valid provider'},
        \ {'condition': empty(a:model), 'message': 'Please provide a valid model'}
        \ ]

  if kisuke#utils#validate(l:checks)
    if !has_key(l:config, 'apiKeys')
      let l:config.apiKeys = {}
    endif

    let l:config.provider = l:lower_provider
    let l:config.model = tolower(a:model)
    let l:config.apiKeys[l:lower_provider] = l:api_key

    call writefile([json_encode(l:config)], l:config_file, 'w')
    call kisuke#buffer#restore({ 'type': 'initialize' })

    redraw!

    echom a:provider . ' configuration updated using model ' . a:model . '.'
  else
    echohl WarningMsg | echom 'Configuration aborted due to validation errors.' | echohl None
  endif
endfunc

func! kisuke#server#parse_reply(channel, reply)
  let l:reply = json_decode(a:reply)

  let g:kisuke.state.marked_files = []
  let g:kisuke.state.marked_code_blocks = []

  let l:handlers = {
        \ 'initialize': function('kisuke#handlers#initialize'),
        \ 'response': function('kisuke#handlers#response'),
        \ 'new_session': function('kisuke#handlers#new_session'),
        \ 'resume_last_session': function('kisuke#handlers#resume_last_session'),
        \ 'switch_session': function('kisuke#handlers#switch_session'),
        \ 'load_sessions': function('kisuke#handlers#load_sessions'),
        \ 'restore_session': function('kisuke#handlers#restore_session'),
        \ 'next_session': function('kisuke#handlers#next_session'),
        \ 'previous_session': function('kisuke#handlers#previous_session'),
        \ 'error': function('kisuke#handlers#error')
        \ }

  if has_key(l:handlers, l:reply.type)
    call l:handlers[l:reply.type](l:reply)
  else
    echoerr 'Unknown message type'
  endif

  let g:kisuke.state.is_pending = 0
endfunc

func! kisuke#server#load()
  let l:config_file = expand('~/.config/kisuke/config.json')

  if filereadable(l:config_file)
    let l:config = json_decode(join(readfile(l:config_file), "\n"))

    return l:config
  endif

  return {
        \ 'provider': '',
        \ 'model': '',
        \ 'apiKeys': {}
        \ }
endfunc
