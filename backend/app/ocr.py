import os

class OCRManager:
    def __init__(self):
        print("OCRManager initialized (API-only mode, local PaddleOCR disabled).")

    def extract_text(self, image_path: str) -> str:
        # Local PaddleOCR disabled in Rank 1 configuration. We rely on Gemini/Groq APIs.
        print("PaddleOCR local inference is disabled in this environment.")
        return ""

ocr_manager = None

def get_ocr_manager():
    global ocr_manager
    if ocr_manager is None:
        ocr_manager = OCRManager()
    return ocr_manager
