import { Node, forEachChild } from 'typescript';
import { FileReplacer } from './FileReplacer';
import { JsxExpression } from './Jsx';

export interface Opt {
  node: Node;
  parent?: Context;
  replacer: FileReplacer;
}

export abstract class Context {
  protected childs: Context[] = [];
  public newStr: string = '';
  public needReplace = false;
  protected node?: Node;
  protected replacer: FileReplacer;
  public parent?: Context;
  public start: number;
  public end: number;

  constructor({
    node,
    start,
    end,
    replacer,
    parent,
  }: Omit<Opt, 'node'> & { start: number; end: number; node?: Node }) {
    this.node = node;
    this.replacer = replacer;
    this.parent = parent;
    this.start = start;
    this.end = end;

    this.parent?.childs.push(this);
  }

  private sortChildThenCheck() {
    this.childs.sort((a, b) => a.start - b.start);
    let prev = this.childs?.[0];
    for (let i = 1; i < this.childs.length; i++) {
      if (this.childs[i].start < prev.end) {
        throw new Error('error parser');
      }
    }
  }

  protected abstract generatingStrFromChildThenSet(): void;

  public generateStrFromChildThenSet() {
    this.sortChildThenCheck();
    this.generatingStrFromChildThenSet();
    this.needReplace =
      this.needReplace || this.childs.some((c) => c.needReplace);
    this.childs?.forEach((c) => {
      c.clear();
    });
  }

  protected joinChildsAsParamter(
    startSkip: number,
    endSkip: number
  ): { str: string; keyMapValue: Record<string, string> } {
    const valueMapKey: Record<string, string> = {};
    const keyMapValue: Record<string, string> = {};

    const str = this.joinChildsToString(startSkip, endSkip, (str, c) => {
      if (
        c instanceof JsxExpression &&
        str.startsWith('{') &&
        str.endsWith('}')
      ) {
        str = str.slice(1, str.length - 1);
      }
      if (!valueMapKey[str]) {
        const key = 'v' + (Object.keys(valueMapKey).length + 1);

        valueMapKey[str] = key;
        keyMapValue[key] = str;
      }

      return '{' + valueMapKey[str] + '}';
    });

    return { str, keyMapValue };
  }

  protected joinChildsToString(
    startSkip: number,
    endSkip: number,
    strHandler: (str: string, c: Context) => string = (str) => str
  ) {
    let str = '';
    let start = this.start + startSkip;
    this.childs.forEach((c) => {
      str += this.replacer.file.slice(start, c.start);
      str += strHandler(c.newStr, c);
      start = c.end;
    });
    str += this.replacer.file.slice(start, this.end - endSkip);
    return str;
  }

  public clear() {
    (this.node as any) = null;
    this.parent = undefined;
    this.newStr = '';
    this.childs = [];
  }
}

export abstract class NodeHandler extends Context {
  public static of(_parameter: Opt): NodeHandler | null {
    throw new Error('should implement of method');
  }

  public static nodeHandlers: NodeHandler[] = [];
  private traverse() {
    if (this.node) {
      forEachChild(this.node, (n) =>
        this.replacer.traverseAstAndExtractLocales(n, this)
      );
    }
  }

  public static handle(opt: Opt): Context | null {
    const context = this.of(opt);

    if (context === null) {
      return null;
    }

    context.traverse();

    context.generateStrFromChildThenSet();

    return context;
  }
}
