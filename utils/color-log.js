'use strict'

const colorLog = {
  blak:'\u001b[30m',
  red:'\u001b[31m',
  green:'\u001b[32m',
  yellow:'\u001b[33m',
  blue:'\u001b[34m',
  magenta:'\u001b[35m',
  cyan:'\u001b[36m',
  white:'\u001b[37m',
  reset:'\u001b[0m',
  color: function(color, value) {
    // TODO: 
    // const c = Function('"use strict";return (this.' + color + ')')();
    const c = eval('this.' + color);
    console.log(`${c}${value}${this.reset}`);
  }
}

module.exports = colorLog;
