import { CacheOptions, CacheValue, CacheValueSnapshot, CacheValueValidationMatcher, ScreenCapturerResult, SnapshotHashes } from "../../types";
import { SnapshotComparator } from "../snapshot/comparator/SnapshotComparator";
import { TestContext } from "../../common/testContext";
/**
 * CacheHandler provides a unified caching solution for both StepPerformer and AutoPerformer.
 * It works with the SnapshotComparator to compare snapshots and find matching cache entries.
 */
export declare class CacheHandler {
    private static CACHE_DIRECTORY;
    private static DEFAULT_CACHE_FILENAME;
    private static APP_NAME;
    private cache;
    private temporaryCache;
    private readonly overrideCacheFilePath;
    private cacheFilePath;
    private cacheOptions;
    private testContext;
    private snapshotComparator;
    private codeEvaluator;
    private resolvedCacheFilePath?;
    /**
     * Creates a new CacheHandler instance
     * @param snapshotComparator The snapshot comparator to use for hash generation and comparison
     * @param testContext Test context containing the current test file path function
     * @param cacheOptions Cache configuration options
     * @param cacheFilePath Optional explicit cache file path override
     */
    constructor(snapshotComparator: SnapshotComparator, testContext: TestContext, cacheOptions?: CacheOptions, cacheFilePath?: string);
    private createCacheOptionsWithDefaults;
    private determineCurrentCacheFilePath;
    /**
     * Generate hashes for a snapshot using all registered algorithms
     * @param screenCapture The screen capture result
     * @returns Object with hash values from each registered algorithm
     */
    generateHashes(screenCapture: ScreenCapturerResult): Promise<SnapshotHashes>;
    loadCacheFromFile(): void;
    private saveCacheToFile;
    /**
     * Get cached values by key from the persistent cache
     * @param cacheKey The cache key string
     * @returns Array of cache values if found, undefined otherwise
     */
    getFromPersistentCache<T>(cacheKey: string): Array<CacheValue<T>> | undefined;
    /**
     * Add value to temporary cache
     * @param cacheKey The cache key string
     * @param value The value to cache
     * @param snapshotHashes Hash values for the current snapshot
     */
    addToTemporaryCacheSnapshotBased<T>(cacheKey: string, value: T, snapshotHashes?: Partial<SnapshotHashes>): void;
    /**
     * Add value to temporary cache
     * @param cacheKey The cache key string
     * @param value The value to cache
     * @param validationMatcher a code line that validate the existence of the step's relevant element
     */
    addToTemporaryCacheValidationMatcherBased<T>(cacheKey: string, value: T & {
        code: string;
    }, validationMatcher?: string[] | string | undefined): void;
    /**
     * Persist temporary cache to permanent cache and save to file
     */
    flushTemporaryCache(): void;
    /**
     * Clear the temporary cache without persisting it
     */
    clearTemporaryCache(): void;
    /**
     * Find matching cache entry by comparing snapshot hashes
     * @param cacheValues Array of cache values to search
     * @param currentHashes Current snapshot hashes (complete with all algorithms)
     * @returns Matching cache value if found, undefined otherwise
     */
    findMatchingCacheEntrySnapshotBased<T>(cacheValues: Array<CacheValueSnapshot<T>>, currentHashes?: SnapshotHashes): CacheValue<T> | undefined;
    /**
     * Searches for a matching cache entry by evaluating its validation matcher code.
     * If the matcher evaluates to true, the corresponding cache entry is returned.
     * Also determines whether additional code should be run based on a comparison between the original code and the matcher.
     * @param cacheValues Array of cache values to search
     * @param context The context
     * @param sharedContext The shared context to use for evaluating the validation matcher
     * @returns Matching cache value if found, undefined otherwise
     */
    findMatchingCacheEntryValidationMatcherBased<T>(cacheValues: Array<CacheValueValidationMatcher<T>>, context: any, sharedContext?: Record<string, any>): Promise<CacheValueValidationMatcher<T> | undefined>;
    /**
     * Generate a cache key from serializable data
     * @param keyData The data to use as a cache key (must be JSON serializable)
     * @returns Cache key string or undefined if cache is disabled
     * @example
     * // Generate a key for step performer
     * const key = cacheHandler.generateCacheKey({ step, previousSteps });
     *
     * // Generate a key for auto performer
     * const key = cacheHandler.generateCacheKey({ goal, previousSteps });
     */
    generateCacheKey<T>(keyData: T): string | undefined;
    private shouldOverrideCache;
    isCacheInUse(): boolean;
    /**
     * Gets the OS-specific user data directory path for the application
     * @returns The appropriate application data directory for the current OS
     */
    private getUserDataDir;
    /**
     * Determines the appropriate cache file path based on the caller path
     * @returns The resolved cache file path
     */
    private getCacheFilePath;
    /**
     * Gets the cache file path for a specific caller file (typically a Jest test)
     * @param callerPath The path of the calling file
     * @returns The resolved cache file path specific to the caller
     */
    private getCallerCacheFilePath;
    /**
     * Gets the default global cache file path when no caller path is available
     * @returns The resolved default cache file path
     */
    private getDefaultCacheFilePath;
}
