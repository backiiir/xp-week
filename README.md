# XP - Week <!-- omit in toc -->

- [Parts](#parts)
  - [Frontend](#frontend)
  - [Common](#common)
  - [Backend](#backend)
    - [Config](#config)

## Parts

This is a monorepository that uses PNPM. With PNPM installed all project/workspace dependencies can be installed via:

```bash
pnpm i
```

Short command to start development on linux based machines:

```bash
pnpm dev
```

### Frontend

Uses [Vue](https://vuejs.org/) Framework and [capacitor](https://capacitorjs.com/) for native functionality. Start development:

```bash
pnpm run frontend
# or shorter
pnpm f
```

### Common

The common folder/project is referenced in the .tsconfig files of other projects. Contains typescript files that can be used both in frontend and backend.

### Backend

Uses [NestJs](https://nestjs.com/) Framework. Start development:

```bash
pnpm run backend
# or shorter
pnpm b
```

#### Config

There are config files located at `./backend/config`. Variables in the format `${PROCESS_ENV}` will be replaced with the environment variable set on the system. By default nest.js will load an `.env` file located at `./backend` - the projects root.
