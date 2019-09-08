'use strict'

const stampTypeObj = {
  map: new Map([["circle", "&#x2b55;"], ["check", "&#x2705;"], ["smile", "&#x1f603;"], ["heart", "&#x2764;"], ["star", "&#x2b50;"], ["bell", "&#x1f514;"]]),
  defaultType: function() {
    return Array.from(this.map.keys())[0];
  }
}

module.exports = stampTypeObj;
