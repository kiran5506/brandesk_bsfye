FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Production environment
ENV NODE_ENV=production

# Do NOT hardcode secrets in the Dockerfile. Use build args or pass
# credentials at runtime (docker run -e ...) or via your orchestration
# platform. The following are placeholders / build args only.

# Build-time defaults (can be overridden at build time)
ARG AWS_REGION=us-east-1
ARG AWS_S3_BUCKET=bsfye-bucket
ARG BASE_URL=https://bsfye-bucket.s3.us-east-1.amazonaws.com/

# Expose values as environment variables in the container. AWS credentials
# must NOT be stored in the image.
ENV AWS_REGION=$AWS_REGION
ENV AWS_S3_BUCKET=$AWS_S3_BUCKET
ENV BASE_URL=$BASE_URL

# Default port used by the application
ENV PORT=4000

EXPOSE 4000

CMD ["node", "src/index.js"]