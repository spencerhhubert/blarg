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
      try {
        console.error("using api key", settings.apiKeys[settings.provider]);
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
        });

        if (!res.ok) {
          console.error(
            "Error fetching Anthropic embedding:",
            await res.text(),
          );
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.error("data", data);
        return { embedding: data.data[0].embedding };
      } catch (error) {
        console.error("Error fetching Anthropic embedding:", error);
        throw error;
      }

    default:
      throw new Error(`Unsupported provider: ${settings.provider}`);
  }
}
