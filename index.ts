﻿export { TypedHTML as default, TypedHTML, TypedSVG, API } from './src/dom/builder';
export { html, svg, text, frag, observer } from './src/util/dom';
export * from './src/util/listener';

declare global {
  interface SVGElementTagNameMap_ extends SVGElementTagNameMap {
  }
}
