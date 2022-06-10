import {
  MiraieCloudAuthResponse,
  MiraiePlatformConfig,
  MiraieCloudHomeResponse,
  Home,
  MQTTDevice,
  MiraieCloudDeviceStatusResponse,
} from './types';

import {
  LOGIN_RETRY_DELAY,
  CONSTANTS,
} from './settings';

import axios, {AxiosError} from 'axios';

export default class MiraieCloudApi {
  protected accessToken: string;
  private expiresIn: number;
  private _loginRefreshInterval: NodeJS.Timer | undefined;
  private _loginRetryTimeouts: NodeJS.Timer[] = [];
  private static loggedIn;

  constructor( private readonly config: MiraiePlatformConfig ) {
    this.accessToken = '';
    this.expiresIn = 0;
    MiraieCloudApi.loggedIn = false;
  }

  async login() {
    /**
     * A repeat-login might have been requested by several accessories
     * at a similar time. The first timeout to be executed can clear
     * all remaining ones, since it doesn't make sense to log in multiple
     * times within a short amount of time.
     */
    for (const timeoutId of this._loginRetryTimeouts) {
      clearTimeout(timeoutId);
    }
    clearInterval(<NodeJS.Timer>this._loginRefreshInterval);

    const getScope = () => `an_${Math.floor(Math.random() * 1000000000)}`;

    return axios.request<MiraieCloudAuthResponse>({
      method: 'post',
      url: CONSTANTS.loginUrl,
      data: {
        'mobile': this.config.mobile,
        'password': this.config.password,
        'clientId': CONSTANTS.httpClientId,
        'scope': getScope(),
      },
    }).then((response) => {
      this.accessToken = response.data.accessToken;
      this.expiresIn = parseInt(response.data.expiresIn);
      this._loginRefreshInterval =setInterval(this.login.bind(this),
        this.expiresIn);
    }).catch((error: AxiosError) => {
      this._loginRetryTimeouts.push(setTimeout(this.login.bind(this), LOGIN_RETRY_DELAY));
    });
  }

  /**
   * Fetches all devices that are registered with the user's MirAIe Cloud account.
   *
   * @returns A promise of all the user's devices.
   */
  async getHomes(): Promise<Home[]> {
    if (!this.accessToken) {
      return Promise.reject('No auth token available (login probably failed). ' +
        'Check your credentials and restart HomeBridge.');
    }
    return axios.request<MiraieCloudHomeResponse>({
      method: 'get',
      url: CONSTANTS.homesUrl,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    }).then((response) => {
      return response.data.homeList;
    }).catch((error: AxiosError) => {
      // this.log.debug('Comfort Cloud - getHomes(): Error');
      this.handleNetworkRequestError(error);
      return Promise.reject();
    });
  }

  getMqttDevices(homes): MQTTDevice[] {
    const mqttDevices: MQTTDevice[] = [];
    homes.forEach(home => {
      home.spaces.forEach(space => {
        space.devices.forEach(device => {
          const deviceName:string = device.deviceName.toLowerCase().replace(/\s/g, '-');
          const mqttDevice: any = {
            id: device.deviceId,
            name: deviceName,
            friendlyName: device.deviceName,
            controlTopic: device.topic ? `${device.topic[0]}/control` : '',
            statusTopic: device.topic ? `${device.topic[0]}/status` : '',
            connectionStatusTopic: device.topic ? `${device.topic[0]}/connectionStatus` : '',
          };
          mqttDevices.push(mqttDevice);
        });
      });
    });
    return mqttDevices;
  }

  // getMQTTDeviceStatus

  async getDeviceStatus(deviceId: string): Promise<MiraieCloudDeviceStatusResponse> {
    if (!this.accessToken) {
      return Promise.reject('No auth token available (login probably failed). ' +
        'Check your credentials and restart HomeBridge.');
    }

    if (!deviceId) {
      return Promise.reject('Cannot get device status for undefined deviceGuid.');
    }
    const url = CONSTANTS.statusUrl.replace('{deviceId}', deviceId);

    return axios.request<MiraieCloudDeviceStatusResponse>({
      method: 'get',
      url: url,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    }).then((response) => {
      return response.data;
    }).catch((error: AxiosError) => {
      // this.log.debug('Miraie Cloud - getDeviceStatus(): Error');
      this.handleNetworkRequestError(error);
      return Promise.reject();
    });
  }

  /**
   * Generic Axios error handler that checks which type of
   * error occurred and prints the respective information.
   *
   * @see https://axios-http.com/docs/handling_errors
   * @param error The error that is passes into the Axios error handler
   */
  handleNetworkRequestError(error: AxiosError) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx.
      // this.log.debug(error.response);
      if (error.response.status === 401) {
        // Unauthorised, try to log in again
        this._loginRetryTimeouts.push(setTimeout(this.login.bind(this), LOGIN_RETRY_DELAY));
      }
    } else if (error.request) {
      // The request was made but no response was received.
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      // this.log.debug(error.request);
    } else {
      // Something happened in setting up the request that triggered an error.
      // this.log.debug(error.message);
    }
  }

}

