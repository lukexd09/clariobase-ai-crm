# Project Context

## Business context

ClarioBase is a small service business focused on helping local companies improve their online presence, generate more inquiries and measure results. The initial target market is local beauty and service businesses in Upper Silesia.

The project already has a lead harvester that collects and enriches potential leads. The next need is an operational CRM that can support the full process from raw lead to client.

## Problem

A generic CRM is too broad for the current stage. The business needs a focused tool that supports:

- lead review,
- qualification,
- scoring,
- mini-audit preparation,
- outreach planning,
- follow-up discipline,
- pipeline visibility,
- structured collaboration with ChatGPT through files.

## Strategic assumption

The first version should not use external AI APIs. The user already has a ChatGPT subscription and wants to manually exchange files with ChatGPT. The CRM should therefore generate structured files for AI analysis and import structured AI responses after manual approval.

## Operating model

```text
Harvester
  ↓
PostgreSQL
  ↓
CRM UI
  ↓
AI exchange files
  ↓
ChatGPT manual analysis
  ↓
AI response files
  ↓
CRM import preview
  ↓
User approval
  ↓
CRM updates
```

## Long-term ambition

The solution starts as a self-hosted internal CRM for ClarioBase. Later it should support UGC outreach for the user's wife. If both use cases work, it may evolve into a productized AI-assisted CRM for small service businesses and creators.
