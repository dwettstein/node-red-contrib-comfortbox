'use strict';

var apiRequest = require('../lib/apiRequest.js');

module.exports = function(RED) {
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
    this.return = config.return || 'txt';

    var node = this;

    node.on('input', function(msg) {
      if (!node.server) {
        var errMsg = JSON.stringify({error: 'No server config found! You have to select or create one.'});
        node.error(errMsg);
        node.status({fill: 'red', shape: 'ring', text: '400'});
        node.send(errMsg);
      } else {
        var comfortbox = {
          name: node.boxName,
          particleId: node.particleId,
          created: node.created,
          labels: node.labels,
        };

        var payload = JSON.stringify(comfortbox);

        var options = {
          hostname: node.server.host,
          port: node.server.port,
          path: '/api/ComfortBoxes' + (node.server.accessToken ? '?access_token=' + node.server.accessToken : ''),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'Accept': 'application/json',
          },
        };

        if (node.server.host === 'localhost') {
          // Ignore certificate errors if host is localhost.
          options.rejectUnauthorized = false;
        }

        apiRequest(node.server.protocol, node.return, options, payload, function(res) {
          node.status({});
          if (res && res.statusCode / 100 !== 2) {
            node.error(res);
            node.status({fill: 'red', shape: 'ring', text: res.statusCode});
          }
          node.send(res);
        });
      }
    });

    node.on('close', function() {
      node.status({});
    });
  }

  RED.nodes.registerType('register box', RegisterBoxNode);
};
