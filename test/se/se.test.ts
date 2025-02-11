import * as path from 'path';
import { runAndExpect } from '../helper';
import SeI18nFormatter from '../../src/formatter/SeI18nFormatter';

it('should render se template successful', async () => {
  await runAndExpect({
    dirName: path.basename(__dirname),
    opt: {
      I18nFormatter: SeI18nFormatter,
    },
  });
});
