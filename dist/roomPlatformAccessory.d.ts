import type { PlatformAccessory } from 'homebridge';
import { CharacteristicGetCallback, CharacteristicSetCallback, CharacteristicValue } from 'homebridge';
import { FlairPlatform } from './platform';
import { Room, Structure, Client } from 'flair-api-ts';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class FlairRoomPlatformAccessory {
    private readonly platform;
    private readonly accessory;
    private accessoryInformationService;
    private thermostatService;
    private client;
    private room;
    private structure;
    constructor(platform: FlairPlatform, accessory: PlatformAccessory, client: Client, structure: Structure);
    setTargetHeatingCoolingState(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    setRoomActive(): void;
    setTargetTemperature(value: CharacteristicValue, callback: CharacteristicSetCallback): void;
    getTargetTemperature(callback: CharacteristicGetCallback): void;
    getNewRoomReadings(): Promise<Room>;
    updateFromStructure(structure: Structure): void;
    updateRoomReadingsFromRoom(room: Room): void;
    private getCurrentHeatingCoolingStateFromStructureAndRoom;
    private getTargetHeatingCoolingStateFromStructureAndRoom;
}
//# sourceMappingURL=roomPlatformAccessory.d.ts.map