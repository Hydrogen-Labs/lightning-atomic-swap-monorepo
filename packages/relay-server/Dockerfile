# Stage 1: Base dependencies
FROM node:18 AS base

WORKDIR /app

# Enable Corepack for Yarn 3
RUN corepack enable

# Copy the Yarn configuration files and package.json
COPY package.json yarn.lock ./
COPY .yarnrc.yml ./
COPY .yarn ./.yarn

# Copy all workspace packages
COPY packages/relay-server/ ./packages/relay-server
COPY packages/shared/ ./packages/shared

# Install dependencies
RUN yarn install

# Build the relay-server
WORKDIR /app/packages/relay-server
RUN yarn build

# Stage 2: Production
FROM node:18-slim AS production

WORKDIR /app

# Enable Corepack for Yarn 3
RUN corepack enable

# Install development libraries
RUN apt-get update && apt-get install -y

# Copy the package files from the base stage
COPY --from=base /app/package.json /app/yarn.lock ./
COPY --from=base /app/.yarn ./.yarn
COPY --from=base /app/.yarnrc.yml ./
COPY --from=base /app/packages/relay-server ./packages/relay-server
COPY --from=base /app/packages/shared ./packages/shared
COPY --from=base /app/node_modules ./node_modules

# Expose the necessary port
EXPOSE 3004

# Define environment variables
ENV PORT=3004
ENV NODE_ENV=production

# Run the transpiled app
WORKDIR /app/packages/relay-server
CMD ["yarn", "start"]
