import { NodeHandler, Opt } from './Context';

export class RootContext extends NodeHandler {
  public hasImportedI18nModules: boolean = false;

  protected override generatingStrFromChildThenSet(): void {
    this.childs = this.childs.filter((c) => c.needReplace);
    if (!this.needReplace || this.childs.length === 0) {
      this.str = '';
      return;
    }

    if (!this.hasImportedI18nModules) {
      const tsNocheckMatched = this.str.match(
        /(\n|^)\/\/\s*@ts-nocheck[^\n]*\n/
      );
      const insertIndex =
        tsNocheckMatched === null
          ? 0
          : (tsNocheckMatched.index ?? 0) + tsNocheckMatched[0].length;
      this.str =
        this.str.slice(0, insertIndex) +
        this.replacer.bundleReplacer.createImportStatement() +
        this.str.slice(insertIndex);
    }

    this.str = this.joinChildsToString(0, 0);
  }

  public static override of(opt: Opt): RootContext {
    return new RootContext({
      ...opt,
      start: 0,
      end: opt.node.getEnd(),
    });
  }
}
