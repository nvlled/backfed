// @flow
const appdb = require("./appdb");
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const {
    Right, Left
// $FlowFixMe: nope
} = require("funfix");

/*::
import type { $Request, $Response } from 'express';
import type { UserT } from './appdb';

type $Req = {
    allparams: {[string]: string},
    body: {[string]: string},
} & $Request

type Handler = ($Req, $Response) => void

*/

const app = express();
const appAPI = express.Router();

app.set("view options", {
    basedir: "views",
    delimiter: '?'
});

app.set("view engine", "pug");

/* -------------- static files --------------*/

app.use("/public/scripts", express.static("client", {
    fallthrough: false,
}));

app.use("/public", express.static("public", {
    fallthrough: false,
}));

/* -------------- middlewares --------------*/

app.use(bodyParser.urlencoded({
    extended: false,
}));

app.use( (req /*:$Req*/, res /*:$Response*/, next) => {
    req.allparams = Object.assign(
        {},
        req.query,
        req.body,
    );
    next();
});

appAPI.use( (req /*:$Req*/, res /*:$Response*/, next) => {
    next();
    // TODO:
    // serialize response to json
});

/* -------------- handlers --------------*/

appAPI.get("/fetch/:source", async (req /*:$Req*/, res /*:$Response*/) => {
    let source = req.params.source;
    let args = {
        offset: parseInt(req.allparams.page),
        limit:  parseInt(req.allparams.pagesize),
    }
    let result = await appdb.fetch(source, args);
    res.json(result);
})

app.use("/api", appAPI);

app.get("/", async (req /*:$Req*/, res /*:$Response*/) => {
    let params = req.params;
    let {office, serviceAvail, age} = params;

    let categories = await appdb.userCategories.search({});
    res.render("index", {
        categories,
        formData: params,
    });
})

app.post("/", async (req /*:$Req*/, res /*:$Response*/) => {

    let data /*:{[string]: string}*/ = req.body;
    console.log("data", data);
    let result = await appdb.users.register({
        age: parseInt(data.age),
        categoryCode: data.category,
    });
    if (result.isLeft()) {
        //return res.send(JSON.stringify({errors: result.value}));
        let {office, serviceAvail, age} = data;

        let categories = await appdb.userCategories.search({});
        res.render("index", {
            errors: result.value,
            categories,
            formData: data,
        });
        return;
    }
    let user /*: UserT */ = result.value;
    let fd = await appdb.feedbacks.register({
        comment: data.comment,
        userId: user.id || 0,
    });

    res.send(JSON.stringify([user, fd]));
});

app.get("/test", (req /*:$Req*/, res /*:$Response*/) => {
    res.render("test.ejs");
});

app.use("*", (req /*:$Req*/, res /*:$Response*/) => {
    res.sendStatus(404);
    res.send("nope");
});

let port = 5000;
app.listen(port, function() {
    console.log(`server listening at ${port}`);
});
