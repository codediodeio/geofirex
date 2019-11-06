const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const geofirex = require('geofirex');
const geo = geofirex.init(firebase);

console.log(geo)

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
