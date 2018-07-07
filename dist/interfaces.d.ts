import * as types from '@firebase/firestore-types';
export declare namespace firestore {
    interface CollectionReference extends types.CollectionReference {
    }
    interface Query extends types.Query {
    }
    interface QuerySnapshot extends types.QuerySnapshot {
    }
    interface GeoPoint extends types.GeoPoint {
    }
    interface DocumentReference extends types.DocumentReference {
    }
    interface Firestore extends types.FirebaseFirestore {
    }
    interface FirebaseApp {
        firestore?(): types.FirebaseFirestore;
    }
}
