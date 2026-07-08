jest.mock('../../src/resolveMergeConflict', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import resolveMergeConflict from '../../src/resolveMergeConflict';
import { cli } from '../../src/cli';

it('test merge command failure with non-error value', async () => {
  const mockedMerge = resolveMergeConflict as jest.MockedFunction<
    typeof resolveMergeConflict
  >;
  mockedMerge.mockRejectedValueOnce('boom-string');

  const errorSpy = jest.spyOn(console, 'error').mockImplementation();
  jest.replaceProperty(process, 'argv', [
    ...process.argv.slice(0, 2),
    'merge',
    'dist-dir',
    'out-dir',
  ]);
  process.exitCode = undefined;

  await cli();

  expect(errorSpy).toHaveBeenCalledWith('[merge] failed: boom-string');
  expect(process.exitCode).toBe(1);

  errorSpy.mockRestore();
});
