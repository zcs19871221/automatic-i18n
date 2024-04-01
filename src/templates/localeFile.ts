export const renderLocaleFile = (keyMapValue: Record<string, string>) => {
  return `
/*
  * This file will be changed by automatic program.
  * You can only change variable's property and value.
 */
import { TranslateKey } from './types.ts';

const locale: Record<TranslateKey, string> = {
  ${Object.keys(keyMapValue)
    .map((key) => {
      if (key.includes('-')) {
        key = `'"' + key + '"'`;
      }
      let quote = "'";
      if (keyMapValue[key].includes("'")) {
        quote = '"';
      }
      return `${key}: ${quote}${keyMapValue[key]}${quote}`;
    })
    .join(',\n')}
};
`;
};
