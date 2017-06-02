module.exports = function(RED) {
  'use strict';

  var requestComfortboxApi = require('../lib/requestComfortboxApi.js');

  function DisplayTextNode(config) {
    RED.nodes.createNode(this, config);

    this.server = RED.nodes.getNode(config.server);
    this.boxId = config.boxId;
    this.text = config.text;
    this.name = config.name;
    this.return = config.return || "txt";

    var node = this;

    node.on('input', function(msg) {
      var payload;
      if (node.text) {
        payload = 'text=' + encodeURIComponent(node.text);
      } else {
        payload = 'text=' + encodeURIComponent(msg.payload);
      }

      var options = {
        hostname: node.server.host,
        port: node.server.port,
        path: '/api/ComfortBoxes/' + node.boxId + '/displayText' + (node.server.accessToken ? '?access_token=' + node.server.accessToken : ''),
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(payload),
          'Accept': 'application/json'
        }
      }

      requestComfortboxApi(msg, node, options, payload);
    });

    node.on("close", function() {
      node.status({});
    });
  }

  RED.nodes.registerType('display text', DisplayTextNode);
};
