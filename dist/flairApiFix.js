"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.installFlairApiFixes = installFlairApiFixes;
/**
 * Runtime compatibility fixes for `flair-api-ts`.
 *
 * The upstream `flair-api-ts` client predates several breaking changes on
 * Flair's side, so its default behaviour no longer authenticates or discovers
 * devices correctly. These patches keep the dependency unmodified while
 * restoring working behaviour:
 *
 *  1. Auth: `flair-api-ts` posts to the legacy `/oauth/token` endpoint with a
 *     `password` grant. Flair rejects that with `{"error":"invalid_client"}`.
 *     The current endpoint is `/oauth2/token` using `client_credentials`.
 *
 *  2. Primary structure: `getPrimaryStructure()` returns the structure whose
 *     `isPrimaryHome()` is truthy. Flair now reports `home: false` on the
 *     primary structure, so it resolved to `undefined` — which crashed the
 *     platform with "Cannot read properties of undefined (reading 'id')".
 *     Fall back to the first structure.
 *
 * Applied once at platform init. Safe to call multiple times.
 */
const flair_api_ts_1 = require("flair-api-ts");
const querystring = __importStar(require("querystring"));
const moment_1 = __importDefault(require("moment"));
let applied = false;
function installFlairApiFixes() {
    if (applied) {
        return;
    }
    applied = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proto = flair_api_ts_1.Client.prototype;
    // --- 1. Authenticate against the current OAuth2 endpoint -----------------
    proto.getRefreshToken = async function getRefreshToken() {
        const oauth2Config = {
            client_id: this.passwordTokenConfig.client_id,
            client_secret: this.passwordTokenConfig.client_secret,
            grant_type: 'client_credentials',
        };
        const response = await this.client.post('/oauth2/token', querystring.stringify(oauth2Config), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        if (response.status !== 200) {
            throw new Error('Getting access token failed.');
        }
        response.data.expires_at = (0, moment_1.default)().add(response.data.expires_in ?? 3600, 'seconds');
        return (this.currentToken = response.data);
    };
    // Client-credentials tokens carry no refresh token, so re-authenticate.
    proto.updateAccessToken = async function updateAccessToken() {
        if (this.currentToken === undefined) {
            return this.getRefreshToken();
        }
        const expiresAt = this.currentToken.expires_at;
        const isExpired = !expiresAt || expiresAt.isBefore((0, moment_1.default)().add(20, 'seconds'));
        if (isExpired) {
            return this.getRefreshToken();
        }
        return this.currentToken;
    };
    // --- 2. Never return an undefined structure ------------------------------
    proto.getPrimaryStructure = async function getPrimaryStructure() {
        await this.updateClient();
        const structures = await this.getStructures();
        return structures.find((structure) => structure.isPrimaryHome())
            || structures[0];
    };
}
//# sourceMappingURL=flairApiFix.js.map