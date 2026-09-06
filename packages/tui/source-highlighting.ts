import {TreeSitterClient,addDefaultParsers,SyntaxStyle} from '@opentui/core';
import ruby from '../../third_party/tree-sitter-ruby/tree-sitter-ruby.wasm' with {type:'file'};
import highlights from '../../third_party/tree-sitter-ruby/highlights.scm' with {type:'file'};
addDefaultParsers([{filetype:'ruby',aliases:['rb','rake','gemspec'],wasm:ruby,queries:{highlights:[highlights]}}]);
export function sourceHighlighter(dataPath:string){return new TreeSitterClient({dataPath,initTimeout:3000});}
export function sourceLanguage(path:string){if(/(?:\.(?:rb|rake|gemspec|ru)$|(?:^|\/)(?:Gemfile|Rakefile))/.test(path))return 'ruby';if(/\.[cm]?jsx?$/.test(path))return 'javascript';if(/\.tsx?$/.test(path))return 'typescript';return 'text';}
export function sourceSyntax(noColor=process.env.NO_COLOR!==undefined){return SyntaxStyle.fromStyles(noColor?{default:{}}:{default:{fg:'#d7dde8'},keyword:{fg:'#c5a3ff',bold:true},string:{fg:'#add7a2'},comment:{fg:'#8b97a9',italic:true},function:{fg:'#89c8ee'},type:{fg:'#f2d49b'},constant:{fg:'#efb79a'},number:{fg:'#efb79a'},operator:{fg:'#c5a3ff'},property:{fg:'#a7cce7'},variable:{fg:'#d7dde8'}});}
