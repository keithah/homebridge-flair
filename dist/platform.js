"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlairPlatform = void 0;
const settings_1 = require("./settings");
const puckPlatformAccessory_1 = require("./puckPlatformAccessory");
const ventPlatformAccessory_1 = require("./ventPlatformAccessory");
const roomPlatformAccessory_1 = require("./roomPlatformAccessory");
const flair_api_ts_1 = require("flair-api-ts");
const class_transformer_1 = require("class-transformer");
const utils_1 = require("./utils");
const structurePlatformAccessory_1 = require("./structurePlatformAccessory");
const flairApiFix_1 = require("./flairApiFix");
/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
class FlairPlatform {
    log;
    config;
    api;
    Service;
    Characteristic;
    // this is used to track restored cached accessories
    accessories = [];
    client;
    structure;
    rooms = [];
    primaryStructureAccessory;
    _hasValidConfig;
    _hasValidCredentials;
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        this.log.debug('Finished initializing platform:', this.config.name);
        if (!this.validConfig()) {
            return;
        }
        // Apply Flair API compatibility fixes before the client is used.
        (0, flairApiFix_1.installFlairApiFixes)();
        this.client = new flair_api_ts_1.Client(this.config.clientId, this.config.clientSecret, this.config.username, this.config.password);
        // When this event is fired it means Homebridge has restored all cached accessories from disk.
        // Dynamic Platform plugins should only register new accessories after this event was fired,
        // in order to ensure they weren't added to homebridge already. This event can also be used
        // to start discovery of new accessories.
        this.api.on("didFinishLaunching" /* APIEvent.DID_FINISH_LAUNCHING */, async () => {
            if (!this.validConfig()) {
                return;
            }
            if (!(await this.checkCredentials())) {
                return;
            }
            // run the method to discover / register your devices as accessories
            await this.discoverDevices();
            setInterval(async () => {
                await this.getNewStructureReadings();
            }, (this.config.pollInterval + (0, utils_1.getRandomIntInclusive)(1, 20)) * 1000);
        });
    }
    validConfig() {
        if (this._hasValidConfig !== undefined) {
            return this._hasValidConfig;
        }
        this._hasValidConfig = true;
        if (!this.config.clientId) {
            this.log.error('You need to enter a Flair Client Id');
            this._hasValidConfig = false;
        }
        if (!this.config.clientSecret) {
            this.log.error('You need to enter a Flair Client Id');
            this._hasValidConfig = false;
        }
        if (!this.config.username) {
            this.log.error('You need to enter your flair username');
            this._hasValidConfig = false;
        }
        if (!this.config.password) {
            this.log.error('You need to enter your flair password');
            this._hasValidConfig = false;
        }
        return this._hasValidConfig;
    }
    async checkCredentials() {
        if (this._hasValidCredentials !== undefined) {
            return this._hasValidCredentials;
        }
        try {
            await this.client.getUsers();
            this._hasValidCredentials = true;
        }
        catch (e) {
            this._hasValidCredentials = false;
            this.log.error('Error getting structure readings this is usually incorrect credentials, ensure you entered the right credentials.');
        }
        return this._hasValidCredentials;
    }
    async getNewStructureReadings() {
        try {
            const structure = await this.client.getStructure(await this.getStructure());
            this.updateStructureFromStructureReading(structure);
        }
        catch (error) {
            this.log.error('Error getting structure readings:', error.message);
        }
    }
    updateStructureFromStructureReading(structure) {
        this.structure = structure;
        for (const room of this.rooms) {
            if (room) {
                room.updateFromStructure(this.structure);
            }
        }
        if (this.primaryStructureAccessory) {
            this.primaryStructureAccessory.updateFromStructure(this.structure);
        }
        return this.structure;
    }
    async setStructureMode(heatingCoolingMode) {
        const structure = await this.client.setStructureHeatingCoolMode(await this.getStructure(), heatingCoolingMode);
        return this.updateStructureFromStructureReading(structure);
    }
    async getStructure() {
        if (this.structure) {
            return this.structure;
        }
        try {
            this.structure = await this.client.getPrimaryStructure();
        }
        catch (e) {
            const errorMessage = 'There was an error getting your primary flair home from the api: ' +
                e.message;
            this.log.error(errorMessage);
            throw new Error(errorMessage);
        }
        if (!this.structure) {
            const errorMessage = 'The structure is not available. Please check your Flair account has a primary home configured.';
            this.log.error(errorMessage);
            throw new Error(errorMessage);
        }
        return this.structure;
    }
    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    async configureAccessory(accessory) {
        if (!this.validConfig()) {
            return;
        }
        if (!(await this.checkCredentials())) {
            return;
        }
        if (accessory.context.type === flair_api_ts_1.Vent.type && this.config.ventAccessoryType === ventPlatformAccessory_1.VentAccessoryType.Hidden) {
            this.log.info('Removing vent accessory from cache since vents are now hidden:', accessory.displayName);
            await this.api.unregisterPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [
                accessory,
            ]);
            return;
        }
        // add the restored accessory to the accessories cache so we can track if it has already been registered
        this.accessories.push(accessory);
        this.log.info('Restoring accessory from cache:', accessory.displayName);
        try {
            if (accessory.context.type === flair_api_ts_1.Puck.type) {
                this.log.info('Restoring puck from cache:', accessory.displayName);
                accessory.context.device = (0, class_transformer_1.plainToClass)(flair_api_ts_1.Puck, accessory.context.device);
                new puckPlatformAccessory_1.FlairPuckPlatformAccessory(this, accessory, this.client);
            }
            else if (accessory.context.type === flair_api_ts_1.Vent.type) {
                this.log.info('Restoring vent from cache:', accessory.displayName);
                accessory.context.device = (0, class_transformer_1.plainToClass)(flair_api_ts_1.Vent, accessory.context.device);
                new ventPlatformAccessory_1.FlairVentPlatformAccessory(this, accessory, this.client);
            }
            else if (accessory.context.type === flair_api_ts_1.Room.type) {
                this.log.info('Restoring room from cache:', accessory.displayName);
                accessory.context.device = (0, class_transformer_1.plainToClass)(flair_api_ts_1.Room, accessory.context.device);
                try {
                    const structure = await this.getStructure();
                    this.rooms.push(new roomPlatformAccessory_1.FlairRoomPlatformAccessory(this, accessory, this.client, structure));
                }
                catch (error) {
                    this.log.error('Failed to restore room accessory due to structure error:', accessory.displayName, error.message);
                    // Remove the problematic accessory from cache
                    await this.api.unregisterPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
                }
            }
            else if (accessory.context.type === flair_api_ts_1.Structure.type) {
                this.log.info('Restoring structure from cache:', accessory.displayName);
                accessory.context.device = (0, class_transformer_1.plainToClass)(flair_api_ts_1.Structure, accessory.context.device);
                this.primaryStructureAccessory = new structurePlatformAccessory_1.FlairStructurePlatformAccessory(this, accessory, this.client);
            }
        }
        catch (error) {
            this.log.error('Error configuring accessory:', accessory.displayName, error.message);
        }
    }
    /**
     * This is an example method showing how to register discovered accessories.
     * Accessories must only be registered once, previously created accessories
     * must not be registered again to prevent "duplicate UUID" errors.
     */
    async discoverDevices() {
        let currentUUIDs = [];
        const promisesToResolve = [];
        if (this.config.ventAccessoryType !== ventPlatformAccessory_1.VentAccessoryType.Hidden) {
            promisesToResolve.push(this.addDevices(await this.client.getVents()));
        }
        // NB: Homebridge does not inject config.schema.json defaults into config.json,
        // so an unset boolean arrives as `undefined`. Treat only an explicit `false`
        // as opt-in, which keeps these guards consistent with the schema defaults.
        if (this.config.hidePrimaryStructure === false) {
            promisesToResolve.push(this.addDevices([await this.client.getPrimaryStructure()]));
        }
        if (this.config.hidePuckRooms === false) {
            promisesToResolve.push(this.addDevices((await this.client.getRooms()).filter((value) => {
                return value.pucksInactive === 'Active';
            })));
        }
        if (this.config.hidePuckSensors === false) {
            promisesToResolve.push(this.addDevices(await this.client.getPucks()));
        }
        const uuids = await Promise.all(promisesToResolve);
        currentUUIDs = currentUUIDs.concat(...uuids);
        //Loop over the current uuid's and if they don't exist then remove them.
        for (const accessory of this.accessories) {
            if (currentUUIDs.length === 0 || !currentUUIDs.find((uuid) => uuid === accessory.UUID)) {
                await this.api.unregisterPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [
                    accessory,
                ]);
                delete this.accessories[this.accessories.indexOf(accessory, 0)];
                this.log.debug('Removing not found device:', accessory.displayName);
            }
        }
    }
    async addDevices(devices) {
        const currentUUIDs = [];
        // loop over the discovered devices and register each one if it has not already been registered
        for (const device of devices) {
            // Guard against a malformed API response: a missing entry used to throw
            // "Cannot read properties of undefined (reading 'id')" and crash startup.
            if (!device || !device.id) {
                this.log.warn('Skipping discovered device with no id:', JSON.stringify(device));
                continue;
            }
            // generate a unique id for the accessory this should be generated from
            // something globally unique, but constant, for example, the device serial
            // number or MAC address
            const uuid = this.api.hap.uuid.generate(device.id);
            currentUUIDs.push(uuid);
            // check that the device has not already been registered by checking the
            // cached devices we stored in the `configureAccessory` method above
            if (!this.accessories.find((accessory) => accessory.UUID === uuid)) {
                // create a new accessory
                const accessory = new this.api.platformAccessory(device.name, uuid);
                // store a copy of the device object in the `accessory.context`
                // the `context` property can be used to store any data about the accessory you may need
                accessory.context.device = device;
                // create the accessory handler
                // this is imported from `puckPlatformAccessory.ts`
                if (device instanceof flair_api_ts_1.Puck) {
                    accessory.context.type = flair_api_ts_1.Puck.type;
                    new puckPlatformAccessory_1.FlairPuckPlatformAccessory(this, accessory, this.client);
                }
                else if (device instanceof flair_api_ts_1.Vent) {
                    accessory.context.type = flair_api_ts_1.Vent.type;
                    new ventPlatformAccessory_1.FlairVentPlatformAccessory(this, accessory, this.client);
                }
                else if (device instanceof flair_api_ts_1.Room) {
                    accessory.context.type = flair_api_ts_1.Room.type;
                    const structure = await this.getStructure();
                    this.rooms.push(new roomPlatformAccessory_1.FlairRoomPlatformAccessory(this, accessory, this.client, structure));
                }
                else if (device instanceof flair_api_ts_1.Structure) {
                    accessory.context.type = flair_api_ts_1.Structure.type;
                    this.primaryStructureAccessory = new structurePlatformAccessory_1.FlairStructurePlatformAccessory(this, accessory, this.client);
                }
                else {
                    continue;
                }
                this.log.info(`Registering new ${accessory.context.type}`, device.name);
                // link the accessory to your platform
                this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [
                    accessory,
                ]);
                // push into accessory cache
                this.accessories.push(accessory);
                // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
                // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
            }
            else {
                this.log.debug('Discovered accessory already exists:', device.name);
            }
        }
        return currentUUIDs;
    }
}
exports.FlairPlatform = FlairPlatform;
//# sourceMappingURL=platform.js.map