function cosineSimilarity(a, b) {
  if (!a) {
    throw new Error("First array is empty");
  }
  if (!b) {
    throw new Error("Second array is empty");
  }
  if (a.length !== b.length) {
    throw new Error("Arrays must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}
