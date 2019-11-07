const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const geofirex = require('geofirex');
const geo = geofirex.init(admin);

console.log(geo)

const rx = require('rxjs');

exports.testFun = functions.https.onRequest((req, res) => {
    console.log(geo.point(38.5, -119.5))

    const ref = geo.query('bearings')
    const point = geo.point(40.5, -80.0);
    const query = ref.within(point, 10, 'pos');

    ref.f

    query.subscribe(v => {
        res.send({ len: v.length, v })
    })

})

// exports.dbWrite = functions.firestore
//     .document('/positions/{docId}')
//     .onCreate((change, context) => {
//         const docId = context.params.docId;

//         if (!docId.includes('testPoint')) return;

//         return delay(15000).then(() => {
//             return admin
//                 .firestore()
//                 .doc('positions/' + docId)
//                 .delete();
//         });


//     });

// function delay(t) {
//     return new Promise(function(resolve) {
//         setTimeout(resolve.bind(null, null), t);
//     });
// }
