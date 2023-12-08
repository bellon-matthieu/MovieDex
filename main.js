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
const dbMovie = client.db("MovieDex").collection("movie");

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/static"));

const genres = [
        "Action",
        "Adventure",
        "Animated",
        "Biography",
        "Comedy",
        "Crime",
        "Dance",
        "Disaster",
        "Documentary",
        "Drama",
        "Erotic",
        "Family",
        "Fantasy",
        "Found Footage",
        "Historical",
        "Horror",
        "Independent",
        "Legal",
        "Live Action",
        "Martial Arts",
        "Musical",
        "Mystery",
        "Noir",
        "Performance",
        "Political",
        "Romance",
        "Satire",
        "Science Fiction",
        "Short",
        "Silent",
        "Slasher",
        "Sports",
        "Spy",
        "Superhero",
        "Supernatural",
        "Suspense",
        "Teen",
        "Thriller",
        "War",
        "Western"
]

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

  const trendsMoviesSize = 3;

  // DB ---> 15 films aléatoires avec (year >= 2000)
  const trendsMovies = await dbMovie.aggregate([{ $match: {year:{$gte:2002}} },  { $sample: { size: trendsMoviesSize*5 }}]).toArray();

  // Ajout d'une image rouge pour les films qui n'ont pas de thumbnail
  for (let i=0; i<trendsMovies.length; i++) {
    if (trendsMovies[i]["thumbnail"] == null) {
      trendsMovies[i]["thumbnail"] = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Solid_red.svg/768px-Solid_red.svg.png"
    }
  }

  res.render("./template/template.ejs", {
    path: "home/home.ejs",
    trendsMovies:trendsMovies,
  });
});

// ###############
// PROFILE
// ###############

app.get("/profile", function (req, res, next) { 
if (! req.session.id_user) {
  res.redirect("log-in");
}

  res.render("./template/template.ejs", {
    path: "profile/profile.ejs",
  });
});

// ###############
// SETTINGS
// ###############

app.get("/settings", function (req, res, next) {
  res.render("./template/template.ejs", {
    path: "settings/settings.ejs",
  });
});

// ###############
// DEXES
// ###############

app.get("/dex", async function (req, res, next) {

  const dataDex = await dbDex.findOne({ _id: new ObjectId(req.query.id)});
  const idUser = req.session.id_user;

  res.render("./template/template.ejs", {
    path: "dex/dex.ejs",
    dataDex:dataDex,
    idUser:idUser,
  });
});

app.post("/dex", function (req,res,next) {
  const idDex = req.body.id;
  res.redirect("dex?id="+idDex)
})

app.post("/delete-dex", async function (req,res,next){
  const idDex = new ObjectId(req.body.idDex);
  await dbDex.deleteOne({_id : idDex});
  res.redirect("my-dexes");
})

app.get("/my-dexes", async function (req, res, next) {
  if (! req.session.id_user) {
    res.redirect("log-in");
  } else {
    const dexes = await dbDex.find({user : req.session.id_user}).toArray();
    res.render("./template/template.ejs", {
      path: "dex/my-dexes.ejs",
      dexes : dexes,
      });
  };
});

app.get("/create-dex", async function (req, res, next) {
  if (! req.session.id_user) {
    res.redirect("log-in");
  } else {
    res.render("./template/template.ejs", {
      path: "dex/create-dex.ejs",
      genres:genres,
      
      });
  };
});

app.post("/create-dex", async function (req,res, next) {
  idUser = req.session.id_user;
  nameDex = req.body.nameDex;
  genresDex = req.body.genresDex;

  dbDex.insertOne({"user":idUser,
                  "name":nameDex,
                  "genres":genresDex,
                  "movies":[]})
  
  res.redirect("home");
})

// ###############
// RESEARCH
// ###############

app.get("/research", function (req, res, next) {
  res.render("./template/template.ejs", {
    path: "research/research.ejs",
  });
});

// ###############
// FILM
// ###############

app.get("/movie", async function (req, res, next) {
  const idDailyMovie = req.query.id;
  const dataMovie = await dbMovie.findOne({ _id: new ObjectId(idDailyMovie)});

  res.render("./template/template.ejs", {
    path: "movie/movie.ejs",
    dataMovie:dataMovie,
  });
});

app.post("/movie", function (req,res,next) {
  const idMovie = req.body.idMovie;
  res.redirect("movie?id="+idMovie)
})

app.get("/random-movie", async function (req, res, next) {
  const randomMovie = await dbMovie.aggregate([{ $match: {year:{$gte:2010}} },  { $sample: { size: 1 }}]).toArray();

  const idRandomMovie = randomMovie[0]['_id'];

  res.redirect("movie?id="+idRandomMovie);
})

app.get("/daily-movie", async function (req, res, next) {

  const allMovies = await dbMovie.find().toArray();

  const date = new Date();

  const day = date.getDay();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  let index = day + month + year;
  index = index*index*index;
  index = index % (allMovies.length+1);
  


  const idDailyMovie = allMovies[index]['_id'];

  res.redirect("movie?id="+idDailyMovie);
})

// ###############
// REGISTER
// ###############

app.get("/register", async function (req, res, next) {;
  res.render("./template/template.ejs", {
    path: "register/register.ejs",
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
    path: "register/log-in.ejs",
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
