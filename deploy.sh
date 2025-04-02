#!/usr/bin/env bash
# check if there is instance running with the image name we are deploying
CURRENT_INSTANCE=$(docker ps -a -q --filter ancestor="$IMAGE_NAME" --format="{{.ID}}")

#if an instance does exist stop the instance
if [ "$CURRENT_INSTANCE"]
then
  docker rm $(docker stop $CURRENT_INSTANCE)
fi

#pull down the instance from dockerhub
docker pull $IMAGE_NAME

#check if a docker container exists with the name of node_app if it does remove the container
CONTAINER_EXISTS=$(docker ps -a | grep $CONTAINER_NAME)
if [ "$CONTAINER_EXISTS" ]
then
  docker rm node_app
fi

#create a container called node_app that is available on port 8444 from our docker image
docker create -p 80:8080 -p 8443:8444 --name $CONTAINER_NAME $IMAGE_NAME
#write the private key to a file
echo $PRIVATE_KEY > privatekey.pem
#write the server key to a file
echo $SERVER > server.crt
#add the private key to the node_app docker container
docker cp ./privatekey.pem $CONTAINER_NAME:/privatekey.pem
#add the server key to the node_app docker container
docker cp ./server.crt $CONTAINER_NAME:/server.crt
#start the node_app container
docker start $CONTAINER_NAME
