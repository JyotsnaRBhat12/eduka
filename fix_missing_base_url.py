import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace fetchWithAuth('/api/...') with fetchWithAuth(`${API_BASE_URL}/api/...`)
fixed = re.sub(r"fetchWithAuth\('/api/", r"fetchWithAuth(`${API_BASE_URL}/api/", content)
fixed = re.sub(r"fetch\('/api/", r"fetch(`${API_BASE_URL}/api/", content)

# Make sure closing quotes match backticks where replaced
# Find any fetchWithAuth(`${API_BASE_URL}/api/...'); and fix the closing quote
fixed = re.sub(r"(fetchWithAuth|fetch)\(`\$\{API_BASE_URL\}/api/([^`']*?)'\)", r"\1(`${API_BASE_URL}/api/\2`)", fixed)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(fixed)

print("Fixed relative fetch requests in App.jsx successfully!")
