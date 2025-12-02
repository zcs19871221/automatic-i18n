import * as fs from 'fs-extra';
import path from 'path';
import { GenerateApiTsFileOptions } from './types';
import generateUiApiTsFile from './generateUIApiTsFile';

const cwd = process.cwd();
export default function generateApiFile(params: GenerateApiTsFileOptions) {
  const { extraOptionsForGeneration } = params;
  const uiDist = extraOptionsForGeneration?.uiDist ?? path.join(cwd, 'api');
  const uiApiFile = generateUiApiTsFile(params);
  // const bffApiFile = generateBffApiFile(params);
  fs.ensureDirSync(uiDist);
  fs.writeFileSync(path.join(uiDist, params.request.name + '.ts'), uiApiFile);
}
