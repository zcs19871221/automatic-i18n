import path from 'path';
import I18nReplacer from '../../src';

jest.mock('prettier', () => ({
  ...jest.requireActual('prettier'),
  resolveConfig: () => ({
    singleQuote: true,
    tabWidth: 2,
    parser: 'typescript',
  }),
}));

it('empty parameter should run successful', async () => {
  process.cwd = jest.fn(() => path.join(__dirname, './dist'));

  await expect(
    I18nReplacer.createI18nReplacer().replace()
  ).resolves.not.toThrow();
});
