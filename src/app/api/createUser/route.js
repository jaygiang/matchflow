import { NextResponse } from 'next/server';
import { getSession } from '../../lib/neo4j';
import axios from 'axios';

export async function POST(request) {
  try {
    const { name, email, profession, location, answer1, answer2, answer3 } = await request.json();
    const surveyText = `${answer1} ${answer2} ${answer3}`;

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
