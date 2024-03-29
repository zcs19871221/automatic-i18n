import { IdentifierHandler } from './IdentifierHandler';
import { ImportHandler } from './ImportHandler';
import { JsxExpressionHandler } from './JsxExpressionHandler';
import { JsxTagHandler } from './JsxTagHandler';
import { StringLikeNodesHandler } from './StringLikeNodesHandler';
import { TemplateExpressionHandler } from './TemplateHandler';
import { TemplateSpanHandler } from './TemplateSpanHandler';
import type { TsNodeHandler } from './TsNodeHandler';

const tsNodeHandlers: TsNodeHandler[] = [
  new StringLikeNodesHandler(),
  new TemplateSpanHandler(),
  new TemplateExpressionHandler(),
  new ImportHandler(),
  new IdentifierHandler(),
  new JsxTagHandler(),
  new JsxExpressionHandler(),
];
export default tsNodeHandlers;

export type { TsNodeHandler };
