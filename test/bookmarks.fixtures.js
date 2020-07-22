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


module.exports = {
    makeBookmarksArray,
    maliciousBookmarks
}