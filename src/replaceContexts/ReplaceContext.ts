import { Node, forEachChild } from 'typescript';
import tsNodeHandlers from '../tsNodeHandlers';
import { FileContext } from './FileContext';

export interface Opt {
  node: Node;
  parent?: ReplaceContext;
  fileContext: FileContext;
}

export abstract class ReplaceContext {
  protected children: ReplaceContext[] = [];
  public replacedText: string = '';
  public needReplace = false;
  protected node?: Node;
  protected fileContext: FileContext;
  public parent?: ReplaceContext;
  public start: number;
  public end: number;

  constructor({
    node,
    start,
    end,
    fileContext,
    parent,
  }: {
    start: number;
    end: number;
    node?: Node;
    parent?: ReplaceContext;
    fileContext?: FileContext;
  }) {
    this.node = node;
    if (fileContext) {
      this.fileContext = fileContext;
    } else if (this instanceof FileContext) {
      this.fileContext = this;
    } else {
      throw new Error('fileContest should not be null');
    }
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

  public generateStrFromChildrenThenSet() {
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
      str += this.fileContext.file.slice(start, c.start);
      str += strHandler(c.replacedText, c);
      start = c.end;
    });
    str += this.fileContext.file.slice(start, this.end - endSkip);
    return str;
  }

  public clear() {
    (this.node as any) = null;
    this.parent = undefined;
    this.replacedText = '';
    this.children = [];
  }

  public handleChildren(node: Node, parentContext?: ReplaceContext) {
    forEachChild(node, (child) => {
      const targetHandler = tsNodeHandlers.filter((tsNodeHandler) =>
        tsNodeHandler.match(child, this.fileContext, parentContext)
      );
      if (targetHandler.length > 1) {
        throw new Error('matched more then 1 ');
      }
      const foundHandler = targetHandler[0];
      if (foundHandler) {
        foundHandler.handle(child, this.fileContext, parentContext);
        return;
      }
      this.handleChildren(child, parentContext);
    });
  }

  public generateNewText(): string {
    if (this.node) {
      this.handleChildren(this.node, this);
    }

    this.generateStrFromChildrenThenSet();

    return this.replacedText;
  }
}
