import { PlatformConfig} from 'homebridge';

export interface MiraiePlatformConfig extends PlatformConfig {
    mobile: string;
    password: string;
    mqttBrokerHost: string;
    mqttBrokerPort: number;
    mqttBrokerUsername: string;
    mqttBrokerPassword: string;
    cleanSession: boolean;
    sslTls: boolean;
}

export interface MiraieCloudAuthResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
    userId: string;
}

export interface MiraieCloudHomeResponse {
    homeList: Home[];
}

export interface Home {
    address: Address;
    location: number[];
    hostName: string;
    homeId: string;
    userId: string;
    primaryUser: string;
    secondaryUsers: string[];
    metaTopic: string;
    spaces: Space[]
}

export interface Address {
    addressLine1: string;
    addressLine2: string;
    city: string;
    pincode: string;
}

export interface Space {
    spaceId: string;
    spaceType: string;
    spaceName: string;
    devices: Device[];
    members: string[];
}

export interface Device {
    deviceId: string;
    deviceName: string;
    topic: string[];
}

export interface MQTTDevice {
    id: string;
    name: string;
    friendlyName: string;
    controlTopic: string;
    statusTopic: string;
    connectionStatusTopic: string;
    statusResponse: MiraieCloudDeviceStatusResponse;
}

export interface MiraieCloudDeviceStatusResponse {
    achs: number;
    acfs: string;
    ps: string;
    ty: string;
    rmtmp: string;
    acdl: number;
    acdc: string;
    sid: string;
    acsp: string;
    acmd: string;
    V: string;
    mo: string;
    rssi: number;
    acms: string;
    acgm: number;
    acem: string;
    cnt: string;
    acec: string;
    acmss: number;
    actmp: string;
    acpms: number;
    acfc: string;
    acvs: number;
    acpm: string;
    acng: string;
    actm: number[];
    lcmd: string;
    acngs: string;
    ts: string;
    onlineStatus: string;
    connectedTime: number;
    updatedTime: number;
    totalOperatingHours: number;
    filterDustLevel: number;
    filterCleaningRequired: boolean;
    filterCleaningCause: string;
    errors: string;
    warnings: string;
}

export interface PanasonicAccessoryContext {
    device: MQTTDevice;
}