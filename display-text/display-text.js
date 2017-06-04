module.exports = function(RED) {
  'use strict';

  var apiRequest = require('../lib/apiRequest.js');

  function DisplayTextNode(config) {
    RED.nodes.createNode(this, config);

    this.server = RED.nodes.getNode(config.server);
    this.boxId = config.boxId;
    this.text = config.text;
    this.name = config.name;
    this.return = config.return || "txt";

    var node = this;

    node.on('input', function(msg) {
      if (!node.server) {
        var errMsg = JSON.stringify({error: 'No server config found! You have to select or create one.'});
        node.error(errMsg);
        node.status({fill: 'red', shape: 'ring', text: '400'});
        node.send(errMsg);
      } else {
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
        };

        if (node.server.host === 'localhost') {
          // Ignore certificate errors if host is localhost.
          options.rejectUnauthorized = false;
        }

        apiRequest(node.server.protocol, node.return, options, payload, function (res) {
          node.status({});
          if (res && res.statusCode / 100 != 2) {
            node.error(res);
            node.status({fill: 'red', shape: 'ring', text: res.statusCode});
          }
          node.send(res);
        });
      }
    });

    node.on("close", function() {
      node.status({});
    });
  }

  RED.nodes.registerType('display text', DisplayTextNode);
};
