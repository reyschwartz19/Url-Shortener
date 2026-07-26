FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm install
RUN npx prisma generate

COPY . .

RUN npm run build
RUN mkdir -p dist/generated && cp -r generated/prisma dist/generated/prisma

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 3000
ENTRYPOINT [ "./entrypoint.sh" ]