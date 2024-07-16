# Workflow Node

Привет! Добро пожаловать в мой проект **Workflow Node**.
Это бэкенд от общего проекта **Workflow Node React**.

## О проекте

Этот проект — это серверное приложение, построенное на базе `NestJS` и `TypeScript`.

## Зависимости

### Основные

- `@nestjs-modules/mailer`, `nodemailer`: Модуль для отправки писем. Уведомления и всякие такие штуки.
- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/platform-socket.io`, `@nestjs/websockets`:
  Основные модули NestJS. Без них никуда.
- `@nestjs/mongoose`, `mongoose`: Интеграция с MongoDB через Mongoose. Храним данные как профи.
- `@types/bcrypt` и `bcrypt`: Хэширование паролей. Безопасность превыше всего.
- `class-transformer` и `class-validator`: Валидация и трансформация данных. Держим данные в порядке.
- `handlebars`: Шаблонизатор для писем. Красивые письма — это важно.
- `reflect-metadata`: Декораторы для TypeScript. Удобно и красиво.

### DevDependencies

- `@nestjs/cli`: CLI для NestJS. Упрощает разработку.
- `@types/express`: Типы для Express. TypeScript нас любит.
- `@types/node`: Типы для Node.js.
- `@types/nodemailer`: Типы для Nodemailer.
- `prettier`, `eslint`, `eslint-config-prettier` и `eslint-plugin-prettier`: Prettier и ESLint. Красивый код — это
  важно.
- `@typescript-eslint/eslint-plugin` и `@typescript-eslint/parser`: ESLint для TypeScript.
- `source-map-support`: Поддержка source maps. Удобно для отладки.
- `ts-loader`: Загрузчик для TypeScript. Сборка проекта.
- `ts-node`: Запуск TypeScript кода.
- `tsconfig-paths`: Поддержка путей из tsconfig. Удобно для импорта модулей.
- `typescript`: Сам TypeScript. Мастхев однозначно.

## Структура проекта

- `src`: Основной исходный код приложения.
    - `main.ts`: Точка входа в приложение.
    - `workflows`: Модуль для работы с workflow.
    - `dto-schemas-interfaces`: DTO, схемы и интерфейсы.
    - `mail`: Шаблоны и логика для отправки писем.
    - `services`: Различные сервисы для работы приложения.

## Заключение

Надеюсь, это описание поможет вам разобраться в проекте. Если будут вопросы, не стесняйтесь спрашивать! 🚀

*Приглашения на работу рассматриваются **в первую очередь** :)*