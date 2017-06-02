module.exports = function(msg, node, options, payload) {
  'use strict';

  var http = require('http');
  var https = require('https');

  if (node && node.server) {
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
};
