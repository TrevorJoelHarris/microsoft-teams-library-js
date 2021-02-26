const path = require('path')
const HtmlWebPackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: "./src/index.tsx",
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-react",
              "@babel/preset-typescript",
            ],
          },
        },
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "bundle.js",
  },
  devServer: {
    contentBase: path.join(__dirname, "build"),
    publicPath: "/",
    compress: true,
    port: 4000,
    https: true,
    disableHostCheck: true,
  },
  plugins: [
    new HtmlWebPackPlugin({ template: "./index.html", filename: "index.html", })
  ]
};
