const tweets = {};

let store;

function reset() {
  Store.init().then((s) => {
    store = s;
    watchTweets();
  });
}

setTimeout(reset, 2000);
