let express = require("express"),
  session = require("express-session"),
  engines = require("consolidate"),
  app = express();

app.engine("html", engines.hogan);
var bodyParser = require("body-parser");

const ObjectId = require("mongodb").ObjectId;

let { MongoClient, BSONType } = require("mongodb");
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
  try {
    res.redirect("home");
  } catch {
    res.redirect("error")
  }
});

// ###############
// HOME
// ###############

app.get("/home", async function (req, res, next) { 

  // DB ---> 15 meilleurs films
  const trendsMovies = await dbMovie.aggregate([
    { $addFields :
      {averageScore :
        {$avg : {
          $map : {
            input: "$score",
            as: "array",
            in: {$arrayElemAt:["$$array",0]}
          }}}}},

    { $sort: 
      { averageScore: -1, year:-1
      }},

    { $limit: 15},
                                      ]).toArray();

  const trendsDexes = await dbDex.aggregate([{$sample:{size:6}}]).toArray();

  // Ajout d'une image rouge pour les films qui n'ont pas de thumbnail
  for (let i=0; i<trendsMovies.length; i++) {
    if (trendsMovies[i]["thumbnail"] == null) {
      trendsMovies[i]["thumbnail"] = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Solid_red.svg/768px-Solid_red.svg.png"
    }
  }

  let likeUser = null;

  if (req.session.idUser) {
    const user = await dbUser.findOne({_id:new ObjectId(req.session.idUser)});
    likeUser = user['like'];
  } else {
    likeUser = [];
  }

  res.render("./template/template.ejs", {
        path: "home/home.ejs",
        trendsMovies:trendsMovies,
        trendsDexes:trendsDexes,
        likeUser:likeUser,
    });

  
});

// ###############
// PROFILE
// ###############

app.get("/profile", async function (req, res, next) { 
  let idUser = null;

  if (req.query.id) {
    idUser = req.query.id;
  } else {
    if (req.session.idUser) {
      idUser = req.session.idUser;
    }
    else {
      res.redirect("log-in");
    }
  }

  try {
    const user = await dbUser.findOne({_id:new ObjectId(idUser)});
    res.render("./template/template.ejs", {
      path: "profile/profile.ejs",
      user: user,
    });
  } catch (BSONType) {
    console.log("user not found");
    res.redirect("error");
  }
});

// ###############
// DEXES
// ###############

app.get("/dex", async function (req, res, next) {

  const dataDex = await dbDex.aggregate([{$match:{ _id: new ObjectId(req.query.id)}}]).toArray();
  const idUser = req.session.idUser;
  const creator = await dbUser.aggregate([{$match:{ _id: new ObjectId(dataDex[0]['user'])}}]).toArray();

  res.render("./template/template.ejs", {
    path: "dex/dex.ejs",
    dataDex:dataDex[0],
    idUser:idUser,
    creatorUsername: creator[0]['username'],
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

app.post("/remove-movie-from-dex", async function (req,res,next) {
  idMovie = req.body.idMovieRemoved;
  idDex = req.body.idDex;

  const previousDex = await dbDex.findOne({ _id : new ObjectId(idDex)});
  const moviesDex = previousDex["movies"];

  for (let i = 0; i < moviesDex.length;i++) {
    if (moviesDex[i]["_id"] == idMovie) {
      moviesDex.splice(i,1);
      break;
    }
  }

  dbDex.updateOne(
    {_id : new ObjectId(idDex)},
    {$set : {"movies":moviesDex}});
  res.redirect("dex?id="+idDex);
})

app.get("/my-dexes", async function (req, res, next) {
  if (! req.session.idUser) {
    res.redirect("log-in");
  } else {
    const dexes = await dbDex.find({user : req.session.idUser}).toArray();
    res.render("./template/template.ejs", {
      path: "dex/my-dexes.ejs",
      dexes : dexes,
      });
  };
});

app.get("/create-dex", async function (req, res, next) {
  if (! req.session.idUser) {
    res.redirect("log-in");
  } else {
    res.render("./template/template.ejs", {
      path: "dex/create-dex.ejs",
      genres:genres,
      });
  };
});

app.post("/create-dex", async function (req,res, next) {
  idUser = req.session.idUser;
  nameDex = req.body.nameDex;
  genresDex = req.body.genresDex;
  descriptionDex = req.body.descriptionDex;

  let newDex = await dbDex.insertOne({"user":idUser,
                                      "name":nameDex,
                                      "genres":genresDex,
                                      "movies":[],
                                      "description": descriptionDex,
                                      "score": 0,
                                    });
  let idNewDex = newDex.insertedId;
  res.redirect("dex?id="+idNewDex);
})


// ###############
// SEARCH
// ###############

app.get("/search", async function (req, res, next) {
  let startTime = performance.now();

  let query = req.query.query.toString();

  let startDate = parseInt(req.query.startDate);
  let endDate = parseInt(req.query.endDate);

  const actor = req.query.actor;

  const queryGenres = req.query.genres;
  let genresInput = [];
  if (queryGenres) {
    if (Array.isArray(queryGenres)) {
      genresInput = queryGenres;
    } else {
      genresInput = [queryGenres]
    }
  }

  let resultMovies = null;
  
  if (genresInput.length==0) {
    if (actor) {
      resultsMovies = await dbMovie.aggregate([
          {$match: {
            $text: {$search:query},
            year: {$gte : startDate, $lte : endDate},
            cast : {$in : [actor]},
          }},
          {$sort: {
            score:-1, 
            extract: {$meta: "textScore"}
          }},
      ]).toArray();
    } else {
      resultsMovies = await dbMovie.aggregate([
          {$match: {
            $text: {$search:query},
            year: {$gte : startDate, $lte : endDate},
          }},
          {$sort: {
            score:-1, 
            extract: {$meta: "textScore"}
          }},
      ]).toArray();
    }

  } else {
    if (actor) {
      resultsMovies = await dbMovie.aggregate([
          {$match: {
            $text: {$search:query},
            year: {$gte : startDate, $lte : endDate},
            cast : {$in : [actor]},
            genres: {$all : genresInput},
          }},
          {$sort: {
            score:-1, 
            extract: {$meta: "textScore"}
          }},
      ]).toArray();
    } else {
      resultsMovies = await dbMovie.aggregate([
          {$match: {
            $text: {$search:query},
            year: {$gte : startDate, $lte : endDate},
            genres: {$all : genresInput},
          }},
          {$sort: {
            score:-1, 
            extract: {$meta: "textScore"}
          }},
      ]).toArray();
    }
  }


  
  let endTime = performance.now();
  const time = Math.round((endTime-startTime)*100) / 100;

  res.render("./template/template.ejs", {
    path: "search/search.ejs",
    query:query,
    genres:genres,
    resultsMovies:resultsMovies,
    time:time,
  });
});

app.post("/search", function (req, res, next) {
  let url = "search?query="+req.body.query;
  if (req.body.startDate) {url += "&startDate="+req.body.startDate} else {url += "&startDate="+1917};
  if (req.body.endDate) {url += "&endDate="+req.body.endDate} else {url += "&endDate="+2023};
  if (req.body.actor) {url += "&actor="+req.body.actor};
  if (req.body.genres) {
    if (Array.isArray(req.body.genres)) {
      for (let i = 0; i < req.body.genres.length; i++) {
        url += "&genres="+req.body.genres[i];
      }
    } else {
      url += "&genres="+req.body.genres;
    }
  }
  res.redirect(url);
});

// ###############
// MOVIE
// ###############

app.get("/movie", async function (req, res, next) {
  const idDailyMovie = req.query.id;
  const idUser = req.session.idUser;
  const dataMovie = await dbMovie.findOne({ _id: new ObjectId(idDailyMovie)});
  const dexesUser = await dbDex.find({user : idUser}).toArray();

  let sum = 0;
  let rate = 0;
  const nbrRate = dataMovie['score'].length

  for (let i = 0; i <dataMovie['score'].length;i++) {
    sum += dataMovie['score'][i][0];
  }
  if (dataMovie['score'].length>0) {rate = (sum / dataMovie['score'].length);}

  let seen = false;
  if (idUser) {
    const user = await dbUser.findOne({_id:new ObjectId(idUser)});
    const moviesSeen = user['seen']
    for (let i = 0; i < moviesSeen.length; i++) {
      if (dataMovie._id.equals(moviesSeen[i]._id)) {
        seen = true;
        break;
    }
  }
  }

  res.render("./template/template.ejs", {
    path: "movie/movie.ejs",
    dataMovie:dataMovie,
    idUser:idUser,
    dexesUser:dexesUser,
    seen:seen,
    rate:rate,
    nbrRate:nbrRate,
  });
});

app.post("/movie", function (req,res,next) {
  const idMovie = req.body.idMovie;
  res.redirect("movie?id="+idMovie)
})

app.post("/add-movie", async function (req,res,next) {
  const idDex = req.body.selectedDex;
  const idMovie = req.body.idMovie;

  const newMovie = await dbMovie.findOne({_id : new ObjectId(idMovie)});
  const dex = await dbDex.findOne({_id : new ObjectId(idDex)});
  const moviesDex = dex['movies'];

  let isMovieAlreadyIn = false;

  for (let i = 0; i<moviesDex.length; i++) {

    if (newMovie._id.equals(moviesDex[i]._id)) {
      isMovieAlreadyIn = true;
      break;
    }
  }

  if (! isMovieAlreadyIn) {
    dbDex.updateOne(
      { _id : new ObjectId(idDex) },
      { $push : {movies : newMovie} })
    res.redirect("movie?id="+idMovie);
  } else {
    res.redirect("movie?id="+idMovie);}
})

app.get("/random-movie", async function (req, res, next) {
  const randomMovie = await dbMovie.aggregate([{ $match: {year:{$gte:2000}} },  { $sample: { size: 1 }}]).toArray();

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

app.post("/movie-seen", async function (req,res,next) {
  const idMovie = req.body.idMovie;
  const newMovie = await dbMovie.findOne({_id:new ObjectId(idMovie)});
  const idUser = req.body.idUser;

  const dataUser = await dbUser.findOne({_id:new ObjectId(idUser)});
  const alreadySeenMovies = dataUser['seen'];

  let isAlreadySeen = false;

  for (let i = 0; i < alreadySeenMovies.length; i++) {
    if (newMovie._id.equals(alreadySeenMovies[i]._id)) {
      isAlreadySeen = true;
      break;
    }
  }

  if (! isAlreadySeen) {
    dbUser.updateOne(
      { _id : new ObjectId(idUser) },
      { $push : {seen : newMovie} });
  }

  res.redirect("movie?id="+idMovie);

})

app.post("/add-rate", async function (req,res,next) {
  const idMovie = req.body.idMovie;
  const dataMovie = await dbMovie.findOne({_id:new ObjectId(idMovie)});
  const idUser = req.body.idUser;

  const rates = dataMovie['score'];

  let isAlreadyRate = false;

  const rating = [parseInt(req.body.rate),idUser];
  const usr_rated = [parseInt(req.body.rate),dataMovie];

  for (let i = 0; i < rates.length; i++) {
    if (idUser == (rates[i][1])) {
      isAlreadyRate = true;
      break;
    }
  }

  if (! isAlreadyRate) {
    dbMovie.updateOne(
      { _id : new ObjectId(idMovie) },
      { $push : {score : rating} });
      
    dbUser.updateOne(
      { _id : new ObjectId(idUser) },
      { $push : {rated : usr_rated} });
  }

  res.redirect("movie?id="+idMovie);
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

  function encrypt(rawInput) {
    let hash = 0, i, chr;
    if (rawInput === 0) {return hash;}
    for (i = 0; i < rawInput.length; i++) {
      chr = rawInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash;
  }
  
  const username = req.body.username;
  const email = req.body.email;
  const encryptPassword = encrypt(req.body.password);
  
  if (await dbUser.findOne({username:username})) {
    res.redirect("register");
  } else {
    client.db("MovieDex").collection("user").insertOne({
      username:username,
      email:email,
      password:encryptPassword,
      seen:[],
      rated:[],
    })
    const user = await dbUser.findOne({username:username});
    const idUser = user["_id"];

    req.session.idUser = idUser;
    res.redirect("profile");
  }
})

app.get("/log-in", async function (req, res, next) {
  res.render("./template/template.ejs", {
    path: "register/log-in.ejs",
  });
});

app.post("/log-in", async function (req,res,next) {

  function encrypt(rawInput) {
    let hash = 0, i, chr;
    if (rawInput === 0) {return hash;}
    for (i = 0; i < rawInput.length; i++) {
      chr = rawInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash;
  }

  const username_or_email = req.body.username;
  const password = encrypt(req.body.password);

  if (await dbUser.findOne({$or : [{username:username_or_email},{email:username_or_email}]})) {
    
    const user = await dbUser.findOne({$or : [{username:username_or_email},{email:username_or_email}]});

    if (password == user['password']) {

      req.session.idUser = user['_id'];
      res.redirect("profile");

    } else {

      res.redirect("log-in")};

  } else {
    
    res.redirect("log-in");

    };
})

app.get("/log-out", function (req,res,next) {
  req.session.idUser = null;
  res.redirect("log-in");
});

// ###############
// other
// ###############

app.get("error", (req, res) => {
  res.render("./template/template.ejs", {
    path: "error/error.ejs",
  });
});

app.get("*", (req, res) => {
  res.render("./template/template.ejs", {
    path: "error/not-found.ejs",
  });
});

app.use(express.static("MovieDex"));
app.listen(8080);
console.log("MovieDex is now online - please have fun (port 8080)");
