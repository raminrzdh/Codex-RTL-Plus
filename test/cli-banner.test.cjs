'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('CLI uses the compact Codex RTL Plus direction-track banner', () => {
    const cli = path.join(__dirname, '..', 'bin', 'index.js');
    const result = spawnSync(process.execPath, [cli, '--asar'], {
        encoding: 'utf8',
        env: Object.assign({}, process.env, { NO_COLOR: '1' })
    });
    const output = result.stdout + result.stderr;

    assert.strictEqual(result.status, 1, 'missing --asar value should exit with an error');
    assert.match(output, /CODEX RTL PLUS/);
    assert.match(output, /LTR\s+→\s+MIXED TEXT\s+←\s+RTL/);
    assert.match(output, /Persian · Arabic · Hebrew · code-safe/);
    assert.doesNotMatch(output, /RTL & UI Patcher/);
    assert.doesNotMatch(output, /▗▄▄|▐▌|▝▚/);
});
