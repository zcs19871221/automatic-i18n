#!/usr/bin/env node
import { cli } from '../src/cli';

cli().catch((err) => {
  console.error(err);
});
