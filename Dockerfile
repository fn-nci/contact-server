# syntax=docker/dockerfile:1

#set the base image for the container
FROM node:20.17.0-slim

#set environment variable to production
ENV NODE_ENV=production

#set working directory just to be safe
WORKDIR /contact-server

# make sure user is root to run groupadd
USER root

# Install basic utilities and dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
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

# Clear npm cache and install dependencies 
RUN npm cache clean --force && \
    npm install --production --no-cache

# Copy only necessary files (excluding .git, node_modules, etc.)
COPY --chown=nodeuser:nodeuser . .

# Add a simple health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expose ports the app will run on
EXPOSE 8080 8444

#default command to run on startup
CMD [ "npm", "start" ]


