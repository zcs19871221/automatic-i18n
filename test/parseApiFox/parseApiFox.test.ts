jest.setTimeout(20000);

import path from 'path';
import * as fs from 'fs-extra';
import parseApiFox from '../../src/parseApiFox';

const uiDist = path.join(process.cwd(), '../eh-ui/api');
const bffDist = path.join(process.cwd(), '../eh-bff/api/general');
const extraOptionsForGeneration = {
  uiDist,
  bffDist,
};
if (fs.existsSync(extraOptionsForGeneration.uiDist)) {
  fs.removeSync(extraOptionsForGeneration.uiDist);
}

it('should create file from apiFox url successful', async () => {
  await parseApiFox({
    url: [
      'https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3485315',
      'https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3485315',
      'https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3485317',
      'https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3485316',
      'https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3485318',
      'https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3482571',
      'https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3477847',
      'https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3477954',
    ],
    extraOptionsForGeneration,
  });

  const expectDir = path.join(process.cwd(), 'test/parseApiFox/expect');
  fs.readdirSync(expectDir).forEach((fileOrDirName) => {
    const fileName = path.join(expectDir, fileOrDirName);
    const target = fs.readFileSync(
      path.join(
        ['restful.ts', 'dataSource.ts'].includes(fileOrDirName)
          ? bffDist
          : uiDist,
        fileOrDirName
      ),
      'utf-8'
    );
    expect(fs.readFileSync(fileName, 'utf-8')).toEqual(target);
  });
});
