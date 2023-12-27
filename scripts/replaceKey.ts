import * as fs from 'fs-extra';
import * as path from 'path';

const replaceKey = (dirs: string[], mapping: Record<string, string>) => {
  dirs.forEach((dir) => {
    fs.readdirSync(dir).forEach((dirName) => {
      const fileOrDir = path.join(dir, dirName);
      if (fs.lstatSync(fileOrDir).isDirectory()) {
        replaceKey([fileOrDir], mapping);
        return;
      }
      fs.writeFileSync(
        fileOrDir,
        fs
          .readFileSync(fileOrDir, 'utf-8')
          .replace(/id: '(key\d+)'/g, (_matched, key) => {
            if (mapping[key]) {
              return `id: '${mapping[key]}'`;
            }

            return _matched;
          })
      );
    });
  });
};

export const englishMessgeToVariableName = (text: string) => {
  text = text.trim();
  return text
    .replace(
      /(?:(?:\s+)|(?:\n))([a-z\d])/gi,
      (_matched: string, firstLetter: string) => {
        return firstLetter.toUpperCase();
      }
    )
    .replace(/\{[(^}+)]\}/g, (_matched: string, variableName: string) => {
      return 'V' + variableName;
    })
    .replace(/[^a-z]/gi, '');
};

const main = () => {
  const en = 'C:/work/eh-ui/i18n/en-us.ts';
  const zh = 'C:/work/eh-ui/i18n/zh-cn.ts';
  let cnFile = fs.readFileSync(zh, 'utf-8');
  let enFile = fs.readFileSync(en, 'utf-8');
  const mapping: Record<string, string> = {};
  fs.writeFileSync(
    en,
    enFile.replace(
      /(key\d+): '([^']+)'/g,
      (_matched, key: string, english: string) => {
        if (!english || !english.trim() || english.match(/[\u4e00-\u9fa5]/)) {
          return _matched;
        }
        if (!english.match(/[a-z]/i)) {
          return _matched;
        }
        const variableName = englishMessgeToVariableName(english);
        cnFile = cnFile.replace(key, variableName);
        mapping[key] = variableName;
        return `${variableName}: '${english}'`;
      }
    )
  );
  fs.writeFileSync(zh, cnFile);
  replaceKey(
    [
      'C:\\work\\eh-ui\\components',
      'C:\\work\\eh-ui\\pages',
      'C:\\work\\eh-ui\\components',
      'C:\\work\\eh-ui\\middleware',
      'C:\\work\\eh-ui\\utils',
      'C:\\work\\eh-ui\\modules',
    ],
    mapping
  );
};

main();
