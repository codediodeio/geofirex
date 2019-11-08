const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const geo = require('geofirex').init(admin);
// const geo = geofirex.init(admin);
console.log(geo)
exports.testFun = functions.https.onRequest((req, res) => {
    console.log(geo.point(38.5, -119.5))

    const ref = geo.query('bearings')
    const point = geo.point(40.5, -80.0);
    const query = ref.within(point, 10, 'pos');

    query.subscribe(v => {
        res.send({ len: v.length, v })
    })

})
