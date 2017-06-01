module.exports = function(RED) {
  'use strict';

  var http = require('http');
  var https = require('https');

  function DisplayTextNode(config) {
    RED.nodes.createNode(this, config);

    this.server = RED.nodes.getNode(config.server);
    this.boxId = config.boxId;
    this.text = config.text;
    this.name = config.name;
    this.return = config.return || "txt";

    var node = this;

    node.on('input', function(msg) {
      if (node.server) {
        var payload = 'text=' + encodeURIComponent(msg.payload);

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
        }

        if (node.server.host === 'localhost') {
          // Ignore certificate errors if host is localhost.
          options.rejectUnauthorized = false;
        }

        var req = (node.server.protocol === 'https' ? https : http).request(options, function(res) {
          (node.return === "bin") ? res.setEncoding('binary') : res.setEncoding('utf8');
          msg.statusCode = res.statusCode;
          msg.headers = res.headers;
          msg.responseUrl = res.responseUrl;
          msg.payload = "";

          res.on('data', function(chunk) {
            msg.payload += chunk;
          });

          res.on('end', function() {
            if (node.return === "bin") {
              msg.payload = new Buffer(msg.payload, "binary");
            } else if (node.return === "obj") {
              try {
                msg.payload = JSON.parse(msg.payload);
              } catch(e) {
                node.warn(RED._("httpin.errors.json-error"));
              }
            }
            node.send(msg);
            node.status({});
          });
        });

        req.on('error', function(err) {
          node.error(err, msg);
          msg.payload = err.toString();
          msg.statusCode = err.code;
          node.send(msg);
          node.status({fill: 'red', shape: 'ring', text: err.code});
        });

        if (payload) {
          req.write(payload);
        }

        req.end();
      } else {
        msg.payload = 'Error: No server config found! You have to select or create one.';
        msg.statusCode = 400;
        node.error(msg);
        node.send(msg);
        node.status({fill: 'red', shape: 'ring', text: msg.statusCode});
      }
    });

    node.on("close", function() {
      node.status({});
    });
  }

  RED.nodes.registerType('display text', DisplayTextNode);
};
