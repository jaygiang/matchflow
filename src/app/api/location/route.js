import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const locationA = searchParams.get('locationA');
  const locationB = searchParams.get('locationB');
  
  // Basic US zip code validation
  const zipCodeRegex = /^\d{5}(-\d{4})?$/;
  if (!locationA || !locationB || !zipCodeRegex.test(locationA) || !zipCodeRegex.test(locationB)) {
    return NextResponse.json(
      { error: 'Both locations are required' },
      { status: 400 }
    );
  }

  try {
    // Geocode both locations
    const geocodeLocation = async (zipCode) => {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            address: zipCode,
            key: process.env.GOOGLE_MAPS_API_KEY,
          },
        }
      );
      
      if (response.data.results.length === 0) {
        throw new Error(`No results found for zip code: ${zipCode}`);
      }
      
      return response.data.results[0].geometry.location;
    };

    const [locationACoords, locationBCoords] = await Promise.all([
      geocodeLocation(locationA),
      geocodeLocation(locationB),
    ]);

    // Calculate midpoint
    const midpoint = {
      lat: (locationACoords.lat + locationBCoords.lat) / 2,
      lng: (locationACoords.lng + locationBCoords.lng) / 2,
    };
;
    // Search for coffee shops near midpoint
    const placesResponse = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: `${midpoint.lat},${midpoint.lng}`,
          radius: 5000, // 5km radius
          type: 'cafe',
          keyword: 'coffee shop',
          key: process.env.GOOGLE_MAPS_API_KEY,
          minprice: 0,
          maxprice: 3,
          opennow: true
        },
      }
    );

    // Process and return top 5 venues
    const venues = placesResponse.data.results
      .slice(0, 5)
      .map(venue => ({
        name: venue.name,
        address: venue.vicinity,
        rating: venue.rating,
        totalRatings: venue.user_ratings_total,
        placeId: venue.place_id,
        location: venue.geometry.location,
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${venue.place_id}`,
      }));

    return NextResponse.json({ venues, midpoint });
  } catch (error) {
    console.error('Error finding meetup locations:', error);
    return NextResponse.json(
      { error: 'Failed to find meetup locations' },
      { status: 500 }
    );
  }
}
