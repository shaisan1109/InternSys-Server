# Step 1: Use a Node.js base image
FROM node:18-alpine

# Step 2: Set the working directory
WORKDIR /app

# Step 3: Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Step 4: Copy the rest of the project files
COPY . .

# Step 5: Expose port 8080
EXPOSE 8080

# Step 6: Start the Node.js application
CMD ["npm", "start"]
