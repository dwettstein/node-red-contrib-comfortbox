module.exports = function(protocol, returnType, options, payload, callback) {
  'use strict';

  var http = require('http');
  var https = require('https');

  if (!protocol) {
    protocol = "http";
  }

  var resObj = {};
  var req = (protocol === 'https' ? https : http).request(options, function(res) {
    (returnType === "bin") ? res.setEncoding('binary') : res.setEncoding('utf8');
    resObj.statusCode = res.statusCode;
    resObj.headers = res.headers;
    resObj.responseUrl = res.responseUrl;
    resObj.payload = "";

    res.on('data', function(chunk) {
      resObj.payload += chunk;
    });

    res.on('end', function() {
      if (returnType === "bin") {
        resObj.payload = new Buffer(resObj.payload, "binary");
      } else if (returnType === "obj") {
        try {
          resObj.payload = JSON.parse(resObj.payload);
        } catch (e) {
          resObj.error = e.toString();
          resObj.statusCode = 500;
        }
      }
      if (callback && typeof callback === 'function') {
        callback(resObj);
      }
    });
  });

  req.on('error', function(err) {
    resObj.error = err.toString();
    if (err.code == 'ENOTFOUND') {
      resObj.statusCode = 400;
    } else {
      resObj.statusCode = 500;
    }
    if (callback && typeof callback === 'function') {
      callback(resObj);
    }
  });

  if (payload) {
    req.write(payload);
  }

  req.end();
};
