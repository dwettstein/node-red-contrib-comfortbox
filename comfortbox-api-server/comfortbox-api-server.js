'use strict';

var apiRequest = require('../lib/apiRequest.js');

module.exports = function(RED) {
  function ComfortboxApiServerNode(config) {
    RED.nodes.createNode(this, config);

    this.host = config.host || 'localhost';
    this.port = config.port || '3000';
    this.useTls = config.useTls || false;
    this.accessToken = config.accessToken;
  }

  RED.httpAdmin.get('/node-red/ComfortBoxes', function(req, res) {
    var server;
    if (req.query && req.query.server) {
      server = RED.nodes.getNode(req.query.server);
    }

    if (!server) {
      var resObjErr = {};
      resObjErr.error = 'The server config with id "' + req.query.server + '" was not found! Please deploy the flow at least once.';
      resObjErr.statusCode = 500;
      res.send(JSON.stringify(resObjErr));
    } else {
      var payload = null;
      var options = {
        hostname: server.host,
        port: server.port,
        path: '/api/ComfortBoxes' + (server.accessToken ? '?access_token=' + server.accessToken : ''),
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };

      if (server.host === 'localhost') {
        // Ignore certificate errors if host is localhost.
        options.rejectUnauthorized = false;
      }

      apiRequest(server.useTls ? 'https' : 'http', 'txt', options, payload, function(resObj) {
        res.setHeader('Content-Type', 'application/json');
        if (resObj && resObj.statusCode / 100 !== 2) {
          res.send(JSON.stringify(resObj));
        } else {
          res.send(resObj.payload);
        }
      });
    }
  });

  RED.nodes.registerType('comfortbox-api-server', ComfortboxApiServerNode);
};
