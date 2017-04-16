import regexEscape = require('escape-string-regexp');
import * as path from 'path';
import * as utils from './test-utils';
import { TestSuite } from './TestSuite';

export function normaliseOutput(contents: string): string {
    return normaliseString(contents)
        // We don't want a difference in the number of kilobytes to fail the build
        .replace(/[\d]+[.][\d]* kB/g, ' A-NUMBER-OF kB')
        // We also don't want a difference in the number of bytes to fail the build
        .replace(/ \d+ bytes /g, ' A-NUMBER-OF bytes ')
        // Sometimes "[built]" is written to output, and sometimes not. This should not fail the build
        .replace(/\s\[built\]/g, '')
        // Ignore whitespace between:     Asset     Size  Chunks             Chunk Names
        .replace(/\s+Asset\s+Size\s+Chunks\s+Chunk Names/, '    Asset     Size  Chunks             Chunk Names');
}

export function normaliseString(contents: string): string {
    return contents
        .replace(/\r\n/g, '\n')
        .replace(/\\r\\n/g, '\\n')
        // replace C:/source/ts-loader/index.js or /home/travis/build/TypeStrong/ts-loader/index.js with ts-loader
        .replace(/ \S+[\/|\\]ts-loader[\/|\\]index.js/, 'ts-loader')
        // replace (C:/source/ts-loader/dist/index.js with (ts-loader)
        .replace(/\(\S+[\/|\\]ts-loader[\/|\\]dist[\/|\\]index.js:\d*:\d*\)/, '(ts-loader)')
        // Convert '/' to '\' and back to '/' so slashes are treated the same
        // whether running / generated on windows or *nix
        .replace(new RegExp(regexEscape('/'), 'g'), '\\')
        .replace(new RegExp(regexEscape('\\'), 'g'), '/');
}

export function normaliseError(test: TestSuite, err: any): string {
    return err.toString()
        .replace(new RegExp(regexEscape(test.paths.staging + path.sep), 'g'), '')
        .replace(new RegExp(regexEscape(utils.rootPath + path.sep), 'g'), '')
        .replace(new RegExp(regexEscape(utils.rootPath), 'g'), '')
        .replace(/\.transpile/g, '');
}

export function normaliseStats(test: TestSuite, stats: any): string {
    return stats.toString({ timings: false, version: false, hash: false })
        .replace(new RegExp(regexEscape(test.paths.staging + path.sep), 'g'), '')
        .replace(new RegExp(regexEscape(utils.rootPath + path.sep), 'g'), '')
        .replace(new RegExp(regexEscape(utils.rootPath), 'g'), '')
        .replace(new RegExp(regexEscape(utils.rootPathWithIncorrectWindowsSeparator), 'g'), '')
        .replace(/\.transpile/g, '');
}
