import * as path from 'path';
import { runAndExpect } from '../helper';
import { DefaultI18nFormatter } from '../../src/formatter';

it('hook edge case', async () => {
  await runAndExpect({
    dirName: path.basename(__dirname),
    opt: {
      I18nFormatterClass: DefaultI18nFormatter,
    },
  });
});
