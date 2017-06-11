'use strict';

var amqp = require('amqplib');

module.exports = function(RED) {
  function ComfortboxAmqpServerNode(config) {
    RED.nodes.createNode(this, config);

    this.host = config.host || 'localhost';
    this.port = config.port || '5672';
    this.useTls = config.useTls || false;
    this.vhost = config.vhost;
    this.keepAlive = config.keepalive;

    var node = this;

    node.clientCount = 0;
    node.connection = null;

    node.claimConnection = function() {
      if (node.clientCount === 0) {
        // Create the connection url for the AMQP server
        var urlType = node.useTls ? 'amqps://' : 'amqp://';
        var credentials = '';
        if (node.credentials.user) {
          credentials = node.credentials.user + ':' + node.credentials.password + '@';
        }
        var urlLocation = node.host + ':' + node.port;
        if (node.vhost) {
          urlLocation += '/' + node.vhost;
        }
        if (node.keepAlive) {
          urlLocation += '?heartbeat=' + node.keepAlive;
        }

        node.connection = amqp.connect(urlType + credentials + urlLocation).then(function(conn) {
          node.log('Connected to ComfortBox AMQP server ' + urlType + urlLocation);
          return conn;
        }).then(null, node.error);
      }
      node.clientCount++;

      return node.connection;
    };

    node.freeConnection = function() {
      node.clientCount--;
      if (node.clientCount === 0) {
        node.connection.then(function(connection) {
          connection.close().then(function() {
            node.connection = null;
            node.log('Server connection ' + node.host + ':' + node.port + ' closed');
          });
        }).catch(function(e) {
          node.error('Error closing connection: ' + e.message);
        });
      }
    };
  }

  RED.nodes.registerType('comfortbox-amqp-server', ComfortboxAmqpServerNode, {
    credentials: {
      user: {type: 'text'},
      password: {type: 'password'},
    },
  });
};
