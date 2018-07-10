const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.dbWrite = functions.firestore
    .document('/positions/{docId}')
    .onCreate((change, context) => {
        const docId = context.params.docId;

        if (!docId.includes('testPoint')) return;

        return delay(15000).then(() => {
            return admin
                .firestore()
                .doc('positions/' + docId)
                .delete();
        });


    });

function delay(t) {
    return new Promise(function(resolve) {
        setTimeout(resolve.bind(null, null), t);
    });
}

// "use strict";
// var __awaiter = (this && this.__awaiter) || function(thisArg, _arguments, P, generator) {
//     return new(P || (P = Promise))(function(resolve, reject) {
//         function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }

//         function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }

//         function step(result) { result.done ? resolve(result.value) : new P(function(resolve) { resolve(result.value); }).then(fulfilled, rejected); }
//         step((generator = generator.apply(thisArg, _arguments || [])).next());
//     });
// };
// Object.defineProperty(exports, "__esModule", { value: true });
// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// admin.initializeApp();
// exports.dbWrite = functions.firestore
//     .document('/positions/{docId}')
//     .onCreate((change, context) => __awaiter(this, void 0, void 0, function*() {
//         const docId = context.params.docId;
//         if (!docId.includes('testPoint'))
//             return;
//         yield delay(15000);
//         return admin
//             .firestore()
//             .doc('positions/' + docId)
//             .delete();
//     }));

// function delay(t) {
//     return new Promise(function(resolve) {
//         setTimeout(resolve.bind(null, null), t);
//     });
// }
// //# sourceMappingURL=index.js.map