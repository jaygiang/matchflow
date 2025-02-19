import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { locationA, locationB } = req.body;

    try {
      // Geocode the two locations to get latitude and longitude
      const geocode = async (address) => {
        const response = await axios.get(
          'https://maps.googleapis.com/maps/api/geocode/json',
          {
            params: {
              address,
              key: process.env.GOOGLE_MAPS_API_KEY,
            },
          }
        );
        return response.data.results[0].geometry.location;
      };

      const locA = await geocode(locationA);
      const locB = await geocode(locationB);

      // Calculate midpoint
      const midpoint = {
        lat: (locA.lat + locB.lat) / 2,
        lng: (locA.lng + locB.lng) / 2,
      };

      // Search for nearby coffee shops at the midpoint
      const placesResponse = await axios.get(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
        {
          params: {
            location: `${midpoint.lat},${midpoint.lng}`,
            radius: 2000,
            type: 'cafe',
            key: process.env.GOOGLE_MAPS_API_KEY,
          },
        }
      );

      const recommendedVenue = placesResponse.data.results[0];

      res.status(200).json({
        name: recommendedVenue.name,
        address: recommendedVenue.vicinity,
        placeId: recommendedVenue.place_id,
      });
    } catch (error) {
      console.error('Error fetching location:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to fetch location' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
