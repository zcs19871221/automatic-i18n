import { Context } from './Context';

export class RootContext extends Context {
  protected override generatingStrFromChildThenSet(): void {
    this.childs = this.childs.filter((c) => c.needReplace);
    if (this.childs.length === 0) {
      this.str = '';
      return;
    }

    this.str = this.joinChilds(0, 0);
  }
}
