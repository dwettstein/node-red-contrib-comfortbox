module.exports = function(RED) {
  'use strict';

  var apiRequest = require('../lib/apiRequest.js');

  function ComfortboxApiServerNode(config) {
    RED.nodes.createNode(this, config);
    this.host = config.host;
    this.port = config.port;
    this.protocol = config.protocol;
    this.accessToken = config.accessToken;
  }

  RED.httpAdmin.get('/node-red/ComfortBoxes', function(req, res) {
    if (req.query && req.query.server) {
      var server = RED.nodes.getNode(req.query.server);
    }

    var resObj = {};
    if (!server) {
      //JSON.stringify({error: 'No server config found! You have to select or create one.'});
      resObj.payload = "[]"
      resObj.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      //res.send(JSON.stringify(resObj));
      res.send(resObj.payload);
    } else {
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

      apiRequest(server.protocol, 'txt', options, payload, function (resObj) {
        res.setHeader('Content-Type', 'application/json');
        if (resObj && resObj.statusCode / 100 != 2) {
          res.send(JSON.stringify(resObj));
        } else {
          res.send(resObj.payload);
        }
      });
    }
  });

  RED.nodes.registerType("comfortbox-api-server", ComfortboxApiServerNode);
}
