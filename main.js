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
app.set("views", __dirname + "/views");
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
  res.redirect("home");
});

app.get("/home", async function (req, res, next) {
  //{thumbnail :{$ne:null}, year:2020} .limit(10).toArray()
  const test_film = await client.db("data-film").collection("films").aggregate([{$match:{}}, { $sample: { size: 10 }}]).toArray();
  for (let i =  0;i<test_film.length;i++) {
    if (test_film[i]["thumbnail"] == null) {
      test_film[i]["thumbnail"] = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Solid_red.svg/768px-Solid_red.svg.png"
    }
  }
  const photo_array = test_film.map(f => f.thumbnail);
  console.log(photo_array);

  res.render("./template/template.ejs", {
    path: "home.ejs",
    photo:photo_array,
    i: 0,
  });
});

app.get("/profile", function (req, res, next) {
  res.render("./template/template.ejs", {
    path: "profile.ejs",
  });
});

app.get("/settings", function (req, res, next) {
  res.render("./template/template.ejs", {
    path: "settings.ejs",
  });
});

app.get("/my-dexes", function (req, res, next) {
  res.render("./template/template.ejs", {
    path: "my-dexes.ejs",
  });
});

app.get("/results", function (req, res, next) {
  res.render("./template/template.ejs", {
    path: "results.ejs",
  });
});

app.get("/film", function (req, res, next) {
  res.render("./template/template.ejs", {
    path: "film.ejs",
  });
});

app.get("*", (req, res) => {
  res.redirect("/");
});

app.use(express.static("MovieDex"));
/template/;
app.listen(8080);
console.log("Express server started in port 8080");
