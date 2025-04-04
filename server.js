const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const path = require('path');
const db = require('./database');
const https = require('https');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8444;
const csrfProtection = csrf({ cookie: true });  // initialize CSRF protection middleware w/ cookie-based tokens

//allow requests from frontend and allow cookies
const corsOptions = {
  origin: 'https://34.241.85.158:8444', // updated port
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
    // Create HTTP server for internal use
    const httpServer = app.listen(8080, () => {
      console.log(`HTTP server running on port 8080`);
    });
    
    // Create HTTPS server
    try {
      console.log('Setting up HTTPS server...');
      
      // Define certificate file paths
      const keyPath = '/contact-server/certs/privatekey.pem';
      const certPath = '/contact-server/certs/server.crt';
      
      // Read certificate files
      const keyContent = fs.readFileSync(keyPath, 'utf8');
      const certContent = fs.readFileSync(certPath, 'utf8');
      
      const httpsOptions = {
        key: keyContent,
        cert: certContent
      };
      
      const httpsServer = https.createServer(httpsOptions, app).listen(8444, '0.0.0.0', () => {
        console.log(`HTTPS server running on port 8444`);
      });
      
      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing servers');
        httpServer.close(() => console.log('HTTP server closed'));
        httpsServer.close(() => console.log('HTTPS server closed'));
      });
      
      app.close = function(callback) {
        httpServer.close(() => {
          httpsServer.close(callback);
        });
      };
    } catch (error) {
      console.error('Failed to start HTTPS server:', error.message);
    }
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
  });

module.exports = app;
