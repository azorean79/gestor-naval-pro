import os
import sys
import google.generativeai as genai

# Get API key from environment variable
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    print('Error: GEMINI_API_KEY not set')
    sys.exit(1)

genai.configure(api_key=api_key)

# Accept prompt from command line argument or stdin
if len(sys.argv) > 1:
    prompt = sys.argv[1]
else:
    prompt = sys.stdin.read().strip()

model = genai.GenerativeModel('gemini-2.0-flash')
response = model.generate_content(prompt)
print(response.text)
