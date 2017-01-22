import { TypedHTML as ITypedHTML, TypedHTMLContents } from 'typed-dom';
import { build } from './builder';

export type TypedHTML<S extends string, T extends HTMLElement, U extends TypedHTMLContents<HTMLElement>> = ITypedHTML<S, T, U>;
export const TypedHTML: TypedHTML<string, HTMLElement, TypedHTMLContents<HTMLElement>> = [
  // lib.dom.d.ts
  'a',
  'abbr',
  'acronym',
  'address',
  'applet',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'basefont',
  'bdo',
  'big',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'center',
  'cite',
  'code',
  'col',
  'colgroup',
  'datalist',
  'dd',
  'del',
  'dfn',
  'dir',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'font',
  'footer',
  'form',
  'frame',
  'frameset',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hgroup',
  'hr',
  'html',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'isindex',
  'kbd',
  'keygen',
  'label',
  'legend',
  'li',
  'link',
  'listing',
  'map',
  'mark',
  'marquee',
  'menu',
  'meta',
  'meter',
  'nav',
  'nextid',
  'nobr',
  'noframes',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'p',
  'param',
  'picture',
  'plaintext',
  'pre',
  'progress',
  'q',
  'rt',
  'ruby',
  's',
  'samp',
  'script',
  'section',
  'select',
  'small',
  'source',
  'span',
  'strike',
  'strong',
  'style',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'template',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'title',
  'tr',
  'track',
  'tt',
  'u',
  'ul',
  'var',
  'video',
  'wbr',
  'xmp',
  // custom
  'custom'
]
  .reduce((obj, tag) => (
    obj[tag] =
      <T extends TypedHTMLContents<HTMLElement>>
      (attrs?: { [name: string]: string; }, children?: T, factory?: () => HTMLElement)
      : TypedHTML<string, HTMLElement, T> =>
          !attrs || !children || typeof children === 'function'
            ? build(<any>children || (() => document.createElement(tag)), {}, <T><any>attrs)
            : build(factory || (() => document.createElement(tag)), attrs, children),
    obj
  ), <TypedHTML<string, HTMLElement, TypedHTMLContents<HTMLElement>>>{});
