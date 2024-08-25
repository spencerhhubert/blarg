class Settings {
  provider;
  model;
  apiKeys;

  constructor({ provider, model, apiKeys }) {
    this.provider = provider;
    this.model = model;
    this.apiKeys = apiKeys;
  }

  toJSON() {
    return {
      provider: this.provider,
      model: this.model,
      apiKeys: this.apiKeys,
    };
  }

  static fromJSON(json) {
    return new Settings(json);
  }
}

function setSlopTweets(tweets) {
  chrome.storage.local.get(["slop"], (result) => {
    result.slop.tweets = tweets;
    chrome.storage.local.set({ slop: result.slop }, () => {
      console.log("Slop tweets saved", tweets);
    });
  });
}

function saveSlopTweet(tweetJSON) {
  chrome.storage.local.get(["slop"], (result) => {
    const slopTweets = result.slop.tweets || {};
    slopTweets[tweetJSON.tweetId] = tweetJSON;
    setSlopTweets(slopTweets);
  });
  chrome.storage.local.get(["slop"], (result) => {
    console.error("save tweet", JSON.stringify(result.slop));
  });
}

function saveSettings(settings) {
  chrome.storage.local.get(["slop"], (result) => {
    result.slop.settings = settings;
    chrome.storage.local.set({ slop: result.slop }, () => {
      console.log("Slop settings saved", settings);
    });
  });
  chrome.storage.local.get(["slop"], (result) => {
    console.error("save settings", JSON.stringify(result.slop));
  });
}

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["slop"], (result) => {
      resolve(Settings.fromJSON(result.slop.settings));
    });
  });
}

async function getSlopTweets() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["slop"], (result) => {
      for (const id in result.slop.tweets) {
        result.slop.tweets[id] = Tweet.fromJSON(result.slop.tweets[id]);
      }
      resolve(result.slop.tweets);
    });
  });
}

function initStorage() {
  chrome.storage.local.get(["slop"], (result) => {
    if (!result.slop) {
      chrome.storage.local.set({ slop: { settings: null, tweets: {} } }, () => {
        console.log("Slop storage initialized");
      });
    } else if (!result.slop.settings) {
      chrome.storage.local.get(["slop"], (result) => {
        result.slop.settings = null;
        chrome.storage.local.set({ slop: result.slop }, () => {
          console.log("Slop settings initialized");
        });
      });
    } else if (!result.slop.tweets) {
      setSlopTweets({});
    } else if (result.slop.tweets) {
      const slopTweets = result.slop.tweets;
      for (const tweetId in slopTweets) {
        if (!isTweetIdFormat(tweetId)) {
          delete slopTweets[tweetId];
        }
      }
      setSlopTweets(slopTweets);
    }
  });
}
