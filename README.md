# Sistema de Matrícula — Teste Prático (CIn-UFPE)

Monorepo com **back-end** (Node.js + Express + Prisma + SQLite) e **front-end** (React + Vite + TypeScript) para o sistema de matrícula descrito no edital do Processo Seletivo · Bolsa de Inovação Tecnológica em Engenharia de Software.

---

## Sumário

- [Visão geral](#visão-geral)
- [Stack e justificativas](#stack-e-justificativas)
- [Como rodar do zero](#como-rodar-do-zero)
- [Usuários e dados iniciais](#usuários-e-dados-iniciais)
- [Requisito extra: pré-requisitos entre disciplinas](#requisito-extra-pré-requisitos-entre-disciplinas)
- [Arquitetura e decisões](#arquitetura-e-decisões)
- [Documentação da API](#documentação-da-api)
- [Regras de negócio implementadas](#regras-de-negócio-implementadas)
- [Testes](#testes)
- [O que ficou de fora / o que eu faria com mais tempo](#o-que-ficou-de-fora--o-que-eu-faria-com-mais-tempo)

---

## Visão geral

Dois perfis de acesso:

- **Secretaria**: cadastra disciplinas e professores, abre turmas e altera vagas.
- **Aluno**: vê as ofertas do semestre, matricula-se, cancela matrículas e
  acompanha o progresso do curso em três grupos de carga horária
  (obrigatórias, eletivas de perfil, eletivas livres).

Existe um único semestre corrente — não há modelagem de períodos letivos nem
turmas de semestres anteriores, conforme o edital.

---

## Stack e justificativas

| Camada    | Tecnologia                              | Por quê |
|-----------|------------------------------------------|---------|
| Back-end  | Node.js + **Express** + TypeScript       | Ecossistema JS/TS (exigência), Express por ser mínimo e explícito — facilita justificar cada decisão na entrevista. TypeScript porque as regras de negócio (progresso, matrícula) se beneficiam de tipos. |
| ORM       | **Prisma**                               | Schema declarativo legível, tipagem forte gerada, migração trivial para Postgres. |
| Banco     | **SQLite** (`file:./dev.db`)             | Zero configuração: roda com `npx prisma db push`, sem servidor externo. Suporta transações ACID (usado na matrícula). Para produção, basta trocar `provider = "postgresql"` e ajustar `DATABASE_URL`. |
| Auth      | **JWT** (`jsonwebtoken`)                 | Stateless, simples de integrar no front, e a "senha é opcional" do edital vira "login só com username" naturalmente. |
| Front-end | **React + Vite + TypeScript**            | Exigência do edital. Vite dá DX rápida; React Router para as rotas por perfil. |
| Testes    | **Jest** (+ `ts-jest`)                   | Testa as funções puras de regra de negócio sem precisar de banco. |

---

## Como rodar do zero

Pré-requisitos: **Node.js 20+** e **npm 10+**.

O repositório é um monorepo simples (duas pastas independentes, cada uma com seu `package.json`). Não é necessário instalar nada globalmente.

### 1) Back-end

```bash
cd backend
npm install
cp .env.example .env          # já contém valores de desenvolvimento
npx prisma db push            # cria backend/prisma/dev.db com o schema
npm run seed                  # popula cursos, disciplinas, alunos, histórico e turmas
npm run dev                   # sobe em http://localhost:3001
```
### 2) Front-end

```bash
cd frontend
npm install
npm run dev                   #sobe em http://localhost:5173
