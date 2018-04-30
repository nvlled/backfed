// @flow
const express = require('express');
const appdb = require("../appdb");

/*::
import type { UserT } from '../appdb';
import type { $Req, $Res} from '../index';
*/

let router = express.Router();

let respondentPage = async (req /*:$Req*/, res /*:$Response*/) => {
    let params = req.allparams();
    console.log("get data", params);

    let categories = await appdb.userCategories.search({});
    res.render("index", Object.assign({
        formAction: "validate",
        errors: res.locals.errors,
        categories,
    }, params));
}

router.all("/", respondentPage);

router.post("/validate", async (req /*:$Req*/, res /*:$Response*/) => {
    let data /*:{[string]: string}*/ = req.allparams();
    console.log("base url:", req.baseUrl);

    if (data.action) {
        if (data.action == "go back") {
            res.redirect(307, req.baseUrl+"/");
        } else {
            res.redirect(307, req.baseUrl+"/submit");
        }
        return;
    }

    let categories = await appdb.userCategories.search({q: data.category});
    let category = categories[0] || {};
    data.categoryName = category.name;
    data.categoryData = data["data-"+category.code];

    console.log("post data", data);
    let result = await appdb.users.validate({
        age: parseInt(data.age),
        categoryCode: data.category,
    });
    if (result.isLeft()) {
        res.locals.errors = result.value;
        respondentPage(req, res);
        return;
    }
    let user /*: UserT */ = result.value;
    result = await appdb.feedbacks.validate({
        comment: data.comment,
        serviceCode: data.serviceCode,
        officeCode: data.officeCode,
        userId: user.id || 0,
    });
    console.log(result);
    if (result.isLeft()) {
        res.locals.errors = result.value;
        respondentPage(req, res);
        return;
    }

    let cancelAction = "/";
    let confirmAction = "/submit";
    res.render("respondent-confirm", Object.assign({
        cancelAction,
        confirmAction,
    }, data));
});

router.post("/submit", async (req /*:$Req*/, res /*:$Response*/) => {
    let data /*:{[string]: string}*/ = req.allparams();
    console.log("post data", data);
    let result = await appdb.users.register({
        age: parseInt(data.age),
        categoryCode: data.category,
        categoryData: data.categoryData,
    });
    if (result.isLeft()) {
        res.locals.errors = result.value;
        respondentPage(req, res);
        return;
    }
    let user /*: UserT */ = result.value;
    let fd = await appdb.feedbacks.register({
        comment: data.comment,
        serviceCode: data.serviceCode,
        officeCode: data.officeCode,
        userId: user.id || 0,
    });
    if (result.isLeft()) {
        res.locals.errors = result.value;
        respondentPage(req, res);
        return;
    }

    res.render("respondent-done", Object.assign({
        message: "Thank you very much for completing the survey!",
        back: "/",
    }, data));
});

module.exports = router;
