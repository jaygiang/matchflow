import { NextResponse } from 'next/server';
import { getSession } from '../../lib/neo4j';
import axios from 'axios';

export async function POST(request) {
  try {
    const { name, email, profession, location, answer1, answer2, answer3 } = await request.json();
    
    const question1 = "How would close friends describe you?";
    const question2 = "What are some random things you geek out on (unrelated to your job)?";
    const question3 = "Describe your pet peeves or things that bug you.";

    const surveyText = `
Q: ${question1}
A: ${answer1}
Q: ${question2}
A: ${answer2}
Q: ${question3}
A: ${answer3}
    `.trim();

    // Generate embedding using OpenAI
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        input: surveyText,
        model: 'text-embedding-ada-002',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );
    const embedding = openaiResponse.data.data[0].embedding;

    // Store in Neo4j and return the generated userId
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
        embedding: $embedding
      })
      RETURN u.userId AS userId
      `,
      {
        name,
        email,
        profession,
        location,
        answer1,
        answer2,
        answer3,
        embedding,
        question1,
        question2,
        question3
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
