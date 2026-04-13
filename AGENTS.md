# AGENTS.md

## Project Goal
Build a mobile-first personal accounting app for Chinese-speaking users.

## Tech Stack
- Mobile: React Native + Expo + TypeScript
- Backend: NestJS + Prisma + PostgreSQL
- Auth: JWT

## Core Features
- register
- login
- add income and expense
- category management
- dashboard
- monthly reports

## UX Rules
- mobile-first
- simple Chinese UI
- fast transaction entry
- clear income vs expense distinction
- polished empty, loading, and error states

## Backend Rules
- users can only access their own data
- transaction includes amount, type, category, date, note
- validate all inputs
- use REST API
- modular architecture

## Workflow Rules
- first propose plan and file structure
- then implement in small steps
- explain assumptions clearly
- use production-style code