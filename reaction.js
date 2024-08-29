function addGarbageCanEmoji(tweet, element) {
  const slopDiv = element.querySelector(".tweet-slop");
  if (slopDiv) {
    const p = document.createElement("p");
    p.innerHTML = "🗑️";
    slopDiv.appendChild(p);
  }
}

function addReactionButtons(tweet, element) {
  if (!element.querySelector(".tweet-slop")) {
    if (tweet.tweetId && tweet.author.username) {
      const slopDiv = document.createElement("div");
      slopDiv.className = "tweet-slop";
      slopDiv.innerHTML = `
        <button
          data-tweet-id="${tweet.tweetId}"
          data-author="${tweet.author.username}"
          class="slop-tweet-btn thumbs-up"
        >
          👍
        </button>
        <button
          data-tweet-id="${tweet.tweetId}"
          data-author="${tweet.author.username}"
          class="slop-tweet-btn thumbs-down"
        >
          👎
        </button>
      `;
      element.appendChild(slopDiv);
      tweets[tweet.tweetId] = tweet;
    } else {
      console.error("Failed to add slop buttons", {
        tweetId: tweet.tweetId,
        username: tweet.author.username,
      });
    }
  }
}

async function handleReaction(event) {
  if (event.target.classList.contains("slop-tweet-btn")) {
    const tweetElement = event.target.closest('[data-testid="tweet"]');
    const isSlop = event.target.classList.contains("thumbs-down");
    const tweet = Tweet.fromTweetElement(tweetElement, isSlop);
    store.tweets[tweet.tweetId] = tweet;
    await tweet.embed(store.settings);
    store.write();
  }
}

function watchTweets() {
  const doWhat = async (element) => {
    const tweet = Tweet.fromTweetElement(element, null);
    addReactionButtons(tweet, element);
    await tweet.embed(store.settings);
    await decideIfKeep(tweet, element);
    store.tweets[tweet.tweetId] = tweet;
    store.write();
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
  document.addEventListener("click", handleReaction);
}
