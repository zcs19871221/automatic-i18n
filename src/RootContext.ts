import { NodeHandler, Opt } from './Context';

export class RootContext extends NodeHandler {
  protected override generatingStrFromChildThenSet(): void {
    this.childs = this.childs.filter((c) => c.needReplace);

    this.newStr = this.joinChildsToString(0, 0);
  }

  public static override of(opt: Opt): RootContext {
    return new RootContext({
      ...opt,
      start: 0,
      end: opt.node.getEnd(),
    });
  }
}
