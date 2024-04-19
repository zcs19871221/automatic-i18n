import * as path from 'path';
import { runAndExpect } from '../helper';
import { HookI18nFormatter } from '../../src/formatter';

it('hook edge case', async () => {
  runAndExpect(path.basename(__dirname), {
    I18nFormatter: HookI18nFormatter,
  });
});
