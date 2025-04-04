# syntax=docker/dockerfile:1

#set the base image for the container
FROM node:20.17.0-slim

#set environment variable to production
ENV NODE_ENV=production

#set working directory just to be safe
WORKDIR /contact-server

# make sure user is root to run groupadd
USER root

# Install only essential dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# create a non-root user to get around permissions on sqlite3 install
RUN groupadd -r nodeuser && useradd -r -g nodeuser -m nodeuser

#copy the package.json and package-lock.json from host machine to the container's working directory
#before changing the user to non-root
COPY package.json package-lock.json* ./

# having root user set ownership of app directory before switching
RUN chown -R nodeuser:nodeuser /contact-server 

# change the user to the non-root user we just created to run the rest of the commands
USER nodeuser

#install dependencies inside container as none root user so taking out the sudo
RUN npm install --production

# Copy only necessary files (excluding .git, node_modules, etc.)
COPY --chown=nodeuser:nodeuser . .

# Create self-signed certificates
USER root
RUN mkdir -p /contact-server/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /contact-server/certs/privatekey.pem -out /contact-server/certs/server.crt \
    -subj "/CN=localhost" && \
    chmod 644 /contact-server/certs/privatekey.pem /contact-server/certs/server.crt && \
    chown nodeuser:nodeuser /contact-server/certs/privatekey.pem /contact-server/certs/server.crt && \
    chmod 755 /contact-server/certs

# Switch back to nodeuser for running the application
USER nodeuser

# Expose ports the app will run on
EXPOSE 8080 8444

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

#default command to run on startup
CMD [ "npm", "start" ]

