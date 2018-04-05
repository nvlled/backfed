// @flow
const appdb = require("./appdb");
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

/*::
import type { $Request, $Response } from 'express';

type $Req = $Request & {
    allparams: {[string]: string},
    x: {[string]: string},
}

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

app.post("/", async (req /*:$Req*/, res /*:$Response*/) => {
    console.log("body", req.body);

    let data /*:{[string]: string}*/ = req.x;
    let user = await appdb.users.register({
        age: parseInt(data.age),
        categoryCode: data.category,
    });

    res.send("okay");
});

app.get("/", async (req /*:$Req*/, res /*:$Response*/) => {
    let params = req.params;
    let {office, serviceAvail, age} = params;

    let categories = await appdb.userCategories.search({});
    res.render("index", {
        categories,
        formData: params,
    });
})

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
