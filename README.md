![screenshot](ss-1.png)

# kisuke.vim

Another AI plugin for Vim.

- Work in progess, to be updated...

## My Motivation

When the this idea first came to me I thought there are no available plugin does this in vim lol. Then after little bit of googling I found out there is plugins does what I want to do in NeoVim but not in Vim. But after a while I found out a similliar plugin exists in Vim too. I just want to develop my own plugin just for sake of doing it, don't know where this going to end up but it's so fun.

## To use it

- It's really early stage of this plugin but you can test out the available features.
- Currently it's using claude only and you need a api key to use it.
- I'll add how to use it with other plugin managers later on.

#### Install yarn if you don't have it

```bash
npm i -g yarn@latest
```

#### Install commands

```bash
mkdir -p ~/.vim/pack/plugins/start
cd ~/.vim/pack/plugins/start
git clone https://github.com/dorukozerr/kisuke.vim.git
cd kisuke.vim
yarn build
cd ~
```

## Mappings

| Mapping                                     | Description                                                        | Mode |
| :------------------------------------------ | :----------------------------------------------------------------- | :--- |
| <kbd>leader</kbd> <kbd>k</kbd> <kbd>o</kbd> | Open Kisuke chat buffer                                            | `n`  |
| <kbd>leader</kbd> <kbd>k</kbd> <kbd>c</kbd> | Create new Kisuke session                                          | `n`  |
| <kbd>leader</kbd> <kbd>k</kbd> <kbd>n</kbd> | Switch to next Kisuke session                                      | `n`  |
| <kbd>leader</kbd> <kbd>k</kbd> <kbd>p</kbd> | Switch to previous Kisuke session                                  | `n`  |
| <kbd>leader</kbd> <kbd>k</kbd> <kbd>a</kbd> | Invoke Kisuke for saving API KEY                                   | `n`  |
| <kbd>leader</kbd> <kbd>k</kbd> <kbd>d</kbd> | Delete current Kisuke session                                      | `n`  |
| <kbd>leader</kbd> <kbd>k</kbd> <kbd>m</kbd> | Save/Remove the focused buffer/file to be used in your next prompt | `n`  |
