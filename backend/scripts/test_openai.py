import os
import sys

import httpx

key = os.environ.get("OPENAI_API_KEY")
if not key:
    print("OPENAI_API_KEY not found in environment")
    sys.exit(1)

print(f"Testing OpenAI with key ending in: {key[-4:]}")

url = "https://api.openai.com/v1/embeddings"
headers = {"Authorization": f"Bearer {key}"}
payload = {"input": "test content for embedding", "model": "text-embedding-3-small"}

try:
    print(f"Sending request to {url}...")
    with httpx.Client(timeout=30.0) as client:
        response = client.post(url, headers=headers, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"Network Error: {type(e).__name__} - {str(e)}")
