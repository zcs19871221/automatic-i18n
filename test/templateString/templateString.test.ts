import * as path from 'path';
import { runAndExpect } from '../helper';

it('should extract successful', async () => {
  runAndExpect(path.basename(__dirname));
});
