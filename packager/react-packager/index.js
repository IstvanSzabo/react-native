/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

require('../babelRegisterOnly')([/react-packager\/src/]);

require('./src/node-haste/fastpath').replace();

var debug = require('debug');
var Activity = require('./src/Activity');

type Options = {
  nonPersistent: boolean,
  verbose: boolean,
}

exports.createServer = createServer;
exports.Activity = Activity;

exports.getOrderedDependencyPaths = function(options: Options, bundleOptions: mixed) {
  var server = createNonPersistentServer(options);
  return server.getOrderedDependencyPaths(bundleOptions)
    .then(function(paths) {
      server.end();
      return paths;
    });
};

function enableDebug() {
  // react-packager logs debug messages using the 'debug' npm package, and uses
  // the following prefix throughout.
  // To enable debugging, we need to set our pattern or append it to any
  // existing pre-configured pattern to avoid disabling logging for
  // other packages
  var debugPattern = 'ReactNativePackager:*';
  var existingPattern = debug.load();
  if (existingPattern) {
    debugPattern += ',' + existingPattern;
  }
  debug.enable(debugPattern);
}

function createServer(options: Options) {
  // the debug module is configured globally, we need to enable debugging
  // *before* requiring any packages that use `debug` for logging
  if (options.verbose) {
    enableDebug();
  }

  var Server = require('./src/Server');
  return new Server(omit(options, ['verbose']));
}

function createNonPersistentServer(options: Options) {
  Activity.disable();
  // Don't start the filewatcher or the cache.
  if (options.nonPersistent == null) {
    options.nonPersistent = true;
  }

  return createServer(options);
}

function omit(obj, blacklistedKeys) {
  return Object.keys(obj).reduce((clone, key) => {
    if (blacklistedKeys.indexOf(key) === -1) {
      clone[key] = obj[key];
    }

    return clone;
  }, {});
}
