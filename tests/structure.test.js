const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

test('Code Structure & DEV_RULES Compliance Unit Tests', async (t) => {
  const rootDir = path.join(__dirname, '..');

  await t.test('verifies src/enums/ directory contains single-definition files and barrel index.ts', () => {
    const enumsDir = path.join(rootDir, 'src', 'enums');
    assert.equal(fs.existsSync(enumsDir), true);

    const files = fs.readdirSync(enumsDir);
    assert.equal(files.includes('index.ts'), true);
    assert.equal(files.includes('NeedStatusEnum.ts'), true);
    assert.equal(files.includes('ModelTypeEnum.ts'), true);
  });

  await t.test('verifies src/types/ directory contains single-definition files and barrel index.ts', () => {
    const typesDir = path.join(rootDir, 'src', 'types');
    assert.equal(fs.existsSync(typesDir), true);

    const files = fs.readdirSync(typesDir);
    assert.equal(files.includes('index.ts'), true);
    assert.equal(files.includes('NeedStatus.ts'), true);
    assert.equal(files.includes('ModelType.ts'), true);
  });

  await t.test('verifies src/interfaces/ directory contains single-definition files and barrel index.ts', () => {
    const interfacesDir = path.join(rootDir, 'src', 'interfaces');
    assert.equal(fs.existsSync(interfacesDir), true);

    const files = fs.readdirSync(interfacesDir);
    assert.equal(files.includes('index.ts'), true);
    assert.equal(files.includes('Need.ts'), true);
    assert.equal(files.includes('Offer.ts'), true);
  });
});
