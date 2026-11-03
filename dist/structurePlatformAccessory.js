"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlairStructurePlatformAccessory = void 0;
const flair_api_ts_1 = require("flair-api-ts");
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class FlairStructurePlatformAccessory {
    platform;
    accessory;
    accessoryInformationService;
    thermostatService;
    client;
    structure;
    constructor(platform, accessory, client) {
        this.platform = platform;
        this.accessory = accessory;
        this.structure = this.accessory.context.device;
        this.client = client;
        // set accessory information
        this.accessoryInformationService = this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Flair')
            .setCharacteristic(this.platform.Characteristic.Model, 'Structure')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.structure.id);
        this.thermostatService = this.accessory.getService(this.platform.Service.Thermostat)
            ?? this.accessory.addService(this.platform.Service.Thermostat);
        this.thermostatService.setPrimaryService(true);
        this.thermostatService
            .setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name)
            .setCharacteristic(this.platform.Characteristic.CurrentTemperature, this.structure.setPointTemperatureC)
            .setCharacteristic(this.platform.Characteristic.TargetTemperature, this.structure.setPointTemperatureC)
            .setCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState, this.getTargetHeatingCoolingState(this.structure))
            .setCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState, this.getCurrentHeatingCoolingState(this.structure));
        this.thermostatService.getCharacteristic(this.platform.Characteristic.TargetTemperature)
            .on("set" /* CharacteristicEventTypes.SET */, this.setTargetTemperature.bind(this))
            .on("get" /* CharacteristicEventTypes.GET */, this.getTargetTemperature.bind(this));
        this.thermostatService.getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
            .on("set" /* CharacteristicEventTypes.SET */, this.setTargetHeatingCoolingState.bind(this));
    }
    setTargetHeatingCoolingState(value, callback) {
        if (value === this.platform.Characteristic.TargetHeatingCoolingState.OFF) {
            this.platform.setStructureMode(flair_api_ts_1.StructureHeatCoolMode.OFF).then((structure) => {
                callback(null);
                this.updateFromStructure(structure);
            });
        }
        else if (value === this.platform.Characteristic.TargetHeatingCoolingState.COOL) {
            this.platform.setStructureMode(flair_api_ts_1.StructureHeatCoolMode.COOL).then((structure) => {
                callback(null);
                this.updateFromStructure(structure);
            });
        }
        else if (value === this.platform.Characteristic.TargetHeatingCoolingState.HEAT) {
            this.platform.setStructureMode(flair_api_ts_1.StructureHeatCoolMode.HEAT).then((structure) => {
                callback(null);
                this.updateFromStructure(structure);
            });
        }
        else if (value === this.platform.Characteristic.TargetHeatingCoolingState.AUTO) {
            this.platform.setStructureMode(flair_api_ts_1.StructureHeatCoolMode.AUTO).then((structure) => {
                callback(null);
                this.updateFromStructure(structure);
            });
        }
    }
    setTargetTemperature(value, callback) {
        this.client.setStructureSetPoint(this.structure, value).then((structure) => {
            // you must call the callback function
            callback(null);
            this.updateFromStructure(structure);
            this.platform.log.debug('Set Characteristic Temperature -> ', value);
        });
    }
    getTargetTemperature(callback) {
        callback(null, this.platform.structure ? this.platform.structure.setPointTemperatureC : 0);
    }
    updateFromStructure(structure) {
        this.structure = structure;
        // push the new value to HomeKit
        this.thermostatService
            .updateCharacteristic(this.platform.Characteristic.TargetTemperature, this.structure.setPointTemperatureC)
            .updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.structure.setPointTemperatureC)
            .updateCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState, this.getTargetHeatingCoolingState(this.structure))
            .updateCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState, this.getCurrentHeatingCoolingState(this.structure));
        this.platform.log.debug(`Pushed updated current structure state for ${this.structure.name} to HomeKit:`, this.structure.structureHeatCoolMode);
    }
    getCurrentHeatingCoolingState(structure) {
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
    getTargetHeatingCoolingState(structure) {
        if (structure.structureHeatCoolMode === flair_api_ts_1.StructureHeatCoolMode.COOL) {
            return this.platform.Characteristic.TargetHeatingCoolingState.COOL;
        }
        if (structure.structureHeatCoolMode === flair_api_ts_1.StructureHeatCoolMode.HEAT) {
            return this.platform.Characteristic.TargetHeatingCoolingState.HEAT;
        }
        if (structure.structureHeatCoolMode === flair_api_ts_1.StructureHeatCoolMode.AUTO) {
            return this.platform.Characteristic.TargetHeatingCoolingState.AUTO;
        }
        return this.platform.Characteristic.TargetHeatingCoolingState.OFF;
    }
}
exports.FlairStructurePlatformAccessory = FlairStructurePlatformAccessory;
//# sourceMappingURL=structurePlatformAccessory.js.map