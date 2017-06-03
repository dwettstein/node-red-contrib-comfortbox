module.exports = function(RED) {
  'use strict';

  var requestComfortboxApi = require('../lib/requestComfortboxApi.js');

  function ConfigureBoxNode(config) {
    RED.nodes.createNode(this, config);

    var inputLabels = [];
    if (config.labels) {
      inputLabels = config.labels.split(/[,]\s?/);
    }

    // Tab general
    this.server = RED.nodes.getNode(config.server);
    this.boxId = config.boxId;
    this.boxName = config.boxName;
    this.particleId = config.particleId;
    this.labels = inputLabels;
    this.return = config.return || "txt";

    // Tab MQTT
    this.mqttHost = config.mqttHost;
    this.mqttPort = config.mqttPort;

    // Tab data
    this.dataInterval = config.dataInterval;
    this.worktime = config.worktime;
    this.doShowDataRegularly = config.doShowDataRegularly;

    var node = this;

    node.on('input', function(msg) {

      var doPatchBox = false;
      var comfortbox = {};
      if (node.boxName) {
        comfortbox.name = node.boxName;
        doPatchBox = true;
      }
      if (node.particleId) {
        comfortbox.particleId = node.particleId;
        doPatchBox = true;
      }
      if (node.labels && node.labels.length > 0) {
        comfortbox.labels = node.labels;
        doPatchBox = true;
      }

      if (doPatchBox) {
        var payload = JSON.stringify(comfortbox);
        var options = {
          hostname: node.server.host,
          port: node.server.port,
          path: '/api/ComfortBoxes/' + node.boxId + (node.server.accessToken ? '?access_token=' + node.server.accessToken : ''),
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'Accept': 'application/json'
          }
        }
        requestComfortboxApi(msg, node, options, payload);
      } else {
        msg.payload = "The node had nothing to configure.";
        node.send(msg);
        node.status({});
      }

    });

    node.on("close", function() {
      node.status({});
    });
  }

  RED.nodes.registerType('configure box', ConfigureBoxNode);
};