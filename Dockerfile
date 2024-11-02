FROM node:19.5.0-bullseye

# Устанавливаем необходимые системные зависимости
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем только файлы, необходимые для установки зависимостей
COPY package*.json ./

# Устанавливаем зависимости с явным указанием холостого запуска для canvas
RUN npm install --build-from-source

# Копируем файлы Prisma
COPY prisma ./prisma/

# Генерируем Prisma client
RUN npx prisma generate

# Копируем остальные файлы проекта
COPY . .

EXPOSE 3000

# Запускаем приложение
CMD [ "npm", "start" ]