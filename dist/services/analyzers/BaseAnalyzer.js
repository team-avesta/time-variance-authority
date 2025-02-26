"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAnalyzer = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
class BaseAnalyzer {
    constructor() {
        this.IST_TIMEZONE = "Asia/Kolkata";
    }
    calculateTotalHours(entries) {
        if (!entries || entries.length === 0) {
            return 0;
        }
        return entries.reduce((total, entry) => {
            const start = (0, moment_timezone_1.default)(entry.start);
            const end = (0, moment_timezone_1.default)(entry.end);
            const duration = moment_timezone_1.default.duration(end.diff(start)).asHours();
            return total + duration;
        }, 0);
    }
    roundHours(hours) {
        return Math.round(hours * 100) / 100;
    }
}
exports.BaseAnalyzer = BaseAnalyzer;
//# sourceMappingURL=BaseAnalyzer.js.map