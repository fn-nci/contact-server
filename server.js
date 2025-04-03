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
const PORT = process.env.PORT || 8443;
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
    // Create HTTP server for internal use
    const httpServer = app.listen(8080, () => {
      console.log(`HTTP server running on port 8080`);
    });
    
    // Create HTTPS server
    try {
      console.log('Attempting to set up HTTPS server...');
      console.log('Checking for certificate files:');
      console.log('Private key exists:', fs.existsSync('/privatekey.pem'));
      console.log('Certificate exists:', fs.existsSync('/server.crt'));
      
      if (!fs.existsSync('/privatekey.pem') || !fs.existsSync('/server.crt')) {
        throw new Error('Certificate files not found at expected paths');
      }
      
      // Read the files and log the first few characters to debug
      const keyContent = fs.readFileSync('/privatekey.pem', 'utf8');
      const certContent = fs.readFileSync('/server.crt', 'utf8');
      
      console.log('Private key starts with:', keyContent.substring(0, 50));
      console.log('Certificate starts with:', certContent.substring(0, 50));
      
      const httpsOptions = {
        key: keyContent,
        cert: certContent
      };
      
      console.log('SSL certificate files loaded successfully');
      
      const httpsServer = https.createServer(httpsOptions, app).listen(8443, '0.0.0.0', () => {
        console.log(`HTTPS server running on port 8443`);
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
      console.error('Failed to start HTTPS server:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      // Fall back to HTTP only in case of HTTPS setup failure
    }
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
  });

module.exports = app;
