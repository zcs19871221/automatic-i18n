import { FileReplacer } from '../FileReplacer';
import { ReplaceContext } from './ReplaceContext';

export class JsxChildContext extends ReplaceContext {
  constructor(
    replacer: FileReplacer,
    start: number,
    end: number,
    children: ReplaceContext[]
  ) {
    super({ replacer, start, end });
    this.children = children;
  }

  protected override generatingStrFromChildThenSet() {
    const { str, keyMapValue } = this.joinChildrenAsParameter(0, 0, (str) => {
      if (str.startsWith('{') && str.endsWith('}')) {
        return str.slice(1, str.length - 1);
      }
      return str;
    });

    if (!this.replacer.includesTargetLocale(str)) {
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

    const intlId = this.replacer.getOrCreateIntlId(newStr);
    this.replacedText =
      '{' +
      this.replacer.createIntlExpressionFromIntlId(intlId, keyMapValue) +
      '}';
  }
}
