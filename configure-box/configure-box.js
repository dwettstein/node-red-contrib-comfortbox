'use strict';

var apiRequest = require('../lib/apiRequest.js');

module.exports = function(RED) {
  function ConfigureBoxNode(config) {
    RED.nodes.createNode(this, config);

    // Tab general
    this.server = RED.nodes.getNode(config.server);
    this.device = config.device;
    this.boxId = config.boxId;
    this.boxName = config.boxName;
    this.particleId = config.particleId;

    this.labels = config.labels ? config.labels.split(/[,]\s?/) : [];
    this.return = config.return || 'txt';

    // Tab MQTT
    this.mqttHost = config.mqttHost;
    this.mqttPort = config.mqttPort;

    // Tab data
    this.dataInterval = config.dataInterval;
    this.worktime = config.worktime;
    this.doShowDataRegularly = config.doShowDataRegularly;

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

      node.status({});
      var responseMsgs = [];

      // ********************************************************************************
      // Update API information (PATCH /api/ComfortBoxes/:id)
      // ********************************************************************************
      var doBoxPatch = false;
      var comfortbox = {};
      if (node.device && node.boxName !== node.device.name) {
        comfortbox.name = node.boxName;
        doBoxPatch = true;
      }
      if (node.device && node.particleId !== node.device.particleId) {
        comfortbox.particleId = node.particleId;
        doBoxPatch = true;
      }
      if (node.device && (node.labels && node.labels.length > 0 && JSON.stringify(node.labels) !== JSON.stringify(node.device.labels))) {
        comfortbox.labels = node.labels;
        doBoxPatch = true;
      }

      RED.log.info('Execute box patch? ' + doBoxPatch);
      if (doBoxPatch) {
        var boxPatchPayload = JSON.stringify(comfortbox);
        var boxPatchOptions = {
          hostname: node.server.host,
          port: node.server.port,
          path: '/api/ComfortBoxes/' + node.boxId + (node.server.accessToken ? '?access_token=' + node.server.accessToken : ''),
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(boxPatchPayload),
            'Accept': 'application/json',
          },
        };

        if (node.server.host === 'localhost') {
          // Ignore certificate errors if host is localhost.
          boxPatchOptions.rejectUnauthorized = false;
        }

        apiRequest(node.server.useTls, node.return, boxPatchOptions, boxPatchPayload, function(res) {
          if (res && res.statusCode / 100 !== 2) {
            node.error(res);
            node.status({fill: 'red', shape: 'ring', text: res.statusCode});
          }
          responseMsgs += res.payload;
        });
      }

      // ********************************************************************************
      // Update MQTT information
      // ********************************************************************************
      RED.log.info('Execute MQTT update? ' + (node.mqttHost && node.mqttPort));
      if (node.mqttHost && node.mqttPort) {
        // e.g. host=localhost&port=1883
        var mqttUpdatePayload = 'host=' + encodeURIComponent(node.mqttHost) + '&port=' + encodeURIComponent(node.mqttPort);
        var mqttUpdateOptions = {
          hostname: node.server.host,
          port: node.server.port,
          path: '/api/ComfortBoxes/' + node.boxId + '/setMqttHost' + (node.server.accessToken ? '?access_token=' + node.server.accessToken : ''),
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(mqttUpdatePayload),
            'Accept': 'application/json',
          },
        };

        if (node.server.host === 'localhost') {
          // Ignore certificate errors if host is localhost.
          mqttUpdateOptions.rejectUnauthorized = false;
        }

        apiRequest(node.server.protocol, node.return, mqttUpdateOptions, mqttUpdatePayload, function(res) {
          if (res && res.statusCode / 100 !== 2) {
            node.error(res);
            node.status({fill: 'red', shape: 'ring', text: res.statusCode});
          }
          responseMsgs += res.payload;
        });
      }

      // ********************************************************************************
      // Update data interval
      // ********************************************************************************
      RED.log.info('Execute interval update? ' + node.dataInterval);
      if (node.dataInterval) {
        // e.g. interval=5
        var intervalPayload = 'interval=' + encodeURIComponent(node.dataInterval);
        var intervalOptions = {
          hostname: node.server.host,
          port: node.server.port,
          path: '/api/ComfortBoxes/' + node.boxId + '/setInterval' + (node.server.accessToken ? '?access_token=' + node.server.accessToken : ''),
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(intervalPayload),
            'Accept': 'application/json',
          },
        };

        if (node.server.host === 'localhost') {
          // Ignore certificate errors if host is localhost.
          intervalOptions.rejectUnauthorized = false;
        }

        apiRequest(node.server.protocol, node.return, intervalOptions, intervalPayload, function(res) {
          if (res && res.statusCode / 100 !== 2) {
            node.error(res);
            node.status({fill: 'red', shape: 'ring', text: res.statusCode});
          }
          responseMsgs += res.payload;
        });
      }

      // ********************************************************************************
      // Update working hours
      // ********************************************************************************
      RED.log.info('Execute worktime update? ' + node.worktime);
      if (node.worktime) {
        // e.g. worktime=08%3A00-17%3A00
        var worktimePayload = 'worktime=' + encodeURIComponent(node.worktime);
        var worktimeOptions = {
          hostname: node.server.host,
          port: node.server.port,
          path: '/api/ComfortBoxes/' + node.boxId + '/setWorktime' + (node.server.accessToken ? '?access_token=' + node.server.accessToken : ''),
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(worktimePayload),
            'Accept': 'application/json',
          },
        };

        if (node.server.host === 'localhost') {
          // Ignore certificate errors if host is localhost.
          worktimeOptions.rejectUnauthorized = false;
        }

        apiRequest(node.server.protocol, node.return, worktimeOptions, worktimePayload, function(res) {
          if (res && res.statusCode / 100 !== 2) {
            node.error(res);
            node.status({fill: 'red', shape: 'ring', text: res.statusCode});
          }
          responseMsgs += res.payload;
        });
      }

      // ********************************************************************************
      // doShowDataUpdate
      // ********************************************************************************
      RED.log.info('Execute show data regularly update? ' + node.doShowDataRegularly);
      if (node.doShowDataRegularly) {
        // e.g. doShowDataRegularly=true
        var showDataPayload = 'doShowDataRegularly=' + encodeURIComponent(node.doShowDataRegularly);
        var showDataOptions = {
          hostname: node.server.host,
          port: node.server.port,
          path: '/api/ComfortBoxes/' + node.boxId + '/setShowDataRegularly' + (node.server.accessToken ? '?access_token=' + node.server.accessToken : ''),
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(showDataPayload),
            'Accept': 'application/json',
          },
        };

        if (node.server.host === 'localhost') {
          // Ignore certificate errors if host is localhost.
          showDataOptions.rejectUnauthorized = false;
        }

        apiRequest(node.server.protocol, node.return, showDataOptions, showDataPayload, function(res) {
          if (res && res.statusCode / 100 !== 2) {
            node.error(res);
            node.status({fill: 'red', shape: 'ring', text: res.statusCode});
          }
          responseMsgs += res.payload;
        });
      }

      // ********************************************************************************
      // Send node response after 2 seconds (not a very good solution, I know...)
      // ********************************************************************************
      setTimeout(function() {
        if (responseMsgs.length === 0) {
          msg.payload = 'The node had nothing to configure.';
          node.send(msg);
        } else {
          msg.payload = JSON.stringify({responses: responseMsgs});
          node.send(msg);
        }
      }, 2000);
    });

    node.on('close', function() {
      node.status({});
    });
  }

  RED.nodes.registerType('configure box', ConfigureBoxNode);
};
