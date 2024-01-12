import { FileReplacer } from './FileReplacer';
import { NodeHandler, Opt } from './context';

export class Template extends NodeHandler {
  public static override of(opt: Opt) {
    return new Template({
      ...opt,
      start: opt.node.getStart(),
      end: opt.node.getEnd(),
    });
  }

  protected override generatingStrFromChildThenSet() {
    const { keyMapValue, str } = this.concatBlock('`'.length, '`'.length);
    if (!this.replacer.includesTargetLocale(str)) {
      this.newStr = this.joinChilds(0, 0, (str: string) => '${' + str + '}');
      return;
    }
    this.needReplace = true;
    const textKey =
      this.replacer.bundleReplacer.getOrSetLocaleTextKeyIfAbsence(str);
    this.newStr = FileReplacer.localeMapToken(textKey, keyMapValue);
  }
}

export class TemplateExpression extends NodeHandler {
  protected override generatingStrFromChildThenSet() {
    this.newStr = this.joinChilds('${'.length, '}'.length);
  }

  public static override of(opt: Opt) {
    const first = opt.node.getChildren()[0];
    const startSymbol = '${';
    const endSymbol = '}';
    const start = opt.replacer.file.lastIndexOf(
      startSymbol,
      opt.node.getStart()
    );
    const end =
      opt.replacer.file.indexOf(endSymbol, first.getEnd()) + endSymbol.length;

    return new TemplateExpression({ ...opt, start, end });
  }
}
