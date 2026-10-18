"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePath = normalizePath;
exports.pathMatches = pathMatches;
exports.isOperationGranted = isOperationGranted;
function normalizePath(path) {
    const withoutQuery = path.split("?")[0].split("#")[0];
    const single = withoutQuery.replace(/\/{2,}/g, "/");
    const trimmed = single.replace(/\/+$/, "");
    return trimmed === "" ? "/" : trimmed;
}
function pathMatches(pattern, path) {
    const patternParts = normalizePath(pattern).split("/");
    const pathParts = normalizePath(path).split("/");
    if (patternParts.length !== pathParts.length)
        return false;
    return patternParts.every((part, index) => part.startsWith(":") || part === pathParts[index]);
}
function isOperationGranted(granted, method, path) {
    const upperMethod = method.toUpperCase();
    return granted.some((resource) => resource.method.toUpperCase() === upperMethod && pathMatches(resource.path, path));
}
//# sourceMappingURL=resource-match.js.map