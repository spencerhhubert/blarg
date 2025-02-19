let currentState = "list-tweets";
let store;

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
  tweets = Object.values(store.tweets);

  const container = document.getElementById("content");
  container.innerHTML = `<div id="slop-tweets-container"></div>`;

  const tweetsContainer = document.getElementById("slop-tweets-container");

  if (tweets.length === 0) {
    tweetsContainer.innerHTML = "<p>Nothing saved</p>";
    return;
  }

  tweets.sort((a, b) => {
    //sort by isSlop, which is null, true, or false. put null at bottom
    if (a.isSlop === b.isSlop) return 0;
    if (a.isSlop === null) return 1;
    if (b.isSlop === null) return -1;
    return a.isSlop ? 1 : -1;
  });

  tweets.forEach((tweet) => {
    tweetsContainer.appendChild(mkTweetElement(tweet));
  });

  tweetsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-slop-tweet")) {
      removeSlopTweet(e.target.getAttribute("data-tweet-id"));
    }
  });
}

function displayMap() {
  const tweets = Object.values(store.tweets);
  const container = document.getElementById("content");
  container.innerHTML = '<div id="map-container"></div>';
  const mapContainer = document.getElementById("map-container");

  if (tweets.length === 0) {
    mapContainer.innerHTML = "<p>No tweets available for mapping</p>";
    return;
  }

  const settings = store.settings;
  console.error("settings", JSON.stringify(settings.toJSON()));
  console.error("t", JSON.stringify(tweets));
  const embeddings = tweets
    .filter((tweet) => tweet.hasEmbeddings(settings))
    .map((tweet) => tweet.embeddings[settings.provider][settings.model][0]);

  // Use k-means clustering
  const k = Math.min(5, tweets.length); // Use 5 clusters or less if there are fewer tweets
  const { assignments } = kMeansClustering(embeddings, k);

  // Group tweets by cluster
  const clusters = {};
  assignments.forEach((cluster, index) => {
    if (!clusters[cluster]) clusters[cluster] = [];
    clusters[cluster].push(tweets[index]);
  });

  // Display clusters
  Object.entries(clusters).forEach(([cluster, clusterTweets]) => {
    const clusterDiv = document.createElement("div");
    clusterDiv.className = "cluster";
    clusterDiv.innerHTML = `<h3>Cluster ${parseInt(cluster) + 1}</h3>`;
    clusterTweets.forEach((tweet) => {
      clusterDiv.appendChild(mkTweetElement(tweet));
    });
    mapContainer.appendChild(clusterDiv);
  });
}

function mkTweetElement(tweet) {
  const tweetElement = document.createElement("div");
  tweetElement.className = "slop-tweet";
  tweetElement.innerHTML = `
    <a href="https://twitter.com/${tweet.author.username}/status/${tweet.tweetId}" target="_blank" class="slop-tweet-username">@${tweet.author.username}</a>
    <div class="slop-tweet-content">${tweet.content}</div>
    <button data-tweet-id="${tweet.tweetId}" class="remove-slop-tweet">Remove</button>
    <div>Status: ${tweet.isSlop === true ? "Bad" : tweet.isSlop === false ? "Good" : "Nothing"}</div>
  `;
  return tweetElement;
}

async function handleShowPositivePosts(e) {
  const showPositivePosts = e.target.checked;
  const settings = store.settings;
  settings.deleteHtmlElements = !showPositivePosts;
  await store.write();
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const [provider, model] = document
    .getElementById("embeddings-provider")
    .value.split("/");
  const settings = store.settings;
  settings.provider = provider;
  settings.model = model;
  const apiKey = document.getElementById("api-key").value;
  if (apiKey) settings.apiKeys[provider] = apiKey;
  console.error("wrote api key", settings.apiKeys[provider]);
  await store.write();
  switchState("list-tweets");
}

function switchState(newState) {
  currentState = newState;
  if (currentState === "list-tweets") {
    displaySlopTweets(store.tweets);
  } else if (currentState === "settings") {
    displaySettings(store.settings);
  } else if (currentState === "map") {
    displayMap();
  }
}
async function handleDeleteAll() {
  switchState("list-tweets");
  store.tweets = {};
  await store.write();
}

async function removeSlopTweet(tweetId) {
  delete store.tweets[tweetId];
  await store.write();
}

async function resetPopover() {
  store = await Store.init();
  switchState(currentState);
  document.getElementById("gear-btn").addEventListener("click", function () {
    switchState(currentState === "list-tweets" ? "settings" : "list-tweets");
  });
  document.getElementById("map-btn").addEventListener("click", function () {
    switchState(currentState === "map" ? "list-tweets" : "map");
  });
}

document.addEventListener("DOMContentLoaded", resetPopover);
