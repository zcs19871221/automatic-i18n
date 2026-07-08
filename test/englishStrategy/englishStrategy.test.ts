import * as path from 'path';
import * as fs from 'fs-extra';
import ts, { Node } from 'typescript';
import I18nReplacer from '../../src';
import { EnglishStrategy } from '../../src/types';
import { doEqual } from '../helper';
import { Info } from '../../src/ReplaceContext';

const baseDir = __dirname;
const fixtureFile = path.join(baseDir, 'template.tsx');

// Each strategy has its own expect folder under test/englishStrategy/expect.
// If extraction behavior changes intentionally, regenerate dist and sync the
// corresponding expect files to keep the snapshot-style comparison meaningful.

async function runWithStrategy(englishStrategy: EnglishStrategy) {
  const outDir = path.join(baseDir, 'dist', englishStrategy);
  const localeDir = path.join(outDir, 'i18n');

  fs.removeSync(outDir);
  fs.ensureDirSync(outDir);

  await I18nReplacer.createI18nReplacer({
    targets: [fixtureFile],
    distLocaleDir: localeDir,
    outputToNewDir: outDir,
    localeToReplace: 'en-us',
    localesToGenerate: ['en-us', 'zh-cn'],
    englishStrategy,
    global: false,
    uniqIntlKey: true,
  }).replace();

  return outDir;
}

function createInfo(i18nReplacer: I18nReplacer, file: string): Info {
  return {
    file,
    fileName: 'inline.tsx',
    i18nReplacer,
    imports: new Set(),
    requiredImports: {},
    commentRange: { ignore: [], collect: [] },
    globalContext: [],
  };
}

function findStringNode(
  file: string,
  matcher: (node: Node) => boolean
): { node: Node; source: ts.SourceFile } {
  const source = ts.createSourceFile(
    'inline.tsx',
    file,
    ts.ScriptTarget.ESNext,
    true
  );
  let found: Node | null = null;
  const walk = (node: Node) => {
    if (!found && matcher(node)) {
      found = node;
      return;
    }
    ts.forEachChild(node, walk);
  };
  walk(source);
  if (!found) {
    throw new Error('expected node not found');
  }
  return { node: found, source };
}

describe('englishStrategy', () => {
  it('comment-only output should match expect files', async () => {
    await runWithStrategy('comment-only');
    doEqual(path.join(baseDir, 'expect', 'comment-only'));
  });

  it('balanced output should match expect files', async () => {
    await runWithStrategy('balanced');
    doEqual(path.join(baseDir, 'expect', 'balanced'));
  });

  it('aggressive output should match expect files', async () => {
    await runWithStrategy('aggressive');
    doEqual(path.join(baseDir, 'expect', 'aggressive'));
  });

  it('blacklist should block import path, object key, element access key and technical jsx attrs', () => {
    const i18nReplacer = I18nReplacer.createI18nReplacer({
      targets: [fixtureFile],
      distLocaleDir: path.join(baseDir, 'dist', 'blacklist', 'i18n'),
      localeToReplace: 'en-us',
      englishStrategy: 'aggressive',
    });

    const importFile = `import a from 'module-name';`;
    const importMatch = findStringNode(
      importFile,
      (node) => node.kind === ts.SyntaxKind.StringLiteral
    );
    expect(
      i18nReplacer.shouldExtractLocaleNode({
        node: importMatch.node,
        text: importMatch.node.getText(importMatch.source),
        info: createInfo(i18nReplacer, importFile),
        channel: 'string-like',
      })
    ).toBe(false);

    const keyFile = `const x = {'title': 1};`;
    const keyMatch = findStringNode(
      keyFile,
      (node) => node.getText() === `'title'`
    );
    expect(
      i18nReplacer.shouldExtractLocaleNode({
        node: keyMatch.node,
        text: keyMatch.node.getText(keyMatch.source),
        info: createInfo(i18nReplacer, keyFile),
        channel: 'string-like',
      })
    ).toBe(false);

    const elementAccessFile = `const k = map['name'];`;
    const elementAccessMatch = findStringNode(
      elementAccessFile,
      (node) => node.getText() === `'name'`
    );
    expect(
      i18nReplacer.shouldExtractLocaleNode({
        node: elementAccessMatch.node,
        text: elementAccessMatch.node.getText(elementAccessMatch.source),
        info: createInfo(i18nReplacer, elementAccessFile),
        channel: 'string-like',
      })
    ).toBe(false);

    const jsxAttrFile = `const a = <div className="hello" />;`;
    const jsxAttrMatch = findStringNode(
      jsxAttrFile,
      (node) => node.getText() === `"hello"`
    );
    expect(
      i18nReplacer.shouldExtractLocaleNode({
        node: jsxAttrMatch.node,
        text: jsxAttrMatch.node.getText(jsxAttrMatch.source),
        info: createInfo(i18nReplacer, jsxAttrFile),
        channel: 'string-like',
      })
    ).toBe(false);
  });
});
