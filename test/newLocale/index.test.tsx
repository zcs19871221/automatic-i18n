import path from 'path';
import * as fs from 'fs-extra';
import I18nReplacer from '../../src';

it('empty parameter should run successful', async () => {
  const dist = path.join(__dirname, './dist');
  process.cwd = jest.fn(() => dist);
  fs.emptyDirSync(dist);
  fs.copySync(path.join(__dirname, './src'), 'dist');
  await expect(
    I18nReplacer.createI18nReplacer().replace()
  ).resolves.not.toThrow();
});
