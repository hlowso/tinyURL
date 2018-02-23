const express = require("express");
const morgan = require('morgan');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

// *--------------*
// | SERVER SETUP |
// *--------------*

// Setup of third party middleware
const app = express();
app.set("view engine", "ejs");
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  secret: 'Listen... doo wah oooh... Do you want to know a secret?.. doo wah oooh'
}));
const PORT = process.env.PORT || 8080; 
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Declaration of data objects
const urlDatabase = {};
const users = {};

// *------------------*
// | USEFUL FUNCTIONS |
// *------------------*

function generateRandomString() {
  const C = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  for(let i = 0; i < 6; i++) {
  	key += C.charAt(Math.floor(Math.random() * C.length));
  }
  return key;
}

function filterUrls(user_id) {
  const user_urls = {};
  for(let key in urlDatabase) {
    if(urlDatabase[key].userID === user_id) {
      user_urls[key] = urlDatabase[key];
    }
  }
  return user_urls;
}

function findUserByEmail(email) {
  let user;
  for(let key in users) if(users[key].email === email) user = users[key];
  return user;
}

function isLoggedIn(user_id) {
  return (user_id in users);
}

// *----------*
// | HANDLERS |
// *----------*

// 1. LOGIN AND REGISTRATION

// Render sign up page
app.get("/register", (req, res) => {
  if(isLoggedIn(req.session.user_id)) 
    return redirect("/urls");
  return res.render('register');
});   

// Attempt to sign up
app.post("/register", (req, res) => {
  const incoming_email = req.body.email;
  if(!incoming_email) return res.render('register', { empty_email: true });

  const incoming_password = req.body.password;
  if(!incoming_password) return res.render('register', {empty_password: true});

  if(findUserByEmail(incoming_email)) 
    return res.render('register', {email_already_exists: true});

  const user_id = generateRandomString();
  req.session.user_id = user_id;
  users[user_id] = { id: user_id, email: incoming_email, password: bcrypt.hashSync(incoming_password, 10) };
  return res.redirect("/urls");
});

// Render login page
app.get("/login", (req, res) => {
  if(isLoggedIn(req.session.user_id)) 
    return res.render('login', { user: users[req.session.user_id] });
  return res.render('login');
});   

// Attempt to login
app.post("/login", (req, res) => {
  let template_args = {};
  if(isLoggedIn(req.session.user_id)) template_args = { user: users[req.session.user_id] };

  const incoming_email = req.body.email;
  if(!incoming_email) {
    template_args.empty_email = true;
    return res.render('login', template_args);
  }

  const incoming_password = req.body.password;
  if(!incoming_password) { 
    template_args.empty_password = true;
    return res.render('login', template_args);
  }

  const user = findUserByEmail(incoming_email);
  if(!user || !bcrypt.compareSync(incoming_password, user.password)) {
    template_args.bad_login = true;
    return res.render('login', template_args);
  }
  
  req.session.user_id = user.id;
  return res.redirect("/urls"); 
});

// Logout
app.post("/logout", (req, res) => {
  req.session = null;
  return res.redirect("/login");
});

app.get("/", (req, res) => {
  if(isLoggedIn(req.session.user_id)) return res.redirect("/urls");
  return res.redirect("/login");
});

// 2. URL FEATURES

// Attempt to list short urls
app.get("/urls", (req, res) => {
  let template_args = {};
  const user_id = req.session.user_id;

  if(isLoggedIn(user_id)) 
    return res.render('urls_index', { user: users[user_id], urls: filterUrls(user_id) });

  res.status(401);
  return res.render('error', {links: true, message: "401: You must be logged in to see your urls."});
});

// Attempt to create a new short url
app.post("/urls", (req, res) => {
  const user_id = req.session.user_id;

  if(isLoggedIn(user_id)) {
    const new_key = generateRandomString();
    const longURL = req.body.longURL;

    if(!longURL) 
      return res.render('urls_new', { user: users[user_id], url_empty: true });

    const exact_date = new Date();
    const date = exact_date.getDate() + '/' + exact_date.getMonth() + 1 + '/' + exact_date.getFullYear();
    urlDatabase[new_key] = { id: new_key, longURL: longURL, userID: user_id, birthday: date, total_visits: 0, unique_visitors: [] };
    return res.redirect(`/urls/${new_key}`); 
  }

  res.status(401);
  return res.render('error', {links: true, message: "401: You must be logged in to create a url."});           
});

// Attempt to render short url creation page
app.get("/urls/new", (req, res) => {
  if(isLoggedIn(req.session.user_id)) 
    return res.render('urls_new', { user: users[req.session.user_id] });
  return res.redirect("/login");
});

// Attempt to view a short url
app.get("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;

  if(isLoggedIn(user_id)) {
    const url_id = req.params.id;
    url = urlDatabase[url_id];

    if(url === undefined){
      res.status(404);
      return res.render('error', { user: users[user_id], message: "404: url not found." }); 
    }

    if(url.userID !== user_id) {
      res.status(403);
      return res.render('error', { user: users[user_id], message: "403: You are not the owner of this url." }); 
    }

    return res.render('urls_show', { user: users[user_id], url: urlDatabase[url_id] });
  }

  else {
    res.status(401);
    return res.render('error', { links: true, message: "401: You must be logged in to see this url." });        
  }
});

// Attempt to edit a short url
app.post("/urls/:id", (req, res) => {

  const user_id = req.session.user_id;
  if(isLoggedIn(user_id)) {

    const updated = req.body.updatedURL;
    const url_id = req.params.id;
    url = urlDatabase[url_id];

    if(url === undefined) {
      res.status(404);
      return res.render('error', { user: users[user_id], message: "404: url not found." }); 
    }

    if(url.userID !== user_id) {
      res.status(403);
      return res.render('error', { user: users[user_id], message: "403: You are not the owner of this url." }); 
    } 

    if(!updated) 
      return res.render('urls_show', { user: users[user_id], url_empty: true, url: urlDatabase[url_id] });

    url.longURL = updated;
    return res.redirect("/urls");
  }

  res.status(401);
  return res.render('error', {links: true, message: "401: You must be logged in to see this url."}); 
});

// Attempt to redirect user to the url pointed to by a short url
app.get("/u/:shortURL", (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  const user_id = req.session.user_id;

  if(!url) {
    res.status(404);
    return res.render('error', { user: users[user_id], message: "404: url not found." }); 
  }

  if(user_id !== undefined) {
    url.total_visits += 1;
    if(!url.unique_visitors.includes(user_id))
      url.unique_visitors.push(user_id);
  }

  let longURL = url.longURL;
  if(!longURL.startsWith('http://') && !longURL.startsWith('https://')) longURL = 'http://' + longURL;
  res.redirect(longURL);
});

// Attempt to delete a short url
app.post("/urls/:id/delete", (req, res) => {
  const user_id = req.session.user_id;

  if(isLoggedIn(user_id)) {
    const url_id = req.params.id;
    url = urlDatabase[url_id];

    if(url === undefined) {
      res.status(404);
      return res.render('error', {user: users[user_id], message: "404: url not found."}); 
    }

    if(url.userID !== user_id) {
      res.status(403);
      return res.render('error', {user: users[user_id], message: "403: You are not the owner of this url."}); 
    }

    delete urlDatabase[url_id];
    return res.redirect("/urls");
  }

  res.status(401);
  return res.render('error', {links: true, message: "401: You must be logged in to update a url."});
});
