import { ImportDeclaration } from 'typescript';
import I18nReplacer from '.';

export interface CommentRange {
  ignore: [number, number][];
  collect: [number, number][];
}
export interface Info {
  file: string;
  fileName: string;
  i18nReplacer: I18nReplacer;
  imports: Set<ImportDeclaration>;
  requiredImports: {
    [module: string]: {
      moduleName: string;
      names: Set<string>;
    };
  };
  commentRange: CommentRange;
  globalContext: ReplaceContext[];
}
export class ReplaceContext {
  public children: ReplaceContext[] = [];
  public newText: string | null = null;
  public start: number;
  public end: number;
  public info: Info;

  constructor({
    start,
    end,
    info,
    newText,
  }: {
    start: number;
    end: number;
    info: Info;
    newText?: string;
  }) {
    this.start = start;
    this.end = end;
    this.info = info;
    if (newText !== undefined) {
      this.newText = newText;
    }
  }

  public sortAndCheckChildren() {
    this.children.sort((a, b) => a.start - b.start);
    let prev = this.children?.[0];
    for (let i = 1; i < this.children.length; i++) {
      if (this.children[i].start < prev.end) {
        // istanbul ignore next
        throw new Error('error parser');
      }
    }
  }

  public useChildrenCreateIntlVariableMessage(
    handler: (str: string) => string
  ): {
    str: string;
    keyMapValue: Record<string, string>;
  } {
    this.sortAndCheckChildren();

    const valueMapKey: Record<string, string> = {};
    const keyMapValue: Record<string, string> = {};

    const str = this.joinChildren((str: string) => {
      str = handler(str);
      if (!valueMapKey[str]) {
        const key = 'v' + (Object.keys(valueMapKey).length + 1);

        valueMapKey[str] = key;
        keyMapValue[key] = str;
      }

      return '{' + valueMapKey[str] + '}';
    });

    return { str, keyMapValue };
  }

  public joinChildren(handler: (str: string) => string = (str) => str): string {
    this.sortAndCheckChildren();
    let str = '';
    let start = this.start;
    this.children
      .filter((c) => c.newText !== null)
      .forEach((c) => {
        str += this.info.file.slice(start, c.start);
        str += handler(c.newText as string);
        start = c.end;
      });
    str += this.info.file.slice(start, this.end);
    this.children.forEach((n) => n.clear());
    return str;
  }

  public clear() {
    this.newText = '';
    this.children = [];
  }
}
