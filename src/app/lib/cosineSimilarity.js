export function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, ai, idx) => sum + ai * b[idx], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
