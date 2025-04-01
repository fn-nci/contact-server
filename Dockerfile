# syntax=docker/dockerfile:1

#set the base image for the container
FROM circleci/node:10.16.3

#set environment variable to production
ENV NODE_ENV=production

#copy the package.json and package-lock.json from host machine to the container's working directory
COPY ["package.json", "package-lock.json*", "./"]

#install dependencies inside container
RUN npm install

#copy all content from current directory on host machine to the container
COPY . .

#default command to run on startup
CMD [ "npm", "start" ]