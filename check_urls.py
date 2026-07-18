import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find any fetch calls starting with '/api/' without API_BASE_URL
matches = re.findall(r"(fetchWithAuth|fetch)\(['\"](/api/[^'\"]+)['\"]\)", content)
print("Relative fetch calls found:", matches)
