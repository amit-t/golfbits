#!/usr/bin/env node
"use strict";
const { runAlias } = require("../lib/commands");

runAlias("learn", process.argv.slice(2)).then(status => {
  if (typeof status === "number") process.exit(status);
}).catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
