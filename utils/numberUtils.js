// Zero pads a number to a specified length
const zeroPadNumber = (number, length) => {
    return number.toString().padStart(length, '0');
  };
  
  module.exports = {
    zeroPadNumber
  };
  