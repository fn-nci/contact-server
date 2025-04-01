# syntax=docker/dockerfile:1

#set the base image for the container
FROM circleci/node:10.16.3

#set environment variable to production
ENV NODE_ENV=production

# create a non-root user to get around permissions on sqlite3 install
RUN groupadd -r nodeuser && useradd -r -g nodeuser -m nodeuser

# change the user to the non-root user we just created to run the rest of the commands
USER nodeuser

#copy the package.json and package-lock.json from host machine to the container's working directory
COPY ["package.json", "package-lock.json*", "./"]

#install dependencies inside container as none root user so taking out the sudo
RUN npm install

#copy all content from current directory on host machine to the container
COPY . .

#default command to run on startup
CMD [ "npm", "start" ]


