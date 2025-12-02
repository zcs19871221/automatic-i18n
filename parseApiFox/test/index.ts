import path from 'path';
import * as fs from 'fs-extra';
import parseApiFox from '..';

const extraOptionsForGeneration = {
  uiDist: path.join(__dirname, 'dist'),
};
if (fs.existsSync(extraOptionsForGeneration.uiDist)) {
  fs.removeSync(extraOptionsForGeneration.uiDist);
}

[
  'https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3485315',
  'https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3485317',
  'https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3485316',
  'https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3485318',
  'https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3482571',
  'https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3477847',
  'https://apifox.t.energymost.com/apidoc/docs-site/6000016/api-3477954',
].forEach((url) => {
  parseApiFox({
    url,
    extraOptionsForGeneration,
  });
});
