const { merge } = require("webpack-merge");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const ParallelUglifyPlugin = require("webpack-parallel-uglify-plugin");
const path = require("path");
const { AutomaticPrefetchPlugin, DllReferencePlugin } = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const common = require("./webpack.common.js");

module.exports = merge(common(), {
  mode: "production",
  devtool: "source-map",
  module: {
    rules: [],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "随便玩玩",
      description: "瞎搞",
      template: path.resolve(__dirname, "/public/index.html"),
      filename: "index.html",
      inject: "body",
      files: {
        js: [{ url: "./vendor.dll.js" }],
      },
    }),
    new AutomaticPrefetchPlugin(),
    new MiniCssExtractPlugin({
      filename: "assets/css/[name].[contenthash].css",
    }),
    new DllReferencePlugin({
      manifest: require("../build/vendor-manifest.json"),
    }),
  ],
  optimization: {
    chunkIds: "total-size",
    concatenateModules: true,
    flagIncludedChunks: true,
    moduleIds: "deterministic",
    innerGraph: true,
    providedExports: true,
    removeAvailableModules: true,
    // runtimeChunk: {
    //   name: (entrypoint) => `runtime~${entrypoint.name}`,
    // },
    splitChunks: {
      chunks: "all",
      minSize: 20 * 1024,
      maxSize: 20 * 1024,
      cacheGroups: {
        // 处理入口chunk,同步的
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          chunks: "all",
          name: "vendors",
        },
        "async-vendors": {
          test: /[\\/]node_modules[\\/]/,
          chunks: "async",
          name: "async-vendors",
        },
        common: {
          name: "chunk-common",
          minChunks: 2,
          priority: -20,
          chunks: "initial",
        },
      },
    },
    minimizer: [
      new ParallelUglifyPlugin({
        sourceMap: true,
        cacheDir: path.resolve(__dirname, "../temp_cache"),
        test: /.js$/,
        terser: {
          keep_classnames: true,
          keep_fnames: true,
          output: {
            beautify: false,
            comments: false,
          },
          compress: {
            drop_console: true,
            collapse_vars: true,
            reduce_vars: true,
          },
        },
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            "default",
            {
              discardComments: { removeAll: true },
            },
          ],
        },
      }),
    ],
  },
});
