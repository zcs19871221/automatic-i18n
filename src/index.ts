import { BundleReplacer } from './BundleReplacer';
import { Opt } from './types';

export class LocaleReplacer {
  public static replace(opt: Opt) {
    const replaceBundle = new BundleReplacer(opt);
    return replaceBundle.replace();
  }
}
