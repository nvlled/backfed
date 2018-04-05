// @flow
const appdb = require("./server/appdb");

/*::
import type { UserT, FeedbackT } from './server/appdb';
*/

(async function() {
    await appdb.init({force: true});

    let res = await appdb.users.register({
        firstname:  Math.random().toString(36).slice(2),
        lastname:   Math.random().toString(36).slice(2),
        age:        Math.floor(10 + Math.random()*20),
    });
    res.map(model => {
        console.log("new user created", model.id, model.firstname);
    });


    for (let u of await appdb.users.search({q: "ron"})) {
        console.log(">", u.id, u.firstname, u.lastname);
    }
    appdb.sequelize.close();
})();
