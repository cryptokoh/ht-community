"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestContext = void 0;
const testEnvUtils_1 = require("./testEnvUtils");
/**
 * Test context that provides information about the current test execution environment.
 * Handles defaults internally so consumers always get working functionality.
 */
class TestContext {
    getCurrentTestFilePath;
    constructor(config = {}) {
        this.getCurrentTestFilePath =
            config.getCurrentTestFilePath ?? testEnvUtils_1.getCurrentTestFilePath;
    }
}
exports.TestContext = TestContext;
