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
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto lg:py-0">
        <MatchScoreGauge score={matchData.match.matchScore} />
        
        <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 mt-8">
          <div className="flex flex-col items-center pb-10 pt-8">
            <img className="w-24 h-24 mb-3 rounded-full shadow-lg" src="/profile-placeholder.jpg" alt={`${matchData.match.name}'s profile`}/>
            <h5 className="mb-1 text-xl font-medium text-gray-900 dark:text-white">{matchData.match.name}</h5>
            <span className="text-sm text-gray-500 dark:text-gray-400">{matchData.match.profession}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{matchData.match.location}</span>
            
            <div className="mt-6 px-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Why You Might Click</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{matchData.explanation}</p>
            </div>

            <div className="flex mt-4 md:mt-6">
              <button
                onClick={() => router.push({
                  pathname: '/meetup',
                  query: {
                    locationA: matchData.currentUserLocation,
                    locationB: matchData.match.location,
                  },
                })}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Suggest Meetup Location
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
