"use strict";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

function callOpenAiChat(messages, openai_key) {
  if (!openai_key) throw new Error("No OpenAI API key provided");
  const payload = {
    model: "chatgpt-4o-latest",
    messages: messages,
  };
  return fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + openai_key,
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          "OpenAI API request failed with status " + response.status,
        );
      }
      return response.json();
    })
    .then((data) => {
      if (
        !data.choices ||
        !data.choices[0] ||
        !data.choices[0].message ||
        !data.choices[0].message.content
      ) {
        throw new Error("Invalid OpenAI API response structure");
      }
      return data.choices[0].message.content;
    });
}

window.callOpenAiChat = callOpenAiChat;
