from gemini_service import generate_response

if __name__ == "__main__":
    predictions = [
        {"label": "eczema", "score": 0.61},
        {"label": "psoriasis", "score": 0.23}
    ]

    print(generate_response(predictions))