"use strict";
const fs = require("fs");
const path = require("path");
const { CONFIG_FILE, PROJECT_CONF_FILE } = require("./paths");

function readConfig(configFile = CONFIG_FILE) {
  return JSON.parse(fs.readFileSync(configFile, "utf8"));
}

function parsePositiveInt(value) {
  if (!/^\d+$/.test(String(value).trim())) return undefined;
  const n = Number.parseInt(String(value).trim(), 10);
  return n > 0 ? n : undefined;
}

function stripInlineComment(line) {
  const idx = line.indexOf("#");
  return idx === -1 ? line : line.slice(0, idx);
}

function parseProjectConf(text) {
  const parsed = {};
  for (const original of String(text || "").split(/\r?\n/)) {
    const line = stripInlineComment(original).trim();
    if (!line) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim().toLowerCase();
    const value = line.slice(eq + 1).trim();
    if (!value) continue;
    if (key === "agent") parsed.agent = value;
    else if (key === "port") {
      const port = parsePositiveInt(value);
      if (port !== undefined) parsed.port = port;
    } else if (key === "batch_size") {
      const batchSize = parsePositiveInt(value);
      if (batchSize !== undefined) parsed.batchSize = batchSize;
    }
  }
  return parsed;
}

function readProjectConf(projectConfFile = PROJECT_CONF_FILE) {
  try { return parseProjectConf(fs.readFileSync(projectConfFile, "utf8")); }
  catch (e) { return {}; }
}

function providerOptions(rawConfig) {
  return Object.keys(rawConfig?.agent?.providers || {});
}

function resolveConfig({ flagAgent = null, rawConfig = null, projectConfText, projectConfPath = PROJECT_CONF_FILE } = {}) {
  const raw = rawConfig || readConfig();
  const project = projectConfText !== undefined ? parseProjectConf(projectConfText) : readProjectConf(projectConfPath);
  const providers = raw.agent?.providers || {};
  const options = Object.keys(providers);

  let provider = raw.agent?.provider;
  if (project.agent) provider = project.agent;
  if (flagAgent) provider = flagAgent;

  if (!providers[provider]) {
    throw new Error(`Unknown agent provider '${provider}'. Options: ${options.join(", ")}`);
  }

  const port = project.port || raw.server?.port || 4321;
  const batchSize = project.batchSize || raw.content?.batchSize || 28;
  return { provider, port, batchSize, raw, project, providerSpec: providers[provider] };
}

function setProjectConfValue(key, value, projectConfFile = PROJECT_CONF_FILE) {
  const canonical = String(key).toLowerCase();
  let lines = [];
  try { lines = fs.readFileSync(projectConfFile, "utf8").split(/\r?\n/); }
  catch (e) { lines = []; }

  let found = false;
  const updated = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    const eq = line.indexOf("=");
    if (eq === -1) return line;
    const existingKey = line.slice(0, eq).trim().toLowerCase();
    if (existingKey !== canonical || found) return line;
    found = true;
    return `${canonical} = ${value}`;
  });

  if (!found) {
    while (updated.length && updated[updated.length - 1] === "") updated.pop();
    if (updated.length) updated.push("");
    updated.push(`${canonical} = ${value}`);
  }

  fs.mkdirSync(path.dirname(projectConfFile), { recursive: true });
  fs.writeFileSync(projectConfFile, updated.join("\n").replace(/\n*$/, "\n"));
}

module.exports = { readConfig, parseProjectConf, readProjectConf, resolveConfig, providerOptions, setProjectConfValue };
