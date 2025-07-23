"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAutoPilotReviewOutputs = extractAutoPilotReviewOutputs;
exports.extractAutoPilotStepOutputs = extractAutoPilotStepOutputs;
exports.extractPilotOutputs = extractPilotOutputs;
const reviews_utils_1 = require("../../performers/auto-performer/reviews/reviews-utils");
const BASE_AUTOPILOT_STEP = {
    screenDescription: { tag: "SCREENDESCRIPTION", isRequired: true },
    thoughts: { tag: "THOUGHTS", isRequired: true },
    action: { tag: "ACTION", isRequired: true },
    goalSummary: { tag: "GOAL_SUMMARY", isRequired: false },
};
const AUTOPILOT_REVIEW_SECTION = {
    summary: { tag: "SUMMARY", isRequired: false },
    findings: { tag: "FINDINGS", isRequired: false },
    score: { tag: "SCORE", isRequired: false },
};
const PILOT_OUTPUTS = {
    cacheValidationMatcher: {
        tag: "CACHE_VALIDATION_MATCHER",
        isRequired: false,
    },
    code: { tag: "CODE", isRequired: true },
};
function extractTaggedOutputs({ text, outputsMapper, }) {
    const entries = [];
    for (const key of Object.keys(outputsMapper)) {
        const { tag, isRequired } = outputsMapper[key];
        const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`);
        const match = text.match(regex);
        if (match) {
            const content = match[1].trim();
            entries.push([key, content]);
            text = text.replace(match[0], "");
        }
        else if (!isRequired) {
            entries.push([key, undefined]);
        }
        else {
            throw new Error(`Missing field for required tag <${tag}>`);
        }
    }
    return Object.fromEntries(entries);
}
/**
 * Extracts review outputs (summary, findings, score) from text with review tags
 */
function extractAutoPilotReviewOutputs(text) {
    return extractTaggedOutputs({
        text,
        outputsMapper: AUTOPILOT_REVIEW_SECTION,
    });
}
/**
 * Extracts autopilot step outputs including dynamic review sections
 */
function extractAutoPilotStepOutputs(text, reviewTypes = []) {
    const reviewSections = (0, reviews_utils_1.reviewConfigsToOutputsMapping)(reviewTypes);
    const outputsMapper = { ...BASE_AUTOPILOT_STEP, ...reviewSections };
    return extractTaggedOutputs({ text, outputsMapper });
}
function extractPilotOutputs(text) {
    const outputs = extractTaggedOutputs({
        text,
        outputsMapper: PILOT_OUTPUTS,
    });
    const cacheValidationMatcher = outputs.cacheValidationMatcher
        ? outputs.cacheValidationMatcher.trim().replace(/\s*\/>/g, "")
        : "";
    return { code: outputs.code, cacheValidationMatcher: cacheValidationMatcher };
}
