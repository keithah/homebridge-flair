# Changelog

## [1.4.1] - 2026-11-03

### Fixed
- **Authentication**: Flair now rejects the legacy `/oauth/token` + `password` grant with
  `{"error":"invalid_client"}`. The client now authenticates against `/oauth2/token`
  using the `client_credentials` grant, which is Flair's current documented flow.
- **Startup crash loop**: `getPrimaryStructure()` filtered on `isPrimaryHome()`, which reads
  the structure's `home` attribute. Flair now reports `home: false` on the primary
  structure, so the lookup returned `undefined` and registration threw
  `Cannot read properties of undefined (reading 'id')`, restarting Homebridge on every boot.
  It now falls back to the first structure.
- **Undefined devices**: `addDevices()` skips entries with no `id` instead of throwing.

### Changed
- Replaced the abandoned `@ds-flair/flair-api-ts@0.0.0-development` placeholder (published
  2023, identical to the unmaintained `flair-api-ts`) with `flair-api-ts@^1.0.31`.
- Boolean config guards now treat only an explicit `false` as opt-in. Homebridge does not
  inject `config.schema.json` defaults into `config.json`, so an unset flag arrives as
  `undefined` and the previous `!flag` checks enabled features by accident.
- `hidePuckRooms` now defaults to `true`: Flair removed `/api/rooms/{id}/current-reading`
  (returns 404), so room thermostats cannot report state.
- `dist/` is committed so installs from a git tarball work without a build step.

## [1.4.0] - 2025-08-13

### Fixed
- **CRITICAL**: Fixed `UnhandledPromiseRejection` error that caused Homebridge crashes when structure is not available
- Improved error handling in `getStructure()` method with proper Error objects instead of string throws
- Added try-catch blocks around accessory configuration to prevent crashes during restore
- Enhanced error logging with descriptive messages

### Changed
- **BREAKING**: Updated Node.js requirements to `^18.17.0 || ^20.9.0 || ^22.0.0` for Homebridge v2.0 compatibility
- **BREAKING**: Updated Homebridge requirements to `^1.8.0 || ^2.0.0-beta.0`
- Updated TypeScript target to ES2022
- Updated TypeScript to v5.0.0
- Updated @types/node to v20.0.0
- Improved error messages to be more user-friendly

### Security
- Fixed potential crash scenarios that could affect Homebridge stability
- Added graceful handling of missing Flair account structures

### Notes
This release addresses the critical stability issue where the plugin would crash Homebridge with "The structure is not available, this should not happen." error. The plugin now handles missing structures gracefully and provides clear error messages to help users diagnose configuration issues.