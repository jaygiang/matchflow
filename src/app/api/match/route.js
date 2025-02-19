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

    // Calculate similarity scores
    const matches = otherUsers.map((user) => {
      const similarity = cosineSimilarity(
        currentUser.embedding,
        user.embedding,
      );
      return {
        userId: user.userId,
        name: user.name,
        profession: user.profession,
        location: user.location,
        matchScore: similarity * 100,
      };
    });

    // Sort by match score and get the best match
    const bestMatch = matches.sort((a, b) => b.matchScore - a.matchScore)[0];

    // Generate explanation using OpenAI Chat Completions
    const matchedUser = otherUsers.find((u) => u.userId === bestMatch.userId);
    const prompt = `Based on their survey answers:
You: ${currentUser.answer1} ${currentUser.answer2} ${currentUser.answer3}
${matchedUser.name}: ${matchedUser.answer1} ${matchedUser.answer2} ${matchedUser.answer3}

Explain in 2-3 sentences why these people might be good friends.`;

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
