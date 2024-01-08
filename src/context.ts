import ts from 'typescript';
import { FileReplacer } from './FileReplacer';

export abstract class Context {
  public childs: Context[] = [];
  public newStr: string = '';
  public needReplace = false;

  constructor(
    public replacer: FileReplacer,
    public start: number,
    public end: number,
    public parent?: Context
  ) {
    parent?.childs.push(this);
  }

  private sortChildThenCheck() {
    this.childs.sort((a, b) => a.start - b.start);
    let prev = this.childs?.[0];
    for (let i = 1; i < this.childs.length; i++) {
      if (this.childs[i].start <= prev.end) {
        throw new Error('error parser');
      }
    }
  }

  protected abstract generatingStrFromChildThenSet(node?: ts.Node): void;

  public generateStrFromChildThenSet(node?: ts.Node): void {
    this.sortChildThenCheck();
    this.generatingStrFromChildThenSet(node);
    this.needReplace =
      this.needReplace || this.childs.some((c) => c.needReplace);
    this.childs?.forEach((c) => {
      c.newStr = '';
    });
    this.childs = [];
  }

  public static handle(
    _node: ts.Node,
    _parent: Context,
    _replacer: FileReplacer
  ) {}

  protected concatVariable(startSkip: number, endSkip: number): string {
    return this.concat(startSkip, endSkip);
  }

  protected concatBlock(
    startSkip: number,
    endSkip: number
  ): { str: string; keyMapValue: Record<string, string> } {
    const valueMapKey: Record<string, string> = {};
    const keyMapValue: Record<string, string> = {};

    const str = this.concat(startSkip, endSkip, (str) => {
      if (!valueMapKey[str]) {
        const key = 'v' + (Object.keys(valueMapKey).length + 1);
        valueMapKey[str] = key;
        keyMapValue[key] = str;
      }

      return '{' + valueMapKey[str] + '}';
    });

    return { str, keyMapValue };
  }

  protected concat(
    startSkip: number,
    endSkip: number,
    strHandler: (str: string) => string = (str) => str
  ) {
    let str = '';
    let start = this.start + startSkip;
    this.childs.forEach((c) => {
      str += this.replacer.file.slice(start, c.start);
      str += strHandler(c.newStr);
      start = c.end;
    });
    str += this.replacer.file.slice(start, this.end - endSkip);
    return str;
  }
}
