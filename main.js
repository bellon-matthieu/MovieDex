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

const dbUser = client.db("MovieDex").collection("user");
const dbDex = client.db("MovieDex").collection("dex");
const dbFilms = client.db("MovieDex").collection("films");

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

  // DB ---> 15 films aléatoires avec (year >= 2000)
  const films = await dbFilms.aggregate([{ $match: {year:{$gte:2000}} },  { $sample: { size: 15 }}]).toArray();

  // Ajout d'une image rouge pour les films qui n'ont pas de thumbnail
  for (let i =  0;i<films.length;i++) {
    if (films[i]["thumbnail"] == null) {
      films[i]["thumbnail"] = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Solid_red.svg/768px-Solid_red.svg.png"
    }
  }

  res.render("./template/template.ejs", {
    path: "home.ejs",
    films:films,
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
// DEXES
// ###############

app.get("/my-dexes", async function (req, res, next) {
  if (! req.session.id_user) {
    res.redirect("log-in");
  } else {
    const my_dexes = await dbDex.find({id_user : req.session.id_user}).toArray();
    res.render("./template/template.ejs", {
      path: "my-dexes.ejs",
      my_dexes : my_dexes,
      });
  };
});

app.get("/create_dex", async function (req, res, next) {
  if (! req.session.id_user) {
    res.redirect("log-in");
  } else {
    const films = await dbFilms.aggregate([{$match:{}},{$sample:{size:10}}]).toArray();

    console.log(films);
    res.render("./template/template.ejs", {
      path: "create_dex.ejs",
      films: films,
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

  const data_film = await dbFilms.findOne({ _id: new ObjectId(req.query.id)});

  res.render("./template/template.ejs", {
    path: "film.ejs",
    data_film:data_film,
  });
});

app.post("/film", function (req,res,next) {
  const id_film = req.body.id;
  res.redirect("film?id="+id_film)
})

app.get("/random-movie", async function (req, res, next) {
  const random_movie = await dbFilms.aggregate([{ $match: {year:{$gte:2015}} },  { $sample: { size: 1 }}]).toArray();

  const random_movie_id = random_movie[0]['_id'];

  res.redirect("film?id="+random_movie_id);
})

app.get("/daily-movie", async function (req, res, next) {

  const random_movie = await dbFilms.find().toArray();

  const date = new Date();

  const day = date.getDay();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  let index = day + month + year;
  console.log(index);
  index = index*index*index;
  console.log(index);

  index = index % (random_movie.length+1);
  console.log(index);
  


  const random_movie_id = random_movie[index]['_id'];

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
  if (await dbUser.findOne({username:username})) {
    res.redirect("register");
  } else {
    client.db("MovieDex").collection("user").insertOne({
      username:username,
      email:email,
      password:password,
    })
    const user = await dbUser.findOne({username:username});
    const id_user = user["_id"];

    req.session.id_user = id_user;
    res.redirect("profile");
  }
})

app.get("/log-in", async function (req, res, next) {
  res.render("./template/template.ejs", {
    path: "log-in.ejs",
  });
});

app.post("/log-in", async function (req,res,next) {

  const username_or_email = req.body.username;
  const password = req.body.password;

  if (await dbUser.findOne({$or : [{username:username_or_email},{email:username_or_email}]})) {
    
    const user = await dbUser.findOne({$or : [{username:username_or_email},{email:username_or_email}]});

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
