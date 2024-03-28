import { Context } from './Context';

export class RootContext extends Context {
  protected override generatingStrFromChildThenSet(): void {
    this.children = this.children.filter((c) => c.needReplace);
    if (this.children.length === 0) {
      this.str = '';
      return;
    }

    this.str = this.joinChildren(0, 0);
  }
}
