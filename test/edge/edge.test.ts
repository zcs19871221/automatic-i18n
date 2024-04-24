import * as path from 'path';
import { runAndExpect } from '../helper';
import { HookI18nFormatter } from '../../src/formatter';

it('hook edge case', async () => {
  runAndExpect({
    dirName: path.basename(__dirname),
    opt: {
      I18nFormatter: HookI18nFormatter,
    },
  });
});
