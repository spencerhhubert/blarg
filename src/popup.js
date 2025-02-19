"use strict";

function loadConfig() {
  chrome.storage.local.get(["blarg"], function (result) {
    const data = result.blarg || { posts: {}, filter: "", openai_key: "" };
    const filter_input = document.getElementById("filter_input");
    filter_input.value = data.filter;
    const openai_key_input = document.getElementById("openai_key_input");
    openai_key_input.value = data.openai_key;
  });
}

function saveFilter(filter_value) {
  chrome.storage.local.get(["blarg"], function (result) {
    let data = result.blarg || { posts: {}, filter: "", openai_key: "" };
    data.filter = filter_value;
    chrome.storage.local.set({ blarg: data });
  });
}

function saveOpenAiKey(key_value) {
  chrome.storage.local.get(["blarg"], function (result) {
    let data = result.blarg || { posts: {}, filter: "", openai_key: "" };
    data.openai_key = key_value;
    chrome.storage.local.set({ blarg: data });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  loadConfig();
  const filter_input = document.getElementById("filter_input");
  filter_input.addEventListener("input", function () {
    saveFilter(filter_input.value);
  });
  const openai_key_input = document.getElementById("openai_key_input");
  openai_key_input.addEventListener("input", function () {
    saveOpenAiKey(openai_key_input.value);
  });
});
