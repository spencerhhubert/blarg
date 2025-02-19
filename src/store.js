"use strict";

class Post {
  constructor(post_id, platform, real_id, content) {
    this.post_id = post_id;
    this.platform = platform;
    this.real_id = real_id;
    this.content = content;
    this.ai_processed = false;
  }

  toJSON() {
    return {
      post_id: this.post_id,
      platform: this.platform,
      real_id: this.real_id,
      content: this.content,
      ai_processed: this.ai_processed,
    };
  }

  static fromJSON(json) {
    const post = new Post(
      json.post_id,
      json.platform,
      json.real_id,
      json.content,
    );
    post.ai_processed = json.ai_processed || false;
    return post;
  }
}

class Store {
  constructor(posts, filter, openai_key, processed_ids) {
    this.posts = posts;
    this.filter = filter;
    this.openai_key = openai_key;
    this.processed_ids = processed_ids || new Set();
  }

  toJSON() {
    const posts = {};
    for (const id in this.posts) posts[id] = this.posts[id].toJSON();
    return {
      posts,
      filter: this.filter,
      openai_key: this.openai_key,
      processed_ids: Array.from(this.processed_ids),
    };
  }

  static init() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["blarg"], (result) => {
        let data = result.blarg;
        if (!data) {
          data = { posts: {}, filter: "", openai_key: "", processed_ids: [] };
          chrome.storage.local.set({ blarg: data }, () => {
            resolve(new Store({}, "", "", new Set()));
          });
        } else {
          if (typeof data.filter !== "string") data.filter = "";
          if (typeof data.openai_key !== "string") data.openai_key = "";
          const posts = {};
          for (const id in data.posts) {
            posts[id] = Post.fromJSON(data.posts[id]);
          }
          const processed_ids = new Set(data.processed_ids || []);
          resolve(
            new Store(posts, data.filter, data.openai_key, processed_ids),
          );
        }
      });
    });
  }
}

function generateInternalId() {
  return Date.now() + "" + Math.floor(Math.random() * 10000);
}

function extractXDetails(element) {
  const tweet_link = element.querySelector('a[href*="/status/"]');
  let realId = null;
  if (tweet_link) {
    const parts = tweet_link.href.split("/status/");
    if (parts.length > 1) realId = parts[1].split("?")[0];
  }
  return { platform: "x", realId };
}

function extractYoutubeDetails(element) {
  const link = element.querySelector('a[href*="watch?v="]');
  let realId = null;
  if (link) {
    try {
      const url_obj = new URL(link.href, location.origin);
      realId = url_obj.searchParams.get("v");
    } catch (e) {
      realId = null;
    }
  }
  return { platform: "youtube", realId };
}

function getPostDetails(element) {
  let info = { platform: "unknown", realId: null };
  if (location.href.includes("x.com")) {
    info = extractXDetails(element);
  } else if (location.href.includes("youtube.com")) {
    info = extractYoutubeDetails(element);
  }
  const content = element.innerText || "";
  return { ...info, content };
}

// Attach these to the global scope
window.Post = Post;
window.Store = Store;
window.generateInternalId = generateInternalId;
window.getPostDetails = getPostDetails;
