'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MatchScoreGauge from '../components/MatchScoreGauge';

export default function Match() {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/signup');
      return;
    }

    async function fetchMatch() {
      try {
        const response = await fetch(`/api/match?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch match');
        const data = await response.json();
        setMatchData(data);
        // Only clear survey data, keep userId for potential future use
        localStorage.removeItem('surveyData');
      } catch (error) {
        console.error('Error fetching match:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMatch();
  }, [router]);

  if (loading) return <div>Finding your match...</div>;
  if (!matchData) return <div>No match found</div>;

  return (
    <div>
      <h1>Your Best Match</h1>
      <MatchScoreGauge score={matchData.match.matchScore} />
      <div>
        <h2>{matchData.match.name}</h2>
        <p>{matchData.match.profession}</p>
        <p>{matchData.match.location}</p>
      </div>
      <div>
        <h3>Why You Might Click</h3>
        <p>{matchData.explanation}</p>
      </div>
      <button onClick={() => router.push({
        pathname: '/meetup',
        query: {
          locationA: matchData.currentUserLocation,
          locationB: matchData.match.location,
        },
      })}>
        Suggest Meetup Location
      </button>
    </div>
  );
}
