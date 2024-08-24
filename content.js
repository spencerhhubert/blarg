async function init() {
  const { resetReaction } = await import(chrome.runtime.getURL("reaction.js"));
  const initStorage = window.initStorage;

  function reset() {
    resetReaction();
    initStorage();
  }

  setTimeout(reset, 2000);
}

init();
