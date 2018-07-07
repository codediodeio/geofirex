import * as types from '@firebase/firestore-types';

export namespace firestore {
  export interface CollectionReference extends types.CollectionReference {}
  export interface Query extends types.Query {}
  export interface QuerySnapshot extends types.QuerySnapshot {}
  export interface GeoPoint extends types.GeoPoint {}
  export interface DocumentReference extends types.DocumentReference {}
  export interface Firestore extends types.FirebaseFirestore {}
  //   export interface FirebaseNamespace {
  //     firestore?: {
  //       (app?: FirebaseApp): types.FirebaseFirestore;
  //       Blob: typeof types.Blob;
  //       CollectionReference: typeof types.CollectionReference;
  //       DocumentReference: typeof types.DocumentReference;
  //       DocumentSnapshot: typeof types.DocumentSnapshot;
  //       FieldPath: typeof types.FieldPath;
  //       FieldValue: typeof types.FieldValue;
  //       Firestore: typeof types.FirebaseFirestore;
  //       GeoPoint: typeof types.GeoPoint;
  //       Query: typeof types.Query;
  //       QuerySnapshot: typeof types.QuerySnapshot;
  //       Timestamp: typeof types.Timestamp;
  //       Transaction: typeof types.Transaction;
  //       WriteBatch: typeof types.WriteBatch;
  //       setLogLevel: typeof types.setLogLevel;
  //     };
  //   }
  export interface FirebaseApp {
    firestore?(): types.FirebaseFirestore;
  }
}
