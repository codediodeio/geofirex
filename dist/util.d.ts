import { Polygon } from '@turf/helpers';
export declare function flip(arr: any): any[];
export declare function setPrecsion(km: number): number;
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
export declare const encode: (latitude: any, longitude: any, numberOfChars: any) => string;
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
export declare const encode_int: (latitude: any, longitude: any, bitDepth: any) => number;
/**
 * Decode Bounding Box
 *
 * Decode hashString into a bound box matches it. Data returned in a four-element array: [minlat, minlon, maxlat, maxlon]
 * @param {String} hash_string
 * @returns {Array}
 */
export declare const decode_bbox: (hash_string: any) => number[];
/**
 * Decode Bounding Box Integer
 *
 * Decode hash number into a bound box matches it. Data returned in a four-element array: [minlat, minlon, maxlat, maxlon]
 * @param {Number} hashInt
 * @param {Number} bitDepth
 * @returns {Array}
 */
export declare const decode_bbox_int: (hashInt: any, bitDepth: any) => number[];
/**
 * Decode
 *
 * Decode a hash string into pair of latitude and longitude. A javascript object is returned with keys `latitude`,
 * `longitude` and `error`.
 * @param {String} hashString
 * @returns {Object}
 */
export declare const decode: (hashString: any) => {
    latitude: number;
    longitude: number;
    error: {
        latitude: number;
        longitude: number;
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
export declare const decode_int: (hash_int: any, bitDepth: any) => {
    latitude: number;
    longitude: number;
    error: {
        latitude: number;
        longitude: number;
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
export declare const neighbor: (hashString: any, direction: any) => string;
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
export declare const neighbor_int: (hash_int: any, direction: any, bitDepth: any) => number;
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
export declare const neighbors: (hash_string: any) => string[];
/**
 * Bounding Boxes
 *
 * Return all the hashString between minLat, minLon, maxLat, maxLon in numberOfChars
 * @param {Number} minLat
 * @param {Number} minLon
 * @param {Number} maxLat
 * @param {Number} maxLon
 * @param {Number} numberOfChars
 * @returns {bboxes.hashList|Array}
 */
export declare const bboxes: (minLat: any, minLon: any, maxLat: any, maxLon: any, numberOfChars: any) => any[];
/**
 * Bounding Boxes Integer
 *
 * Return all the hash integers between minLat, minLon, maxLat, maxLon in bitDepth
 * @param {Number} minLat
 * @param {Number} minLon
 * @param {Number} maxLat
 * @param {Number} maxLon
 * @param {Number} bitDepth
 * @returns {bboxes_int.hashList|Array}
 */
export declare const bboxes_int: (minLat: any, minLon: any, maxLat: any, maxLon: any, bitDepth: any) => any[];
export declare const compute_geohash_tiles_from_polygon: (polygon: Polygon, precision: number) => string[];
