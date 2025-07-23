"use strict";
/**
 * Utility functions for working with Jest
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentJestTestFilePath = getCurrentJestTestFilePath;
/**
 * Gets the current test file path from Jest's globals
 * @returns The current Jest test file path, or undefined if not in Jest or the path is not available
 */
function getCurrentJestTestFilePath() {
    try {
        const { expect } = require('expect');
        if (typeof expect === 'function' && typeof expect.getState === 'function') {
            // This uses an unofficial Jest API that is not part of the public documentation but is known to work in practice.
            // Use with caution, as it may break in future Jest updates.
            return expect.getState().testPath || undefined;
        }
        return undefined;
    }
    catch (e) {
        // Fallback in case expect isn't available or the API fails
        return undefined;
    }
}
