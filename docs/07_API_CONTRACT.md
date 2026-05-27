# API Contract

# Base URL

```text
/api
```

---

# POST /analyze

Analyze uploaded skin image.

---

## Request

### Content-Type
multipart/form-data

### Body
```text
image: file
```

---

## Response

```json
{
  "session_id": "uuid",
  "prediction": {
    "top_k": [
      {
        "label": "eczema",
        "score": 0.71
      },
      {
        "label": "psoriasis",
        "score": 0.21
      }
    ],
    "confidence": "medium"
  },
  "gemini_response": "The image appears more similar to..."
}
```

---

# POST /chat

Continue conversation in existing session.

---

## Request

```json
{
  "session_id": "uuid",
  "message": "It becomes itchy after showering."
}
```

---

## Response

```json
{
  "assistant_response": "That additional detail may..."
}
```

---

# GET /sessions

Return all sessions.

---

## Response

```json
[
  {
    "session_id": "uuid",
    "created_at": "timestamp"
  }
]
```

---

# GET /sessions/{id}

Return complete session.

---

## Response

```json
{
  "session_id": "uuid",
  "messages": [],
  "images": [],
  "prediction_history": []
}
```

---

# DELETE /sessions/{id}

Delete session.

---

## Response

```json
{
  "status": "deleted"
}
```

---

# Error Responses

## Invalid Image

```json
{
  "error": "Unsupported image format."
}
```

---

## Missing Session

```json
{
  "error": "Session not found."
}
```

---

# API Design Rules

- all responses must be structured
- avoid raw model outputs
- preserve deterministic JSON formatting
- maintain session continuity
- preserve safety constraints