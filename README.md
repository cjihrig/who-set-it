# who-set-it

[![Current Version](https://img.shields.io/npm/v/who-set-it.svg)](https://www.npmjs.org/package/who-set-it)
[![Build Status via Travis CI](https://travis-ci.org/continuationlabs/who-set-it.svg?branch=master)](https://travis-ci.org/continuationlabs/who-set-it)
![Dependencies](http://img.shields.io/david/continuationlabs/who-set-it.svg)

[![belly-button-style](https://cdn.rawgit.com/continuationlabs/belly-button/master/badge.svg)](https://github.com/continuationlabs/belly-button)

Track where object properties are assigned. The primary use case is to track the location of global variable leaks.

## Basic Usage

```javascript
'use strict';
const WhoSetIt = require('who-set-it');
let target = { foo: 1 };
const proxy = WhoSetIt(target);

// Use the proxy in place of the original target.
target = proxy.proxy;

target.bar = 2;

// Revoke the proxy and restore the original target value.
target = proxy.revoke();

target.baz = 3;

// target is now { foo: 1, bar: 2, baz: 3 }
// proxy.locations contains information regarding 'bar'
// 'foo' and 'baz' are not in proxy.locations because the proxy was not active.
```

## API

### whoSetIt(obj)

  - Arguments
    - `obj` (object) - The object to act as the proxy target.
  - Returns
    - object - An object with the following schema.
      - `proxy` (proxy) - A revocable Proxy whose target is `obj`.
      - `locations` (array of objects) - An array containing information about property assignments to `proxy`. Each object in the array has the following schema.
        - `property` (string) - The name of the property that was set.
        - `filename` (string) - The file where the assignment took place.
        - `line` (string) - The line in `filename` where the assignment took place.
        - `column` (string) - The column in `filename` where the assignment took place.
      - `revoke()` (function) - A function that revokes the proxy and returns `obj`. This function has no effect on the proxy after the first call.

Creates a revocable proxy of the input object. The proxy can then be used in place of the original object. The `set()` trap maintains an array of property assignments while the proxy is active. The original object can be restored by calling `revoke()`.
