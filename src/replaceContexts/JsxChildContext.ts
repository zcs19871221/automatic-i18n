import { FileContext } from './FileContext';
import { ReplaceContext } from './ReplaceContext';

export class JsxChildContext extends ReplaceContext {
  constructor(
    fileContext: FileContext,
    start: number,
    end: number,
    children: ReplaceContext[]
  ) {
    super({ fileContext, start, end });
    this.children = children;
  }

  protected override generatingStrFromChildThenSet() {
    const { str, keyMapValue } = this.joinChildrenAsParameter(0, 0, (str) => {
      if (str.startsWith('{') && str.endsWith('}')) {
        return str.slice(1, str.length - 1);
      }
      return str;
    });

    if (!this.fileContext.bundleReplacer.includesTargetLocale(str)) {
      this.replacedText = this.joinChildren(0, 0);
      return;
    }

    this.needReplace = true;
    const newStr = str.replace(
      /(^[\s\n]+)|([\s\n]+$)/g,
      (_match, start, end) => {
        if (start) {
          this.start += _match.length;
        } else {
          this.end -= _match.length;
        }
        return '';
      }
    );

    const intlId = this.fileContext.bundleReplacer.getOrCreateIntlId(newStr);
    this.replacedText =
      '{' +
      this.fileContext.bundleReplacer.createIntlExpressionFromIntlId(
        intlId,
        keyMapValue
      ) +
      '}';
  }
}
