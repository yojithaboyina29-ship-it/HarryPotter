# AI Usage Documentation

This document details how AI/LLM technology is integrated into the Hogwarts Portal.

## AI Model

- **Primary**: Gemma 3 (4B parameters) via Ollama
- **Runtime**: Ollama (local inference, no cloud API)
- **Fallback**: Template-based system when Ollama is unavailable

## AI-Powered Features

### 1. Sorting Ceremony (Adaptive Quiz)
- **What it does**: Generates personalized sorting questions based on previous answers
- **How it works**: Each answer is sent to the LLM with context, which generates the next question exploring different character traits
- **Final sorting**: LLM analyzes all 5 answers against house traits and generates a dramatic "hat speech"
- **Fallback**: 10 pre-written template questions with weighted scoring system
- **Validation**: Backend validates LLM output is proper JSON with correct house names

### 2. Schedule Generation
- **What it does**: Creates a personalized weekly Hogwarts timetable
- **Input**: User's house and selected interests/subject preferences
- **Output**: Structured weekly schedule with classes, study periods, and clubs
- **Fallback**: Pre-built template schedule

### 3. Owl Post Letter Styling
- **What it does**: Rewrites user-drafted letters in a "magical" tone
- **How it works**: Original text is sent to LLM with a prompt to add wizard terminology and magical flair
- **User control**: Optional — users can send letters unstyled or preview the styled version first
- **Fallback**: Original text is used if LLM is unavailable

## What AI Does NOT Control

- **Points system**: All point calculations are deterministic code in the backend
- **Authentication**: Standard bcrypt + JWT, no AI involvement
- **Forum moderation**: Uses rule-based profanity filter (bad-words package), not LLM
- **Database operations**: All CRUD is standard backend code

## AI-Generated Code

This project was developed with AI coding assistance. The AI was used to:
- Generate boilerplate code and project scaffolding
- Write component templates and API route handlers
- Assist with Tailwind CSS styling decisions
- Generate fallback sorting questions content

All AI-generated code was reviewed, understood, and modified by team members.
