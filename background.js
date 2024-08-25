chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchEmbeddings") {
    fetchEmbeddings(request.payload)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ error: error.message }));
    return true; // Indicates that the response is asynchronous
  }
});

async function fetchEmbeddings({ chunks, settings }) {
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
          input: chunks,
          model: settings.model,
        }),
      }).then((r) => r.json());
      if (!res.data || !res.data[0] || !res.data[0].embedding) {
        console.error("Error fetching embedding", res);
        throw new Error("Embedding not found in response");
      }
      return { embeddings: res.data.map((d) => d.embedding) };
    default:
      throw new Error(`Unsupported provider: ${settings.provider}`);
  }
}
