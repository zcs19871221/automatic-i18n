import { FormateMessageIdHandler } from './FormateMessageIdHandler';
import { IdentifierHandler } from './IdentifierHandler';
import { ImportHandler } from './ImportHandler';
import { JsxExpressionHandler } from './JsxExpressionHandler';
import { JsxTagHandler } from './JsxTagHandler';
import { JsxTextHandler } from './JsxTextHandler';
import { SourceFileHandler } from './SourceFileHandler';
import { StringLikeNodesHandler } from './StringLikeNodesHandler';
import { TemplateExpressionHandler } from './TemplateHandler';
import { TemplateSpanHandler } from './TemplateSpanHandler';
import type { TsNodeHandler } from './TsNodeHandler';

const tsNodeHandlers: TsNodeHandler[] = [
  new StringLikeNodesHandler(),
  new TemplateExpressionHandler(),
  new TemplateSpanHandler(),
  new ImportHandler(),
  new IdentifierHandler(),
  new FormateMessageIdHandler(),
  new JsxTagHandler(),
  new JsxTextHandler(),
  new JsxExpressionHandler(),
  new SourceFileHandler(),
];
export default tsNodeHandlers;

export type { TsNodeHandler };
