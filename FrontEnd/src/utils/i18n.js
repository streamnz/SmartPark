/**
 * Internationalization utility for the SmartPark application
 * This file provides language translations for the application
 * Currently only English is supported, but can be expanded to support multiple languages
 */

const translations = {
  en: {
    // Common
    loading: "Loading...",
    error: "Error",
    loginRequired: "Login Required",

    // App name
    appName: "Smart Parking System",

    // Dashboard steps
    selectDestination: "Select Destination",
    confirmRoute: "Confirm Route",
    navigateToParking: "Navigate to Parking",
    findParkingSpot: "Find Parking Spot",
    parkingComplete: "Parking Complete",

    // Destination Selector
    chooseDestination: "Select Your Destination",
    chooseWhere: "Choose where you want to go in Auckland",
    searchDestinations: "Search destinations",
    goHere: "Go Here",

    // Destination confirmation
    confirmYourDestination: "Confirm Your Destination",
    category: "Category",
    selectYourVehicle: "Select Your Vehicle",
    confirmAndStart: "Confirm and Start Navigation",

    // Navigation
    navigateTo: "Navigate to",
    navigationInfo: "Navigation Info",
    from: "From",
    to: "To",
    distance: "Distance",
    estimatedTime: "Estimated Time",
    driving: "Driving",
    arrivedAt: "Arrived at Parking Lot",

    // Parking
    findParkingSpotTitle: "Find Parking Spot",
    recommendedParkingSpot: "Recommended Parking Spot",
    systemReserved: "System has reserved parking spot",
    locatedNear: "for you, located near",
    navigationInstructions: "Navigation Instructions",
    enterParking: "Enter the parking garage",
    goToLevel: "Go to level",
    driveAlong: "Drive along the",
    left: "left",
    right: "right",
    side: "side",
    yourSpotIs: "Your spot is in section",
    parkingComplete: "Parking Complete",

    // Parking Success
    parkingSuccessful: "Parking Successful!",
    rememberLocation: "Please remember your parking location:",
    parkingDetails: "Parking Details:",
    parkingFacility: "Parking Facility:",
    parkingSpot: "Parking Spot:",
    timeStarted: "Time Started:",
    vehicle: "Vehicle:",
    savedToHistory:
      "To help you find your vehicle later, we've saved your parking location to your history.",
    returnHome: "Return to Home",

    // Parking Console
    parkingAssistant: "Parking Assistant",
    currentPosition: "Current Position:",
    targetSpot: "Target Spot:",
    reroute: "Reroute",
    closeToTarget: "You are close to your target spot, please park carefully",
  },
  // Add more languages here if needed in the future
};

// Default language
const defaultLang = "en";

// Get translation function
export const t = (key, lang = defaultLang) => {
  if (!translations[lang]) {
    console.warn(
      `Language ${lang} not supported, falling back to ${defaultLang}`
    );
    lang = defaultLang;
  }

  if (!translations[lang][key]) {
    console.warn(`Translation key "${key}" not found in ${lang}`);
    return key;
  }

  return translations[lang][key];
};

export default {
  t,
  currentLanguage: defaultLang,
};
