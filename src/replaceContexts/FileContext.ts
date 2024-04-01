import { Node } from 'typescript';

import { ReplaceContext } from './ReplaceContext';
import { BundleReplacer } from '../BundleReplacer';
export class FileContext extends ReplaceContext {
  public readonly file: string;
  public readonly fileLocate: string;
  public readonly bundleReplacer: BundleReplacer;
  public hasImportedI18nModules: boolean = false;

  constructor({
    node,
    file,
    fileLocate,
    bundleReplacer,
  }: {
    node: Node;
    file: string;
    fileLocate: string;
    bundleReplacer: BundleReplacer;
  }) {
    super({
      node,
      start: 0,
      end: file.length,
    });
    this.file = file;
    this.fileLocate = fileLocate;
    this.bundleReplacer = bundleReplacer;
  }

  protected override generatingStrFromChildThenSet(): void {
    this.children = this.children.filter((c) => c.needReplace);
    if (this.children.length === 0) {
      this.replacedText = '';
      return;
    }

    this.replacedText = this.joinChildren(0, 0);
  }
}
