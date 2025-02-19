class Settings {
  provider;
  model;
  apiKeys;
  deleteHtmlElements;

  static defaultJSON = {
    provider: "Anthropic",
    model: "voyage-2",
    apiKeys: { Anthropic: null },
  };

  constructor({ provider, model, apiKeys }) {
    this.provider = provider;
    this.model = model;
    this.apiKeys = apiKeys;
    this.deleteHtmlElements = false;
  }

  toJSON() {
    return {
      provider: this.provider,
      model: this.model,
      apiKeys: this.apiKeys,
      deleteHtmlElements: this.deleteHtmlElements,
    };
  }

  static fromJSON(json) {
    const out = new Settings(json);
    out.deleteHtmlElements = json.deleteHtmlElements;
    return out;
  }
}

class Store {
  settings;
  tweets;

  constructor(settings, tweets) {
    this.settings = settings;
    this.tweets = tweets;
  }

  static defaultJSON = { settings: Settings.defaultJSON, tweets: {} };

  static fromJSON(json) {
    json.settings = Settings.fromJSON(json.settings);
    for (const tweetId in json.tweets)
      json.tweets[tweetId] = Tweet.fromJSON(json.tweets[tweetId]);
    return new Store(json.settings, json.tweets);
  }

  toJSON() {
    const tweets = {};
    for (const tweetId in this.tweets)
      tweets[tweetId] = this.tweets[tweetId].toJSON();
    return {
      settings: this.settings.toJSON(),
      tweets,
    };
  }

  static async init() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["blarg"], async (result) => {
        if (!result.blarg) {
          result.blarg = Store.defaultJSON;
          await new Promise((resolve) =>
            chrome.storage.local.set({ blarg: result.blarg }, resolve),
          );
        }
        resolve(Store.fromJSON(result.blarg));
      });
    });
  }

  async write() {
    return new Promise((resolve) => {
      chrome.storage.local.set({ blarg: this.toJSON() }, () => {
        resolve();
      });
    });
  }
}
