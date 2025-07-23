/**
 * Utility functions for detecting the current test environment and context.
 * These utilities work across different test runners and frameworks.
 */
/**
 * Gets the current test file path from the Jest expect API or the stack trace.
 * This function attempts multiple detection methods to work across different test environments.
 *
 * @returns The current test file path, or undefined if not in a test environment or the path is not available
 */
export declare function getCurrentTestFilePath(): string | undefined;
