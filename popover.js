let allSlopTweets = {};
let currentState = "list-tweets";

function displaySlopTweets(tweets) {
  const container = document.getElementById("content");
  container.innerHTML = `
        <input type="text" id="search-bar" placeholder="Search...">
        <div id="slop-tweets-container"></div>
    `;

  const tweetsContainer = document.getElementById("slop-tweets-container");

  if (Object.keys(tweets).length === 0) {
    tweetsContainer.innerHTML = "<p>No slop tweets found.</p>";
    return;
  }

  for (const [tweetId, tweetJSON] of Object.entries(tweets)) {
    const tweet = Tweet.fromJSON(tweetJSON);
    const tweetElement = document.createElement("div");
    tweetElement.className = "slop-tweet";
    tweetElement.innerHTML = `
            <a href="https://twitter.com/${tweet.author.username}/status/${tweet.tweetId}" target="_blank" class="slop-tweet-username">@${tweet.author.username}</a>
            <div class="slop-tweet-content">${tweet.content}</div>
            <button data-tweet-id="${tweet.tweetId}" class="remove-slop-tweet">Remove</button>
        `;
    tweetsContainer.appendChild(tweetElement);
  }

  setupEventListeners();
}

const embeddingsProviders_ = {
  OpenAI: ["text-embedding-3-small", "text-embedding-3-large"],
  Anthropic: ["voyage-2"],
};

const embeddingsProviders = Object.fromEntries(
  Object.entries(embeddingsProviders_).map(([provider, models]) => [
    provider,
    models.map((model) => `${provider}/${model}`),
  ]),
);

function displaySettings() {
  const container = document.getElementById("content");
  container.innerHTML = `
        <form id="settings-form">
            <select id="embeddings-provider">
                ${Object.keys(embeddingsProviders)
                  .map(
                    (provider) => `
                        <optgroup label="${provider}">
                            ${embeddingsProviders[provider]
                              .map(
                                (model) => `
                                    <option value="${model}">${model}</option>
                                `,
                              )
                              .join("")}
                        </optgroup>
                    `,
                  )
                  .join("")}
            </select>
            <input type="text" id="api-key" placeholder="API Key" />
            <button type="submit" id="settings-submit">Submit</button>
        </form>
        <button id="delete-all-btn">Delete All</button>
    `;

  document
    .getElementById("settings-submit")
    .addEventListener("click", handleSaveSettings);
  document
    .getElementById("delete-all-btn")
    .addEventListener("click", handleDeleteAll);
}

function handleDeleteAll() {
  setSlopTweets({});
  switchState("list-tweets");
}

function handleSaveSettings(e) {
  e.preventDefault();
  const [provider, model] = document
    .getElementById("embeddings-provider")
    .value.split("/");
  const apiKey = document.getElementById("api-key").value;
  const apiKeys = { [provider]: apiKey };
  const settings = new Settings({ provider, model, apiKeys });
  saveSettings(settings);
  switchState("list-tweets");
}

function switchState(newState) {
  currentState = newState;
  if (currentState === "list-tweets") {
    displaySlopTweets(allSlopTweets);
  } else if (currentState === "settings") {
    displaySettings();
  }
}

function removeSlopTweet(tweetId) {
  delete allSlopTweets[tweetId];
  chrome.storage.local.set({ slopTweets: allSlopTweets }, () => {
    displaySlopTweets(allSlopTweets);
  });
}

function searchSlopTweets(query) {
  const filteredTweets = Object.fromEntries(
    Object.entries(allSlopTweets).filter(([_, tweetJSON]) => {
      const tweet = Tweet.fromJSON(tweetJSON);
      return (
        tweet.content.toLowerCase().includes(query.toLowerCase()) ||
        tweet.author.username.toLowerCase().includes(query.toLowerCase())
      );
    }),
  );
  displaySlopTweets(filteredTweets);
}

function setupEventListeners() {
  const searchBar = document.getElementById("search-bar");
  const tweetsContainer = document.getElementById("slop-tweets-container");

  searchBar.addEventListener("input", (e) => {
    searchSlopTweets(e.target.value);
  });

  tweetsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-slop-tweet")) {
      removeSlopTweet(e.target.getAttribute("data-tweet-id"));
    }
  });
}

function initPopover() {
  chrome.storage.local.get(["slop"], (result) => {
    allSlopTweets = result.slop.tweets || {};
    console.log("Slop tweets loaded", allSlopTweets);
    switchState("list-tweets");
  });

  document.getElementById("gear-btn").addEventListener("click", function () {
    switchState(currentState === "list-tweets" ? "settings" : "list-tweets");
  });
}

document.addEventListener("DOMContentLoaded", initPopover);
