// @flow
const appdb = require("./appdb");
const apputil = require('../shared/apputil');
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

export type $Req = {
    allparams: () => {[string]: string},
    body: {[string]: string},
} & $Request
export type $Res = {
} & $Response


type Handler = ($Req, $Response) => void

*/

const app = express();
const appAPI = express.Router();

// Make the apputil available to view globals
global.apputil = apputil;

app.set("view options", {
    basedir: "views",
    delimiter: '?',
    globals: ["apputil"],
    self: true,
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
    req.allparams = () => Object.assign(
        {},
        req.params,
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
    let params = req.allparams();
    let source = params.source
    let args = {
        offset: parseInt(params.page),
        limit:  parseInt(params.pagesize),
    }
    let result = await appdb.fetch(source, args);
    res.json(result);
})

app.use("/api", appAPI);

app.use("/", require("./routes/respondent"));

app.get("/test", (req /*:$Req*/, res /*:$Response*/) => {
    res.render("test.ejs");
});

app.use("*", (req /*:$Req*/, res /*:$Response*/) => {
    res.sendStatus(404);
});

let port = 5000;
app.listen(port, function() {
    console.log(`server listening at ${port}`);
});
