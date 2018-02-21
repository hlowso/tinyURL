var express = require("express");
const morgan = require('morgan');
const bodyParser = require('body-parser');

var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

app.set("view engine", "ejs");
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  const C = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  for(let i = 0; i < 6; i++) {
  	key += C.charAt(Math.floor(Math.random() * C.length));
  }
  return key;
}

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  res.render("urls_index", { urls: urlDatabase });
});

app.post("/urls", (req, res) => {
  let new_key = generateRandomString();
  urlDatabase[new_key] = req.body.longURL;  
  res.redirect(`/urls/${new_key}`);         
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

function showProtocol(res, id) {
  res.render("urls_show", { shortURL: id, urls: urlDatabase });
}

app.get("/urls/:id", (req, res) => {
  showProtocol(res, req.params.id);
});

function deleteProtocol(res, id) {
  delete urlDatabase[id];
  res.render("urls_index", { urls: urlDatabase });
}

app.post("/urls/:id", (req, res) => {
  let updated = req.body.updatedURL;
  let key = req.params.id;
  if(updated === undefined) { 
    console.log("Here");
    deleteProtocol(res, key);
  }
  else {
    urlDatabase[key] = updated;
    showProtocol(res, key);
  }
});

app.post("/urls/:id/delete", (req, res) => {
  deleteProtocol(res, req.params.id);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

