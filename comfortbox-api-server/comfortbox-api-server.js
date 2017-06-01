module.exports = function(RED) {
  'use strict';

  function ComfortboxApiServerNode(config) {
    RED.nodes.createNode(this, config);
    this.host = config.host;
    this.port = config.port;
    this.protocol = config.protocol;
    this.accessToken = config.accessToken;
  }
  RED.nodes.registerType("comfortbox-api-server", ComfortboxApiServerNode);
}
