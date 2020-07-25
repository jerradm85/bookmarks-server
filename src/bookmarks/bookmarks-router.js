const express = require("express");
const logger = require("../logger");
const { v4: uuid } = require("uuid");
// const bookmarks = require("../store");
const bookmarksRouter = express.Router();
const bodyParser = express.json();
const BookmarksService = require("./bookmarks-service");
const xss = require("xss");
const path = require('path');

bookmarksRouter
  .route("/")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        // map over the returned bookmarks and sanitize each
        const sanitize = bookmarks.map(bookmark => {
          return {
            ...bookmark,
            title: xss(bookmark.title), // sanitize title
            url: xss(bookmark.url), // sanitize content
            description: xss(bookmark.description), // sanitize content
          }
        })
        // pass array of sanitized bookmarks to the response
        res.json(sanitize)
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body;
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
          .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
          .json({
            ...bookmark,
            title: xss(bookmark.title),
            url: xss(bookmark.url),
            description: xss(bookmark.description)
          })

      })
      .catch(next);
  });

bookmarksRouter
  .route("/:id")
  .all((req, res, next) => {
    BookmarksService.getById(
      req.app.get('db'),
      req.params.id
    )
      .then(bookmark => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: `bookmark doesn't exist` }
          })
        }
        res.bookmark = bookmark;
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    BookmarksService.getById(knexInstance, req.params.id)
      .then((bookmark) => {
        if (!bookmark) {
          logger.error(`Bookmark with id:${req.params.id} not found.`);
          return res.status(404).json({
            error: { message: `bookmark doesn't exist` },
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
  .delete((req, res, next) => {
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
  })
  .patch(bodyParser, (req, res, next) => {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ error: { message: `request must provide id in url` } })
    }
    const { title, url, description, rating } = req.body;
    const bookmarkToUpdate = { title, url, description, rating };

    // check if any of the required values were passed in the body and if they are empty
    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title', 'url', 'description', or 'rating'`
        }
      })
    }

    BookmarksService.updateBookmark(
      req.app.get("db"),
      req.params.id,
      bookmarkToUpdate
    )
      .then(numberOfRowsAffected => {
        res.status(204).end()

      })
      .catch(next)


  })



module.exports = bookmarksRouter;
