"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlairPuckPlatformAccessory = void 0;
const utils_1 = require("./utils");
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class FlairPuckPlatformAccessory {
    platform;
    accessory;
    temperatureService;
    humidityService;
    accessoryInformationService;
    client;
    puck;
    constructor(platform, accessory, client) {
        this.platform = platform;
        this.accessory = accessory;
        this.puck = this.accessory.context.device;
        this.client = client;
        // set accessory information
        this.accessoryInformationService = this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Flair')
            .setCharacteristic(this.platform.Characteristic.Model, 'Puck')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, this.puck.displayNumber);
        // you can create multiple services for each accessory
        this.temperatureService = this.accessory.getService(this.platform.Service.TemperatureSensor)
            ?? this.accessory.addService(this.platform.Service.TemperatureSensor);
        this.temperatureService.setPrimaryService(true);
        this.temperatureService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
        this.temperatureService.setCharacteristic(this.platform.Characteristic.CurrentTemperature, this.puck.currentTemperatureC);
        this.humidityService = this.accessory.getService(this.platform.Service.HumiditySensor)
            ?? this.accessory.addService(this.platform.Service.HumiditySensor);
        this.humidityService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
        this.humidityService.setCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, this.puck.currentHumidity);
        this.temperatureService.addLinkedService(this.humidityService);
        setInterval(async () => {
            await this.getNewPuckReadings();
        }, (platform.config.pollInterval + (0, utils_1.getRandomIntInclusive)(1, 20)) * 1000);
        this.getNewPuckReadings();
    }
    async getNewPuckReadings() {
        try {
            const puck = await this.client.getPuckReading(this.puck);
            this.updatePuckReadingsFromPuck(puck);
            return puck;
        }
        catch (e) {
            this.platform.log.debug(e);
        }
        return this.puck;
    }
    updatePuckReadingsFromPuck(puck) {
        this.accessory.context.device = puck;
        this.puck = puck;
        // push the new value to HomeKit
        this.temperatureService.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.puck.currentTemperatureC);
        this.humidityService.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, this.puck.currentHumidity);
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .updateCharacteristic(this.platform.Characteristic.FirmwareRevision, String(this.puck.firmwareVersionS));
        this.platform.log.debug(`Pushed updated current temperature state for ${this.puck.name} to HomeKit:`, this.puck.currentTemperatureC);
    }
}
exports.FlairPuckPlatformAccessory = FlairPuckPlatformAccessory;
//# sourceMappingURL=puckPlatformAccessory.js.map