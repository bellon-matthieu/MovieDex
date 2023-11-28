let express = require("express"),
  session = require("express-session"),
  engines = require("consolidate"),
  app = express();

app.engine("html", engines.hogan);
var bodyParser = require("body-parser");

const ObjectId = require("mongodb").ObjectId;

let { MongoClient } = require("mongodb");
const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

app.set("view engine", "ejs");
app.set("views", __dirname + "/static");
app.use(express.static(__dirname + "/static"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "propre123",
    resave: false,
    saveUninitialized: true,
    cookie: {
      path: "/",
      httpOnly: true,
      // maxAge: 3600000,
    },
  })
);

app.get("/", function (req, res, next) {
  res.render("home.ejs");
});

app.get("/profile", function (req, res, next) {
  res.render("profile.ejs");
});

app.get("/settings", function (req, res, next) {
  res.render("settings.ejs");
});

app.get("/my-list", function (req, res, next) {
  res.render("my-list.ejs");
});

app.get("/results", function (req, res, next) {
  res.render("results.ejs");
});

app.get("*", (req, res) => {
  res.redirect("/");
});

app.use(express.static("MovieDex"));

app.listen(8080);
console.log("Express server started in port 8080");
