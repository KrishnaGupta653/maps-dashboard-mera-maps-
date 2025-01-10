FROM node:18-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json*  ./
RUN npm install


# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# This will do the trick, use the corresponding env file for each environment.


ENV NODE_ENV=production


ARG GOOGLE_CLOUD_PROJECT
ENV GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT}

ARG NEXT_PUBLIC_MAP_ID
ENV NEXT_PUBLIC_MAP_ID=${NEXT_PUBLIC_MAP_ID}

ARG NEXT_PUBLIC_SUCHNAVALI_BASE_URL
ENV NEXT_PUBLIC_SUCHNAVALI_BASE_URL=${NEXT_PUBLIC_SUCHNAVALI_BASE_URL}

ARG NEXT_PUBLIC_MAPS_API_KEY
ENV NEXT_PUBLIC_MAPS_API_KEY=${NEXT_PUBLIC_MAPS_API_KEY}

RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app




RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public




EXPOSE 80

ENV PORT=80

CMD ["npm", "run", "start"]