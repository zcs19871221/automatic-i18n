import * as fs from 'fs-extra';
import path from 'path';
import { GenerateApiTsFileOptions } from './types';
import generateUiApiTsFile from './generateUIApiTsFile';
import I18nReplacer, { resolvePrettierConfig } from '..';

const cwd = process.cwd();
export default async function generateApiFile(
  params: GenerateApiTsFileOptions
) {
  const { extraOptionsForGeneration } = params;
  const uiDist = extraOptionsForGeneration?.uiDist ?? path.join(cwd, 'api');
  const uiApiFile = generateUiApiTsFile(params);
  // const bffApiFile = generateBffApiFile(params);
  fs.ensureDirSync(uiDist);
  const prettierOptions = await resolvePrettierConfig(uiDist);
  await I18nReplacer.formatAndWrite(
    path.join(uiDist, params.request.name + '.ts'),
    '// ' + params.url + '\n' + uiApiFile,
    prettierOptions
  );
}
