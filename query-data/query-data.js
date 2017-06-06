'use strict';

var apiRequest = require('../lib/apiRequest.js');

module.exports = function(RED) {
  function QueryDataNode(config) {
    RED.nodes.createNode(this, config);

    this.server = RED.nodes.getNode(config.server);
    if (config.device) {
      this.device = JSON.parse(config.device);
    }
    this.boxId = config.boxId;
    this.metricName = config.metricName;
    this.startRelativeValue = config.startRelativeValue;
    this.startRelativeUnit = config.startRelativeUnit;
    this.startAbsolute = config.startAbsolute;
    this.endRelativeValue = config.endRelativeValue;
    this.endRelativeUnit = config.endRelativeUnit;
    this.endAbsolute = config.endAbsolute;
    this.aggregatorName = config.aggregatorName;
    this.aggregatorValue = config.aggregatorValue;
    this.aggregatorUnit = config.aggregatorUnit;
    this.name = config.name;
    this.return = config.return || 'txt';

    var node = this;

    node.on('input', function(msg) {
      var hasError = false;
      var errMsg;

      if (!node.server) {
        errMsg = JSON.stringify({error: 'No server config found! You have to select or create one.'});
        hasError = true;
      } else if (node.startRelativeValue === '' && node.startAbsolute === '') {
        errMsg = JSON.stringify({error: 'No start time found! You have to set either start relative or start absolute.'});
        hasError = true;
      } else if (node.metricName === '') {
        errMsg = JSON.stringify({error: 'No metric selected! You have to select one.'});
        hasError = true;
      }

      if (hasError) {
        node.error(errMsg);
        node.status({fill: 'red', shape: 'ring', text: '400'});
        node.send(errMsg);
      } else {
        // e.g. metricName=comfort.220037000f47343432313031.temp&startRelativeValue=5&startRelativeUnit=months&startAbsolute=1483228800&endRelativeValue=2&endRelativeUnit=months&endAbsolute=1488326400&aggregatorName=avg&aggregatorValue=1&aggregatorUnit=days
        var payload = 'metricName=' + encodeURIComponent('comfort.' + node.device.particleId + '.' + node.metricName);

        if (node.startRelativeValue && node.startRelativeUnit) {
          payload += '&startRelativeValue=' + encodeURIComponent(node.startRelativeValue);
          payload += '&startRelativeUnit=' + encodeURIComponent(node.startRelativeUnit);
        }
        if (node.startAbsolute) {
          payload += '&startAbsolute=' + encodeURIComponent(node.startAbsolute);
        }

        if (node.endRelativeValue && node.endRelativeUnit) {
          payload += '&endRelativeValue=' + encodeURIComponent(node.endRelativeValue);
          payload += '&endRelativeUnit=' + encodeURIComponent(node.endRelativeUnit);
        }
        if (node.endAbsolute) {
          payload += '&endAbsolute=' + encodeURIComponent(node.endAbsolute);
        }

        if (node.aggregatorName && node.aggregatorName !== 'none' && node.aggregatorValue && node.aggregatorUnit) {
          payload += '&aggregatorName=' + encodeURIComponent(node.aggregatorName);
          payload += '&aggregatorValue=' + encodeURIComponent(node.aggregatorValue);
          payload += '&aggregatorUnit=' + encodeURIComponent(node.aggregatorUnit);
        }

        var options = {
          hostname: node.server.host,
          port: node.server.port,
          path: '/api/ComfortBoxes/queryMetricData' + (node.server.accessToken ? '?access_token=' + node.server.accessToken : ''),
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

  RED.nodes.registerType('query data', QueryDataNode);
};
