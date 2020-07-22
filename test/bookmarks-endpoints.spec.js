const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const { makeBookmarksArray} = require("./bookmarks.fixtures");
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

  describe(`GET /bookmarks`, () => {
    context("Given no bookmarks data", () => {
      it("responds with 200 and an empty array", () => {
        return supertest(app)
          .get("/bookmarks")
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
          .get("/bookmarks")
          .set("Authorization", "Bearer " + process.env.API_TOKEN)
          .expect(200, testBookmarks);
      });
    });
  });

  describe(`GET /bookmarks/:id`, () => {
    context("Given no bookmarks data", () => {
      it("responds with 404 not found", () => {
        const bookmarkId = 1000;
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set("Authorization", "Bearer " + process.env.API_TOKEN)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
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
          .get(`/bookmarks/${bookmarkId}`)
          .set("Authorization", "Bearer " + process.env.API_TOKEN)
          .expect(200, expectedBookmark);
      });
    });
  });

  describe.only(`POST /bookmarks`, () => {
    it(`creates an bookmark, responding with 201 and the new bookmark`, function() {
      const newBookmark = {
        title: "Bookmark Title",
        url: "http://example.com",
        description: "Some new description",
        rating: 3
      }

      return supertest(app)
      .post("/bookmarks")
      .set("Authorization", "Bearer " + process.env.API_TOKEN)
      .send(newBookmark)
      .expect(201)
      .expect(res => {
        expect(res.body.title).to.eql(newBookmark.title)
        expect(res.body.url).to.eql(newBookmark.url)
        expect(res.body.description).to.eql(newBookmark.description)
        expect(res.body.rating).to.eql(newBookmark.rating)
        expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
        expect(res.body).to.have.property("id")
      })
      .then(postRes => 
        supertest(app)
        .get(`/bookmarks/${postRes.body.id}`)
        .set("Authorization", "Bearer " + process.env.API_TOKEN)
        .expect(postRes.body)
        )
    })

    it('removes XSS attack content from returned bookmarks', () => {
      // const {maliciousBookmark, expectedBookmark} = maliciousBookmarkItems;
      const maliciousBookmark = {
        id: 911,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url: 'http://example.com',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
      }
      
      const expectedBookmark = {
        id: 911,
        title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        url: 'http://example.com',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
      }
 
      
      // console.log("-------------");
      // console.log(maliciousBookmark);
      // console.log(expectedBookmark);
      // console.log("-------------");

      return supertest(app)
      .post("/bookmarks")
      .set("Authorization", "Bearer " + process.env.API_TOKEN)
      .send(maliciousBookmark)
      .expect(201)
      .expect((res) => {
        console.log("-------------");
        console.log(res.body)
        console.log("-------------");

        expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
        expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)

        // expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
        expect(res.body.url).to.eql(expectedBookmark.url)
        // expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
        expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
        expect(res.body).to.have.property("id")
      })
      .then(postRes => 
        supertest(app)
        .get(`/bookmarks/${postRes.body.id}`)
        .set("Authorization", "Bearer " + process.env.API_TOKEN)
        .expect(postRes.body)
        )

    })
  })
});
