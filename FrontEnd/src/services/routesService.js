/**
 * Routes Service - Handling route planning using Google Routes API
 */

// Get API key from environment variables
const getApiKey = () => {
  // First try to get from environment variables
  const envApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Return the environment variable if available
  if (envApiKey) {
    return envApiKey;
  }

  // Fallback to hardcoded key (not recommended for production)
  console.warn(
    "API key not found in environment variables. Using fallback key."
  );
  return "AIzaSyB9g1LcaQTtNj0xQIHqugH_zfFCndrxbBw";
};

// Get API key
const API_KEY = getApiKey();

/**
 * Calculate a route between origin and destination
 *
 * @param {Object} origin - Origin coordinates {lat, lng}
 * @param {Object} destination - Destination coordinates {lat, lng}
 * @returns {Promise<Object>} - Route details
 */
export const calculateRoute = async (origin, destination) => {
  try {
    // Format coordinates for the API
    const originString = `${origin.lat},${origin.lng}`;
    const destinationString = `${destination.lat},${destination.lng}`;

    // Using Routes API endpoint (with fallback to JavaScript API if needed)
    const response = await fetch(
      `https://routes.googleapis.com/directions/v2:computeRoutes?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs",
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude: origin.lat,
                longitude: origin.lng,
              },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: destination.lat,
                longitude: destination.lng,
              },
            },
          },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
          computeAlternativeRoutes: false,
          routeModifiers: {
            avoidTolls: false,
            avoidHighways: false,
            avoidFerries: false,
          },
          languageCode: "en-US",
          units: "METRIC",
        }),
      }
    );

    // Parse the response
    if (!response.ok) {
      // If Routes API fails, we'll use a fallback
      console.warn("Routes API failed, using fallback method");
      return await calculateRouteUsingJavaScriptAPI(origin, destination);
    }

    const data = await response.json();

    // Format the response
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];

      // Extract steps (if available)
      let steps = [];
      if (route.legs && route.legs.length > 0) {
        route.legs.forEach((leg) => {
          if (leg.steps) {
            steps = steps.concat(
              leg.steps.map((step) => ({
                instructions:
                  step.navigationInstruction?.instructions ||
                  "Continue on route",
                distance: step.distanceMeters
                  ? `${(step.distanceMeters / 1000).toFixed(1)} km`
                  : "",
                duration: step.duration
                  ? `${Math.round(
                      parseInt(step.duration.replace("s", "")) / 60
                    )} mins`
                  : "",
              }))
            );
          }
        });
      }

      // Create route details object
      return {
        distance: `${(route.distanceMeters / 1000).toFixed(1)} km`,
        duration: route.duration
          ? `${Math.round(parseInt(route.duration.replace("s", "")) / 60)} mins`
          : "Unknown",
        encodedPolyline: route.polyline?.encodedPolyline,
        steps: steps,
      };
    }

    throw new Error("No routes found");
  } catch (error) {
    console.error("Error calculating route:", error);
    // Try fallback method
    return await calculateRouteUsingJavaScriptAPI(origin, destination);
  }
};

/**
 * Fallback method using Google Maps JavaScript API
 *
 * @param {Object} origin - Origin coordinates {lat, lng}
 * @param {Object} destination - Destination coordinates {lat, lng}
 * @returns {Promise<Object>} - Route details
 */
const calculateRouteUsingJavaScriptAPI = (origin, destination) => {
  return new Promise((resolve, reject) => {
    try {
      // Check if Google Maps is loaded
      if (!window.google || !window.google.maps) {
        throw new Error("Google Maps JavaScript API not loaded");
      }

      // Create a DirectionsService instance
      const directionsService = new window.google.maps.DirectionsService();

      // Request directions
      directionsService.route(
        {
          origin: origin,
          destination: destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            // Extract route information
            const route = result.routes[0];
            const leg = route.legs[0];

            // Format the steps
            const steps = leg.steps.map((step) => ({
              instructions: step.instructions,
              distance: step.distance.text,
              duration: step.duration.text,
            }));

            // Create route details object
            resolve({
              distance: leg.distance.text,
              duration: leg.duration.text,
              steps: steps,
              // Add a flag to indicate this is from JavaScript API
              fromJSAPI: true,
              // Store the raw result for rendering
              rawResult: result,
            });
          } else {
            reject(new Error(`DirectionsService failed: ${status}`));
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

export default { calculateRoute };
