import { Point, Feature, Coordinates } from './interfaces';

import turfDistance from '@turf/distance';
import turfBearing from '@turf/bearing';


export function distance(from: Coordinates, to: Coordinates) {
  return turfDistance(toGeoJSONFeature(from), toGeoJSONFeature(to));
}

export function bearing(from: Coordinates, to: Coordinates) {
  return turfBearing(toGeoJSONFeature(from), toGeoJSONFeature(to));
}

export function toGeoJSONFeature(coordinates: Coordinates, props?: any): Feature<Point> {
  coordinates = flip(coordinates) as Coordinates;
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates
    },
    properties: props
  };
}


export function flip(arr) {
  return [arr[1], arr[0]];
}

export function setPrecision(km: number): number {
  switch (true) {
    case km <= 0.00477:
      return 9;

    case km <= 0.0382:
      return 8;

    case km <= 0.153:
      return 7;

    case km <= 1.22:
      return 6;

    case km <= 4.89:
      return 5;

    case km <= 39.1:
      return 4;

    case km <= 156:
      return 3;

    case km <= 1250:
      return 2;

    default:
      return 1;
  }
  // 1	≤ 5,000km	×	5,000km
  // 2	≤ 1,250km	×	625km
  // 3	≤ 156km	×	156km
  // 4	≤ 39.1km	×	19.5km
  // 5	≤ 4.89km	×	4.89km
  // 6	≤ 1.22km	×	0.61km
  // 7	≤ 153m	×	153m
  // 8	≤ 38.2m	×	19.1m
  // 9	≤ 4.77m	×	4.77m
}

/////// NGEOHASH ////////

var BASE32_CODES = '0123456789bcdefghjkmnpqrstuvwxyz';
var BASE32_CODES_DICT = {};
for (var i = 0; i < BASE32_CODES.length; i++) {
  BASE32_CODES_DICT[BASE32_CODES.charAt(i)] = i;
}

var ENCODE_AUTO = 'auto';
/**
 * Significant Figure Hash Length
 *
 * This is a quick and dirty lookup to figure out how long our hash
 * should be in order to guarantee a certain amount of trailing
 * significant figures. This was calculated by determining the error:
 * 45/2^(n-1) where n is the number of bits for a latitude or
 * longitude. Key is # of desired sig figs, value is minimum length of
 * the geohash.
 * @type Array
 */
//     Desired sig figs:  0  1  2  3  4   5   6   7   8   9  10
var SIGFIG_HASH_LENGTH = [0, 5, 7, 8, 11, 12, 13, 15, 16, 17, 18];
/**
 * Encode
 *
 * Create a Geohash out of a latitude and longitude that is
 * `numberOfChars` long.
 *
 * @param {Number|String} latitude
 * @param {Number|String} longitude
 * @param {Number} numberOfChars
 * @returns {String}
 */
export const encode = function(latitude, longitude, numberOfChars) {
  if (numberOfChars === ENCODE_AUTO) {
    if (typeof latitude === 'number' || typeof longitude === 'number') {
      throw new Error('string notation required for auto precision.');
    }
    var decSigFigsLat = latitude.split('.')[1].length;
    var decSigFigsLong = longitude.split('.')[1].length;
    var numberOfSigFigs = Math.max(decSigFigsLat, decSigFigsLong);
    numberOfChars = SIGFIG_HASH_LENGTH[numberOfSigFigs];
  } else if (numberOfChars === undefined) {
    numberOfChars = 9;
  }

  var chars = [],
    bits = 0,
    bitsTotal = 0,
    hash_value = 0,
    maxLat = 90,
    minLat = -90,
    maxLon = 180,
    minLon = -180,
    mid;
  while (chars.length < numberOfChars) {
    if (bitsTotal % 2 === 0) {
      mid = (maxLon + minLon) / 2;
      if (longitude > mid) {
        hash_value = (hash_value << 1) + 1;
        minLon = mid;
      } else {
        hash_value = (hash_value << 1) + 0;
        maxLon = mid;
      }
    } else {
      mid = (maxLat + minLat) / 2;
      if (latitude > mid) {
        hash_value = (hash_value << 1) + 1;
        minLat = mid;
      } else {
        hash_value = (hash_value << 1) + 0;
        maxLat = mid;
      }
    }

    bits++;
    bitsTotal++;
    if (bits === 5) {
      var code = BASE32_CODES[hash_value];
      chars.push(code);
      bits = 0;
      hash_value = 0;
    }
  }
  return chars.join('');
};

/**
 * Encode Integer
 *
 * Create a Geohash out of a latitude and longitude that is of 'bitDepth'.
 *
 * @param {Number} latitude
 * @param {Number} longitude
 * @param {Number} bitDepth
 * @returns {Number}
 */
export const encode_int = function(latitude, longitude, bitDepth) {
  bitDepth = bitDepth || 52;

  var bitsTotal = 0,
    maxLat = 90,
    minLat = -90,
    maxLon = 180,
    minLon = -180,
    mid,
    combinedBits = 0;

  while (bitsTotal < bitDepth) {
    combinedBits *= 2;
    if (bitsTotal % 2 === 0) {
      mid = (maxLon + minLon) / 2;
      if (longitude > mid) {
        combinedBits += 1;
        minLon = mid;
      } else {
        maxLon = mid;
      }
    } else {
      mid = (maxLat + minLat) / 2;
      if (latitude > mid) {
        combinedBits += 1;
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    bitsTotal++;
  }
  return combinedBits;
};

/**
 * Decode Bounding Box
 *
 * Decode hashString into a bound box matches it. Data returned in a four-element array: [minlat, minlon, maxlat, maxlon]
 * @param {String} hash_string
 * @returns {Array}
 */
export const decode_bbox = function(hash_string) {
  var isLon = true,
    maxLat = 90,
    minLat = -90,
    maxLon = 180,
    minLon = -180,
    mid;

  var hashValue = 0;
  for (var i = 0, l = hash_string.length; i < l; i++) {
    var code = hash_string[i].toLowerCase();
    hashValue = BASE32_CODES_DICT[code];

    for (var bits = 4; bits >= 0; bits--) {
      var bit = (hashValue >> bits) & 1;
      if (isLon) {
        mid = (maxLon + minLon) / 2;
        if (bit === 1) {
          minLon = mid;
        } else {
          maxLon = mid;
        }
      } else {
        mid = (maxLat + minLat) / 2;
        if (bit === 1) {
          minLat = mid;
        } else {
          maxLat = mid;
        }
      }
      isLon = !isLon;
    }
  }
  return [minLat, minLon, maxLat, maxLon];
};

/**
 * Decode Bounding Box Integer
 *
 * Decode hash number into a bound box matches it. Data returned in a four-element array: [minlat, minlon, maxlat, maxlon]
 * @param {Number} hashInt
 * @param {Number} bitDepth
 * @returns {Array}
 */
export const decode_bbox_int = function(hashInt, bitDepth) {
  bitDepth = bitDepth || 52;

  var maxLat = 90,
    minLat = -90,
    maxLon = 180,
    minLon = -180;

  var latBit = 0,
    lonBit = 0;
  var step = bitDepth / 2;

  for (var i = 0; i < step; i++) {
    lonBit = get_bit(hashInt, (step - i) * 2 - 1);
    latBit = get_bit(hashInt, (step - i) * 2 - 2);

    if (latBit === 0) {
      maxLat = (maxLat + minLat) / 2;
    } else {
      minLat = (maxLat + minLat) / 2;
    }

    if (lonBit === 0) {
      maxLon = (maxLon + minLon) / 2;
    } else {
      minLon = (maxLon + minLon) / 2;
    }
  }
  return [minLat, minLon, maxLat, maxLon];
};

function get_bit(bits, position) {
  return (bits / Math.pow(2, position)) & 0x01;
}

/**
 * Decode
 *
 * Decode a hash string into pair of latitude and longitude. A javascript object is returned with keys `latitude`,
 * `longitude` and `error`.
 * @param {String} hashString
 * @returns {Object}
 */
export const decode = function(hashString) {
  var bbox = decode_bbox(hashString);
  var lat = (bbox[0] + bbox[2]) / 2;
  var lon = (bbox[1] + bbox[3]) / 2;
  var latErr = bbox[2] - lat;
  var lonErr = bbox[3] - lon;
  return {
    latitude: lat,
    longitude: lon,
    error: { latitude: latErr, longitude: lonErr }
  };
};

/**
 * Decode Integer
 *
 * Decode a hash number into pair of latitude and longitude. A javascript object is returned with keys `latitude`,
 * `longitude` and `error`.
 * @param {Number} hash_int
 * @param {Number} bitDepth
 * @returns {Object}
 */
export const decode_int = function(hash_int, bitDepth) {
  var bbox = decode_bbox_int(hash_int, bitDepth);
  var lat = (bbox[0] + bbox[2]) / 2;
  var lon = (bbox[1] + bbox[3]) / 2;
  var latErr = bbox[2] - lat;
  var lonErr = bbox[3] - lon;
  return {
    latitude: lat,
    longitude: lon,
    error: { latitude: latErr, longitude: lonErr }
  };
};

/**
 * Neighbor
 *
 * Find neighbor of a geohash string in certain direction. Direction is a two-element array, i.e. [1,0] means north, [-1,-1] means southwest.
 * direction [lat, lon], i.e.
 * [1,0] - north
 * [1,1] - northeast
 * ...
 * @param {String} hashString
 * @param {Array} Direction as a 2D normalized vector.
 * @returns {String}
 */
export const neighbor = function(hashString, direction) {
  var lonLat = decode(hashString);
  var neighborLat = lonLat.latitude + direction[0] * lonLat.error.latitude * 2;
  var neighborLon =
    lonLat.longitude + direction[1] * lonLat.error.longitude * 2;
  return encode(neighborLat, neighborLon, hashString.length);
};

/**
 * Neighbor Integer
 *
 * Find neighbor of a geohash integer in certain direction. Direction is a two-element array, i.e. [1,0] means north, [-1,-1] means southwest.
 * direction [lat, lon], i.e.
 * [1,0] - north
 * [1,1] - northeast
 * ...
 * @param {String} hash_string
 * @returns {Array}
 */
export const neighbor_int = function(hash_int, direction, bitDepth) {
  bitDepth = bitDepth || 52;
  var lonlat = decode_int(hash_int, bitDepth);
  var neighbor_lat = lonlat.latitude + direction[0] * lonlat.error.latitude * 2;
  var neighbor_lon =
    lonlat.longitude + direction[1] * lonlat.error.longitude * 2;
  return encode_int(neighbor_lat, neighbor_lon, bitDepth);
};

/**
 * Neighbors
 *
 * Returns all neighbors' hashstrings clockwise from north around to northwest
 * 7 0 1
 * 6 x 2
 * 5 4 3
 * @param {String} hash_string
 * @returns {encoded neighborHashList|Array}
 */
export const neighbors = function(hash_string) {
  var hashstringLength = hash_string.length;

  var lonlat = decode(hash_string);
  var lat = lonlat.latitude;
  var lon = lonlat.longitude;
  var latErr = lonlat.error.latitude * 2;
  var lonErr = lonlat.error.longitude * 2;

  var neighbor_lat, neighbor_lon;

  var neighborHashList = [
    encodeNeighbor(1, 0),
    encodeNeighbor(1, 1),
    encodeNeighbor(0, 1),
    encodeNeighbor(-1, 1),
    encodeNeighbor(-1, 0),
    encodeNeighbor(-1, -1),
    encodeNeighbor(0, -1),
    encodeNeighbor(1, -1)
  ];

  function encodeNeighbor(neighborLatDir, neighborLonDir) {
    neighbor_lat = lat + neighborLatDir * latErr;
    neighbor_lon = lon + neighborLonDir * lonErr;
    return encode(neighbor_lat, neighbor_lon, hashstringLength);
  }

  return neighborHashList;
};
