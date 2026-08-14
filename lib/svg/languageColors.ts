// lib/svg/languageColors.ts
// Comprehensive language color map sourced from github-linguist / github/linguist
// Used for tech stack visualization and tower color-coding.
export const LANGUAGE_COLORS: Record<string, string> = {
  // Web / Frontend
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Sass: '#a53b70',
  Less: '#1d365d',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  CoffeeScript: '#244776',
  Handlebars: '#f7931e',
  Liquid: '#67b8de',
  Pug: '#a86454',
  EJS: '#a91e50',
  Astro: '#ff5a03',
  WebAssembly: '#04133b',

  // Backend / Systems
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Scala: '#c22d40',
  Clojure: '#db5855',
  Haskell: '#5e5086',
  Elixir: '#6e4a7e',
  Erlang: '#B83998',
  Ocaml: '#ef7a08',
  'F#': '#b845fc',
  Crystal: '#000100',
  Nim: '#ffc200',
  Zig: '#ec915c',
  V: '#4f87c4',
  Odin: '#3882D0',

  // Scripting / Shell
  Shell: '#89e051',
  Bash: '#89e051',
  PowerShell: '#012456',
  Lua: '#000080',
  Perl: '#0298c3',
  Awk: '#c30e9b',
  Tcl: '#e4cc98',
  Groovy: '#e69f56',

  // Data / ML / Scientific
  R: '#198CE7',
  Julia: '#a270ba',
  MATLAB: '#e16737',
  Jupyter: '#DA5B0B',
  Fortran: '#4d41b1',
  COBOL: '#0101ff',
  'Common Lisp': '#3fb68b',
  Scheme: '#1e4aec',
  Prolog: '#74283c',

  // DevOps / Config / Markup
  Dockerfile: '#384d54',
  HCL: '#844fba',
  Nix: '#7e7eff',
  CMake: '#DA3434',
  Makefile: '#427819',
  YAML: '#cb171e',
  TOML: '#9c4121',
  Jsonnet: '#0064bd',

  // Mobile
  'Objective-C': '#438eff',
  'Objective-C++': '#6866fb',

  // Database / Query
  PLpgSQL: '#336791',
  PLSQL: '#dad8d8',
  TSQL: '#e9e8e8',
};
