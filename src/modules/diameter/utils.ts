import e = require('express');

let deserializeBuffers = function (object: any) {
  Object.keys(object).forEach(k => {
    const value = object[k];
    if (value instanceof Object) {
      if (value.type == "Buffer" && (value.data instanceof Array))
        object[k] = Buffer.from(value.data);
      else deserializeBuffers(value);
    }
    else if (value instanceof Array) {
      value.forEach(v => {
        v.deserializeBuffers(value);
      });
    }
  });
}

export { deserializeBuffers };