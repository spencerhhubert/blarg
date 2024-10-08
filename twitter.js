class Tweet {
  constructor({ tweetId, author, content, isSlop } = {}) {
    this.tweetId = tweetId;
    this.author = author;
    this.content = content;
    this.isSlop = isSlop;
    this.embeddings = null;
    this.getEmbeddingsPromise = null;
  }

  hasEmbeddings = (settings) => {
    return (
      this.embeddings &&
      this.embeddings[settings.provider] &&
      this.embeddings[settings.provider][settings.model] &&
      this.embeddings[settings.provider][settings.model].length > 0
    );
  };

  chunk() {
    const out = [];
    if (!this.content) return out;
    out.push(this.content);
    const lines = this.content.split("\n");
    lines.forEach((l) => out.push(l));
    return out;
  }

  embed = async (settings) => {
    this.getEmbeddingsPromise = new Promise(async (resolve) => {
      // const chunks = this.chunk();
      const res = await chrome.runtime.sendMessage({
        action: "fetchEmbeddings",
        payload: {
          chunks: [this.content],
          settings: settings.toJSON(),
        },
      });
      if (!res.embeddings) {
        console.warn("not setting embeddings", res);
        this.getEmbeddingsPromise = null;
        resolve();
        return;
      }
      const embeddings = res.embeddings;
      console.log("Embedding fetched", res);
      if (this.embeddings === null) this.embeddings = {};
      if (this.embeddings[settings.provider] === undefined) {
        this.embeddings[settings.provider] = {};
      }
      this.embeddings[settings.provider][settings.model] = embeddings;
      this.getEmbeddingsPromise = null;
      resolve();
    });
    return this.getEmbeddingsPromise;
  };

  onlyEmbedIfDontHaveIt = async (settings) => {
    if (!this.hasEmbeddings(settings)) {
      await this.embed(settings);
    }
  };

  toJSON() {
    return {
      tweetId: this.tweetId,
      author: this.author.toJSON(),
      content: this.content,
      embeddings: this.embeddings,
      isSlop: this.isSlop,
    };
  }

  static fromJSON(json) {
    const out = new Tweet({
      tweetId: json.tweetId,
      author: User.fromJSON(json.author),
      content: json.content,
      isSlop: json.isSlop || null,
    });
    if (json.embeddings) out.embeddings = json.embeddings;
    return out;
  }

  static fromTweetElement(element, isSlop) {
    const tweetLink = element.querySelector('a[href*="/status/"]');
    const tweetId = tweetLink
      ? tweetLink.href.split("/status/")[1].split("?")[0]
      : null;

    const author = User.fromTweetElement(element);

    const contentElement = element.querySelector('[data-testid="tweetText"]');
    const content = contentElement ? contentElement.textContent : null;

    return new Tweet({ tweetId, author, content, isSlop });
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

  static fromTweetElement(element) {
    const usernameElement = element.querySelector(
      '[data-testid="User-Name"] a[role="link"][href^="/"]',
    );
    const username = usernameElement
      ? usernameElement.href.split("/")[3]
      : null;

    if (!username) {
      console.error("Failed to get username from tweet element", element);
      return null;
    }

    return new User({ username, bio: null });
  }
}

function isTweetIdFormat(tweetId) {
  try {
    tweetId = parseInt(tweetId);
  } catch (e) {
    return false;
  }
  return Number.isInteger(tweetId) && tweetId.toString().length === 19;
}
