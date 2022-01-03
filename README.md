# Github Visualisation Project
## To install:
### Prerequisites:
Docker
### Installation:
Locate Downloaded source files in terminal

Run 'docker build -t sample:dev .' to build the docker image

Run 'docker run -it --rm -v ${PWD}:/app -v /app/node_modules -p 3001:3000 -e CHOKIDAR_USEPOLLING=true sample:dev'

After the docker container is setup and running, go to localhost:3001 on any browser to view visualisation page

## Frameworks Used:
* React js
* Nivo Graphing framework
