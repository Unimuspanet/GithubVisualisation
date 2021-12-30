# pull official base image
FROM node:13.12.0-alpine

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install --silent
RUN npm install react-scripts@3.4.1 -g --silent
RUN npm install @nivo/core@0.72.0 @nivo/calendar@0.72.0 @nivo/pie@0.72.0

# add app
COPY . ./

# start app
CMD ["npm", "start"]
