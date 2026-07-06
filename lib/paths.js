"use strict";
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
module.exports = {
  ROOT,
  BITS_DIR: path.join(ROOT, "content", "bits"),
  APP_DIR: path.join(ROOT, "app"),
  DATA_DIR: path.join(ROOT, "data"),
  PROGRESS_FILE: path.join(ROOT, "data", "progress.json"),
  QUESTIONS_FILE: path.join(ROOT, "data", "questions.json"),
  PID_FILE: path.join(ROOT, "data", ".server.pid"),
  CONFIG_FILE: path.join(ROOT, "config", "golfbits.json"),
  PROJECT_CONF_FILE: path.join(ROOT, "project.conf"),
  AGENTS_FILE: path.join(ROOT, "AGENTS.md"),
  PLAYBOOK_FILE: path.join(ROOT, "docs", "PLAYBOOK.md")
};
