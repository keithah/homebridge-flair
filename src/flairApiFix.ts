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
import { Client } from 'flair-api-ts';
import * as querystring from 'querystring';
import moment from 'moment';

let applied = false;

export function installFlairApiFixes(): void {
  if (applied) {
    return;
  }
  applied = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proto = Client.prototype as any;

  // --- 1. Authenticate against the current OAuth2 endpoint -----------------
  proto.getRefreshToken = async function getRefreshToken() {
    const oauth2Config = {
      client_id: this.passwordTokenConfig.client_id,
      client_secret: this.passwordTokenConfig.client_secret,
      grant_type: 'client_credentials',
    };

    const response = await this.client.post(
      '/oauth2/token',
      querystring.stringify(oauth2Config),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    if (response.status !== 200) {
      throw new Error('Getting access token failed.');
    }

    response.data.expires_at = moment().add(response.data.expires_in ?? 3600, 'seconds');
    return (this.currentToken = response.data);
  };

  // Client-credentials tokens carry no refresh token, so re-authenticate.
  proto.updateAccessToken = async function updateAccessToken() {
    if (this.currentToken === undefined) {
      return this.getRefreshToken();
    }

    const expiresAt = this.currentToken.expires_at;
    const isExpired = !expiresAt || expiresAt.isBefore(moment().add(20, 'seconds'));

    if (isExpired) {
      return this.getRefreshToken();
    }

    return this.currentToken;
  };

  // --- 2. Never return an undefined structure ------------------------------
  proto.getPrimaryStructure = async function getPrimaryStructure() {
    await this.updateClient();
    const structures = await this.getStructures();
    return structures.find((structure: { isPrimaryHome: () => boolean }) => structure.isPrimaryHome())
      || structures[0];
  };
}
