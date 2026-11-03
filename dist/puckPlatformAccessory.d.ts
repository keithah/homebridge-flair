import type { PlatformAccessory } from 'homebridge';
import { FlairPlatform } from './platform';
import { Puck, Client } from 'flair-api-ts';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class FlairPuckPlatformAccessory {
    private readonly platform;
    private readonly accessory;
    private temperatureService;
    private humidityService;
    private accessoryInformationService;
    private client;
    private puck;
    constructor(platform: FlairPlatform, accessory: PlatformAccessory, client: Client);
    getNewPuckReadings(): Promise<Puck>;
    updatePuckReadingsFromPuck(puck: Puck): void;
}
//# sourceMappingURL=puckPlatformAccessory.d.ts.map