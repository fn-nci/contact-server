const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 4000;
const csrfProtection = csrf({ cookie: true });  // initialize CSRF protection middleware w/ cookie-based tokens

//allow requests from frontend and allow cookies
const corsOptions = {
  origin: 'https://34.241.85.158:8443', //specify url where frontend deployed
  credentials: true, //allow cookies (incl. CSRF tokens) to be sent with requests
};

//middleware
app.disable('x-powered-by');
app.use(morgan('dev'));
app.use(cors(corsOptions)); // enable CORS with the specified options
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(csrfProtection);  // add CSRF protection globally

//security headers
app.use((req, res, next) => {
  //strict transport security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');  
  //content security policy (CSP)
  res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  //xcontent-type-options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  //permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), clipboard-read=(), clipboard-write=(), fullscreen=(), payment=(), interest-cohort=()');
  //x-frame-options
  res.setHeader('X-Frame-Options', 'DENY');
  //cache control
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  next();
});


//middleware to set XSRF-TOKEN cookie w/ each response
app.use(function (req, res, next) {
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
      secure: process.env.NODE_ENV === 'production',  //set secure cookies in production only
      httpOnly: true,  //cookies can't be accessed by JavaScript (client-side)
      sameSite: 'lax', //ensure  cookie is sent with cross-origin requests
  });
  res.locals.csrftoken = req.csrfToken(); //make CSRF token available in templates, if needed
  next();
});

//routes
app.use('/contacts', require('./routes/contacts'));

// Health check endpoint for monitoring and testing
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Service is running',
    timestamp: new Date().toISOString()
  });
});

//error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// start server
db.initDatabase()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });
    
    app.close = function(callback) {
      server.close(callback);
    };
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
  });

module.exports = app;
