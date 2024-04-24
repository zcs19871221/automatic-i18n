import * as path from 'path';
import { runAndExpect } from '../helper';

it('should extract jsx  successful', async () => {
  runAndExpect({ dirName: path.basename(__dirname) });
});
