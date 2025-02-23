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
    const matches = await Promise.all(
      otherUsers.map(async (user) => {
        // Generate embeddings for each answer pair (survey answers)
        const embeddingInputs = [
          currentUser.answer1,
          currentUser.answer2,
          currentUser.answer3,
          user.answer1,
          user.answer2,
          user.answer3,
        ];

        const embeddingResponse = await axios.post(
          "https://api.openai.com/v1/embeddings",
          {
            input: embeddingInputs,
            model: "text-embedding-ada-002",
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
          },
        );

        const embeddings = embeddingResponse.data.data.map(
          (item) => item.embedding,
        );
        const currentEmbeddings = embeddings.slice(0, 3);
        const matchedEmbeddings = embeddings.slice(3);

        // Calculate per-question similarity scores
        const score1Percent = Math.round(
          cosineSimilarity(currentEmbeddings[0], matchedEmbeddings[0]) * 100,
        );
        const score2Percent = Math.round(
          cosineSimilarity(currentEmbeddings[1], matchedEmbeddings[1]) * 100,
        );
        const score3Percent = Math.round(
          cosineSimilarity(currentEmbeddings[2], matchedEmbeddings[2]) * 100,
        );

        // Calculate survey average score
        const surveyAverage = (score1Percent + score2Percent + score3Percent) / 3;

        // Calculate diffbot similarity if both users have a diffbotEmbedding
        let diffbotScorePercent = 0;
        if (currentUser.diffbotEmbedding && user.diffbotEmbedding) {
          diffbotScorePercent = Math.round(
            cosineSimilarity(currentUser.diffbotEmbedding, user.diffbotEmbedding) * 100,
          );
        }

        // Combine survey and diffbot similarity into overall match score
        const overallMatchScore =
          diffbotScorePercent > 0
            ? Math.round((surveyAverage + diffbotScorePercent) / 2)
            : Math.round(surveyAverage);

        return {
          userId: user.userId,
          name: user.name,
          profession: user.profession,
          location: user.location,
          diffbotDescription: user.diffbotDescription,
          matchScore: overallMatchScore,
          questionScores: {
            score1: score1Percent,
            score2: score2Percent,
            score3: score3Percent,
            diffbot: diffbotScorePercent,
          },
        };
      }),
    );

    // Check if we have any matches
    if (!matches || matches.length === 0) {
      await session.close();
      return NextResponse.json(
        { message: "No matches found" },
        { status: 404 },
      );
    }

    // Sort by match score and get the best match
    const bestMatch = matches.sort((a, b) => b.matchScore - a.matchScore)[0];

    // Validate bestMatch and its properties
    if (!bestMatch || !bestMatch.questionScores) {
      await session.close();
      return NextResponse.json(
        { message: "Invalid match data" },
        { status: 500 },
      );
    }

    // Find matched user and validate
    const matchedUser = otherUsers.find((u) => u.userId === bestMatch.userId);
    if (!matchedUser) {
      await session.close();
      return NextResponse.json(
        { message: "Matched user not found" },
        { status: 500 },
      );
    }

    const {
      score1: score1Percent,
      score2: score2Percent,
      score3: score3Percent,
    } = bestMatch.questionScores;

    // Create relationship between current user and best match
    const currentUserId = currentUser.userId;
    const matchedUserId = bestMatch.userId;

    await session.run(
      `
      MATCH (a:User {userId: $currentUserId}), (b:User {userId: $matchedUserId})
      MERGE (a)-[r:MATCHES_WITH]->(b)
      SET r.matchScore = $matchScore, r.createdAt = timestamp()
      `,
      {
        currentUserId,
        matchedUserId,
        matchScore: bestMatch.matchScore,
      }
    );

    // Build the prompt for generating an explanation, including Diffbot descriptions
    const prompt = `
    You are the user in this conversation, and you have a matched user named ${matchedUser.name}. 
    Below are both of your survey responses:
    
    YOUR SURVEY RESPONSES:
    Question 1: "How would close friends describe you?"
    - Similarity Score: ${score1Percent}%
    - Your Answer: ${currentUser.answer1}
    
    Question 2: "What are some random things you geek out on (unrelated to your job)?"
    - Similarity Score: ${score2Percent}%
    - Your Answer: ${currentUser.answer2}
    
    Question 3: "Describe your pet peeves or things that bug you."
    - Similarity Score: ${score3Percent}%
    - Your Answer: ${currentUser.answer3}
    
    YOUR ADDITIONAL DESCRIPTION:
    - ${currentUser.diffbotDescription || "No additional description available."}
    
    YOUR DIFFBOT EMBEDDING (Additional Description Vector, first 5 values):
    - ${currentUser.diffbotEmbedding ? currentUser.diffbotEmbedding.slice(0, 5).join(", ") + " ..." : "No embedding available."}
    
    MATCHED USER'S SURVEY RESPONSES:
    Question 1: "How would close friends describe them?"
    - Matched User's Answer: ${matchedUser.answer1}
    
    Question 2: "What are some random things they geek out on (unrelated to their job)?"
    - Matched User's Answer: ${matchedUser.answer2}
    
    Question 3: "Describe their pet peeves or things that bug them."
    - Matched User's Answer: ${matchedUser.answer3}
    
    MATCHED USER'S ADDITIONAL DESCRIPTION:
    - ${matchedUser.diffbotDescription || "No additional description available."}
    
    MATCHED USER'S DIFFBOT EMBEDDING (Additional Description Vector, first 5 values):
    - ${matchedUser.diffbotEmbedding ? matchedUser.diffbotEmbedding.slice(0, 5).join(", ") + " ..." : "No embedding available."}
    
    INSTRUCTIONS:
    1. Write a single sentence explaining in the second person (i.e., addressing the current user as “you”) why you and ${matchedUser.name} might be good friends. Don't need title or header, list bullet points and numbers for this. Remove any charcters like **.
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
