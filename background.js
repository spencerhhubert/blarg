chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchEmbedding") {
    fetchEmbedding(request.payload)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ error: error.message }));
    return true; // Indicates that the response is asynchronous
  }
});

async function fetchEmbedding({ content, settings }) {
  if (!settings.apiKeys || !settings.apiKeys[settings.provider]) {
    throw new Error("API key not found for provider");
  }
  switch (settings.provider) {
    case "OpenAI":
      throw new Error("OpenAI embedding not implemented");
    case "Anthropic":
      const res = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.apiKeys[settings.provider]}`,
        },
        body: JSON.stringify({
          input: [content],
          model: settings.model,
        }),
      }).then((r) => r.json());
      return { embedding: res.data[0].embedding };
    default:
      throw new Error(`Unsupported provider: ${settings.provider}`);
  }
}
