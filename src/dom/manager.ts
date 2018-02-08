type ElChildrenType =
  | typeof ElChildrenType.Void
  | typeof ElChildrenType.Text
  | typeof ElChildrenType.Collection
  | typeof ElChildrenType.Record;
namespace ElChildrenType {
  export const Void = 'void';
  export const Text = 'text';
  export const Collection = 'collection';
  export const Record = 'record';
}

export type ElChildren =
  | ElChildren.Void
  | ElChildren.Text
  | ElChildren.Collection
  | ElChildren.Record;
export namespace ElChildren {
  export type Void = undefined;
  export type Text = string;
  export type Collection = El<string, Element, any>[];
  export type Record = { [field: string]: El<string, Element, any>; };
}

const memory = new WeakSet<Element>();

export class El<
  T extends string,
  E extends Element,
  C extends ElChildren
  > {
  private readonly tag!: T;
  constructor(
    private readonly element_: E,
    private children_: C
  ) {
    this.tag;
    void throwErrorIfNotUsable(this);
    void memory.add(element_);
    switch (this.type) {
      case ElChildrenType.Void:
        return;
      case ElChildrenType.Text:
        void clear();
        this.children_ = element_.appendChild(document.createTextNode('')) as any;
        this.children = children_;
        return;
      case ElChildrenType.Collection:
        void clear();
        this.children_ = [] as ElChildren.Collection as C;
        this.children = children_;
        void scope(element_, this.children_ as ElChildren.Collection);
        return;
      case ElChildrenType.Record:
        void clear();
        this.children_ = observe(element_, { ...children_ as ElChildren.Record }) as C;
        void scope(element_, this.children_ as ElChildren.Record);
        return;
    }

    function clear(): void {
      while (element_.childNodes.length > 0) {
        void element_.removeChild(element_.firstChild!);
      }
    }

    function scope(el: Element, children: ElChildren.Collection | ElChildren.Record): void {
      if (!el.id.match(/^[\w\-]+$/)) return;
      return void Object.values(children)
        .forEach(child =>
          child.element instanceof HTMLStyleElement &&
          void parse(child.element, el.id));

      function parse(style: HTMLStyleElement, id: string): void {
        style.innerHTML = style.innerHTML.replace(/^\s*\$scope(?!\w)/gm, `#${id}`);
        void [...style.querySelectorAll('*')]
          .forEach(el =>
            void el.remove());
      }
    }

    function observe<C extends ElChildren.Record>(element: Element, children: C): C {
      return Object.defineProperties(
        children,
        Object.entries(children)
          .reduce<PropertyDescriptorMap>((descs, [name, child]) => {
            void throwErrorIfNotUsable(child);
            void element.appendChild(child.element);
            descs[name] = {
              configurable: true,
              enumerable: true,
              get: (): El<string, Element, any> => {
                return child;
              },
              set: (newChild: El<string, Element, any>) => {
                const oldChild = child;
                if (newChild === oldChild) return;
                newChild.element_.parentElement === element || void throwErrorIfNotUsable(newChild);
                child = newChild;
                void element.replaceChild(newChild.element, oldChild.element);
              }
            };
            return descs;
          }, {}));
    }
  }
  private readonly type: ElChildrenType =
    this.children_ === undefined
      ? ElChildrenType.Void
      : typeof this.children_ === 'string'
        ? ElChildrenType.Text
        : Array.isArray(this.children_)
          ? ElChildrenType.Collection
          : ElChildrenType.Record;
  public get element(): E {
    return this.element_;
  }
  public get children(): C {
    assert([ElChildrenType.Void, ElChildrenType.Collection].includes(this.type) ? Object.isFrozen(this.children_) : !Object.isFrozen(this.children_));
    switch (this.type) {
      case ElChildrenType.Text:
        return (this.children_ as any as Text).data as C;
      default:
        return this.children_;
    }
  }
  public set children(children: C) {
    switch (this.type) {
      case ElChildrenType.Void:
        return;
      case ElChildrenType.Text:
        (this.children_ as any as Text).data = children as string;
        return;
      case ElChildrenType.Collection:
        void (this.children_ as ElChildren.Collection)
          .reduce((cs, c) => {
            const i = cs.indexOf(c);
            if (i > -1) return cs;
            void cs.splice(i, 1);
            void c.element.remove();
            return cs;
          }, [...children as ElChildren.Collection]);
        this.children_ = [] as ElChildren.Collection as C;
        void (children as ElChildren.Collection)
          .forEach((child, i) => {
            child.element_.parentElement as Element === this.element_ || void throwErrorIfNotUsable(child);
            this.children_![i] = child;
            void this.element_.appendChild(child.element);
          });
        assert((this.children_ as ElChildren.Collection).every(({ element }, i) => element === this.element_.childNodes[i]));
        void Object.freeze(this.children_);
        return;
      case ElChildrenType.Record:
        assert.deepStrictEqual(Object.keys(children as object), Object.keys(this.children_ as object));
        void Object.keys(this.children_ as ElChildren.Record)
          .forEach(k =>
            this.children_![k] = children![k]);
        assert(Object.entries(this.children_ as ElChildren.Record).every(([k, v]) => children![k] === v));
        return;
    }
  }
}

function throwErrorIfNotUsable({ element }: El<string, Element, any>): void {
  if (element.parentElement === null || !memory.has(element.parentElement)) return;
  throw new Error(`TypedDOM: Cannot add an element used in another typed dom.`);
}
