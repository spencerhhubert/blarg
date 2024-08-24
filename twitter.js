class Tweet {
  constructor({ tweetId, author, content } = {}) {
    this.tweetId = tweetId;
    this.author = author;
    this.content = content;
    this.embeddings = null;
  }

  embed = async (settings) => {
    const res = await chrome.runtime.sendMessage({
      action: "fetchEmbedding",
      payload: {
        content: this.content,
        settings: settings.toJSON(),
      },
    });
    const embedding = res.embedding;
    if (this.embeddings === null) this.embeddings = {};
    if (this.embeddings[settings.provider] === undefined) {
      this.embeddings[settings.provider] = {};
    }
    this.embeddings[settings.provider][settings.model] = embedding;
  };

  toJSON() {
    return {
      tweetId: this.tweetId,
      author: this.author.toJSON(),
      content: this.content,
      embeddings: this.embeddings,
    };
  }

  static fromJSON(json) {
    return new Tweet({
      tweetId: json.tweetId,
      author: User.fromJSON(json.author),
      content: json.content,
      embeddings: json.embeddings,
    });
  }
}

class User {
  constructor({ username, bio } = {}) {
    this.username = username;
    this.bio = bio;
  }

  toJSON() {
    return {
      username: this.username,
      bio: this.bio,
    };
  }

  static fromJSON(json) {
    return new User(json);
  }
}

function userFromTweetElement(element) {
  const usernameElement = element.querySelector(
    '[data-testid="User-Name"] a[role="link"][href^="/"]',
  );
  const username = usernameElement ? usernameElement.href.split("/")[3] : null;

  if (!username) {
    console.error("Failed to get username from tweet element", element);
    return null;
  }

  return new User({ username, bio: null });
}

function tweetFromTweetElement(element) {
  const tweetLink = element.querySelector('a[href*="/status/"]');
  const tweetId = tweetLink
    ? tweetLink.href.split("/status/")[1].split("?")[0]
    : null;

  const author = userFromTweetElement(element);

  const contentElement = element.querySelector('[data-testid="tweetText"]');
  const content = contentElement ? contentElement.textContent : null;

  return new Tweet({ tweetId, author, content });
}

function extractTweetMetaFromTweetElement(element) {
  const tweetLink = element.querySelector('a[href*="/status/"]');
  const tweetId = tweetLink
    ? tweetLink.href.split("/status/")[1].split("?")[0]
    : null;

  const usernameElement = element.querySelector(
    '[data-testid="User-Name"] a[role="link"][href^="/"]',
  );
  const username = usernameElement ? usernameElement.href.split("/")[3] : null;

  return { tweetId, username };
}

function isTweetIdFormat(tweetId) {
  try {
    tweetId = parseInt(tweetId);
  } catch (e) {
    return false;
  }
  return Number.isInteger(tweetId) && tweetId.toString().length === 19;
}

if (typeof window !== "undefined") {
  window.User = User;
  window.Tweet = Tweet;
}

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    User,
    Tweet,
    isTweetIdFormat,
    tweetFromTweetElement,
    extractTweetMetaFromTweetElement,
  };
}
