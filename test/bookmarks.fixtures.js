const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

function makeUsersArray() {
  return [
    {
      id: 1,
      user_name: 'test-user-1',
      full_name: 'Test user 1',
      nickname: 'TU1',
      password: 'password',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 2,
      user_name: 'test-user-2',
      full_name: 'Test user 2',
      nickname: 'TU2',
      password: 'password',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 3,
      user_name: 'test-user-3',
      full_name: 'Test user 3',
      nickname: 'TU3',
      password: 'password',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 4,
      user_name: 'test-user-4',
      full_name: 'Test user 4',
      nickname: 'TU4',
      password: 'password',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
  ]
}

function makeBookmarksArray() {
    return [
        {
            "id": 1,
            "title": "google",
            "url": "http://www.google.com",
            "description": "google search engine",
            "rating": 3
        },
        {
            "id": 2,
            "title": "amazon",
            "url": "http://www.amazon.com",
            "description": "amazon online shopping",
            "rating": 3
        },
        {
            "id": 3,
            "title": "ebay",
            "url": "http://www.ebay.com",
            "description": "ebay online auctionhouse",
            "rating": 3
        },
        {
            "id": 4,
            "title": "ign",
            "url": "http://www.ign.com",
            "description": "ign game/hardware reviews",
            "rating": 3
        },
    ]
}

function maliciousBookmarks() {
  const maliciousBookmark = {
    id: 911,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    url: 'http://example.com <script>alert("xss");</script>',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
  };

  const expectedBookmark = {
    id: 911,
    title: 'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
    url: 'http://example.com &lt;script&gt;alert("xss");&lt;/script&gt;',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
  };

  return {
    maliciousBookmark,
    expectedBookmark
  }
}

function seedUsers(db, users) {
  const preppedUsers = users.map(user => ({
    ...user,
    password: bcrypt.hashSync(user.password, 1)
  }))
  return db.into('blogful_users').insert(preppedUsers)
    .then(() =>
      // update the auto sequence to stay in sync
      db.raw(
        `SELECT setval('blogful_users_id_seq', ?)`,
        [users[users.length - 1].id],
      )
    )
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ user_id: user.id }, secret, {
    subject: user.user_name,
    algorithm: 'HS256',
  })
  return `Bearer ${token}`
}


module.exports = {
    makeBookmarksArray,
    maliciousBookmarks,
    makeUsersArray,
    makeAuthHeader,
    seedUsers
}