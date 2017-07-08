'use strict';
const Vm = require('vm');


function useEval (target, code) {
  eval(code); // eslint-disable-line no-eval
}


function useNewContext (target, code, options) {
  Vm.runInNewContext(code, { target }, options);
}


module.exports = {
  useEval,
  useNewContext
};
