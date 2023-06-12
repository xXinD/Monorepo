// eslint-disable-next-line import/no-extraneous-dependencies
const fs = require("fs-extra");
const path = require("path");

const sourceDir = path.resolve(__dirname, "src", "executables");
const targetDir = path.resolve(__dirname, "dist", "executables");

fs.copySync(sourceDir, targetDir);
