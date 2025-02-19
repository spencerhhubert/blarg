"use strict";

const DEBUG = true;

let store;
const post_elements = {};
let is_processing = false;

function addTrashCan(element) {
  if (element.querySelector(".trash-can")) return;
  const trash = document.createElement("span");
  trash.className = "trash-can";
  trash.textContent = "🗑️";
  element.appendChild(trash);
}

function processPostElement(element) {
  if (element.__processed) return;

  const { platform, realId, content } = getPostDetails(element);
  if (!realId) return;
  if (store.processed_ids.has(realId)) return;

  element.__processed = true;
  const internal_id = generateInternalId();
  const post = new Post(internal_id, platform, realId, content);
  store.posts[internal_id] = post;
  post_elements[internal_id] = element;

  if (getPendingPostsCount() >= 10 && !is_processing) {
    analyzePostsBatch();
  }
}

function processExistingPosts() {
  let selector = "";
  if (location.href.includes("x.com")) {
    selector = '[data-testid="tweet"]';
  } else if (location.href.includes("youtube.com")) {
    selector = "ytd-rich-item-renderer, ytd-video-renderer";
  }
  if (!selector) {
    console.log("DEBUG: No selector found for this platform.");
    return;
  }
  console.log("DEBUG: Processing existing posts using selector:", selector);
  const elements = document.querySelectorAll(selector);
  console.log("DEBUG: Found existing elements:", elements.length);
  elements.forEach(processPostElement);
}

function observePosts() {
  let selector = "";
  if (location.href.includes("x.com")) {
    selector = '[data-testid="tweet"]';
  } else if (location.href.includes("youtube.com")) {
    selector = "ytd-rich-item-renderer, ytd-video-renderer";
  }
  if (!selector) {
    console.log("DEBUG: No selector set for observer.");
    return;
  }
  console.log("DEBUG: Starting observer with selector:", selector);
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type !== "childList") return;
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.matches && node.matches(selector)) {
          console.log("DEBUG: Direct match found in mutation");
          processPostElement(node);
        }
        if (node.querySelectorAll) {
          const children = node.querySelectorAll(selector);
          children.forEach(processPostElement);
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function getPendingPosts() {
  console.log("DEBUG: Getting pending posts");
  console.log("DEBUG: Current processed_ids size:", store.processed_ids.size);
  const pending = [];
  for (const id in store.posts) {
    const post = store.posts[id];
    if (
      !post.ai_processed &&
      post_elements[id] &&
      !store.processed_ids.has(post.real_id)
    ) {
      pending.push(post);
    }
  }
  console.log("DEBUG: Found pending posts:", pending.length);
  return pending;
}

function getPendingPostsCount() {
  return getPendingPosts().length;
}

function cleanAIResponse(response) {
  const start = response.indexOf("{");
  const end = response.lastIndexOf("}") + 1;
  if (start === -1 || end === 0) return response;
  return response.substring(start, end);
}

const prompt = (
  userFilterDescription,
) => `Your job is to filter posts for the user. these are posts on twitter or youtube, or something. it's unknown.
it's extremely important that you only reply with this exact JSON schema
{
  "postsToBlock": string[]
}
otherwise the system won't be able to parse your response and you will fail your job.

you identify these posts by their "handle" identifiers.

You are given a list of posts. For each post, decide whether it should be blocked based on the user's description fo what they want filtered.

this is the criteria you need to be filtering AGAINST:
"""
${userFilterDescription}
"""

ok here are the posts:`;

async function analyzePostsBatch() {
  if (is_processing) return;
  is_processing = true;

  try {
    const pending_posts = getPendingPosts();
    if (pending_posts.length < 10) {
      is_processing = false;
      return;
    }

    const batch_posts = pending_posts.slice(0, 10);
    const handle_list = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const handle_to_id = {};
    const messages = [];
    messages.push({
      role: "user",
      content: prompt(store.filter),
    });
    batch_posts.forEach((post, i) => {
      const handle = handle_list[i];
      handle_to_id[handle] = post.post_id;
      messages.push({
        role: "user",
        content: "Handle: " + handle + "\nContent: " + post.content,
      });
    });

    const ai_response = await callOpenAiChat(messages, store.openai_key);
    console.log("AI response:", ai_response);
    const parsed = JSON.parse(cleanAIResponse(ai_response));
    const posts_to_block = parsed.postsToBlock || [];

    batch_posts.forEach((post, i) => {
      const handle = handle_list[i];
      const post_id = handle_to_id[handle];

      if (store.posts[post_id]) {
        store.posts[post_id].ai_processed = true;
        store.processed_ids.add(store.posts[post_id].real_id);

        if (posts_to_block.includes(handle)) {
          const element = post_elements[post_id];
          if (element) {
            addTrashCan(element);
          }
        }
      }
    });

    await store.write();

    // If we still have pending posts, process the next batch
    if (getPendingPostsCount() >= 10) {
      setTimeout(analyzePostsBatch, 100);
    }
  } catch (e) {
    console.error("DEBUG: Batch processing failed:", e);
  } finally {
    is_processing = false;
  }
}

Store.init().then((s) => {
  store = s;
  processExistingPosts();
  observePosts();
});
