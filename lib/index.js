'use strict';

function whoSetIt (obj) {
  const locations = [];
  const revocable = Proxy.revocable(obj, {
    set (target, property, value, receiver) {
      if ((property in target) === false) {
        const frame = (new Error()).stack.split('\n')[2];
        const at = frame.match(/^\s*at (?:.+\()?(.+):(\d+):(\d+)\)?$/);

        locations.push({
          property,
          filename: at[1],
          line: at[2],
          column: at[3]
        });
      }

      target[property] = value;
      return true;
    }
  });

  return {
    proxy: revocable.proxy,
    locations,
    revoke () {
      revocable.revoke();

      return obj;
    }
  };
}

module.exports = whoSetIt;
