#frontend/Dockerfile

#step 1 build React
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./

#install dependecies
RUN npm install

COPY . .

RUN npm run build

#step 2 serve with Nginx
FROM nginx:alpine

#copy files from build stage
COPY --from=builder ./app/dist /usr/share/nginx/html

#config copy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD [ "nginx", "-g", "daemon off;" ]