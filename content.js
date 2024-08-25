const tweets = {};

function reset() {
  initStorage();
  watchTweets();
}

setTimeout(reset, 2000);
