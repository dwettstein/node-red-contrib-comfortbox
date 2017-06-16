'use strict';

var amqp = require('amqplib');

module.exports = function(RED) {
  function EventTriggerNode(config) {
    RED.nodes.createNode(this, config);

    this.amqpServer = RED.nodes.getNode(config.amqpServer);
    // this.server = RED.nodes.getNode(config.server);
    this.device = config.device;
    this.boxId = config.boxId;
    this.particleId = config.particleId;
    this.metricName = config.metricName;
    this.routingKey = 'comfort.' + config.particleId + '.' + config.metricName;
    this.queueName = (config.queueName || this.routingKey)  + '-' + this.id;

    var node = this;

    node.channel = null;
    node.queue = null;

    if (node.amqpServer) {
      node.status({fill: 'green', shape: 'ring', text: 'connecting'});
      node.amqpServer.claimConnection().then(function(connection) {
        node.log('Creating AMQP channel');
        var channelPromise = connection.createChannel();
        channelPromise.then(function(channel) {
          node.channel = channel;
          node.channel.checkExchange('amq.topic').then(function() {
            node.status({fill: 'green', shape: 'dot', text: 'connected'});
            // execute node specific initialization
            node.initialize();
          }).catch(function(err) {
            node.status({fill: 'red', shape: 'dot', text: 'connect error'});
            node.error('Connect error: ' + err.message);
          });
        }).then(null, node.error);
      }).catch(function(err) {
        node.status({fill: 'red', shape: 'dot', text: 'connect error'});
        node.error('Connect error: ' + err.message);
      });

      node.on('close', function() {
        if (node.channel) {
          if (node.queue) {
            node.channel.deleteQueue(node.queueName);
          }
          node.channel.close().then(function() {
            node.amqpServer.freeConnection();
            node.status({fill: 'red', shape: 'ring', text: 'disconnected'});
          }).catch(function(err) {
            node.amqpServer.freeConnection();
            node.status({fill: 'red', shape: 'dot', text: 'disconnect error'});
            node.error('Disconnect error: ' + err.message);
          });
        } else {
          node.amqpServer.freeConnection();
          node.status({fill: 'red', shape: 'ring', text: 'disconnected'});
        }
      });
    } else {
      node.status({fill: 'red', shape: 'dot', text: 'error'});
      node.error('Error: missing AMQP server configuration');
    }

    // node specific initialization code
    node.initialize = function() {
      node.log('Initializing queue "' + node.queueName + '" and binding');

      function handleMsg(msg) {
        node.send({
          topic: msg.fields.routingKey.toString(),
          payload: msg.content.toString(),
          amqpMessage: msg,
        });
      }

      node.queue = node.channel.assertQueue(node.queueName, {durable: false, exclusive: true, autoDelete: true});
      node.queue.then(function() {
        node.channel.bindQueue(node.queueName, 'amq.topic', node.routingKey).then(function() {
          node.log('Starting to consume messages');
          node.channel.consume(node.queueName, handleMsg.bind(this), {noAck: true}).then(function() {
            node.status({fill: 'green', shape: 'dot', text: 'connected'});
          }).catch(function(e) {
            node.status({fill: 'red', shape: 'dot', text: 'error'});
            node.error('Error: ' + e.message);
          });
        });
      });
    };
  }

  RED.nodes.registerType('event trigger', EventTriggerNode);
};
