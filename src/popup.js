"use strict";

function loadConfig() {
  chrome.storage.local.get(["blarg"], function (result) {
    const data = result.blarg || {
      posts: {},
      filter: "",
      openai_key: "",
      enabled: true,
      trash_only: false,
    };
    const filter_input = document.getElementById("filter_input");
    const openai_key_input = document.getElementById("openai_key_input");
    const enabled_input = document.getElementById("enabled_input");
    const trash_only_input = document.getElementById("trash_only_input");

    filter_input.value = data.filter;
    openai_key_input.value = data.openai_key;
    enabled_input.checked = data.enabled !== false;
    trash_only_input.checked = data.trash_only === true;
  });
}

function saveFilter(filter_value) {
  chrome.storage.local.get(["blarg"], function (result) {
    let data = result.blarg || {
      posts: {},
      filter: "",
      openai_key: "",
      enabled: true,
      trash_only: false,
    };
    data.filter = filter_value;
    chrome.storage.local.set({ blarg: data });
  });
}

function saveOpenAiKey(key_value) {
  chrome.storage.local.get(["blarg"], function (result) {
    let data = result.blarg || {
      posts: {},
      filter: "",
      openai_key: "",
      enabled: true,
      trash_only: false,
    };
    data.openai_key = key_value;
    chrome.storage.local.set({ blarg: data });
  });
}

function saveEnabled(enabled_value) {
  chrome.storage.local.get(["blarg"], function (result) {
    let data = result.blarg || {
      posts: {},
      filter: "",
      openai_key: "",
      enabled: true,
      trash_only: false,
    };
    data.enabled = enabled_value;
    chrome.storage.local.set({ blarg: data });
    chrome.tabs.reload();
  });
}

function saveTrashOnly(trash_only_value) {
  chrome.storage.local.get(["blarg"], function (result) {
    let data = result.blarg || {
      posts: {},
      filter: "",
      openai_key: "",
      enabled: true,
      trash_only: false,
    };
    data.trash_only = trash_only_value;
    chrome.storage.local.set({ blarg: data });
    chrome.tabs.reload();
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

  const enabled_input = document.getElementById("enabled_input");
  enabled_input.addEventListener("change", function () {
    saveEnabled(enabled_input.checked);
  });

  const trash_only_input = document.getElementById("trash_only_input");
  trash_only_input.addEventListener("change", function () {
    saveTrashOnly(trash_only_input.checked);
  });
});
