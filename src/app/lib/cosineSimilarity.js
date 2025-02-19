export function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, ai, idx) => sum + ai * b[idx], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  // Convert similarity to percentage and ensure it's between 0 and 100
  const similarity = (dotProduct / (magnitudeA * magnitudeB));
  return Math.max(0, Math.min(1, similarity));
}
