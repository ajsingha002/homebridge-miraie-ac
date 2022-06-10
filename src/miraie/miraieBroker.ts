import MqttHelper from './mqttHelper';
// import Logger from './logger';

export default class MiraieBroker {
  private mqttHelper;

  private CMD_TYPES;
  private powerModes;
  private acModes;
  private fanModes;

  constructor () {

    this.CMD_TYPES = {
      POWER: 'power',
      MODE: 'mode',
      TEMPERATURE: 'temp',
      FAN: 'fan',
    };

    this.powerModes = {
      OFF: 'off',
      ON: 'on',
    };

    this.acModes = {
      COOL: 'cool',
      DRY: 'dry',
      FAN: 'fan',
      AUTO: 'auto',
    };

    this.fanModes = {
      HIGH: 'high',
      LOW: 'low',
      AUTO: 'auto',
    };
    this.mqttHelper = new MqttHelper();
  }

  generateRandomNumber (len: number): number {
    return Math.floor(Math.random() * Math.pow(10, len));
  }

  generateClientId (): string {
    return `an${this.generateRandomNumber(16)}${this.generateRandomNumber(5)}`;
  }

  buildBasePayload (device) {
    return {
      'ki': 1,
      'cnt': 'an',
      'sid': '1',
    };
  }

  generatePowerMessage (basePayload, command, topic) {
    const powerMessage = {
      topic,
      payload: {
        ...basePayload,
        ps: command,
      },
    };

    return [powerMessage];
  }

  generateModeMessage (basePayload, command, topic) {
    const modeMessage = {
      topic,
      payload: {
        ...basePayload,
        acmd: command,
      },
    };

    return [modeMessage];
  }

  generateTemperatureMessage (basePayload, command, topic) {
    return [{
      topic,
      payload: {
        ...basePayload,
        'actmp': command,
      },
    }];
  }

  generateFanMessage (basePayload, command, topic) {
    return [{
      topic,
      payload: {
        ...basePayload,
        acfs: command,
      },
    }];
  }

  generateMessages (topic, command, cmdType, basePayload) {
    switch (cmdType) {
      case this.CMD_TYPES.POWER:
        return this.generatePowerMessage(basePayload, command.toLowerCase(), topic);
      case this.CMD_TYPES.MODE:
        return this.generateModeMessage(basePayload, command.toLowerCase(), topic);
      case this.CMD_TYPES.TEMPERATURE:
        return this.generateTemperatureMessage(basePayload, command.toLowerCase(), topic);
      case this.CMD_TYPES.FAN:
        return this.generateFanMessage(basePayload, command.toLowerCase(), topic);
    }
    return [];
  }

  connect = (constants, username, password) => {
    const clientId = this.generateClientId();
    const useSsl = 'true';
    this.mqttHelper.connect(constants.mirAIeBrokerHost, constants.mirAIeBrokerPort, clientId, useSsl, username, password, false);
  };

  publish (device, command, commandType) {
    const basePayload = this.buildBasePayload(device);
    const messages = this.generateMessages(device.controlTopic, command, commandType, basePayload);
    messages.map(m => this.mqttHelper.publish(m.topic, m.payload, 0, false));
  }

  disconnect () {
    this.mqttHelper.disconnect();
  }
}
