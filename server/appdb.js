// @flow

// A workaround because flowjs
// disallows Symbols as keys
function map(k, v) {
    return {
        // $FlowFixMe: nope
        [k]: v,
    };
}

/*-------------------------------------------*/

/*::
import type { Connection, QueryCallback, QueryResults, QueryField } from 'mysql';
import type { Model } from 'sequelize';


*/

const util = require("util");
const fs = require("fs");
const mysql = require("mysql");
const Sequelize = require('sequelize').default;
const Op = Sequelize.Op;

const {
    Right, Left
// $FlowFixMe: nope
} = require("funfix");

const seq = new Sequelize('backfed', 'nvlled', '', {
    host: 'localhost',
    dialect: 'mysql',

    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },

    logging: false,

    // SQLite only
    storage: 'path/to/database.sqlite',

    // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
    operatorsAliases: false
});

const mysqlConnOptions = {
    user: "nvlled",
    password: "",
    hostname: "localhost",
    database: "backfed",
}

function connect(fn /*: (Connection) => void */) {
    let conn = mysql.createConnection(mysqlConnOptions);
    try {
        fn(conn);
    } catch (e) {
        console.warn(e.message);
    }
    conn.end();
}

async function testConnection() {
    try {
        await seq.authenticate()
    } catch (e) {
        console.log("cannot connect to database", e.message);
    }
}

const defaults = {
    search: {
        limit: 64,
        offset: 0,
    },
}

/*::
export type QueryPromise = Promise<[QueryResults, ?Array<QueryField>]>
*/

// exec(`
function exec(sql, ...params) /*: QueryPromise */ {
    let conn = mysql.createConnection(mysqlConnOptions);
    return new Promise((resolve, reject) => {

        let handler /*: QueryCallback */ = (error, results, fields) => {
            reject(error);
            conn.end();
            resolve([results, fields]);
        }
        conn.query(sql, params, handler);
    });
}

function insert(sql, ...params) {
    connect(function(conn) {
        conn.query(sql, params);
    });
}

/*-------------------------------------------*/

// TODO: code column must be unique

/*::
export type UserData = {
    firstname?: string,
    lastname?: string,
    age: number,
    categoryCode?: string,
}
export type UserT = Model<any> & UserData & {
    id?: number,
    fullname?: string,
}

export type FeedbackData = {
    id?: number,
    userId: number,
    comment: string,
    officeCode: string,
    serviceCode: string,
}
export type FeedbackT = Model<any> & FeedbackData & {
    getUser(): UserT,
    setUser(UserT): void,
    save(): void,
}

export type OfficeT = Model<any> & {
    id?: number,
    code: string,
    name: string,
}

export type ServiceT = Model<any> & {
    id?: number,
    officeId: number,
    code: string,
    name: string,
}

export type UserCategoryT = {
    code: string,
    name: string,
    hasData?: boolean,
}

export type SearchArgs = {|
    q?: string,
    limit?: number,
    offset?: number,
|}

*/

const User = seq.define("user", {
    firstname: { type: Sequelize.STRING, },
    lastname:  { type: Sequelize.STRING, },
    age:       { type: Sequelize.STRING, },
    categoryCode: { type: Sequelize.STRING, },
}, {
    getterMethods: {
        fullname() {
            return `${this.firstname} ${this.lastname}`;
        }
    }
});

const Feedback = seq.define("feedback", {
    userId:      { type: Sequelize.INTEGER },
    comment:     { type: Sequelize.STRING },
    officeCode:  { type: Sequelize.STRING },
    serviceCode: { type: Sequelize.STRING },
});

const UserCategory = seq.define("user_category", {
    code: { type: Sequelize.STRING },
    name: { type: Sequelize.STRING },
    hasData: { type: Sequelize.BOOLEAN },
});

const Office = seq.define("office", {
    code: { type: Sequelize.STRING },
    name: { type: Sequelize.STRING },
});

const Service = seq.define("service", {
    code: { type: Sequelize.STRING },
    name: { type: Sequelize.STRING },
});

/*::
type Err = {|
    code: string,
    message: string,
|}

type Result<T> = Either<Err[], T>

*/

const errorList /*: Array<Err> */ = [
    { code: "USER_NONE", message: "user not found" },
    { code: "USER_INVAGE", message: "invalid age" },
];

const errorMap /*: {[string]: Err} */ = errorList.reduce((acc, err) => {
    acc[err.code] = err; return acc
} , {});

function errorResult(...codes) {
    return Left(codes.map(code => errorMap[code]));
}

const users = {
    async init(force /*:boolean*/ = true) {
        await User.sync({force});
    },
    async register(userData /*: UserData */)
    {
        if ( !userData.age)
            return errorResult("USER_INVAGE");
        let model = await User.create(userData);
        return Right(model);
    },
    async validate(userData /*: UserData */)
    {
        if ( !userData.age)
            return errorResult("USER_INVAGE");
        return Right(true);
    },
    get(id /*: number */) /*: UserT */ {
        return User.findById(id);
    },
    search(args /*: SearchArgs */) /*: Array<UserT> */ {
        let {
            q="",
            limit=defaults.search.limit,
            offset=defaults.search.offset,
        } = args;
        let {or, like} = Op;
        return User.findAll({
            where: map(or, [
                map("firstname", map(like, `%${q}%`)),
                map("lastname", map(like, `%${q}%`)),
            ]),
        });
    },
    exists(id /*: number */) /*:boolean*/ {
        return !! User.findById(id);
    },
}

const feedbacks = {
    async init(force /*:boolean*/ = true) {
        await Feedback.sync({force});
        await Feedback.hasOne(User, { foreignKey: "id"} );
    },
    async register(
        // TODO: change to FeedbackData
        args /*: {|
                comment: string,
                userId: number
            |} */
    ) /*: Promise<Result<FeedbackT>> */{
        if ( ! users.exists(args.userId)) {
            return errorResult("USER_NONE");
        }
        let feed = await Feedback.create(args);
        return Right(feed);
    },
    async validate(data /*: FeedbackData */)
    {
        return Right(true);
    },
    get(id /*: number */) /*: Result<FeedbackT> */ {
        return Feedback.findById(id);
    },
    search(args /*: SearchArgs */) /*: Array<FeedbackT> */ {
        let {
            q="",
            limit=defaults.search.limit,
            offset=defaults.search.offset,
        } = args;
        let {or, like} = Op;
        return Feedback.findAll({
            where: map(or, [
                map("comment", map(like, `%${q}%`)),
            ]),
        });
    },
}

const offices = {
    async init(force /*:boolean*/ = false) {
        await Office.sync({force});

        let readfile = util.promisify(fs.readFile);
        let jsondata = await readfile("data/offices.json");
        let offices = JSON.parse(jsondata);
        for (let off of offices) {
            let model = await this.register(off);
            console.log("created office:", model.id, model.code, model.name);
        }
    },
    async register(data /*:OfficeT*/) {
        let model = await Office.create(data);
        return model;
    },
    search(args /*: SearchArgs */) /*: Array<OfficeT> */ {
        let {
            q="",
            limit=defaults.search.limit,
            offset=defaults.search.offset,
        } = args;
        let {or, like} = Op;
        return Office.findAll({
            where: map(or, [
                map("name", map(like, `%${q}%`)),
                map("code", map(like, `%${q}%`)),
            ]),
        });
    },
}

const services = {
    async init(force /*:boolean*/ = false) {
        await Service.sync({force});
        let readfile = util.promisify(fs.readFile);
        let jsondata = await readfile("data/services.json");
        let services = JSON.parse(jsondata);
        for (let svc of services) {
            let model = await this.register(svc);
            console.log("create service", model.code, model.name);
        }
    },
    async register(data /*:ServiceT*/) {
        let model = await Service.create(data);
        return model;
    },
    search(args /*: SearchArgs */) /*: Array<ServiceT> */ {
        let {
            q="",
            limit=defaults.search.limit,
            offset=defaults.search.offset,
        } = args;
        let {or, like} = Op;
        return Service.findAll({
            where: map(or, [
                map("name", map(like, `%${q}%`)),
                map("code", map(like, `%${q}%`)),
            ]),
        });
    },
}

// I am, sort of, perfectly cognizant of the
// fact that there is too much repeated code,
// but... it also means more flexibility
// on my part when it comes to changing requirements
// or code structure.

const userCategories = {
    async init(force /*:boolean*/ = false) {
        await UserCategory.sync({force});

        let readfile = util.promisify(fs.readFile);
        let jsondata = await readfile("data/categories.json");
        let categories = JSON.parse(jsondata);
        for (let cat of categories) {
            let model = await this.register(cat);
            console.log("created category", model.code, model.name);
        }
    },
    async register(data /*:ServiceT*/) {
        let model = await UserCategory.create(data);
        return model;
    },
    search(args /*: SearchArgs */) /*: Array<ServiceT> */ {
        let {
            q="",
            limit=defaults.search.limit,
            offset=defaults.search.offset,
        } = args;
        let {or, like} = Op;
        return UserCategory.findAll({
            where: map(or, [
                map("name", map(like, `%${q}%`)),
                map("code", map(like, `%${q}%`)),
            ]),
        });
    },
}

/*::
type init_args = {|
    force?: boolean,
|}
*/
async function init(args /*: init_args */) {
    let {
        force=false,
    } = args;

    await users.init(force);
    await feedbacks.init(force);
    await offices.init(force);
    await services.init(force);
    await userCategories.init(force);
}

function fetch(table /*: string*/, args /*: SearchArgs */) {
    let queryFn = null;
    switch (table) {
        case "users": queryFn     = users.search; break;
        case "feedbacks": queryFn = feedbacks.search; break;
        case "offices": queryFn   = offices.search; break;
        case "services": queryFn  = services.search; break;
        case "user_categories": queryFn  = userCategories.search; break;
    }
    if (queryFn)
        return queryFn(args);
}

module.exports = {
    init,
    fetch,

    users,
    feedbacks,
    offices,
    services,
    userCategories,

    User,
    Feedback,
    Office,
    testConnection,

    sequelize: seq,
}
