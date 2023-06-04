const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "production",
  entry: {
    vendor: ["react", "react-dom"],
  },
  output: {
    path: path.resolve(__dirname, "../build"),
    filename: "[name].dll.js",
    library: "[name]_library",
    clean: {
      keep: /(manifest.*|vendor.dll.*)$/,
    },
  },
  plugins: [
    new webpack.DllPlugin({
      path: path.resolve(__dirname, "../build", "[name]-manifest.json"),
      name: "[name]_library",
    }),
  ],
};
