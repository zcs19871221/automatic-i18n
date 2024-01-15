import { FileReplacer } from './FileReplacer';
import { NodeHandler, Opt } from './Context';

export class Template extends NodeHandler {
  public static override of(opt: Opt) {
    return new Template({
      ...opt,
      start: opt.node.getStart(),
      end: opt.node.getEnd(),
    });
  }

  protected override generatingStrFromChildThenSet() {
    const { keyMapValue, str } = this.joinChildsAsParamter(
      '`'.length,
      '`'.length
    );
    if (!this.replacer.includesTargetLocale(str)) {
      this.str = this.joinChildsToString(
        0,
        0,
        (str: string) =>
          TemplateExpression.startSymbol + str + TemplateExpression.endSymbol
      );
      return;
    }
    this.needReplace = true;
    const textKey = this.replacer.bundleReplacer.getOrCreateIntlId(str);
    this.str = FileReplacer.localeMapToken(textKey, keyMapValue);
  }
}

export class TemplateExpression extends NodeHandler {
  protected override generatingStrFromChildThenSet() {
    this.str = this.joinChildsToString(
      TemplateExpression.startSymbol.length,
      TemplateExpression.endSymbol.length
    );
  }

  public static override of(opt: Opt) {
    const first = opt.node.getChildren()[0];

    const start = opt.replacer.file.lastIndexOf(
      this.startSymbol,
      opt.node.getStart()
    );
    const end =
      opt.replacer.file.indexOf(this.endSymbol, first.getEnd()) +
      this.endSymbol.length;

    return new TemplateExpression({ ...opt, start, end });
  }

  public static readonly startSymbol: string = '${';
  public static readonly endSymbol: string = '}';
}
