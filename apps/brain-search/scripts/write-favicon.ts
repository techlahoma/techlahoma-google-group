#!/usr/bin/env bun
/** Write public/favicon.svg from faviconSvg('g'). The PNG fallback is made with rsvg-convert. */
import {writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {faviconSvg} from '../src/lib/brand';

const out = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'favicon.svg',
);
writeFileSync(out, `${faviconSvg('g')}\n`);
console.log(`Wrote ${out}`);
