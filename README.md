# tinyURL 
A little url shortner by Harry Lowson

## Usage
Login to tinyURL to create cute, 6-character-long URL stand-ins for all of your favourite URLS! Put em' in your tweets to free up space! Put em' in your facebook posts to save time! Put em' in your emails, cause, why not?

## Screenshots

## File and Code Structure
Apart from Node.js, this project consists of 3 main components: third-party packages (located in /node_modules/), the server script (/express_server.js) and several EJS templates (located in /views/).

### Third party packages
express (server engine),
morgan (for http status logging),
body-parser (self explanatory),
bcrypt (password hashing),
cookie-session (cookie encryption)

### express_server.js
This file is divided up by comments into 3 components: Server Setup, Useful Functions and Handlers. The Handlers section is further divided into 2 parts, 1 for Login and Registration and the other for the URL Features. Comments found throughout the script roughly outline the purpose of various objects and handlers.

### EJS templates
In all there are 7 templates. error.ejs, login.ejs, register.ejs and partials/\_header.ejs are self-explanatory. urls_index.ejs lists the short urls created by a particular user. urls_new.ejs is where a new short url can be generated given a long url. urls_show.ejs is where a user can edit one of their short urls.

