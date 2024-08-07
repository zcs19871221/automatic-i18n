import { IdentifierHandler } from './IdentifierHandler';
import { ImportHandler } from './ImportHandler';
import { JsxExpressionHandler } from './JsxExpressionHandler';
import { JsxTagHandler } from './JsxTagHandler';
import { JsxTextHandler } from './JsxTextHandler';
import { StringLikeNodesHandler } from './StringLikeNodesHandler';
import { TemplateExpressionHandler } from './TemplateHandler';
import type { TsNodeHandler } from './TsNodeHandler';

const tsNodeHandlers: TsNodeHandler[] = [
  new StringLikeNodesHandler(),
  new TemplateExpressionHandler(),
  new ImportHandler(),
  new IdentifierHandler(),
  new JsxTagHandler(),
  new JsxTextHandler(),
  new JsxExpressionHandler(),
];
export default tsNodeHandlers;

export type { TsNodeHandler };
