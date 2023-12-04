let express = require("express"),
  session = require("express-session"),
  engines = require("consolidate"),
  app = express();

app.engine("html", engines.hogan);
var bodyParser = require("body-parser");

const ObjectId = require("mongodb").ObjectId;

let { MongoClient } = require("mongodb");
const match = require("nodemon/lib/monitor/match");
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


// ###############
// /
// ###############

app.get("/", function (req, res, next) {
  res.redirect("home");
});

// ###############
// HOME
// ###############

app.get("/home", async function (req, res, next) { 
  //{thumbnail :{$ne:null}, year:2020} .limit(10).toArray()
  const test_film = await client.db("MovieDex").collection("films").aggregate([{ $match: {} },  { $sample: { size: 5 }}]).toArray();
  for (let i =  0;i<test_film.length;i++) {
    if (test_film[i]["thumbnail"] == null) {
      test_film[i]["thumbnail"] = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Solid_red.svg/768px-Solid_red.svg.png"
    }
  }

  let photo_array = [];

  for (let i = 0; i<test_film.length; i++) {
    let temp_array = [];
    temp_array.push(test_film[i]['_id']);
    temp_array.push(test_film[i]['thumbnail']);
    photo_array.push(temp_array);
  }

  // const photo_array = test_film.map(f => f.thumbnail);

  res.render("./template/template.ejs", {
    path: "home.ejs",
    photo:photo_array,
  });
});

// ###############
// Profile
// ###############

app.get("/profile", function (req, res, next) { 
  res.render("./template/template.ejs", {
    path: "profile.ejs",
  });
});

// ###############
// SETTINGS
// ###############

app.get("/settings", function (req, res, next) {
  res.render("./template/template.ejs", {
    path: "settings.ejs",
  });
});

// ###############
// MY-DEXES
// ###############

app.get("/my-dexes", function (req, res, next) {
  res.render("./template/template.ejs", {
    path: "my-dexes.ejs",
  });
});

// ###############
// RESULTS
// ###############

app.get("/results", function (req, res, next) {
  res.render("./template/template.ejs", {
    path: "results.ejs",
  });
});

// ###############
// FILM
// ###############

app.get("/film", async function (req, res, next) {

  const data_film = await client.db("MovieDex").collection("films").findOne({ _id: new ObjectId(req.query.id)});
  let title = data_film["title"];
  let year = data_film["year"];
  let cast = data_film["cast"];
  let genres = data_film["genres"];
  let extract = data_film["extract"];
  let thumbnail = data_film["thumbnail"];



  res.render("./template/template.ejs", {
    path: "film.ejs",
    title: title,
    year: year,
    cast:cast,
    genres:genres,
    extract:extract,
    thumbnail:thumbnail,
  });
});

app.post("/film", function (req,res,next) {
  const id_film = req.body.id;
  res.redirect("film?id="+id_film)
})

app.get("*", (req, res) => {
  res.redirect("/");
});

app.use(express.static("MovieDex"));
app.listen(8080);
console.log("Express server started in port 8080");
