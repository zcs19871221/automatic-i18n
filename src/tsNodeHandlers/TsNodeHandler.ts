import { Node } from 'typescript';
import { Context } from '../Context';
import { FileReplacer } from '../FileReplacer';

export interface TsNodeHandler {
  match(node: Node, replacer: FileReplacer, parentContext?: Context): boolean;
  handle(node: Node, replacer: FileReplacer, parentContext?: Context): void;
}
