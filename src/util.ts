/* eslint-disable @typescript-eslint/no-explicit-any */
import { Point, Feature, Coordinates } from "./interfaces";

import turfDistance from "@turf/distance";
import turfBearing from "@turf/bearing";

export interface IDecode {
  latitude: number;
  longitude: number;
  error: {
    latitude: number;
    longitude: number;
  }
}

export function distance(from: Coordinates, to: Coordinates): number {
  return turfDistance(toGeoJSONFeature(from), toGeoJSONFeature(to));
}

export function bearing(from: Coordinates, to: Coordinates): number {
  return turfBearing(toGeoJSONFeature(from), toGeoJSONFeature(to));
}

export function toGeoJSONFeature(coordinates: Coordinates, props: any = {}): Feature<Point> {
  coordinates = flip(coordinates) as Coordinates;
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates
    },
    properties: props
  };
}


export function flip(arr: any[]): any[] {
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

const BASE32_CODES = "0123456789bcdefghjkmnpqrstuvwxyz";
const BASE32_CODES_DICT: any = {};
for (let i = 0; i < BASE32_CODES.length; i++) {
  BASE32_CODES_DICT[BASE32_CODES.charAt(i)] = i;
}

const ENCODE_AUTO = "auto";

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
const SIGFIG_HASH_LENGTH: number[] = [0, 5, 7, 8, 11, 12, 13, 15, 16, 17, 18];

/**
 * Encode
 *
 * Create a Geohash out of a latitude and longitude that is
 * `numberOfChars` long.
 *
 * @param {Number|String} latitude
 * @param {Number|String} longitude
 * @param {Number|String} numberOfChars
 * @returns {String}
 */
export const encode = (latitude: number | string, longitude: number | string, numberOfChars: number | string): string => {
  if (numberOfChars === ENCODE_AUTO) {
    if (typeof latitude === "number" || typeof longitude === "number") {
      throw new Error("string notation required for auto precision.");
    }
    const decSigFigsLat = latitude.split(".")[1].length;
    const decSigFigsLong = longitude.split(".")[1].length;
    const numberOfSigFigs = Math.max(decSigFigsLat, decSigFigsLong);
    numberOfChars = SIGFIG_HASH_LENGTH[numberOfSigFigs];
  } else if (numberOfChars === undefined) {
    numberOfChars = 9;
  }

  const chars = [];
  let bits = 0;
  let bitsTotal = 0;
  let maxLat = 90;
  let minLat = -90;
  let minLon = -180;
  let maxLon = 180;
  let mid: number;
  let hash_value = 0;
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
      const code = BASE32_CODES[hash_value];
      chars.push(code);
      bits = 0;
      hash_value = 0;
    }
  }
  return chars.join("");
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
export const encode_int = function (latitude: number, longitude: number, bitDepth: number): number {
  bitDepth = bitDepth || 52;

  let bitsTotal = 0,
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
export const decode_bbox = function (hash_string: string): number[] {
  let isLon = true,
    maxLat = 90,
    minLat = -90,
    maxLon = 180,
    minLon = -180,
    mid;

  let hashValue = 0;
  for (let i = 0, l = hash_string.length; i < l; i++) {
    const code = hash_string[i].toLowerCase();
    hashValue = BASE32_CODES_DICT[code];

    for (let bits = 4; bits >= 0; bits--) {
      const bit = (hashValue >> bits) & 1;
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
export const decode_bbox_int = function (hashInt: number, bitDepth: number): number[] {
  bitDepth = bitDepth || 52;

  let maxLat = 90,
    minLat = -90,
    maxLon = 180,
    minLon = -180;

  let latBit = 0,
    lonBit = 0;
  const step = bitDepth / 2;

  for (let i = 0; i < step; i++) {
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

function get_bit(bits: number, position: number): number {
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
export const decode = function (hashString: string): IDecode {
  const bbox = decode_bbox(hashString);
  const lat = (bbox[0] + bbox[2]) / 2;
  const lon = (bbox[1] + bbox[3]) / 2;
  const latErr = bbox[2] - lat;
  const lonErr = bbox[3] - lon;
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
export const decode_int = function (hash_int: number, bitDepth: number): IDecode {
  const bbox = decode_bbox_int(hash_int, bitDepth);
  const lat = (bbox[0] + bbox[2]) / 2;
  const lon = (bbox[1] + bbox[3]) / 2;
  const latErr = bbox[2] - lat;
  const lonErr = bbox[3] - lon;
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
export const neighbor = function (hashString: string, direction: number[]): string {
  const lonLat = decode(hashString);
  const neighborLat = lonLat.latitude + direction[0] * lonLat.error.latitude * 2;
  const neighborLon =
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
 * @returns {Number}
 */
export const neighbor_int = function (hash_int: number, direction: number[], bitDepth: number): number {
  bitDepth = bitDepth || 52;
  const lonlat = decode_int(hash_int, bitDepth);
  const neighbor_lat = lonlat.latitude + direction[0] * lonlat.error.latitude * 2;
  const neighbor_lon =
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
export const neighbors = function (hash_string: string): string[] {
  const hashstringLength = hash_string.length;

  const lonlat = decode(hash_string);
  const lat = lonlat.latitude;
  const lon = lonlat.longitude;
  const latErr = lonlat.error.latitude * 2;
  const lonErr = lonlat.error.longitude * 2;

  let neighbor_lat, neighbor_lon;

  const neighborHashList: string[] = [
    encodeNeighbor(1, 0),
    encodeNeighbor(1, 1),
    encodeNeighbor(0, 1),
    encodeNeighbor(-1, 1),
    encodeNeighbor(-1, 0),
    encodeNeighbor(-1, -1),
    encodeNeighbor(0, -1),
    encodeNeighbor(1, -1)
  ];

  function encodeNeighbor(neighborLatDir: number, neighborLonDir: number): string {
    neighbor_lat = lat + neighborLatDir * latErr;
    neighbor_lon = lon + neighborLonDir * lonErr;
    return encode(neighbor_lat, neighbor_lon, hashstringLength);
  }

  return neighborHashList;
};
