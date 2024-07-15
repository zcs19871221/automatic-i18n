#!/usr/bin/env node
import I18nReplacer from '..';
import { createCli } from './create';

const program = createCli();

I18nReplacer.createI18nReplacer(program.opts())
  .replace()
  .catch((err) => {
    console.error(err);
  });
