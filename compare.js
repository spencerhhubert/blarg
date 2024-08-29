function cosineSimilarity(a, b) {
  if (a.length !== b.length)
    throw new Error("Arrays must have the same length");
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  return normA === 0 || normB === 0 ? 0 : dot / (normA * normB);
}

function euclideanDistance(a, b) {
  if (a.length !== b.length)
    throw new Error("Arrays must have the same length");

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum);
}

function kNearestNeighbors(data, point, k) {
  if (k > data.length)
    throw new Error("K cannot be larger than the dataset size");

  const distances = data.map((dataPoint, index) => ({
    index,
    distance: euclideanDistance(dataPoint, point),
  }));

  distances.sort((a, b) => a.distance - b.distance);
  return distances.slice(0, k).map((d) => d.index);
}

function kMeansClustering(data, k, maxIterations = 100) {
  if (k > data.length)
    throw new Error(
      `K cannot be larger than the dataset size. Found ${k} clusters for ${data.length} data points`,
    );

  // Initialize centroids randomly
  let centroids = data.slice(0, k);
  let assignments = new Array(data.length).fill(0);
  let iterations = 0;

  while (iterations < maxIterations) {
    const newAssignments = [];

    // Assign points to nearest centroid
    for (let i = 0; i < data.length; i++) {
      let nearestCentroid = 0;
      let minDistance = Infinity;

      for (let j = 0; j < k; j++) {
        let distance = euclideanDistance(data[i], centroids[j]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestCentroid = j;
        }
      }
      newAssignments.push(nearestCentroid);
    }

    // Check if assignments have changed
    if (JSON.stringify(assignments) === JSON.stringify(newAssignments)) {
      break;
    }

    assignments = newAssignments;

    // Recalculate centroids
    for (let i = 0; i < k; i++) {
      let cluster = data.filter((_, index) => assignments[index] === i);
      if (cluster.length > 0) {
        centroids[i] = cluster
          .reduce((acc, point) => {
            return acc.map((val, idx) => val + point[idx]);
          })
          .map((sum) => sum / cluster.length);
      }
    }

    iterations++;
  }

  return { centroids, assignments };
}

async function decideIfKeep(tweet, element) {
  if (tweet.content === "") {
    console.log("no content");
    return;
  }
  if (tweet.getEmbeddingsPromise) {
    console.log("supposed to wait ig");
    await tweet.getEmbeddingsPromise;
  }
  const settings = store.settings;
  if (!tweet.hasEmbeddings(settings)) {
    console.log("no embeddings");
    return;
  }
  if (Object.keys(store.tweets).length === 0) {
    console.log("no saved tweets");
    return;
  }
  await Promise.all(
    Object.values(store.tweets).map((st) => st.onlyEmbedIfDontHaveIt(settings)),
  );
  const scores = Object.values(store.tweets)
    .filter((st) => st.hasEmbeddings(settings) && st.isSlop)
    .map((st) =>
      st.embeddings[settings.provider][settings.model].map((chunk) =>
        cosineSimilarity(
          tweet.embeddings[settings.provider][settings.model][0],
          chunk,
        ),
      ),
    )
    .flat();

  const threshold = 0.75;
  if (scores.some((score) => score > threshold)) {
    console.log("remove");
    addGarbageCanEmoji(tweet, element);
    if (settings.deleteHtmlElements) element.remove();
  }
}
