import { NextResponse } from 'next/server';
import { getSession } from '../../lib/neo4j';
import axios from 'axios';

export async function POST(request) {
  try {
    const { name, email, profession, location, answer1, answer2, answer3 } = await request.json();
    
    // Define the questions
    const question1 = "How would close friends describe you?";
    const question2 = "What are some random things you geek out on (unrelated to your job)?";
    const question3 = "Describe your pet peeves or things that bug you.";

    // Create separate inputs for each Q&A pair
    const input1 = `Q: ${question1}\nA: ${answer1}`;
    const input2 = `Q: ${question2}\nA: ${answer2}`;
    const input3 = `Q: ${question3}\nA: ${answer3}`;

    // Generate embeddings for each answer using OpenAI
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

    // Extract the embeddings from the response
    const embeddings = openaiResponse.data.data.map(item => item.embedding);
    const embedding1 = embeddings[0];
    const embedding2 = embeddings[1];
    const embedding3 = embeddings[2];

    // Store in Neo4j along with questions and answers, and return the generated userId
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
        embedding3: $embedding3
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
      }
    );
    await session.close();

    // Extract the userId from the first record
    const userId = result.records[0].get('userId');

    return NextResponse.json({ message: 'User created successfully', userId }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
  }
}
