import { NextResponse } from 'next/server';
import { getSession } from '../../lib/neo4j';
import axios from 'axios';

export async function POST(request) {
  try {
    const { name, email, profession, location, answer1, answer2, answer3 } = await request.json();

    // Define the survey questions
    const question1 = "How would close friends describe you?";
    const question2 = "What are some random things you geek out on (unrelated to your job)?";
    const question3 = "Describe your pet peeves or things that bug you.";

    // Create separate inputs for each Q&A pair for embedding
    const input1 = `Q: ${question1}\nA: ${answer1}`;
    const input2 = `Q: ${question2}\nA: ${answer2}`;
    const input3 = `Q: ${question3}\nA: ${answer3}`;

    // Generate embeddings for each survey answer using OpenAI
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        input: [input1, input2, input3],
        model: 'text-embedding-ada-002',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );
    const embeddings = openaiResponse.data.data.map(item => item.embedding);
    const embedding1 = embeddings[0];
    const embedding2 = embeddings[1];
    const embedding3 = embeddings[2];

    // Call Diffbot to scrape user data (e.g., description)
    const diffbotUrl = `https://kg.diffbot.com/kg/v3/enhance?type=Person&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&size=1&refresh=false&search=false&nonCanonicalFacts=false&jsonmode=%20&token=${process.env.DIFFBOT_API_TOKEN}`;
    
    const diffbotResponse = await axios.get(diffbotUrl, {
      headers: { accept: 'application/json' }
    });
    
    // Extract description from Diffbot response (update based on response structure)
    const diffbotData = diffbotResponse.data;
    let diffbotDescription = "";
    if (diffbotData && diffbotData.data && diffbotData.data.length > 0) {
      diffbotDescription = diffbotData.data[0].entity.description || "";
    }

    // Generate an embedding for the diffbot description if it exists
    let diffbotEmbedding = null;
    if (diffbotDescription && diffbotDescription.trim() !== "") {
      const diffbotEmbeddingResponse = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          input: diffbotDescription,
          model: 'text-embedding-ada-002',
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );
      diffbotEmbedding = diffbotEmbeddingResponse.data.data[0].embedding;
    }

    // Store in Neo4j along with questions, answers, and embeddings
    const session = getSession();
    const result = await session.run(
      `
      CREATE (u:User {
        userId: apoc.create.uuid(),
        name: $name,
        email: $email,
        profession: $profession,
        location: $location,
        question1: $question1,
        question2: $question2,
        question3: $question3,
        answer1: $answer1,
        answer2: $answer2,
        answer3: $answer3,
        embedding1: $embedding1,
        embedding2: $embedding2,
        embedding3: $embedding3,
        diffbotDescription: $diffbotDescription,
        diffbotEmbedding: $diffbotEmbedding
      })
      RETURN u.userId AS userId
      `,
      {
        name,
        email,
        profession,
        location,
        question1,
        question2,
        question3,
        answer1,
        answer2,
        answer3,
        embedding1,
        embedding2,
        embedding3,
        diffbotDescription,
        diffbotEmbedding,
      }
    );
    await session.close();

    // Extract the userId from the first record
    const userId = result.records[0].get('userId');

    return NextResponse.json({ message: 'User created successfully', userId }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error.response?.data || error.message);
    return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
  }
}
