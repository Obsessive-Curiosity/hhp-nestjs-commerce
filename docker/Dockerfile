# Development Stage
FROM node:20-alpine AS dev

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@8.12.0 --activate

WORKDIR /app

# root일 때 소유권 변경
RUN chown -R node:node /app

# 그 다음 user 전환
USER node

# 의존성 설치
COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN pnpm install

# 소스 코드 복사
COPY --chown=node:node . .

# dist 디렉토리 생성 (이미 node 유저이므로 자동으로 node 소유)
RUN mkdir -p /app/dist

EXPOSE 3000

CMD ["pnpm", "start:dev"]