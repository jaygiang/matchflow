'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MatchScoreGauge from '../components/MatchScoreGauge';
import CoffeeSpotModal from '../components/CoffeeSpotModal';
import confetti from 'canvas-confetti';

export default function Match() {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [venues, setVenues] = useState([]);
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
        
        // Trigger confetti effect
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (error) {
        console.error('Error fetching match:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMatch();
  }, [router]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-lg mb-4 text-gray-700 dark:text-gray-300">Finding your match...</div>
      <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
    </div>
  );
  if (!matchData) return <div>No match found</div>;

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto lg:py-0">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">We Found Your Match! 🎉</h1>
        <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex flex-col items-center pb-10 pt-8">
            <img className="w-24 h-24 mb-3 rounded-full shadow-lg" src="/profile-placeholder.jpg" alt={`${matchData.match.name}'s profile`}/>
            <h2 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">{matchData.match.name}</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{matchData.match.profession}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{matchData.match.location}</span>
            
            <div className="mt-6 px-4">
              <h3 className="text-xl text-center font-medium text-gray-900 dark:text-white mb-2">Your Connection Insights</h3>
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                <p className="mb-2">{matchData.explanation.split('Similarities:')[0].trim()}</p>
                
                {matchData.explanation.includes('Similarities:') && (
                  <>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Similarities:</h4>
                    <ul className="list-disc pl-6 mb-4">
                      {matchData.explanation
                        .split('Similarities:')[1]
                        .split('Differences:')[0]
                        .split('\n')
                        .map(line => line.trim())
                        .filter(line => line.startsWith('-'))
                        .map((item, index) => (
                          <li key={index} className="mb-1 pl-1">
                            <span className="block">
                              {item.substring(1).trim()}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </>
                )}
                
                {matchData.explanation.includes('Differences:') && (
                  <>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Differences:</h4>
                    <ul className="list-disc pl-6">
                      {matchData.explanation
                        .split('Differences:')[1]
                        .split('\n')
                        .map(line => line.trim())
                        .filter(line => line.startsWith('-'))
                        .map((item, index) => (
                          <li key={index} className="mb-1 pl-1">
                            <span className="block">
                              {item.substring(1).trim()}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 md:mt-6 w-full px-4">
              <button
                onClick={async () => {
                  if (!matchData.currentUserLocation || !matchData.match.location) {
                    alert('Location information is missing. Please ensure both users have valid locations.');
                    return;
                  }

                  try {
                    const response = await fetch(
                      `/api/location?locationA=${encodeURIComponent(matchData.currentUserLocation)}&locationB=${encodeURIComponent(matchData.match.location)}`
                    );
                    const data = await response.json();

                    if (data.venues && data.venues.length > 0) {
                      setVenues(data.venues);
                      setIsModalOpen(true);
                    } else {
                      alert('No coffee spots found in the area');
                    }
                  } catch (error) {
                    console.error('Error fetching meetup locations:', error);
                    alert('Failed to find meetup locations. Please try again.');
                  }
                }}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Suggest a meetup spot
              </button>
              <CoffeeSpotModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                venues={venues}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <MatchScoreGauge score={matchData.match.matchScore} />
        </div>
      </div>
    </section>
  );
}
