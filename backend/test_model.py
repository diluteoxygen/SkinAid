import os
from clip_infer import analyze_image

if __name__ == "__main__":
    image_path = os.path.join(os.path.dirname(__file__), "test.jpg")
    result = analyze_image(image_path)

    print(result)