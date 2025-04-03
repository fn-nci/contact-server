# syntax=docker/dockerfile:1

#set the base image for the container
FROM node:20.17.0-slim

#set environment variable to production
ENV NODE_ENV=production

#set working directory just to be safe
WORKDIR /contact-server

# make sure user is root to run groupadd
USER root

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

# Expose ports the app will run on
EXPOSE 8443

#default command to run on startup
CMD [ "npm", "start" ]

