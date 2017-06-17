'use strict';

var apiRequest = require('../lib/apiRequest.js');
var convertHexToBase64 = require('../lib/convertHexToBase64.js');

module.exports = function(RED) {
  function DisplayColorNode(config) {
    RED.nodes.createNode(this, config);

    this.server = RED.nodes.getNode(config.server);
    this.device = config.device;
    this.boxId = config.boxId;
    this.useForAll = config.useForAll;
    this.color1 = config.color1;
    this.color2 = config.color2;
    this.color3 = config.color3;
    this.color4 = config.color4;
    this.color5 = config.color5;
    this.color6 = config.color6;
    this.color7 = config.color7;
    this.color8 = config.color8;
    this.color9 = config.color9;
    this.color10 = config.color10;
    this.color11 = config.color11;
    this.color12 = config.color12;
    this.color13 = config.color13;
    this.color14 = config.color14;
    this.color15 = config.color15;
    this.color16 = config.color16;
    this.color17 = config.color17;
    this.color18 = config.color18;
    this.color19 = config.color19;
    this.color20 = config.color20;
    this.color21 = config.color21;
    this.color22 = config.color22;
    this.color23 = config.color23;
    this.color24 = config.color24;
    this.name = config.name;
    this.return = config.return || 'txt';

    var node = this;

    node.on('input', function(msg) {
      if (node.device === 'payload') {
        try {
          if (typeof msg.payload === 'string') {
            node.device = JSON.parse(msg.payload);
          } else {
            node.device = msg.payload;
          }
          node.boxId = node.device.id;
          node.particleId = node.device.particleId;
        } catch (e) {
          node.error(e.message);
          node.status({fill: 'red', shape: 'ring', text: e.message});
          msg.payload = e.message;
          node.send(msg);
          return;
        }
      } else if (node.device === 'manual') {
        node.device = {
          id: node.boxId,
          name: node.boxName,
          particleId: node.particleId,
          labels: node.labels,
        };
      } else {
        try {
          if (typeof node.device === 'string') {
            node.device = JSON.parse(node.device);
          }
        } catch (e) {
          node.error(e.message);
          node.status({fill: 'red', shape: 'ring', text: e.message});
          msg.payload = e.message;
          node.send(msg);
          return;
        }
      }

      if (!node.server) {
        var errMsg = JSON.stringify({error: 'No server config found! You have to select or create one.'});
        node.error(errMsg);
        node.status({fill: 'red', shape: 'ring', text: '400'});
        node.send(errMsg);
      } else {
        var payload, requestPath;
        if (node.useForAll) {
          requestPath = '/api/ComfortBoxes/' + node.boxId + '/displayHexColor' + (node.server.accessToken ? '?access_token=' + node.server.accessToken : '');
          if (node.color1) {
            payload = 'colorInHex=' + encodeURIComponent(node.color1);
          }
        } else {
          requestPath = '/api/ComfortBoxes/' + node.boxId + '/displayLed' + (node.server.accessToken ? '?access_token=' + node.server.accessToken : '');
          payload = 'colorsInBase64=';
          for (var i = 1; i <= 24; i++) {
            var base64Color = convertHexToBase64(node['color' + i]);
            if (base64Color !== '') {
              payload += base64Color;
            } else {
              payload += 'AAAA';
            }
          }
        }

        var options = {
          hostname: node.server.host,
          port: node.server.port,
          path: requestPath,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(payload),
            'Accept': 'application/json',
          },
        };

        if (node.server.host === 'localhost') {
          // Ignore certificate errors if host is localhost.
          options.rejectUnauthorized = false;
        }

        apiRequest(node.server.useTls, node.return, options, payload, function(res) {
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

  RED.nodes.registerType('display color', DisplayColorNode);
};
