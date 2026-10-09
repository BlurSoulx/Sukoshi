// Registro único de paletas (un solo archivo a propósito: 8 paletas ocupan
// ~5 kB, el cambio es síncrono e instantáneo, sin fetches ni flashes).
// ui = interfaz, code = tokens de resaltado (clases shj-syn-*).
export const THEMES = [
  {
    id: 'dark', name: 'Sukoshi Oscuro', mode: 'dark',
    ui: { bg: '#111111', fg: '#e5e5e5', gutter: '#555555', selection: '#333333', scrollbar: '#2b2b2b', scrollbarHover: '#3a3a3a', searchBg: '#1b1b1b', accent: '#d29922', previewBg: '#141414', previewFg: '#e5e5e5' },
    code: { kwd: '#c678dd', str: '#98c379', cmnt: '#8a8f98', num: '#d19a66', func: '#61afef', oper: '#9aa4b2', var: '#e06c75', cls: '#56b6c2', type: '#e5c07b', bool: '#d19a66', section: '#61afef', deleted: '#e06c75', insert: '#98c379', err: '#e06c75' },
  },
  {
    id: 'light', name: 'Sukoshi Claro', mode: 'light',
    ui: { bg: '#f4f4f4', fg: '#1a1a1a', gutter: '#6e6e6e', selection: '#d3d3d3', scrollbar: '#c6c6c6', scrollbarHover: '#adadad', searchBg: '#ffffff', accent: '#8a5a00', previewBg: '#ffffff', previewFg: '#111111' },
    code: { kwd: '#a626a4', str: '#1a7f37', cmnt: '#6e7781', num: '#9a6700', func: '#0550ae', oper: '#57606a', var: '#cf222e', cls: '#087990', type: '#9a6700', bool: '#9a6700', section: '#0550ae', deleted: '#cf222e', insert: '#1a7f37', err: '#cf222e' },
  },
  {
    id: 'dracula', name: 'Dracula', mode: 'dark',
    ui: { bg: '#282a36', fg: '#f8f8f2', gutter: '#6272a4', selection: '#44475a', scrollbar: '#44475a', scrollbarHover: '#6272a4', searchBg: '#21222c', accent: '#bd93f9', previewBg: '#21222c', previewFg: '#f8f8f2' },
    code: { kwd: '#ff79c6', str: '#f1fa8c', cmnt: '#6272a4', num: '#bd93f9', func: '#50fa7b', oper: '#f8f8f2', var: '#ff79c6', cls: '#8be9fd', type: '#f1fa8c', bool: '#ffb86c', section: '#50fa7b', deleted: '#ff5555', insert: '#50fa7b', err: '#ff5555' },
  },
  {
    id: 'nord', name: 'Nord', mode: 'dark',
    ui: { bg: '#2e3440', fg: '#d8dee9', gutter: '#4c566a', selection: '#434c5e', scrollbar: '#434c5e', scrollbarHover: '#4c566a', searchBg: '#3b4252', accent: '#88c0d0', previewBg: '#242933', previewFg: '#d8dee9' },
    code: { kwd: '#81a1c1', str: '#a3be8c', cmnt: '#4c566a', num: '#b48ead', func: '#88c0d0', oper: '#81a1c1', var: '#8fbcbb', cls: '#8fbcbb', type: '#ebcb8b', bool: '#d08770', section: '#88c0d0', deleted: '#bf616a', insert: '#a3be8c', err: '#bf616a' },
  },
  {
    id: 'tokyo-night', name: 'Tokyo Night', mode: 'dark',
    ui: { bg: '#1a1b26', fg: '#c0caf5', gutter: '#565f89', selection: '#33467c', scrollbar: '#292e42', scrollbarHover: '#565f89', searchBg: '#16161e', accent: '#7aa2f7', previewBg: '#16161e', previewFg: '#c0caf5' },
    code: { kwd: '#bb9af7', str: '#9ece6a', cmnt: '#565f89', num: '#ff9e64', func: '#7aa2f7', oper: '#89ddff', var: '#f7768e', cls: '#e0af68', type: '#7dcfff', bool: '#ff9e64', section: '#7aa2f7', deleted: '#f7768e', insert: '#9ece6a', err: '#f7768e' },
  },
  {
    id: 'catppuccin', name: 'Catppuccin Mocha', mode: 'dark',
    ui: { bg: '#1e1e2e', fg: '#cdd6f4', gutter: '#6c7086', selection: '#585b70', scrollbar: '#313244', scrollbarHover: '#45475a', searchBg: '#181825', accent: '#cba6f7', previewBg: '#181825', previewFg: '#cdd6f4' },
    code: { kwd: '#cba6f7', str: '#a6e3a1', cmnt: '#6c7086', num: '#fab387', func: '#89b4fa', oper: '#89dceb', var: '#f38ba8', cls: '#fab387', type: '#94e2d5', bool: '#fab387', section: '#89b4fa', deleted: '#f38ba8', insert: '#a6e3a1', err: '#f38ba8' },
  },
  {
    id: 'gruvbox', name: 'Gruvbox', mode: 'dark',
    ui: { bg: '#282828', fg: '#ebdbb2', gutter: '#928374', selection: '#504945', scrollbar: '#3c3836', scrollbarHover: '#504945', searchBg: '#1d2021', accent: '#fabd2f', previewBg: '#1d2021', previewFg: '#ebdbb2' },
    code: { kwd: '#fb4934', str: '#b8bb26', cmnt: '#928374', num: '#d3869b', func: '#b8bb26', oper: '#fe8019', var: '#83a598', cls: '#fabd2f', type: '#8ec07c', bool: '#fe8019', section: '#83a598', deleted: '#fb4934', insert: '#b8bb26', err: '#fb4934' },
  },
  {
    id: 'monokai', name: 'Monokai', mode: 'dark',
    ui: { bg: '#272822', fg: '#f8f8f2', gutter: '#75715e', selection: '#49483e', scrollbar: '#3e3d32', scrollbarHover: '#49483e', searchBg: '#1e1f1c', accent: '#f92672', previewBg: '#1e1f1c', previewFg: '#f8f8f2' },
    code: { kwd: '#f92672', str: '#e6db74', cmnt: '#75715e', num: '#ae81ff', func: '#a6e22e', oper: '#f92672', var: '#66d9ef', cls: '#a6e22e', type: '#fd971f', bool: '#ae81ff', section: '#66d9ef', deleted: '#f92672', insert: '#a6e22e', err: '#f92672' },
  },
  {
    id: 'synthwave', name: "SynthWave '84", mode: 'dark',
    ui: { bg: '#2a2139', fg: '#ffffff', gutter: '#84779e', selection: '#463465', scrollbar: '#3a2f52', scrollbarHover: '#4a3d66', searchBg: '#232530', accent: '#ff7edb', previewBg: '#221b30', previewFg: '#ffffff' },
    code: { kwd: '#ff7edb', str: '#72f1b8', cmnt: '#84779e', num: '#ff9e64', func: '#03edf9', oper: '#ffffff', var: '#f97e72', cls: '#f3e70f', type: '#03edf9', bool: '#f3e70f', section: '#03edf9', deleted: '#fe4450', insert: '#72f1b8', err: '#fe4450' },
  },
]

export function themeById(id) {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}
