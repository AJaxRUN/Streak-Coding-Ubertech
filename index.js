"use strict";
// This program serves as a broker, leak detector and publisher. That is, it is a broker that continuously monitors leak and publishes values to the broker spun up by itself, for clients that have been connected to it
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
// Setting up the Broker
var express = require("express");
var bodyParser = require("body-parser");
var fs = require("fs");
var request = require("request");
var WebSocket = require("ws");
var http = require("http");
var httpport = 8133;
var sockport = 8134;
// The following data are taken from "saved data" folder
// This is a JSON with UID as the key
var candidates = {};
// This is a JSON with UID as the key
var scores = {};
// These are all the other misc data that we would want to store
var misc = {
    "setno": 0
};
var app;
var app2;
var server;
var websocket = [];
//let host = "localhost";
//let host = "34.93.141.229";
//let contestName = "thisisatemporaryevent";
var contestName = "9e95a086a6fcc6889f7f22b17b18eeed79f911ed61b91e6f806c3f22ac720a83";
var contestName2 = "ffb441d5ac87ce80e1503a3d81340a22167dd883ff369a6032224b4c52ff5d0b";
var adminpassword = "ola";
var passwords = ["6fBgDhF0UBER!", "3aLbNcP2UBER!", "3lFmHnJ2UBER!", "1gHhJiL2UBER!", "5tEuGvI0UBER!", "1eIfKgM1UBER!", "2wTxVyX1UBER!", "4qArCsE2UBER!", "6oCpEqG2UBER!", "1iEjGkI1UBER!", "0kJlLmN0UBER!", "0aBbDcF2UBER!", "4uFvHwJ1UBER!", "1jUkWlY2UBER!", "1pDqFrH0UBER!"];
var points = {
    "traceforpass": 10,
    "traceforpassPenalty": 10,
    "hackerrankwithouttracePenaltyPenalty": 1000
};
ourprocess();
function ourprocess() {
    return __awaiter(this, void 0, void 0, function () {
        var app2_1, wss, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    // In the following three lines, we load the data from the saved file
                    return [4 /*yield*/, loadCandidates()];
                case 1:
                    // In the following three lines, we load the data from the saved file
                    _a.sent();
                    return [4 /*yield*/, loadScores()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, loadMisc()];
                case 3:
                    _a.sent();
                    app = express();
                    app.use(bodyParser.json());
                    app.use(bodyParser.urlencoded());
                    app.get("/getPass", function (req, res, next) {
                        // This request would be sent by candidates
                        if (scores[req.query["uid"]] === undefined) {
                            res.send("There is no such registered candidate");
                        }
                        else {
                            try {
                                if (scores[req.query["uid"]]["hasTraced"] == true) {
                                    res.send("You can do that only once (warning for your safety). Stop fiddling around and solve round two. This act of yours has been noted by the team");
                                    scores[req.query["uid"]]["warning"] += 1;
                                    saveScores();
                                    return;
                                }
                                if (passwords[Number.parseInt(req.query["uid"].substr(3, 5))] == req.query["password"]) {
                                    scores[req.query["uid"]]["hasTraced"] = true;
                                    saveScores();
                                    Object.keys(scores).forEach(function (key, index) {
                                        // key: the name of the object key
                                        // index: the ordinal position of the key within the object 
                                        if (scores[key]["hasTraced"] == true) {
                                            scores[key]["score"] += points.traceforpass;
                                        }
                                    });
                                    scores[req.query["uid"]]["attempt"] += 1;
                                    saveScores();
                                    res.send("Congratulations! Head over to http://www.hackerrank.com/" + contestName + " for your next challenge");
                                }
                                else {
                                    scores[req.query["uid"]]["score"] -= points.traceforpassPenalty;
                                    scores[req.query["uid"]]["penalty"] += points.traceforpassPenalty;
                                    scores[req.query["uid"]]["attempt"] += 1;
                                    saveScores();
                                    res.send("The Password you have traced is wrong. Attempt no: " + scores[req.query["uid"]]["attempt"]);
                                }
                            }
                            catch (err) {
                                res.send("An Error occured");
                            }
                        }
                    });
                    app.get("/getQuestion", function (req, res, next) {
                        if (req.query["set"] == undefined) {
                            res.send("Give the set number as 'set'");
                        }
                        else {
                            if (req.query["pass"] != adminpassword) {
                                res.send("Give the correct Admin password as 'pass'");
                            }
                            else {
                                res.sendFile(__dirname + "/wwwroot/questions/user" + req.query["set"] + ".pdf");
                            }
                        }
                    });
                    app.get("/", function (req, res, next) {
                        res.sendFile(__dirname + "/wwwroot/index.html");
                    });
                    app.get("*", function (req, res, next) {
                        try {
                            if (req.path != "" && !req.path.startsWith("/questions")) {
                                res.sendFile(__dirname + "/wwwroot/" + req.path);
                            }
                        }
                        catch (err) {
                            res.send('This is a Typical 404');
                        }
                    });
                    app.post("/addCandidate", function (req, res, next) {
                        try {
                            if (req.body["password"] == adminpassword) {
                                var rand = pad(Number.parseInt((Math.random() * 1000).toString()), 3);
                                var set = pad(misc.setno, 3);
                                var uid = rand + set;
                                candidates[uid] = req.body;
                                candidates[uid]["uid"] = uid;
                                saveCandidates();
                                misc.setno++;
                                if (misc.setno == 15) {
                                    misc.setno = 0;
                                }
                                saveMisc();
                                scores[uid] = {
                                    "hasTraced": false,
                                    "warning": 0,
                                    "score": 0,
                                    "attempt": 0,
                                    "penalty": 0,
                                    "hackscore": 0,
                                    "hackrank": 10000
                                };
                                saveScores();
                                res.send(uid);
                            }
                            else {
                                res.send("Admin Password is Wrong!");
                            }
                        }
                        catch (err) {
                            res.send("Error in the server");
                        }
                    });
                    app.post("/getAllCandidates", function (req, res, next) {
                        // This request would sent by admins
                        if (req.body["password"] == adminpassword) {
                            var temp_1 = [];
                            Object.keys(candidates).forEach(function (key, index) {
                                // key: the name of the object key
                                // index: the ordinal position of the key within the object 
                                temp_1.push(candidates[key]);
                            });
                            res.send(temp_1);
                        }
                        else {
                            res.send("404");
                        }
                    });
                    app.listen(httpport, function () {
                        console.log("HTTP server live in port " + httpport);
                    });
                    app2_1 = express();
                    //initialize a simple http server
                    server = http.createServer(app2_1);
                    wss = new WebSocket.Server({ server: server });
                    wss.on('connection', function (ws) {
                        console.log("Connected to a client");
                        websocket.push(ws);
                    });
                    //start our server
                    server.listen(sockport, function () {
                        console.log("Socket Server started on port 8134");
                    });
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _a.sent();
                    console.log("Error happened... Restarting server");
                    console.log(err_1);
                    setTimeout(function () {
                        ourprocess();
                    }, 1000);
                    return [3 /*break*/, 5];
                case 5:
                    repeatProcedure();
                    return [2 /*return*/];
            }
        });
    });
}
function repeatProcedure() {
    var url = "https://www.hackerrank.com/rest/contests/" + contestName + "/leaderboard";
    request(url, function (err, res, body) {
        if (err == null) {
            body = JSON.parse(body);
            var result_1 = {};
            for (var _i = 0, _a = body["models"]; _i < _a.length; _i++) {
                var candidate = _a[_i];
                result_1[candidate["hacker"]] = candidate;
            }
            Object.keys(scores).forEach(function (key, index) {
                if (result_1[candidates[key]["hackerrank"]] != undefined) {
                    scores[key]["hackscore"] = Number.parseInt(result_1[candidates[key]["hackerrank"]]["score"]);
                    scores[key]["hackrank"] = Number.parseInt(result_1[candidates[key]["hackerrank"]]["rank"]);
                    if (scores[key]["hasTraced"] == false) {
                        scores[key]["score"] -= points.hackerrankwithouttracePenaltyPenalty;
                        scores[key]["penalty"] += points.hackerrankwithouttracePenaltyPenalty;
                    }
                }
            });
            saveScores();
        }
    });
    setTimeout(function () {
        repeatProcedure();
    }, 3000);
}
function publish(message) {
    console.log("Publishing " + message);
    for (var i = 0; i < websocket.length;) {
        try {
            websocket[i].send(message);
            i++;
        }
        catch (err) {
            websocket.splice(i, 1);
        }
    }
}
function loadCandidates() {
    try {
        candidates = JSON.parse(fs.readFileSync(__dirname + "/saved data/candidates.json").toString());
    }
    catch (err) {
        candidates = {};
        saveCandidates();
    }
}
function loadScores() {
    try {
        scores = JSON.parse(fs.readFileSync(__dirname + "/saved data/scores.json").toString());
    }
    catch (err) {
        scores = {};
        saveScores();
    }
}
function loadMisc() {
    try {
        misc = JSON.parse(fs.readFileSync(__dirname + "/saved data/misc.json").toString());
    }
    catch (err) {
        misc = {
            "setno": 0
        };
        saveMisc();
    }
}
function saveCandidates() {
    fs.writeFileSync(__dirname + '/saved data/candidates.json', JSON.stringify(candidates));
}
function saveScores() {
    fs.writeFileSync(__dirname + '/saved data/scores.json', JSON.stringify(scores));
    var temp = [];
    Object.keys(scores).forEach(function (key, index) {
        // key: the name of the object key
        // index: the ordinal position of the key within the object 
        temp.push({
            "hasTraced": scores[key]["hasTraced"],
            "warning": scores[key]["warning"],
            "score": scores[key]["score"] + scores[key]["hackscore"],
            "attempt": scores[key]["attempt"],
            "penalty": scores[key]["penalty"],
            "team_name": candidates[key]["team_name"],
            "hackerrank": candidates[key]["hackerrank"],
            "hackrank": scores[key]["hackrank"]
        });
    });
    publish(JSON.stringify(temp));
}
function saveMisc() {
    fs.writeFileSync(__dirname + '/saved data/misc.json', JSON.stringify(misc));
}
function pad(num, size) {
    var s = num + "";
    while (s.length < size)
        s = "0" + s;
    return s;
}
