require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");
const validBearerToken = require("./validBearerToken");
const { error404, errorHandler } = require("./error");
const bookmarksRouter = require("./bookmarks-router/bookmarks-router");

const app = express();

const morganOption = (NODE_ENV === 'production')
    ? 'tiny'
    : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(validBearerToken);

app.use("/bookmarks", bookmarksRouter);

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.use(error404, errorHandler);

module.exports = app;
