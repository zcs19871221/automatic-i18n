import * as path from 'path';
import { runAndExpect } from '../helper';
import { HookI18nFormatter } from '../../src/formatter';

it('extract english successfully', async () => {
  runAndExpect(path.basename(__dirname), {
    I18nFormatter: HookI18nFormatter,
    localesToGenerate: ['zh-cn'],
    localeToReplace: 'en-us',
  });
});
