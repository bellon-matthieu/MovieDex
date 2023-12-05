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
  const test_film = await client.db("MovieDex").collection("films").aggregate([{ $match: {year:{$gte:2000}} },  { $sample: { size: 5 }}]).toArray();
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
if (! req.session.id_user) {
  res.redirect("log-in");
}

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

app.get("/my-dexes", async function (req, res, next) {
  if (! req.session.id_user) {
    res.redirect("log-in");
  } else {
    const my_dexes = await client.db("MovieDex").collection("dex").find({id_user : req.session.id_user}).toArray();
    res.render("./template/template.ejs", {
      path: "my-dexes.ejs",
      my_dexes : my_dexes,
      });
  };
});

// ###############
// RESEARCH
// ###############

app.get("/research", function (req, res, next) {
  res.render("./template/template.ejs", {
    path: "research.ejs",
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

app.get("/random-movie", async function (req, res, next) {
  const random_movie = await client.db("MovieDex").collection("films").aggregate([{ $match: {year:{$gte:2015}} },  { $sample: { size: 1 }}]).toArray();

  const random_movie_id = random_movie[0]['_id'];

  res.redirect("film?id="+random_movie_id);
})

// ###############
// REGISTER
// ###############

app.get("/register", async function (req, res, next) {;
  res.render("./template/template.ejs", {
    path: "register.ejs",
  });
});

app.post("/register", async function (req,res,next) {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  if (await client.db("MovieDex").collection("user").findOne({username:username})) {
    res.redirect("register");
  } else {
    client.db("MovieDex").collection("user").insertOne({
      username:username,
      email:email,
      password:password,
    })
    const user = await client.db("MovieDex").collection("user").findOne({username:username});
    const id_user = user["_id"];

    req.session.id_user = id_user;
    res.redirect("profile");
  }
})

// ###############
// LOG IN
// ###############

app.get("/log-in", async function (req, res, next) {
  res.render("./template/template.ejs", {
    path: "log-in.ejs",
  });
});

app.post("/log-in", async function (req,res,next) {

  const username_or_email = req.body.username;
  const password = req.body.password;

  if (await client.db("MovieDex").collection("user").findOne({$or : [{username:username_or_email},{email:username_or_email}]})) {
    
    const user = await client.db("MovieDex").collection("user").findOne({$or : [{username:username_or_email},{email:username_or_email}]});

    if (password == user['password']) {

      req.session.id_user = user['_id'];
      res.redirect("profile");

    } else {

      res.redirect("log-in")};

  } else {
    
    res.redirect("log-in");

    };
})

app.get("*", (req, res) => {
  res.redirect("/");
});

app.use(express.static("MovieDex"));
app.listen(8080);
console.log("MovieDex is now online - please have fun (port 8080)");
