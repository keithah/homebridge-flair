import type { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { FlairPlatform } from './platform';
import { Vent, Client } from 'flair-api-ts';
export declare enum VentAccessoryType {
    WindowCovering = "windowCovering",
    Fan = "fan",
    AirPurifier = "airPurifier",
    Hidden = "hidden"
}
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class FlairVentPlatformAccessory {
    private readonly platform;
    private readonly accessory;
    private fanService?;
    private windowService?;
    private airPurifierService?;
    private mainService;
    private temperatureService;
    private accessoryInformationService;
    private vent;
    private client;
    private accessoryType;
    constructor(platform: FlairPlatform, accessory: PlatformAccessory, client: Client);
    /**
       //  * Handle "SET" requests from HomeKit
       //  * These are sent when the user changes the state of an accessory, for example, changing the Brightness
       //  */
    setTargetPosition(value: CharacteristicValue): Promise<void>;
    getTargetPosition(): Promise<CharacteristicValue>;
    getNewVentReadings(): Promise<Vent>;
    updateVentReadingsFromVent(vent: Vent): void;
}
//# sourceMappingURL=ventPlatformAccessory.d.ts.map