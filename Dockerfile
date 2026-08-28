# Builds and serves the Team Shoutout Board frontend as a static bundle.
# The Supabase Edge Function is deployed separately via `supabase functions
# deploy` (see docs/ARCHITECTURE_AND_SETUP.md §4). It is not containerized
# here, since it runs on Supabase's own edge runtime, not this image.
#
# VITE_* values are build-time only (Vite inlines them into the static
# bundle). Pass them as --build-arg, never bake real secrets into the
# image. None of them are secrets: VITE_SUPABASE_ANON_KEY is the public,
# RLS-scoped anon key, safe to ship in a client bundle.
#
# Build:
#   docker build \
#     --build-arg VITE_SUPABASE_URL=https://<project-ref>.supabase.co \
#     --build-arg VITE_SUPABASE_ANON_KEY=<anon-key> \
#     --build-arg VITE_SUPABASE_FUNCTIONS_URL=https://<project-ref>.supabase.co/functions/v1 \
#     -t team-shoutout-board .
# Run:
#   docker run --rm -p 8080:80 team-shoutout-board

FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_FUNCTIONS_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_SUPABASE_FUNCTIONS_URL=$VITE_SUPABASE_FUNCTIONS_URL

RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
