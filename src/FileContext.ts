import { Context } from './Context';

export class FileContext extends Context {
  protected override generatingStrFromChildThenSet(): void {
    this.children = this.children.filter((c) => c.needReplace);
    if (this.children.length === 0) {
      this.replacedText = '';
      return;
    }

    this.replacedText = this.joinChildren(0, 0);
  }
}
