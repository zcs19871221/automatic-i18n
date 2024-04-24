import * as path from 'path';
import * as fs from 'fs';
import { runAndExpect } from '../helper';

it('should not extract localeInType', async () => {
  runAndExpect({ dirName: path.basename(__dirname) });
  expect(fs.existsSync(path.join(__dirname, 'dist', 'template.tsx'))).toBe(
    false
  );
});
