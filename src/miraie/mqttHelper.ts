import * as mqtt from 'mqtt'
import {IClientPublishOptions, QoS} from 'mqtt';

export default class MqttHelper {
  private _client: mqtt.MqttClient = mqtt.connect('mqtt://test.mosquitto.org');

  connect (host, port, clientId, useSSL, username, password, clean) {
    const protocol = useSSL === 'true' ? 'tls' : 'mqtt';
    const connectUrl = `${protocol}://${host}:${port}`;

    this._client = mqtt.connect(connectUrl, {
      clientId,
      clean,
      username,
      password,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });
  }

  disconnect () {
    this._client.end();
  }

  publish (topic, payload, qos:QoS = 0, retain = false) {
    const message = typeof (payload) === 'object'
      ? JSON.stringify(payload)
      : payload;

    const options: IClientPublishOptions = {
      qos: qos,
      retain: retain,
    };

    this._client.publish(topic, message, options);
  }
}

