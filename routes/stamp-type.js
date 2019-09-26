'use strict'

const stampTypeObj = {
  map: new Map(
    [
      ["circle", "&#x2b55;"],
      ["check", "&#x2705;"],
      ["smile", "&#x1f603;"],
      ["heart", "&#x2764;"],
      ["star", "&#x2b50;"],
      ["bell", "&#x1f514;"],
      ["ok", "&#x1f197;"],
      ["paw", "&#x1f43e;"],
      ["cat", "&#x1f408;"],
      ["chipmunk", "&#x1f43f;"],
      ["panda", "&#x1f43c;"],
      ["koala", "&#x1f428;"],
      ["chick", "&#x1f425;"],
      ["penguin", "&#x1f427;"],
      ["whale", "&#x1f433;"],
      ["sunflower", "&#x1f33b;"],
    ]
  ),
  defaultType: function() {
    return Array.from(this.map.keys())[0];
  }
}

module.exports = stampTypeObj;
