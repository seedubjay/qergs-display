import express from "express";
import cors from "cors";
import path from "path";
import http from "http";
import basicAuth from 'express-basic-auth'
import assert from "assert";
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

import ErgManager from "./ergmanager";

const port = Number(process.env.PORT || 5000);

const password = process.env.PASSWORD;
assert(password, "No password provided");

const secretToken = process.env.SECRET_TOKEN;
assert(secretToken, "No secret token provided");

let STATIC_DIR: string;

const app = express()
app.use(cors());
app.use(express.json())
app.use(cookieParser());

const server = http.createServer(app);
let ergs = new ErgManager(server);

STATIC_DIR = path.resolve(__dirname, "..", "..", "dist");

app.use("/auth", basicAuth({
  users: { 'admin': password },
  challenge: true,
}), (req, res, next) => {
  let token = jwt.sign({}, secretToken, { algorithm: "HS256", expiresIn: '1d' });
  res.cookie('jwt',token, { maxAge: 3600000 })
  res.redirect('/admin')
})

app.use("/admin", (req, res, next) => {
  try {
    jwt.verify(req.cookies['jwt'], secretToken);
    next();
  } catch (e) {
    res.redirect('/auth')
  }
})

app.post("/admin/devices/:device/delete", (req, res) => {
  ergs.delete_device(req.params["device"])
  res.send()
});

app.use(express.static(STATIC_DIR, {extensions:['html']}))

server.listen(port)
console.log(`Listening on port ${ port }`)