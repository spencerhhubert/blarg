const Tweet = window.Tweet;
const User = window.User;
const tweetFromTweetElement = window.tweetFromTweetElement;
const saveSlopTweet = window.saveSlopTweet;
const getSettings = window.getSettings;

function addSlopButton() {
  const tweets = document.querySelectorAll('[data-testid="tweet"]');
  tweets.forEach((tweetElement) => {
    if (!tweetElement.querySelector(".tweet-slop")) {
      const tweet = extractTweetMetaFromTweetElement(tweetElement);

      if (tweet.tweetId && tweet.username) {
        const slopDiv = document.createElement("div");
        slopDiv.className = "tweet-slop";
        slopDiv.innerHTML = `<button
            data-tweet-id="${tweet.tweetId}"
            data-author="${tweet.username}"
            class="slop-tweet-btn"
          >
            👎
          </button>
        `;
        tweetElement.appendChild(slopDiv);
      } else {
        console.error("Failed to add slop button", {
          tweetId: tweet.tweetId,
          authorUsername: tweet.username,
        });
      }
    }
  });
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

export function resetReaction() {
  addSlopButton();
  document.addEventListener("click", handleSlopReaction);
}
