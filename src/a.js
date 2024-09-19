const {cc} = require("bun:ffi")
const {join}  = require('path')

const pathToCFile = join(__dirname, 'main.c');


module.exports = {
    symbols: { str }
  } = cc({
    source: pathToCFile,
    symbols: {
      str: {
        returns: "void",
        args: [2]
      }
    }
  });

  str(2)
