import * as path from 'path';
import { runAndExpect } from '../helper';
import { HookI18nFormatter } from '../../src/formatter';

it('should use HookRender successful', async () => {
  runAndExpect(path.basename(__dirname), {
    I18nFormatter: HookI18nFormatter,
  });
});
