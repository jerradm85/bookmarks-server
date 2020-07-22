const express = require("express");
const logger = require("../logger");
const { v4: uuid } = require("uuid");
// const bookmarks = require("../store");
const bookmarksRouter = express.Router();
const bodyParser = express.json();
const BookmarksService = require("../bookmarks-service");
const xss = require("xss");

bookmarksRouter
  .route("/")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    BookmarksService.getAllBookmarks(knexInstance)
      .then((bookmark) => {
        res.json({
          ...bookmark,
          title: xss(bookmark.title),
          url: xss(bookmark.url),
          description: xss(bookmark.description)
        });
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const { title, url, description, rating} = req.body;
    if (!title) {
      logger.error("Title is required.");
      return res.status(400).send("Invalid Title");
    }
    if (!url) {
      logger.error("URL is required.");
      return res.status(400).send("Invalid URL");
    }
    const knexInstance = req.app.get("db");
    const newBookmark = { title, url, description, rating };
    BookmarksService.insertBookmark(knexInstance, newBookmark)
      .then((bookmark) => {
        logger.info(`Bookmark with id:${bookmark.id} created`);
        res
          .status(201)
          .location(`/bookmarks/${bookmark.id}`)
          .json({
            ...bookmark,
            title: xss(bookmark.title),
            url: xss(bookmark.url),
            description: xss(bookmark.description)
          });
        
      })
      .catch(next);
  });

bookmarksRouter
  .route("/:id")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    BookmarksService.getById(knexInstance, req.params.id)
      .then((bookmark) => {
        if (!bookmark) {
          logger.error(`Bookmark with id:${req.params.id} not found.`);
          return res.status(404).json({
            error: { message: `Bookmark doesn't exist` },
          });
        }
        res.json({
          ...bookmark,
          title: xss(bookmark.title),
          url: xss(bookmark.url),
          description: xss(bookmark.description)
        });
      })
      .catch(next);
  })
  .delete((req, res) => {
    const { id } = req.params;
    const bookmarkIndex = bookmarks.findIndex(
      (book) => book.id.toString() === id
    );
    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id:"${id}" not found.`);
      res.status(404).send("Bookmark not found.");
    }
    bookmarks.splice(bookmarkIndex, 1);
    logger.info(`Bookmark with id:"${id}" was deleted.`);
    res.status(200).send(`Bookmark with id:"${id}" was deleted.`);
  });

module.exports = bookmarksRouter;
