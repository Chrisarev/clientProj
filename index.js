if(process.env.NODE_ENV !== "production"){
    require('dotenv').config(); 
} ///environment variable that is either in dev or production mode

const express = require('express') 
const path = require('path') 
const mongoose = require('mongoose'); ///connection between JS and mongodb
const ejsMate = require('ejs-mate'); ///allows basic boilerplate
const methodOverride = require('method-override');///allows http verbs other than POST/GET in forms 
const Comment = require('./models/comment')
const catchAsync = require('./utils/catchAsync')
const ExpressError = require('./utils/ExpressError')

//const catchAsync = require('./utils/catchAsync.js')
//const ExpressError = require('./utils/ExpressError')
const mongoSanitize = require('express-mongo-sanitize'); ///for preventing mongo injection
const { sendStatus } = require('express/lib/response');
//const ContactInfo = require('./models/contactInfo') //require mongoose model campground.js

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/';
mongoose.connect(dbUrl, {
    useNewUrlParser:true,
    useUnifiedTopology:true,
    
});///creates db yelp-camp(or connects to it if already made)

const db = mongoose.connection; 
db.on("error", console.error.bind(console, "connection error:")); 
db.once("open", () => {
    console.log("Database Connected")
});///checks to see if connected and handles db connection error

const app = express(); ///starts express app 

//app.engine('ejs', ejsMate); ///allows basic boilerplate
app.engine('ejs', ejsMate); ///allows basic boilerplate
app.set('view engine', 'ejs');  ///sets view engine to ejs 
app.set('views', path.join(__dirname, 'views')) ///so we can run app.js from outside of yelpcamp folder 

/*** HTTP -> HTTPS IN ORDER TO USE SSL CERTIFICATE ***/
app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`)
    } else {
      next();
    }
});

app.use(express.static(path.join(__dirname, 'public'))); 
app.use(express.urlencoded({extended:true})) ///allows us to get req.params 
app.use(methodOverride('_method')) ///allows requests other than get/post thru forms 
app.use(mongoSanitize()) ///prevents users from inputting characters that could result in mongo injection
/*app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });  */

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

app.get('/', async (req,res) =>{
    const comments = await Comment.find().sort({ _id: -1 }).limit(10); ///gets 10 latest posts
    console.log(comments);
    res.render('home2', {comments})
    /*res.render('home')*/
})

app.get('/statement', (req,res) =>{
    res.render('statement')
})

app.post('/comment', async (req,res) =>{
    const userComment = new Comment(req.body.comment); 
    await userComment.save(); 
    console.log(userComment);
    res.redirect('/')
})

/*app.get('/delete', async (req,res) =>{
    await Comment.deleteMany({}); 
    res.render('statement'); 
})
*/

app.get('/delCom', async (req,res) =>{
    const comments = await Comment.find().sort({ _id: -1 }).limit(10); ///gets 10 latest posts
    res.render('delCom', {comments})
})

app.post('/deleteComment', async( req,res) =>{
    
    res.redirect('/home')
})

app.all('*', (req,res,next) => { ///runs for all unrecognized urls 
    next(new ExpressError('Page Not Found', 404))
    ///passes ExpressError into err param for app.use
})

///this runs if catchAsync catches error and calls next() OR if next(new ExpressError) gets called OR if validation error 
app.use((err,req,res,next) => { 
    const {status = 500} = err; ///gets status and message from ExpressError passed as err, else set defaults
    if(!err.message) err.message = 'Something went wrong!' ///if no error message, set default 
    res.status(status).render('error',{err})
    ///sets response status property to status passed in and renders error template 
})

///listen on heroku specified port or 3000 in dev environment 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>{ 
    console.log(`Serving on port ${PORT}`)
})
