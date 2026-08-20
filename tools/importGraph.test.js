'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { readFileSync } = require('node:fs');

// Guard: no module under apps/ may reach for a dynamic import specifier that
// escapes the app boundary. The regex must catch ALL THREE specifier shapes --
// a plain string, a template literal, and a variable -- because narrowing it to
// only the first silently drops two thirds of the coverage while every test
// still passes.
const DYNAMIC_IMPORT = /import\s*\(\s*(?:'[^']*'|"[^"]*"|`[^`]*`|[A-Za-z_$][\w$]*)\s*\)/g;

function findDynamicImports(source) {
  return source.match(DYNAMIC_IMPORT) || [];
}

test('detects a plain string specifier', () => {
  assert.strictEqual(findDynamicImports("import('./a.js')").length, 1);
});

test('detects a TEMPLATE LITERAL specifier', () => {
  assert.strictEqual(findDynamicImports('import(`./' + '${n}' + '.js`)').length, 1);
});

test('detects a VARIABLE specifier', () => {
  assert.strictEqual(findDynamicImports('import(spec)').length, 1);
});

module.exports = { DYNAMIC_IMPORT, findDynamicImports };
