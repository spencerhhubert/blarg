function addSlopButton(tweet, element) {
  if (!element.querySelector(".tweet-slop")) {
    if (tweet.tweetId && tweet.author.username) {
      const slopDiv = document.createElement("div");
      slopDiv.className = "tweet-slop";
      slopDiv.innerHTML = `<button
          data-tweet-id="${tweet.tweetId}"
          data-author="${tweet.author.username}"
          class="slop-tweet-btn"
        >
          👎
        </button>
      `;
      element.appendChild(slopDiv);
      tweets[tweet.tweetId] = tweet;
    } else {
      console.error("Failed to add slop button", {
        tweetId: tweet.tweetId,
        username: tweet.author.username,
      });
    }
  }
}

function addGarbageCanEmoji(tweet, element) {
  const slopDiv = element.querySelector(".tweet-slop");
  if (slopDiv) {
    const p = document.createElement("p");
    p.innerHTML = "🗑️";
    slopDiv.appendChild(p);
  }
}

async function handleSlopReaction(event) {
  if (event.target.classList.contains("slop-tweet-btn")) {
    const tweetElement = event.target.closest('[data-testid="tweet"]');
    const tweet = tweetFromTweetElement(tweetElement);
    await tweet.embed(await getSettings());
    if (tweet.tweetId && tweet.author.username) {
      saveSlopTweet(tweet.toJSON());
    } else {
      console.error("Failed to get tweet ID or username", {
        tweetId: tweet.tweetId,
        username: tweet.author.username,
      });
    }
  }
}

async function decideIfKeep(tweet, element) {
  if (tweet.content === "") {
    console.log("no content");
    return;
  }
  if (tweet.getEmbeddingsPromise) {
    console.log("supposed to wait ig");
    await tweet.getEmbeddingsPromise;
  }
  const settings = await getSettings();
  if (!tweet.hasEmbeddings(settings)) {
    console.log("no embeddings");
    return;
  }
  const slop = await getSlopTweets();
  if (Object.keys(slop).length === 0) {
    console.log("no slop");
    return;
  }
  await Promise.all(
    Object.values(slop).map((st) => st.onlyEmbedIfDontHaveIt(settings)),
  );
  const scores = Object.values(slop)
    .filter((st) => st.hasEmbeddings(settings))
    .map((st) =>
      cosineSimilarity(
        tweet.embeddings[settings.provider][settings.model],
        st.embeddings[settings.provider][settings.model],
      ),
    );
  console.log("scores", scores);
  const threshold = 0.75;
  if (scores.some((score) => score > threshold)) {
    console.log("remove");
    addGarbageCanEmoji(tweet, element);
    // element.remove();
  }
}

function watchTweets() {
  const doWhat = async (element) => {
    const tweet = tweetFromTweetElement(element);
    addSlopButton(tweet, element);
    await tweet.embed(await getSettings());
    await decideIfKeep(tweet, element);
  };
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            node.querySelectorAll('[data-testid="tweet"]').forEach(doWhat);
          }
        });
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  document.querySelectorAll('[data-testid="tweet"]').forEach(doWhat);
  document.addEventListener("click", handleSlopReaction);
}
