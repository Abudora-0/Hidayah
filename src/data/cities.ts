export type City = {
  name: string;
  country: string;
  lat: number;
  lng: number;
};

/**
 * A fallback list for when a user declines location access or the browser has
 * no geolocation. Weighted towards South Asia and the wider Muslim world, then
 * the largest cities elsewhere.
 */
export const CITIES: City[] = [
  { name: "Karachi", country: "Pakistan", lat: 24.8607, lng: 67.0011 },
  { name: "Lahore", country: "Pakistan", lat: 31.5204, lng: 74.3587 },
  { name: "Islamabad", country: "Pakistan", lat: 33.6844, lng: 73.0479 },
  { name: "Rawalpindi", country: "Pakistan", lat: 33.5651, lng: 73.0169 },
  { name: "Faisalabad", country: "Pakistan", lat: 31.4187, lng: 73.0791 },
  { name: "Multan", country: "Pakistan", lat: 30.1575, lng: 71.5249 },
  { name: "Peshawar", country: "Pakistan", lat: 34.0151, lng: 71.5249 },
  { name: "Quetta", country: "Pakistan", lat: 30.1798, lng: 66.975 },
  { name: "Hyderabad", country: "Pakistan", lat: 25.396, lng: 68.3578 },
  { name: "Sialkot", country: "Pakistan", lat: 32.4945, lng: 74.5229 },
  { name: "Gujranwala", country: "Pakistan", lat: 32.1877, lng: 74.1945 },
  { name: "Bahawalpur", country: "Pakistan", lat: 29.3956, lng: 71.6836 },
  { name: "Sargodha", country: "Pakistan", lat: 32.0836, lng: 72.6711 },
  { name: "Abbottabad", country: "Pakistan", lat: 34.1688, lng: 73.2215 },
  { name: "Gilgit", country: "Pakistan", lat: 35.9208, lng: 74.3144 },

  { name: "Makkah", country: "Saudi Arabia", lat: 21.3891, lng: 39.8579 },
  { name: "Madinah", country: "Saudi Arabia", lat: 24.5247, lng: 39.5692 },
  { name: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lng: 46.6753 },
  { name: "Jeddah", country: "Saudi Arabia", lat: 21.4858, lng: 39.1925 },
  { name: "Dammam", country: "Saudi Arabia", lat: 26.3927, lng: 49.9777 },

  { name: "Delhi", country: "India", lat: 28.6139, lng: 77.209 },
  { name: "Mumbai", country: "India", lat: 19.076, lng: 72.8777 },
  { name: "Hyderabad", country: "India", lat: 17.385, lng: 78.4867 },
  { name: "Kolkata", country: "India", lat: 22.5726, lng: 88.3639 },
  { name: "Bengaluru", country: "India", lat: 12.9716, lng: 77.5946 },
  { name: "Chennai", country: "India", lat: 13.0827, lng: 80.2707 },
  { name: "Lucknow", country: "India", lat: 26.8467, lng: 80.9462 },
  { name: "Srinagar", country: "India", lat: 34.0837, lng: 74.7973 },

  { name: "Dhaka", country: "Bangladesh", lat: 23.8103, lng: 90.4125 },
  { name: "Chattogram", country: "Bangladesh", lat: 22.3569, lng: 91.7832 },
  { name: "Kabul", country: "Afghanistan", lat: 34.5553, lng: 69.2075 },
  { name: "Kandahar", country: "Afghanistan", lat: 31.6289, lng: 65.7372 },
  { name: "Colombo", country: "Sri Lanka", lat: 6.9271, lng: 79.8612 },
  { name: "Kathmandu", country: "Nepal", lat: 27.7172, lng: 85.324 },

  { name: "Dubai", country: "United Arab Emirates", lat: 25.2048, lng: 55.2708 },
  { name: "Abu Dhabi", country: "United Arab Emirates", lat: 24.4539, lng: 54.3773 },
  { name: "Sharjah", country: "United Arab Emirates", lat: 25.3463, lng: 55.4209 },
  { name: "Doha", country: "Qatar", lat: 25.2854, lng: 51.531 },
  { name: "Kuwait City", country: "Kuwait", lat: 29.3759, lng: 47.9774 },
  { name: "Manama", country: "Bahrain", lat: 26.2285, lng: 50.586 },
  { name: "Muscat", country: "Oman", lat: 23.588, lng: 58.3829 },
  { name: "Baghdad", country: "Iraq", lat: 33.3152, lng: 44.3661 },
  { name: "Najaf", country: "Iraq", lat: 32.0, lng: 44.3333 },
  { name: "Amman", country: "Jordan", lat: 31.9454, lng: 35.9284 },
  { name: "Jerusalem", country: "Palestine", lat: 31.7683, lng: 35.2137 },
  { name: "Gaza", country: "Palestine", lat: 31.5017, lng: 34.4668 },
  { name: "Beirut", country: "Lebanon", lat: 33.8938, lng: 35.5018 },
  { name: "Damascus", country: "Syria", lat: 33.5138, lng: 36.2765 },
  { name: "Tehran", country: "Iran", lat: 35.6892, lng: 51.389 },
  { name: "Mashhad", country: "Iran", lat: 36.2605, lng: 59.6168 },
  { name: "Sanaa", country: "Yemen", lat: 15.3694, lng: 44.191 },

  { name: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784 },
  { name: "Ankara", country: "Turkey", lat: 39.9334, lng: 32.8597 },
  { name: "Izmir", country: "Turkey", lat: 38.4237, lng: 27.1428 },
  { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
  { name: "Alexandria", country: "Egypt", lat: 31.2001, lng: 29.9187 },
  { name: "Casablanca", country: "Morocco", lat: 33.5731, lng: -7.5898 },
  { name: "Rabat", country: "Morocco", lat: 34.0209, lng: -6.8416 },
  { name: "Marrakesh", country: "Morocco", lat: 31.6295, lng: -7.9811 },
  { name: "Algiers", country: "Algeria", lat: 36.7538, lng: 3.0588 },
  { name: "Tunis", country: "Tunisia", lat: 36.8065, lng: 10.1815 },
  { name: "Tripoli", country: "Libya", lat: 32.8872, lng: 13.1913 },
  { name: "Khartoum", country: "Sudan", lat: 15.5007, lng: 32.5599 },
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792 },
  { name: "Kano", country: "Nigeria", lat: 12.0022, lng: 8.592 },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219 },
  { name: "Mogadishu", country: "Somalia", lat: 2.0469, lng: 45.3182 },
  { name: "Dakar", country: "Senegal", lat: 14.7167, lng: -17.4677 },
  { name: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241 },
  { name: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473 },

  { name: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456 },
  { name: "Surabaya", country: "Indonesia", lat: -7.2575, lng: 112.7521 },
  { name: "Kuala Lumpur", country: "Malaysia", lat: 3.139, lng: 101.6869 },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Bandar Seri Begawan", country: "Brunei", lat: 4.9031, lng: 114.9398 },
  { name: "Manila", country: "Philippines", lat: 14.5995, lng: 120.9842 },
  { name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018 },
  { name: "Tashkent", country: "Uzbekistan", lat: 41.2995, lng: 69.2401 },
  { name: "Almaty", country: "Kazakhstan", lat: 43.222, lng: 76.8512 },
  { name: "Baku", country: "Azerbaijan", lat: 40.4093, lng: 49.8671 },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Beijing", country: "China", lat: 39.9042, lng: 116.4074 },
  { name: "Urumqi", country: "China", lat: 43.8256, lng: 87.6168 },

  { name: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278 },
  { name: "Birmingham", country: "United Kingdom", lat: 52.4862, lng: -1.8904 },
  { name: "Manchester", country: "United Kingdom", lat: 53.4808, lng: -2.2426 },
  { name: "Bradford", country: "United Kingdom", lat: 53.795, lng: -1.7594 },
  { name: "Glasgow", country: "United Kingdom", lat: 55.8642, lng: -4.2518 },
  { name: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603 },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { name: "Marseille", country: "France", lat: 43.2965, lng: 5.3698 },
  { name: "Berlin", country: "Germany", lat: 52.52, lng: 13.405 },
  { name: "Frankfurt", country: "Germany", lat: 50.1109, lng: 8.6821 },
  { name: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  { name: "Brussels", country: "Belgium", lat: 50.8503, lng: 4.3517 },
  { name: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038 },
  { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964 },
  { name: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686 },
  { name: "Oslo", country: "Norway", lat: 59.9139, lng: 10.7522 },
  { name: "Copenhagen", country: "Denmark", lat: 55.6761, lng: 12.5683 },
  { name: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173 },
  { name: "Sarajevo", country: "Bosnia and Herzegovina", lat: 43.8563, lng: 18.4131 },

  { name: "New York", country: "United States", lat: 40.7128, lng: -74.006 },
  { name: "Chicago", country: "United States", lat: 41.8781, lng: -87.6298 },
  { name: "Houston", country: "United States", lat: 29.7604, lng: -95.3698 },
  { name: "Los Angeles", country: "United States", lat: 34.0522, lng: -118.2437 },
  { name: "Dearborn", country: "United States", lat: 42.3223, lng: -83.1763 },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { name: "Montreal", country: "Canada", lat: 45.5017, lng: -73.5673 },
  { name: "Mississauga", country: "Canada", lat: 43.589, lng: -79.6441 },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { name: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631 },
  { name: "Auckland", country: "New Zealand", lat: -36.8485, lng: 174.7633 },
];

export function searchCities(query: string, limit = 8): City[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored = CITIES.map((city) => {
    const name = city.name.toLowerCase();
    const country = city.country.toLowerCase();
    let score = -1;
    if (name.startsWith(q)) score = 0;
    else if (name.includes(q)) score = 1;
    else if (country.startsWith(q)) score = 2;
    else if (country.includes(q)) score = 3;
    return { city, score };
  }).filter((entry) => entry.score >= 0);

  scored.sort((a, b) => a.score - b.score || a.city.name.localeCompare(b.city.name));
  return scored.slice(0, limit).map((entry) => entry.city);
}
