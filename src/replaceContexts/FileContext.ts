import { ReplaceContext } from './ReplaceContext';

export class FileContext extends ReplaceContext {
  protected override generatingStrFromChildThenSet(): void {
    this.children = this.children.filter((c) => c.needReplace);
    if (this.children.length === 0) {
      this.replacedText = '';
      return;
    }

    this.replacedText = this.joinChildren(0, 0);
  }
}
