"use strict";
const settings_1 = require("./settings");
const platform_1 = require("./platform");
require("reflect-metadata");
module.exports = (api) => {
    api.registerPlatform('homebridge-flair', settings_1.PLATFORM_NAME, platform_1.FlairPlatform);
};
//# sourceMappingURL=index.js.map