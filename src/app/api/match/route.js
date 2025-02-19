import { NextResponse } from "next/server";
import { getSession } from "../../lib/neo4j";
import { cosineSimilarity } from "../../lib/cosineSimilarity";
import axios from "axios";

export async function GET(request) {
  // Parse query parameters from the URL
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { message: "User ID is required" },
      { status: 400 },
    );
  }

  try {
    const session = getSession();

    // Get current user's data
    const userResult = await session.run(
      "MATCH (u:User {userId: $userId}) RETURN u",
      { userId },
    );

    if (userResult.records.length === 0) {
      await session.close();
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const currentUser = userResult.records[0].get("u").properties;

    // Get all other users
    const othersResult = await session.run(
      "MATCH (u:User) WHERE u.userId <> $userId RETURN u",
      { userId },
    );

    const otherUsers = othersResult.records.map(
      (record) => record.get("u").properties,
    );

    // Calculate per-question similarity scores and overall match
    const matches = otherUsers.map((user) => {
      // Calculate similarity scores for each question
      const score1 = Math.round(cosineSimilarity(
        [currentUser.answer1], 
        [user.answer1]
      ) * 100);
      const score2 = Math.round(cosineSimilarity(
        [currentUser.answer2], 
        [user.answer2]
      ) * 100);
      const score3 = Math.round(cosineSimilarity(
        [currentUser.answer3], 
        [user.answer3]
      ) * 100);
      
      // Overall similarity using the embedding
      const overallSimilarity = cosineSimilarity(
        currentUser.embedding,
        user.embedding,
      );

      return {
        userId: user.userId,
        name: user.name,
        profession: user.profession,
        location: user.location,
        matchScore: Math.round(overallSimilarity * 100),
        questionScores: { score1, score2, score3 }
      };
    });

    // Sort by match score and get the best match
    const bestMatch = matches.sort((a, b) => b.matchScore - a.matchScore)[0];

    // Generate explanation using OpenAI Chat Completions
    const matchedUser = otherUsers.find((u) => u.userId === bestMatch.userId);
    const { score1, score2, score3 } = bestMatch.questionScores;

    const prompt = `Based on the following similarity scores and survey responses:

Question 1: "How would close friends describe you?"
- Similarity Score: ${score1}%
- Your Answer: ${currentUser.answer1}
- Matched User's Answer: ${matchedUser.answer1}

Question 2: "What are some random things you geek out on (unrelated to your job)?"
- Similarity Score: ${score2}%
- Your Answer: ${currentUser.answer2}
- Matched User's Answer: ${matchedUser.answer2}

Question 3: "Describe your pet peeves or things that bug you."
- Similarity Score: ${score3}%
- Your Answer: ${currentUser.answer3}
- Matched User's Answer: ${matchedUser.answer3}

Please explain in one sentence why these two might be good friends. Then, list out the similarities between their responses as an unordered list and highlight any major differences.`;

    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a friendly matchmaker assistant.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 150,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      },
    );

    const explanation = openaiResponse.data.choices[0].message.content.trim();

    await session.close();

    return NextResponse.json(
      {
        match: bestMatch,
        explanation,
        currentUserLocation: currentUser.location,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Error finding match:",
      error.response?.data || error.message,
    );
    return NextResponse.json(
      { message: "Error finding match" },
      { status: 500 },
    );
  }
}
