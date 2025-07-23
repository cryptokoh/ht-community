import { TestContextConfig } from "../../types/core";
/**
 * Test context that provides information about the current test execution environment.
 * Handles defaults internally so consumers always get working functionality.
 */
export declare class TestContext {
    readonly getCurrentTestFilePath: () => string | undefined;
    constructor(config?: TestContextConfig);
}
