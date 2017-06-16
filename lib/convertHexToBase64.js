'use strict';

module.exports = function(hexColor) {
  if (hexColor.length % 2) {
    // Check if there is a '#' at the beginning.
    if (hexColor.startsWith('#')) {
      hexColor = hexColor.substring(1, hexColor.length);
    } else {
      return '';
    }
  }
  var binaryArray = [];
  for (var i = 0; i < hexColor.length / 2; i++) {
    var hexPart = hexColor.substr(i * 2, 2); // Parse to binary through the HEX string
    binaryArray[i] = parseInt(hexPart, 16);
  }
  var base64Color = new Buffer(binaryArray, 'binary').toString('base64');
  return base64Color;
};
