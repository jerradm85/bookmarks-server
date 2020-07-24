const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const { makeBookmarksArray, maliciousBookmarks } = require("./bookmarks.fixtures");
const supertest = require("supertest");

describe.only("Bookmarks Endpoints", function () {
  let db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL,
    });
    app.set("db", db);
  });
  // destroy our database connection when done so our tests don't hang
  after("disconnect from db", () => db.destroy());

  // remove all data from the table before running any tests
  before("clean the table", () => db("bookmarks").truncate());

  // remove all data from the table after each test to prepare for the next
  afterEach("cleanup", () => db("bookmarks").truncate());

  describe(`GET /api/bookmarks`, () => {
    context("Given no bookmarks data", () => {
      it("responds with 200 and an empty array", () => {
        return supertest(app)
          .get("/api/bookmarks")
          .set("Authorization", "Bearer " + process.env.API_TOKEN)
          .expect(200, []);
      });
    });

    context("Given bookmarks has data", () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach("insert bookmarks into database", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });
      it("responds with 200 and all bookmarks", () => {
        return supertest(app)
          .get("/api/bookmarks")
          .set("Authorization", "Bearer " + process.env.API_TOKEN)
          .expect(200, testBookmarks);
      });
    });
  });

  describe(`GET /api/bookmarks/:id`, () => {
    context("Given no bookmarks data", () => {
      it("responds with 404 not found", () => {
        const bookmarkId = 1000;
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .set("Authorization", "Bearer " + process.env.API_TOKEN)
          .expect(404, { error: { message: `bookmark doesn't exist` } });
      });
    });

    context(`Given bookmarks has data`, () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach("insert bookmarks into database", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });

      it("responds 200 with specified bookmark", () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/api/bookmarks/${bookmarkId}`)
          .set("Authorization", "Bearer " + process.env.API_TOKEN)
          .expect(200, expectedBookmark);
      });
    });
  });

  describe(`POST /api/bookmarks`, () => {
    it(`creates an bookmark, responding with 201 and the new bookmark`, function () {
      const newBookmark = {
        title: "Bookmark Title",
        url: "http://example.com",
        description: "Some new description",
        rating: 3,
      };

      return supertest(app)
        .post("/api/bookmarks")
        .set("Authorization", "Bearer " + process.env.API_TOKEN)
        .send(newBookmark)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`);
          expect(res.body).to.have.property("id");
        })
        .then((postRes) =>
          supertest(app)
            .get(`/api/bookmarks/${postRes.body.id}`)
            .set("Authorization", "Bearer " + process.env.API_TOKEN)
            .expect(200, postRes.body)
        );
    });

    it("removes XSS attack content from returned bookmarks", () => {
      const { maliciousBookmark, expectedBookmark } = maliciousBookmarks();

      return supertest(app)
        .post("/api/bookmarks")
        .set("Authorization", "Bearer " + process.env.API_TOKEN)
        .send(maliciousBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedBookmark.title);
          expect(res.body.url).to.eql(expectedBookmark.url);
          expect(res.body.description).to.eql(expectedBookmark.description);
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`);
          expect(res.body).to.have.property("id");
        })
        .then((postRes) =>
          supertest(app)
            .get(`/api/bookmarks/${postRes.body.id}`)
            .set("Authorization", "Bearer " + process.env.API_TOKEN)
            .expect(200, postRes.body)
        );
    });
  });

  describe.only(`PATCH /api/bookmarks/:id`, () => {
    context(`given no bookmarks data`, () => {
      it(`responds with 404 not found`, () => {
        const bookmarkId = 1000;
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `bookmark doesn't exist` } })
      })
    })

    context(`given bookmarks has data`, () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks")
          .insert(testBookmarks)
      })
      // it(`responds with 400 if id not provided in url`, () => {

      //   return supertest(app)
      //     .patch(`/api/bookmarks/`)
      //     .send({})
      //     .expect(404, {error: { message: `bookmark doesn't exist` }})
      // })
      it(`responds 204 and updates the bookmark`, () => {
        const idToUpdate = 3
        const updateBookmark = {
          "title": "etsy",
          "url": "http://www.etsy.com",
          "description": "etsy online auctionhouse",
          "rating": 5
        }
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        }
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send(updateBookmark)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .expect(expectedBookmark)
          )
      })

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 3

        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({ irrelevantField: 'garbage' })
          .expect(400, { error: { message: `Request body must contain either 'title', 'url', 'description', or 'rating'` } })
      })

      it(`responds with 204 when updating a subset of fields`, () => {
        const idToUpdate = 3
        const updateBookmark = {
          "title": "Updated BING"
        }
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        }

        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({
            ...updateBookmark,
            garbageField: `should not update here`
          })
          .expect(204)
          .then(res => {
            return supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .expect(expectedBookmark)
          })
      })
    })
  })
});
