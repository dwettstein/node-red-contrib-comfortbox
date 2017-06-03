module.exports = function(RED) {
  'use strict';

  var http = require('http');
  var https = require('https');
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

  // See here: https://stackoverflow.com/questions/37265230/node-red-get-configuration-node-value-in-admin-ui
  RED.httpAdmin.get('/api/ComfortBoxes', function(req, res) {
    var server = RED.nodes.getNode(req.query.server);

    var resObj = {};
    resObj.payload = "[]";
    if (server) {
      var payload = null;
      var options = {
        hostname: server.host,
        port: server.port,
        path: '/api/ComfortBoxes' + (server.accessToken ? '?access_token=' + server.accessToken : ''),
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }

      if (server.host === 'localhost') {
        // Ignore certificate errors if host is localhost.
        options.rejectUnauthorized = false;
      }

      var localReq = (server.protocol === 'https' ? https : http).request(options, function(localRes) {
        localRes.setEncoding('utf8');
        resObj.statusCode = localRes.statusCode;
        resObj.headers = localRes.headers;
        resObj.responseUrl = localRes.responseUrl;
        resObj.payload = "";

        localRes.on('data', function(chunk) {
          resObj.payload += chunk;
        });

        localRes.on('end', function() {
          res.setHeader('Content-Type', 'application/json');
          res.send(resObj.payload);
        });
      });

      localReq.on('error', function(err) {
        RED.log.error(err.toString());
        resObj.payload = err.toString();
        resObj.statusCode = err.code;
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(resObj));
      });

      if (payload) {
        localReq.write(payload);
      }

      localReq.end();
    } else {
      resObj.payload = 'Error: No server config found! You have to select or create one.';
      resObj.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(resObj));
    }
  });

  RED.nodes.registerType('configure box', ConfigureBoxNode);
};
