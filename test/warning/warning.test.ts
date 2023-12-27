import { runAndExpect } from '../helper';

const originWarn = console.warn;

it('should show warnings text correctly', () => {
  let warnText = '';
  console.warn = (text) => {
    warnText += text;
  };

  runAndExpect('warning');
  expect(warnText).toMatch(`【'发'】`);
  expect(warnText).toMatch(`【'好'】`);
  expect(warnText).toMatch(`【'你'】`);
  expect(warnText).toMatch(`【'大'】`);
  expect(warnText).not.toMatch(`【今天】'】`);
  expect(warnText).not.toMatch(`【他】'】`);
  expect(warnText).not.toMatch(`【忽略】'】`);
  expect(warnText).toMatch(`【最近7天】`);
  expect(warnText).toMatch(`【最近30天】`);

  console.warn = originWarn;
});
