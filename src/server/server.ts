import express from "express";
import cors from "cors";
import path from "path";
import http from "http";

import ErgManager from "./ergmanager";

const port = Number(process.env.PORT || 5000);
let STATIC_DIR: string;

const app = express()
app.use(cors());
app.use(express.json())

if (process.env.NODE_ENV !== "production") {
  let webpack = require("webpack");
  let webpackDevMiddleware = require("webpack-dev-middleware");
  let webpackConfig = require("../../webpack.config");
  let webpackHotMiddleware = require("webpack-hot-middleware");

  const compiler = webpack(webpackConfig({}));
  app.use(webpackDevMiddleware(compiler, {}));
  app.use(webpackHotMiddleware(compiler));

  // on development, use "../../" as static root
  STATIC_DIR = path.resolve(__dirname, "..", "..");

} else {
  // on production, use ./public as static root
  STATIC_DIR = path.resolve(__dirname, "..", "..", "dist");
}

app.use("/", express.static(STATIC_DIR));

const server = http.createServer(app);
server.listen(port)
console.log(`Listening on port ${ port }`)

let ergs = new ErgManager(server);