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

    // Calculate matches with per-question embeddings and similarity scores
    const matches = await Promise.all(otherUsers.map(async (user) => {
      // Generate embeddings for each answer pair
      const embeddingInputs = [
        currentUser.answer1,
        currentUser.answer2,
        currentUser.answer3,
        user.answer1,
        user.answer2,
        user.answer3
      ];

      const embeddingResponse = await axios.post(
        "https://api.openai.com/v1/embeddings",
        {
          input: embeddingInputs,
          model: "text-embedding-ada-002"
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );

      const embeddings = embeddingResponse.data.data.map(item => item.embedding);
      const currentEmbeddings = embeddings.slice(0, 3);
      const matchedEmbeddings = embeddings.slice(3);

      // Calculate per-question similarity scores
      const score1Percent = Math.round(cosineSimilarity(currentEmbeddings[0], matchedEmbeddings[0]) * 100);
      const score2Percent = Math.round(cosineSimilarity(currentEmbeddings[1], matchedEmbeddings[1]) * 100);
      const score3Percent = Math.round(cosineSimilarity(currentEmbeddings[2], matchedEmbeddings[2]) * 100);
      
      // Overall similarity using the stored embedding
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
        questionScores: {
          score1: score1Percent,
          score2: score2Percent,
          score3: score3Percent
        }
      };
    }));

    // Sort by match score and get the best match
    const bestMatch = matches.sort((a, b) => b.matchScore - a.matchScore)[0];

    // Generate explanation using OpenAI Chat Completions
    const matchedUser = otherUsers.find((u) => u.userId === bestMatch.userId);
    const { score1: score1Percent, score2: score2Percent, score3: score3Percent } = bestMatch.questionScores;

    const prompt = `
    You are the user in this conversation, and you have a matched user named ${matchedUser.name}. 
    Below are both of your survey responses:
    
    YOUR SURVEY RESPONSES:
    Q1: How would close friends describe you?
    A: ${currentUser.answer1}
    
    Q2: What are some random things you geek out on (unrelated to your job)?
    A: ${currentUser.answer2}
    
    Q3: Describe your pet peeves or things that bug you.
    A: ${currentUser.answer3}
    
    MATCHED USER'S SURVEY RESPONSES:
    Q1: How would close friends describe them?
    A: ${matchedUser.answer1}
    
    Q2: What are some random things they geek out on (unrelated to their job)?
    A: ${matchedUser.answer2}
    
    Q3: Describe their pet peeves or things that bug them.
    A: ${matchedUser.answer3}
    
    INSTRUCTIONS:
    1. Write a single sentence explaining in the second person (i.e., addressing the current user as “you”) why you and ${matchedUser.name} might be good friends.
    2. Under the heading "Similarities:", provide bullet points of what you both share in common (using second-person language, e.g., "You both enjoy traveling").
    3. Under the heading "Differences:", provide bullet points of any notable differences (also in second-person language, e.g., "You dislike loud noises, while ${matchedUser.name} doesn’t mind them").
    4. Keep your response concise, friendly, and encouraging.
    `;
    
    
    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
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
