"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlairRoomPlatformAccessory = void 0;
const flair_api_ts_1 = require("flair-api-ts");
const utils_1 = require("./utils");
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class FlairRoomPlatformAccessory {
    platform;
    accessory;
    accessoryInformationService;
    thermostatService;
    client;
    room;
    structure;
    constructor(platform, accessory, client, structure) {
        this.platform = platform;
        this.accessory = accessory;
        this.room = this.accessory.context.device;
        this.client = client;
        this.structure = structure;
        // set accessory information
        this.accessoryInformationService = this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Flair')
            .setCharacteristic(this.platform.Characteristic.Model, 'Room')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.room.id);
        this.thermostatService = this.accessory.getService(this.platform.Service.Thermostat)
            ?? this.accessory.addService(this.platform.Service.Thermostat);
        this.thermostatService.setPrimaryService(true);
        this.thermostatService
            .setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name)
            .setCharacteristic(this.platform.Characteristic.CurrentTemperature, this.room.currentTemperatureC)
            .setCharacteristic(this.platform.Characteristic.TargetTemperature, this.room.setPointC)
            .setCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState, this.getTargetHeatingCoolingStateFromStructureAndRoom(this.structure))
            .setCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState, this.getCurrentHeatingCoolingStateFromStructureAndRoom(this.structure))
            .setCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, this.room.currentHumidity);
        this.thermostatService.getCharacteristic(this.platform.Characteristic.TargetTemperature)
            .on("set" /* CharacteristicEventTypes.SET */, this.setTargetTemperature.bind(this))
            .on("get" /* CharacteristicEventTypes.GET */, this.getTargetTemperature.bind(this));
        this.thermostatService.getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
            .on("set" /* CharacteristicEventTypes.SET */, this.setTargetHeatingCoolingState.bind(this));
        setInterval(async () => {
            await this.getNewRoomReadings();
        }, (platform.config.pollInterval + (0, utils_1.getRandomIntInclusive)(1, 20)) * 1000);
        this.getNewRoomReadings();
    }
    setTargetHeatingCoolingState(value, callback) {
        if (value === this.platform.Characteristic.TargetHeatingCoolingState.OFF) {
            this.client.setRoomAway(this.room, true).then((room) => {
                this.updateRoomReadingsFromRoom(room);
                this.platform.log.debug('Set Room to away', value);
                // you must call the callback function
                callback(null);
            });
        }
        else if (value === this.platform.Characteristic.TargetHeatingCoolingState.COOL) {
            this.setRoomActive();
            this.platform.setStructureMode(flair_api_ts_1.StructureHeatCoolMode.COOL).then((structure) => {
                callback(null);
                this.updateFromStructure(structure);
            });
        }
        else if (value === this.platform.Characteristic.TargetHeatingCoolingState.HEAT) {
            this.setRoomActive();
            this.platform.setStructureMode(flair_api_ts_1.StructureHeatCoolMode.HEAT).then((structure) => {
                callback(null);
                this.updateFromStructure(structure);
            });
        }
        else if (value === this.platform.Characteristic.TargetHeatingCoolingState.AUTO) {
            this.setRoomActive();
            this.platform.setStructureMode(flair_api_ts_1.StructureHeatCoolMode.AUTO).then((structure) => {
                callback(null);
                this.updateFromStructure(structure);
            });
        }
    }
    setRoomActive() {
        if (this.room.active) {
            return;
        }
        this.client.setRoomAway(this.room, false).then(() => {
            this.platform.log.debug('Set Room to active');
        });
    }
    setTargetTemperature(value, callback) {
        this.client.setRoomSetPoint(this.room, value).then((room) => {
            this.updateRoomReadingsFromRoom(room);
            this.platform.log.debug('Set Characteristic Temperature -> ', value);
            // you must call the callback function
            callback(null);
        });
    }
    getTargetTemperature(callback) {
        this.getNewRoomReadings().then((room) => {
            callback(null, room.setPointC);
        });
    }
    async getNewRoomReadings() {
        try {
            const room = await this.client.getRoom(this.room);
            this.updateRoomReadingsFromRoom(room);
            return room;
        }
        catch (e) {
            this.platform.log.debug(e);
        }
        return this.room;
    }
    updateFromStructure(structure) {
        this.structure = structure;
        // push the new value to HomeKit
        this.updateRoomReadingsFromRoom(this.room);
        this.platform.log.debug(`Pushed updated current structure state for ${this.room.name} to HomeKit:`, this.structure.structureHeatCoolMode);
    }
    updateRoomReadingsFromRoom(room) {
        this.accessory.context.device = room;
        this.room = room;
        // push the new value to HomeKit
        this.thermostatService
            .updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.room.currentTemperatureC)
            .updateCharacteristic(this.platform.Characteristic.TargetTemperature, this.room.setPointC)
            .updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, this.room.currentHumidity)
            .updateCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState, this.getTargetHeatingCoolingStateFromStructureAndRoom(this.structure))
            .updateCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState, this.getCurrentHeatingCoolingStateFromStructureAndRoom(this.structure));
        this.platform.log.debug(`Pushed updated current temperature state for ${this.room.name} to HomeKit:`, this.room.currentTemperatureC);
    }
    getCurrentHeatingCoolingStateFromStructureAndRoom(structure) {
        if (!this.room.active) {
            return this.platform.Characteristic.CurrentHeatingCoolingState.OFF;
        }
        if (structure.structureHeatCoolMode === flair_api_ts_1.StructureHeatCoolMode.COOL) {
            return this.platform.Characteristic.CurrentHeatingCoolingState.COOL;
        }
        if (structure.structureHeatCoolMode === flair_api_ts_1.StructureHeatCoolMode.HEAT) {
            return this.platform.Characteristic.CurrentHeatingCoolingState.HEAT;
        }
        if (structure.structureHeatCoolMode === flair_api_ts_1.StructureHeatCoolMode.AUTO) {
            //TODO: When the structure api shows the current thermostat mode change this to that.
            // For now active always means cool.
            return this.platform.Characteristic.CurrentHeatingCoolingState.COOL;
        }
        return this.platform.Characteristic.CurrentHeatingCoolingState.OFF;
    }
    getTargetHeatingCoolingStateFromStructureAndRoom(structure) {
        if (!this.room.active) {
            return this.platform.Characteristic.TargetHeatingCoolingState.OFF;
        }
        if (structure.structureHeatCoolMode === flair_api_ts_1.StructureHeatCoolMode.COOL) {
            return this.platform.Characteristic.TargetHeatingCoolingState.COOL;
        }
        if (structure.structureHeatCoolMode === flair_api_ts_1.StructureHeatCoolMode.HEAT) {
            return this.platform.Characteristic.TargetHeatingCoolingState.HEAT;
        }
        if (structure.structureHeatCoolMode === flair_api_ts_1.StructureHeatCoolMode.AUTO) {
            return this.platform.Characteristic.TargetHeatingCoolingState.AUTO;
        }
        return this.platform.Characteristic.TargetHeatingCoolingState.AUTO;
    }
}
exports.FlairRoomPlatformAccessory = FlairRoomPlatformAccessory;
//# sourceMappingURL=roomPlatformAccessory.js.map