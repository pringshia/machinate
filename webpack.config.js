const path = require("path");
const isProd = process.env.NODE_ENV === "production";

module.exports = {
  entry: "./src/index.js",
  devtool: isProd ? "cheap-module-source-map" : "source-map",

  output: {
    path: path.resolve("build"),
    filename: "lib.js",
    library: "Machinate",
    libraryTarget: "umd"
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: "babel-loader", exclude: /node_modules/ },
      { test: /\.jsx$/, loader: "babel-loader", exclude: /node_modules/ }
    ]
  }
};
