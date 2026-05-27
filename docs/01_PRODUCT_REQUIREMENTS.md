# Product Requirements Document (PRD)

# Product Name

DermAI Assistant

---

# Product Vision

Create a modern AI-powered dermatology support assistant capable of:
- analyzing skin images
- explaining results conversationally
- supporting follow-up questions
- maintaining session continuity

The system should prioritize:
- usability
- safety
- explainability
- responsive design

---

# Target Users

## Primary Users
- students
- researchers
- demo evaluators
- academic reviewers

## Secondary Users
- general users seeking educational assistance

---

# Core User Flow

User uploads image
↓
DermLIP analyzes image
↓
Top-K dermatology concepts generated
↓
Gemini explains results
↓
User asks follow-up questions
↓
Conversation continues in session memory

---

# Functional Requirements

## Image Upload
- support JPG, JPEG, PNG
- preview uploaded image
- drag-and-drop upload
- mobile compatible

---

## DermLIP Inference
- preprocess image to 224x224
- use prompt-bank similarity scoring
- generate top-k results
- generate confidence bands

---

## Gemini Integration
- receive image + structured predictions
- generate simplified explanation
- maintain conversational continuity
- ask contextual follow-up questions

---

## Session Memory
- preserve conversation history
- preserve image history
- allow reopening sessions
- timestamp sessions

---

## UI Requirements
- responsive design
- modern medical-style UI
- smooth loading states
- accessible layout
- desktop + mobile support

---

# Non-Functional Requirements

## Performance
- low latency
- optimized fp16 inference
- responsive UI feedback

---

## Reliability
- graceful error handling
- recoverable session flow
- deterministic backend structure

---

## Maintainability
- modular architecture
- reusable components
- documented APIs

---

# Safety Requirements

The system must:
- avoid medical certainty
- preserve disclaimers
- communicate uncertainty
- avoid unsafe treatment instructions

---

# Constraints

- free-tier friendly
- no authentication for MVP
- local session storage acceptable
- academic/demo oriented

---

# MVP Definitions

## MVP 1
- upload image
- analyze image
- Gemini explanation
- single-session chat

---

## MVP 2
- session memory
- image history
- multi-session support

---

## MVP 3
- polished UI
- benchmarking
- deployment readiness
- evaluation dashboard