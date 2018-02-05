import { noop } from './noop';

const cache = new Map<string, HTMLElement>();

export function html<T extends keyof HTMLElementTagNameMap>(tag: T, children?: Node[] | string): HTMLElementTagNameMap[T]
export function html<T extends keyof HTMLElementTagNameMap>(tag: T, attrs?: Record<string, string>, children?: Node[] | string): HTMLElementTagNameMap[T]
export function html<T extends keyof HTMLElementTagNameMap>(tag: T, attrs: Record<string, string> | Node[] | string = {}, children: Node[] | string = []): HTMLElementTagNameMap[T] {
  if (typeof children === 'string') return html(tag, attrs as {}, [document.createTextNode(children)]);
  if (typeof attrs === 'string' || Array.isArray(attrs)) return html(tag, {}, attrs);
  const el: HTMLElement = cache.has(tag)
    ? cache.get(tag)!.cloneNode(true) as HTMLElement
    : cache.set(tag, document.createElement(tag)).get(tag)!.cloneNode(true) as HTMLElement;
  assert(el.attributes.length === 0);
  assert(el.childNodes.length === 0);
  for (const [name, value] of Object.entries(attrs)) {
    void el.setAttribute(name, value);
  }
  for (const child of children) {
    void el.appendChild(child);
  }
  return el;
}

export const currentTargets = new WeakMap<Event, EventTarget>();

export function listen<T extends keyof WindowEventMap>(target: Window, type: T, listener: (ev: WindowEventMap[T]) => any, option?: boolean | AddEventListenerOptions): () => undefined;
export function listen<T extends keyof DocumentEventMap>(target: Document, type: T, listener: (ev: DocumentEventMap[T]) => any, option?: boolean | AddEventListenerOptions): () => undefined;
export function listen<T extends keyof HTMLElementEventMap>(target: HTMLElement, type: T, listener: (ev: HTMLElementEventMap[T]) => any, option?: boolean | AddEventListenerOptions): () => undefined;
export function listen<T extends keyof HTMLElementEventMap>(target: Document | HTMLElement, selector: string, type: T, listener: (ev: HTMLElementEventMap[T]) => any, option?: AddEventListenerOptions): () => undefined;
export function listen<T extends keyof WindowEventMap | keyof DocumentEventMap | keyof HTMLElementEventMap>(target: Window | Document | HTMLElement, a: T | string, b: ((ev: Event) => any) | T, c: boolean | AddEventListenerOptions | ((ev: Event) => any) = false, d: AddEventListenerOptions = {}): () => undefined {
  return typeof b === 'string'
    ? delegate(target as Document, a, b as keyof HTMLElementEventMap, c as () => void, d)
    : bind(target as HTMLElement, a as keyof HTMLElementEventMap, b, c as boolean);
}

export function once<T extends keyof WindowEventMap>(target: Window, type: T, listener: (ev: WindowEventMap[T]) => any, option?: boolean | AddEventListenerOptions): () => undefined;
export function once<T extends keyof DocumentEventMap>(target: Document, type: T, listener: (ev: DocumentEventMap[T]) => any, option?: boolean | AddEventListenerOptions): () => undefined;
export function once<T extends keyof HTMLElementEventMap>(target: HTMLElement, type: T, listener: (ev: HTMLElementEventMap[T]) => any, option?: boolean | AddEventListenerOptions): () => undefined;
export function once<T extends keyof HTMLElementEventMap>(target: Document | HTMLElement, selector: string, type: T, listener: (ev: HTMLElementEventMap[T]) => any, option?: AddEventListenerOptions): () => undefined;
export function once<T extends keyof WindowEventMap | keyof DocumentEventMap | keyof HTMLElementEventMap>(target: Window | Document | HTMLElement, a: T | string, b: ((ev: Event) => any) | T, c: boolean | AddEventListenerOptions | ((ev: Event) => any) = false, d: AddEventListenerOptions = {}): () => undefined {
  return typeof b === 'string'
    ? delegate(target as Document, a, b as keyof HTMLElementEventMap, c as () => void, { ...(typeof d === 'boolean' ? { capture: d } : d), once: true })
    : bind(target as HTMLElement, a as keyof HTMLElementEventMap, b, { ...(typeof c === 'boolean' ? { capture: c } : c), once: true });
}

export function bind<T extends keyof WindowEventMap>(target: Window, type: T, listener: (ev: WindowEventMap[T]) => any, option?: boolean | AddEventListenerOptions): () => undefined;
export function bind<T extends keyof DocumentEventMap>(target: Document, type: T, listener: (ev: DocumentEventMap[T]) => any, option?: boolean | AddEventListenerOptions): () => undefined;
export function bind<T extends keyof HTMLElementEventMap>(target: HTMLElement, type: T, listener: (ev: HTMLElementEventMap[T]) => any, option?: boolean | AddEventListenerOptions): () => undefined;
export function bind<T extends keyof WindowEventMap | keyof DocumentEventMap | keyof HTMLElementEventMap>(target: Window | Document | HTMLElement, type: T, listener: (ev: Event) => any, option: boolean | AddEventListenerOptions = false): () => undefined {
  void target.addEventListener(type, handler, adjustEventListenerOptions(option) as boolean);
  let unbind: () => undefined = () => (
    unbind = noop,
    void target.removeEventListener(type, handler, adjustEventListenerOptions(option) as boolean));
  return () => void unbind();

  function handler(ev: Event) {
    if (typeof option === 'object') {
      if (option.passive) {
        ev.preventDefault = noop;
      }
      if (option.once) {
        void unbind();
      }
    }
    void currentTargets.set(ev, ev.currentTarget);
    void listener(ev);
  }

  function adjustEventListenerOptions(option: boolean | AddEventListenerOptions): boolean | AddEventListenerOptions {
    return supportEventListenerOptions
      ? option
      : typeof option === 'boolean' ? option : !!option.capture;
  }
}

export function delegate<T extends keyof HTMLElementEventMap>(target: Document | HTMLElement, selector: string, type: T, listener: (ev: HTMLElementEventMap[T]) => any, option: AddEventListenerOptions = {}): () => undefined {
  return bind(target instanceof Document ? target.documentElement : target, type, ev => {
    const cx = (ev.target as HTMLElement).closest(selector);
    if (!cx) return;
    void [...target.querySelectorAll<HTMLElement>(selector)]
      .filter(el => el === cx)
      .forEach(el =>
        void once(el, type, ev => {
          void listener(ev);
        }, option));
  }, { ...option, capture: true });
}

let supportEventListenerOptions = false;
try {
  document.createElement("div").addEventListener("test", function () { }, {
    get capture() {
      return supportEventListenerOptions = true;
    }
  } as any);
} catch (e) { }
