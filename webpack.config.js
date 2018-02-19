const path = require("path");
module.exports = {
  entry: "./src/index.js",
  devtool: "eval-source-map",
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
