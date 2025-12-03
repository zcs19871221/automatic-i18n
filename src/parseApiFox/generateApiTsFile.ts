import * as fs from 'fs-extra';
import path from 'path';
import { GenerateApiTsFileOptions } from './types';
import generateUiApiTsFile from './generateUIApiTsFile';
import I18nReplacer, { resolvePrettierConfig } from '..';
import generateBffApiFile from './generateBffApiFile';

const cwd = process.cwd();
export default async function generateApiFile(
  params: GenerateApiTsFileOptions
) {
  const { extraOptionsForGeneration } = params;
  const uiDist = extraOptionsForGeneration?.uiDist ?? path.join(cwd, 'api');
  const bffDist =
    extraOptionsForGeneration?.bffDist ??
    path.join(cwd, '../eh-bff/api/general');
  const uiApiFile = generateUiApiTsFile(params);
  const bffApiFiles = generateBffApiFile({ ...params, bffDist });

  fs.ensureDirSync(uiDist);
  const prettierOptions = await resolvePrettierConfig(uiDist);
  await I18nReplacer.formatAndWrite(
    path.join(uiDist, params.request.name + '.ts'),
    '// ' + params.url + '\n' + uiApiFile,
    prettierOptions
  );

  fs.ensureDir(bffDist);
  const prettierBffOptions = await resolvePrettierConfig(bffDist);
  await I18nReplacer.formatAndWrite(
    path.join(bffDist, 'restful.ts'),
    bffApiFiles.restful,
    prettierBffOptions
  );
  await I18nReplacer.formatAndWrite(
    path.join(bffDist, 'dataSource.ts'),
    bffApiFiles.dataSource,
    prettierBffOptions
  );
}
