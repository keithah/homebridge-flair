import type { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig } from 'homebridge';
import { Structure, StructureHeatCoolMode, Model } from 'flair-api-ts';
/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export declare class FlairPlatform implements DynamicPlatformPlugin {
    readonly log: Logger;
    readonly config: PlatformConfig;
    readonly api: API;
    readonly Service: any;
    readonly Characteristic: any;
    readonly accessories: PlatformAccessory[];
    private client?;
    structure?: Structure;
    private rooms;
    private primaryStructureAccessory?;
    private _hasValidConfig?;
    private _hasValidCredentials?;
    constructor(log: Logger, config: PlatformConfig, api: API);
    private validConfig;
    private checkCredentials;
    private getNewStructureReadings;
    private updateStructureFromStructureReading;
    setStructureMode(heatingCoolingMode: StructureHeatCoolMode): Promise<Structure>;
    private getStructure;
    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory: PlatformAccessory): Promise<void>;
    /**
     * This is an example method showing how to register discovered accessories.
     * Accessories must only be registered once, previously created accessories
     * must not be registered again to prevent "duplicate UUID" errors.
     */
    discoverDevices(): Promise<void>;
    addDevices(devices: [Model]): Promise<string[]>;
}
//# sourceMappingURL=platform.d.ts.map