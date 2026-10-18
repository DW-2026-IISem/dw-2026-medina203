"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUserResponse = toUserResponse;
function toUserResponse(user) {
    const { password: _password, ...safe } = user.toJSON();
    return safe;
}
//# sourceMappingURL=user-response.dto.js.map