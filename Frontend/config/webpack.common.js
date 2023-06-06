const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");
const WebpackBar = require("webpackbar");

module.exports = () => {
  const { REACT_ENV } = process.env;
  const isProduction = REACT_ENV !== "development";
  return {
    entry: {
      app: path.resolve(__dirname, "../src/index.tsx"),
    },
    output: {
      publicPath: "auto",
      filename: "[name].[contenthash].bundle.js",
      path: path.resolve(__dirname, "../build"),
      assetModuleFilename: isProduction
        ? "images/[contenthash][ext]"
        : "[path][name][ext]",
    },
    stats: {
      preset: "errors-warnings",
      performance: true,
      logging: "error",
      env: true,
      colors: true,
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".json"],
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@c": path.resolve(__dirname, "src/components"),
        process: "process/browser",
      },
    },
    // externals: {
    //   react: "React",
    //   "react-dom": "ReactDOM",
    // },
    module: {
      rules: [
        {
          test: /\.(js)$/,
          include: path.resolve("src"),
          use: ["thread-loader"],
        },
        {
          test: /\.txt/,
          type: "asset",
        },
        {
          test: /\.svg/,
          type: "asset",
          parser: {
            dataUrlCondition: {
              maxSize: 4 * 1024,
            },
          },
        },
        {
          test: /\.(png|jpg|gif)$/,
          type: "asset/resource",
        },
        {
          enforce: "pre",
          test: /\.js$/,
          loader: "source-map-loader",
        },
        {
          test: /\.m?js$/,
          exclude: /(node_modules|bower_components)/,
          include: path.resolve(__dirname, "/src"),
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
              cacheDirectory: true,
            },
          },
        },
        {
          test: /\.([cm]?ts|tsx)$/,
          use: ["ts-loader"],
          exclude: /node_modules/,
        },
        {
          test: /\.less$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : "style-loader",
            {
              loader: "css-loader",
              options: {
                modules: {
                  mode: "local",
                  auto: true,
                  exportGlobals: true,
                  localIdentName: isProduction
                    ? "[contenthash:base64]"
                    : "[path][name]__[local]",
                },
              },
            },
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  plugins: [["postcss-preset-env"]],
                },
              },
            },
            {
              loader: "less-loader",
              options: {
                webpackImporter: false,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new WebpackBar(),
      new webpack.DefinePlugin({
        "process.env": JSON.stringify(process.env),
      }),
    ],
    cache: {
      type: "filesystem",
      allowCollectingMemory: true,
      buildDependencies: {
        config: [__filename],
      },
      cacheDirectory: path.resolve(__dirname, "../temp_cache"), // 本地目录
      store: "pack",
    },
  };
};
