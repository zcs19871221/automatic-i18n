import { Node, forEachChild } from 'typescript';
import { FileReplacer } from '../FileReplacer';

export interface Opt {
  node: Node;
  parent?: ReplaceContext;
  replacer: FileReplacer;
}

export abstract class ReplaceContext {
  protected children: ReplaceContext[] = [];
  public replacedText: string = '';
  public needReplace = false;
  protected node?: Node;
  protected replacer: FileReplacer;
  public parent?: ReplaceContext;
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

    this.parent?.children.push(this);
  }

  private sortChildrenThenCheck() {
    this.children.sort((a, b) => a.start - b.start);
    let prev = this.children?.[0];
    for (let i = 1; i < this.children.length; i++) {
      if (this.children[i].start < prev.end) {
        throw new Error('error parser');
      }
    }
  }

  protected abstract generatingStrFromChildThenSet(): void;

  public generateStrFromChildThenSet() {
    this.sortChildrenThenCheck();
    this.generatingStrFromChildThenSet();
    this.needReplace =
      this.needReplace || this.children.some((c) => c.needReplace);
    this.children?.forEach((c) => {
      c.clear();
    });
  }

  protected joinChildrenAsParameter(
    startSkip: number,
    endSkip: number,
    handler: (str: string, c: ReplaceContext) => string = (str) => str
  ): { str: string; keyMapValue: Record<string, string> } {
    const valueMapKey: Record<string, string> = {};
    const keyMapValue: Record<string, string> = {};

    const str = this.joinChildren(
      startSkip,
      endSkip,
      (str: string, c: ReplaceContext) => {
        str = handler(str, c);
        if (!valueMapKey[str]) {
          const key = 'v' + (Object.keys(valueMapKey).length + 1);

          valueMapKey[str] = key;
          keyMapValue[key] = str;
        }

        return '{' + valueMapKey[str] + '}';
      }
    );

    return { str, keyMapValue };
  }

  protected joinChildren(
    startSkip: number,
    endSkip: number,
    strHandler: (str: string, c: ReplaceContext) => string = (str) => str
  ): string {
    let str = '';
    let start = this.start + startSkip;
    this.children.forEach((c) => {
      str += this.replacer.file.slice(start, c.start);
      str += strHandler(c.replacedText, c);
      start = c.end;
    });
    str += this.replacer.file.slice(start, this.end - endSkip);
    return str;
  }

  public clear() {
    (this.node as any) = null;
    this.parent = undefined;
    this.replacedText = '';
    this.children = [];
  }

  public generateNewText(): string {
    if (this.node) {
      forEachChild(this.node, (n) => this.replacer.traverse(n, this));
    }

    this.generateStrFromChildThenSet();

    return this.replacedText;
  }
}
