import { Node } from 'typescript';
import { ReplaceContext } from '../ReplaceContext/ReplaceContext';
import { FileReplacer } from '../FileReplacer';

export interface TsNodeHandler {
  match(
    node: Node,
    replacer: FileReplacer,
    parentContext?: ReplaceContext
  ): boolean;
  handle(
    node: Node,
    replacer: FileReplacer,
    parentContext?: ReplaceContext
  ): void;
}
