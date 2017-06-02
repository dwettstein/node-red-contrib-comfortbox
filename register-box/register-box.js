module.exports = function(RED) {
  'use strict';

  var requestComfortboxApi = require('../lib/requestComfortboxApi.js');

  function RegisterBoxNode(config) {
    RED.nodes.createNode(this, config);

    var inputLabels = [];
    if (config.labels) {
      inputLabels = config.labels.split(/[,]\s?/);
    }

    this.server = RED.nodes.getNode(config.server);
    this.boxName = config.boxName;
    this.particleId = config.particleId;
    this.created = config.created || (new Date()).toISOString();
    this.labels = inputLabels;
    this.return = config.return || "txt";

    var node = this;

    node.on('input', function(msg) {

      var comfortbox = {
        name: node.boxName,
        particleId: node.particleId,
        created: node.created,
        labels: node.labels
      }

      var payload = JSON.stringify(comfortbox);

      var options = {
        hostname: node.server.host,
        port: node.server.port,
        path: '/api/ComfortBoxes' + (node.server.accessToken ? '?access_token=' + node.server.accessToken : ''),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  RED.nodes.registerType('register box', RegisterBoxNode);
};
