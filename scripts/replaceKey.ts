// import * as fs from 'fs-extra';
// import * as path from 'path';
// import * as prettier from 'prettier';
// import { I18nReplacer } from '../src';
// import ts from 'typescript';
// import { renderLocaleFile } from '../src/static-template/localeFile';

// const replaceKey = (dirs: string[], mapping: Record<string, string>) => {
//   dirs.forEach((dir) => {
//     fs.readdirSync(dir).forEach((dirName) => {
//       const fileOrDir = path.join(dir, dirName);
//       if (
//         dirName.startsWith('.') ||
//         (dirName.includes('.') && !dirName.match(/[t|j]sx?/))
//       ) {
//         return;
//       }
//       if (fs.lstatSync(fileOrDir).isDirectory()) {
//         replaceKey([fileOrDir], mapping);
//         return;
//       }
//       fs.writeFileSync(
//         fileOrDir,
//         fs
//           .readFileSync(fileOrDir, 'utf-8')
//           .replace(/id:\s*'(key\d+)'/g, (_matched, key) => {
//             if (mapping[key]) {
//               return `id: '${mapping[key]}'`;
//             }

//             return _matched;
//           })
//       );
//     });
//   });
// };

// export const englishMessgeToVariableName = (text: string) => {
//   text = text.trim();
//   text = text
//     .replace(
//       /(?:[^a-z\d]+)([a-z\d])/gi,
//       (_matched: string, firstLetter: string) => {
//         return firstLetter.toUpperCase();
//       }
//     )
//     .replace(/\{[(^}+)]\}/g, (_matched: string, variableName: string) => {
//       return 'V' + variableName;
//     })
//     .replace(/[^a-z\d]/gi, '');
//   if (text.match(/^\d/)) {
//     text = '_' + text;
//   }
//   if (text.length > 30) {
//     text = text.slice(0, 30) + '_';
//   }
//   return text;
// };

// const main = () => {
//   const en = path.join(process.cwd(), '/i18n/en-us.ts');
//   const zh = path.join(process.cwd(), '/i18n/zh-cn.ts');
//   const enMapping: Record<string, string> = I18nReplacer.parseLocaleTsFile(
//     en,
//     ts.ScriptTarget.ESNext
//   );
//   const zhMapping: Record<string, string> = I18nReplacer.parseLocaleTsFile(
//     zh,
//     ts.ScriptTarget.ESNext
//   );
//   const mapping: Record<string, string> = {};

//   const variableNames = new Set(
//     Object.keys(enMapping).filter((key) => !key.match(/key\d+/))
//   );

//   Object.keys(enMapping).forEach((key) => {
//     if (key.match(/key\d+/)) {
//       const value = enMapping[key];
//       if (value.match(/[\u4e00-\u9fa5]/) || !value.match(/[a-z]/i)) {
//         return;
//       }

//       const variableName = englishMessgeToVariableName(value);
//       let i = 1;
//       let name = variableName;
//       while (variableNames.has(name)) {
//         name = variableName + '_' + i++;
//       }
//       variableNames.add(name);
//       mapping[key] = name;

//       enMapping[name] = enMapping[key];
//       delete enMapping[key];

//       zhMapping[name] = zhMapping[key];
//       delete zhMapping[key];
//     }
//   });

//   const enFinal: any = {};
//   const zhFinal: any = {};

//   Object.keys(enMapping)
//     .sort()
//     .forEach((key) => {
//       enFinal[key] = enMapping[key];
//       zhFinal[key] = zhMapping[key];
//     });
//   fs.writeFileSync(
//     en,
//     prettier.format(renderLocaleFile('en-us', enFinal, 'zh-cn'), {
//       singleQuote: true, // 使用单引号代替双引号
//       trailingComma: 'es5',
//     })
//   );
//   fs.writeFileSync(
//     zh,
//     prettier.format(renderLocaleFile('zh-cn', zhFinal, 'zh-cn'), {
//       singleQuote: true, // 使用单引号代替双引号
//       trailingComma: 'es5',
//     })
//   );
//   replaceKey(
//     [
//       path.join(process.cwd(), 'components'),
//       path.join(process.cwd(), 'pages'),
//       path.join(process.cwd(), 'components'),
//       path.join(process.cwd(), 'middleware'),
//       path.join(process.cwd(), 'utils'),
//       path.join(process.cwd(), 'modules'),
//     ],
//     mapping
//   );
// };

// try {
//   main();
// } catch (error) {
//   console.error(error);
// }
