import { BundleReplacer } from './BundleReplacer';
import { Opt } from './types';

export class LocaleReplacer {
  public static replace(opt: Opt) {
    if (!opt.locales.includes(opt.defaultLocale)) {
      opt.locales.push(opt.defaultLocale);
    }
    const replaceBundle = new BundleReplacer(opt);
    return replaceBundle.replace();
  }
}
