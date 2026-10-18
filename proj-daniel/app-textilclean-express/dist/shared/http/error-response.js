"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = sendError;
const app_error_1 = require("../errors/app-error");
function sendError(res, error) {
    if (error instanceof app_error_1.AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
    }
    res.status(500).json({ error: "Internal server error", detail: String(error) });
}
//# sourceMappingURL=error-response.js.map