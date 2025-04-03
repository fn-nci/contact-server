/**
 * HTTPS Server Configuration Helper
 * This file exports a function that sets up an HTTPS server using the provided Express app
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

/**
 * Sets up the HTTPS server for the Express app
 * @param {Object} app - Express application
 * @param {number} port - HTTPS port to listen on
 * @returns {Object} HTTPS server instance
 */
function setupHttpsServer(app, port = 8444) {
  try {
    console.log('Setting up HTTPS server...');
    
    // Default paths for certificate files
    const certPath = process.env.SSL_CERT_PATH || '/server.crt';
    const keyPath = process.env.SSL_KEY_PATH || '/privatekey.pem';
    
    console.log(`Using certificate: ${certPath}`);
    console.log(`Using private key: ${keyPath}`);
    
    // Check if the certificate files exist
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      console.error('SSL certificate files not found!');
      console.error(`Certificate path: ${certPath}`);
      console.error(`Key path: ${keyPath}`);
      
      // If in development, we could generate self-signed certs
      if (process.env.NODE_ENV !== 'production') {
        console.log('Using default self-signed certificate for development');
        // Simple self-signed cert just for development testing
        const options = {
          key: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDFc7XiPE3anu9U
MDRO2m7EZnHg/X0JQWgYQXgQcMEOzcK2Ajb7+45XMbBH5WnqQkGr2Q2GtZ+k1Hvt
Mj7/O7TbSEwzAHqDHr1DL8eL9Hq2ptgCQp6Cf3xF+eDtFCRUkuOS0KlUDVCZU7Z8
G2QD0eBQXrW0gkrzwz9PEDkjOUpky4ztDoPof1GzIW290x4L7FG0QkIbhfOk+AYp
g8Z0CrEQPYR76Q/T4CJLyBYyMKK0UEb7JJi+DFxQtHzLJ6bArQypFAz2WPaLhOlJ
gUWbp4YbWVKAVbKxXJiqaJDXUMZ4gTi5WDGfJn9kjNJDx9Ry/ScFMcx34K3MxFv8
5LXHr2j9AgMBAAECggEATJGQpQ8UeMXqYQPUu2ZtYyjNiGXYR9XBDkcP9Q2SM6n6
FcSWS1s+Ctw0kBuJJxIqwP5reOhyHSJJdNqg+AwgPiKb4JWpXBc3aHVewO+dJYYi
PeXM6O1D0xKiGgKaLxkxugX4HuJz7Muu97p0XmA31Gzb+QdI9SAjbLlQAZJJLbRv
qVL6mU8FcG0fPQxep/FQU7FBAFdYXvHDBHOI5epMWKyRm4/NKB95JF+OC0XsEBN+
FtNPKLz8NZq5bpWGFFG1sghPHiGxADRXbtLkCK/Q0atqvZchhnz5cSzFDMEVITKY
+MjMG903cZZU/x0DbUYqQ/xB3oMwsR7xMH9UQjDfUQKBgQDlWNGg4fjhBmMxHRr6
JNAf5HbIGLQFPIhiOlm8qZm4JGRv5cmoAMVLGLr5P1+m6UOjJYu8QvXG7E87+V/7
VYNNUn0itKkLJpUEGRjtWUgMKQfx2TsD5h4cxFZ3mN2imzv7NAVMzuXu1cdGnF8u
A8lXuZ4RCQQXTUOp5MXvUyF8sQKBgQDcaBK3YMfUlNmTUxQsHraMCJH9YTBCyfaR
US3MsOLA9/DiF6hcX5Xl3VEIH3Vn9iYUUjzYPqP5LQOgvU/xl+QdsFT8p/g0yYfg
1Vh1JaxIx9mPhRKpMBMDe9nHNL5CvB8JpIejWzGtOx7W6Qpb7IIRoL6RZ3jJ/Klk
ZXAFWlx5vQKBgQDVMq8Hs2Dw8T0XQoWs1uK+uNveIBhS4dMYoFIj1wHbggKBpwZs
r/Rho80sEZwbjtUYLQG0mRinLD8Sg3zaRxU9rlGWMvLVke7OYpvvKCQdm7Y5sPDl
XSUKdFVfY5ZzS+z3eUQBxBcJzbJNcPbPGKDWGuXU1yrZQaU9LMIkxM4EEQKBgQCp
UARz2rDe/uV4UqnNCipVTYUTpkGMIg8q48Emn3/69TTB9FjMVpoU0jqJUKoR0V1u
7hDnPMJ/cUJK8kVzlN25pZRlveJpOh/RCW+Zu8uqOHOxUEwPN6lK7jkA6uAPW1J3
jxM1/GpJBUBJ47SovsQe4XTnxSRuuUfGFZKRQB80mQKBgBpllmNUrV6MoIj7Lra0
0yRJ3QaL8ToYUb9gOPRjyh5AJJAQaJnDImJqLDSYg56MhfwEJNdbIj6QF7Ffc35E
JF12huKyXuOcgOYPXlnMOBYIrSHsQayDrGSo94s1SrlC/1H9uBHECvLBHEQ6iLRK
ueK7H7BQnwYqWgT5FfVSjngn
-----END PRIVATE KEY-----`,
          cert: `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIJAL95WG5pRgEPMA0GCSqGSIb3DQEBCwUAMEwxCzAJBgNV
BAYTAlVTMRMwEQYDVQQIDApDYWxpZm9ybmlhMRYwFAYDVQQHDA1TYW4gRnJhbmNp
c2NvMRAwDgYDVQQKDAdDb250YWN0MB4XDTIzMDQwMTAwMDAwMFoXDTMzMDQwMTAw
MDAwMFowTDELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFjAUBgNV
BAcMDVNhbiBGcmFuY2lzY28xEDAOBgNVBAoMB0NvbnRhY3QwggEiMA0GCSqGSIb3
DQEBAQUAA4IBDwAwggEKAoIBAQDFc7XiPE3anu9UMDRO2m7EZnHg/X0JQWgYQXgQ
cMEOzcK2Ajb7+45XMbBH5WnqQkGr2Q2GtZ+k1HvtMj7/O7TbSEwzAHqDHr1DL8eL
9Hq2ptgCQp6Cf3xF+eDtFCRUkuOS0KlUDVCZU7Z8G2QD0eBQXrW0gkrzwz9PEDkj
OUpky4ztDoPof1GzIW290x4L7FG0QkIbhfOk+AYpg8Z0CrEQPYR76Q/T4CJLyBYy
MKK0UEb7JJi+DFxQtHzLJ6bArQypFAz2WPaLhOlJgUWbp4YbWVKAVbKxXJiqaJDX
UMZ4gTi5WDGfJn9kjNJDx9Ry/ScFMcx34K3MxFv85LXHr2j9AgMBAAGjUzBRMB0G
A1UdDgQWBBQjQ5aDLD9jUu4fFHZwMFqWRK7ePDAfBgNVHSMEGDAWgBQjQ5aDLD9j
Uu4fFHZwMFqWRK7ePDAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IB
AQBxO0A1pVrcTmTXQiAQ4tBLxPCY/zGtrpKQB/PqG+aJ3QFqmwz2qnle06bKF5zK
5TG9F/JQB3CCK4KKMT3NQ7ckL95Ff5QBhVMvHLXXJ73eYVUUGaFu3hV9+3xz9FTX
k0OVRTXWcbOcbgMC1TGZNl1GJh5ryXuK6J5RDtYHZBjgR7dPcyWwrppDq1csFHfM
TxZDWEU5OUlApWAxZlHCAgMvzG1LK9xDZL38F5RP2kIQRXaXG5jZVBLn0ISr7Kfr
NfJ1an+s4JqU5u+5ml60cVJ0/I0/erBxi+8J7MXcGKZUuZMhO5D5wfHYJZQRVfU5
AUgI9NdJDJA7sQoDUnZkG5hT
-----END CERTIFICATE-----`
        };
        return https.createServer(options, app).listen(port, () => {
          console.log(`HTTPS server started on port ${port} with self-signed certificate`);
        });
      } else {
        console.error('SSL certificate files not found in production environment!');
        process.exit(1);
      }
    }
    
    // Create HTTPS server with the certificate files
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    
    return https.createServer(options, app).listen(port, () => {
      console.log(`HTTPS server started on port ${port}`);
    });
  } catch (error) {
    console.error('Error setting up HTTPS server:', error);
    throw error;
  }
}

module.exports = setupHttpsServer; 