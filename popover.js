let allSlopTweets = {};
let currentState = "list-tweets";

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

function displaySettings(settings) {
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
        <div>
            <label for="show-positive-posts">Show Positively Filtered Posts:</label>
            <input
              type="checkbox"
              id="show-positive-posts"
              ${!settings.deleteHtmlElements ? "checked" : ""}
            />
        </div>
    `;

  document
    .getElementById("settings-submit")
    .addEventListener("click", handleSaveSettings);
  document
    .getElementById("delete-all-btn")
    .addEventListener("click", handleDeleteAll);
  document
    .getElementById("show-positive-posts")
    .addEventListener("change", handleShowPositivePosts);
}

function displaySlopTweets(tweets) {
  const container = document.getElementById("content");
  container.innerHTML = `<div id="slop-tweets-container"></div>`;

  const tweetsContainer = document.getElementById("slop-tweets-container");

  if (Object.keys(tweets).length === 0) {
    tweetsContainer.innerHTML = "<p>Nothing saved</p>";
    return;
  }

  for (const [tweetId, tweetJSON] of Object.entries(tweets)) {
    const tweet = Tweet.fromJSON(tweetJSON);
    console.error("json", JSON.stringify(tweetJSON));
    const tweetElement = document.createElement("div");
    tweetElement.className = "slop-tweet";
    tweetElement.innerHTML = `
            <a href="https://twitter.com/${tweet.author.username}/status/${tweet.tweetId}" target="_blank" class="slop-tweet-username">@${tweet.author.username}</a>
            <div class="slop-tweet-content">${tweet.content}</div>
            <button data-tweet-id="${tweet.tweetId}" class="remove-slop-tweet">Remove</button>
            ${tweet.isSlop ? "Bad" : "Good"}
        `;
    tweetsContainer.appendChild(tweetElement);
  }

  tweetsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-slop-tweet")) {
      removeSlopTweet(e.target.getAttribute("data-tweet-id"));
    }
  });
}

async function handleShowPositivePosts(e) {
  const showPositivePosts = e.target.checked;
  const settings = await getSettings();
  settings.deleteHtmlElements = !showPositivePosts;
  saveSettings(settings);
}

function handleDeleteAll() {
  setSlopTweets({});
  switchState("list-tweets");
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const [provider, model] = document
    .getElementById("embeddings-provider")
    .value.split("/");
  const settings = await getSettings();
  settings.provider = provider;
  settings.model = model;
  const apiKey = document.getElementById("api-key").value;
  if (apiKey) settings.apiKeys[provider] = apiKey;
  saveSettings(settings);
  switchState("list-tweets");
}

function switchState(newState) {
  currentState = newState;
  if (currentState === "list-tweets") {
    displaySlopTweets(allSlopTweets);
  } else if (currentState === "settings") {
    getSettings().then(displaySettings);
  }
}

function removeSlopTweet(tweetId) {
  delete allSlopTweets[tweetId];
  setSlopTweets(allSlopTweets);
}

function resetPopover() {
  chrome.storage.local.get(["slop"], (result) => {
    allSlopTweets = result.slop.tweets || {};
    switchState("list-tweets");
  });

  document.getElementById("gear-btn").addEventListener("click", function () {
    switchState(currentState === "list-tweets" ? "settings" : "list-tweets");
  });
}

document.addEventListener("DOMContentLoaded", resetPopover);
