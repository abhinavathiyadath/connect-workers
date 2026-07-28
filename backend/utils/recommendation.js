/**
 * Smart recommendation: weighted score from distance, price, rating, and bookings.
 * All partial scores are normalized to 0–1 before combining.
 */

/** Earth radius in km */
const R = 6371;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine distance in kilometers between two lat/lng points.
 */
function distanceKm(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Min-max normalize array to [0, 1]. If all equal, everyone gets 1.
 */
function normalizeMinMax(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 1);
  return values.map((v) => (v - min) / (max - min));
}

/**
 * Attach recommendationScore and breakdown to each worker object.
 * @param {Array} workers - plain worker docs with location, price, rating, totalBookings
 * @param {number} customerLat
 * @param {number} customerLng
 * @returns {Array} sorted by score descending
 */
function scoreAndSortWorkers(workers, customerLat, customerLng) {
  if (!workers.length) return [];

  const distances = workers.map((w) =>
    distanceKm(customerLat, customerLng, w.location.lat, w.location.lng)
  );
  const prices = workers.map((w) => w.price);
  const ratings = workers.map((w) => w.rating || 0);
  const bookings = workers.map((w) => w.totalBookings || 0);

  const distNorm = normalizeMinMax(distances);
  const distanceScores = distNorm.map((n) => 1 - n);

  const priceNorm = normalizeMinMax(prices);
  const priceScores = priceNorm.map((n) => 1 - n);

  const ratingScores = normalizeMinMax(ratings);
  const bookingScores = normalizeMinMax(bookings);

  const WEIGHTS = {
    distance: 0.4,
    price: 0.2,
    rating: 0.2,
    booking: 0.2,
  };

  const enriched = workers.map((w, i) => {
    const recommendationScore =
      WEIGHTS.distance * distanceScores[i] +
      WEIGHTS.price * priceScores[i] +
      WEIGHTS.rating * ratingScores[i] +
      WEIGHTS.booking * bookingScores[i];

    return {
      ...w,
      distanceKm: Math.round(distances[i] * 100) / 100,
      recommendationScore: Math.round(recommendationScore * 1000) / 1000,
      scoreBreakdown: {
        distanceScore: Math.round(distanceScores[i] * 1000) / 1000,
        priceScore: Math.round(priceScores[i] * 1000) / 1000,
        ratingScore: Math.round(ratingScores[i] * 1000) / 1000,
        bookingScore: Math.round(bookingScores[i] * 1000) / 1000,
      },
    };
  });

  enriched.sort((a, b) => b.recommendationScore - a.recommendationScore);
  return enriched;
}

module.exports = { distanceKm, scoreAndSortWorkers };
