import requests
import json

BASE_URL = 'http://localhost:5000/api'

def test_generate_quiz():
    # 1. Login
    login_data = {
        'email': 'test@example.com',
        'password': 'password'
    }
    response = requests.post(f'{BASE_URL}/login', json=login_data)
    if response.status_code != 200:
        print("Login failed:", response.text)
        return

    token = response.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # 2. Generate Quiz
    payload = {
        'topic': 'General Knowledge',
        'count': 3,
        'difficulty': 'Easy'
    }
    
    print("Requesting quiz generation...")
    response = requests.post(f'{BASE_URL}/quiz/generate', json=payload, headers=headers)
    
    if response.status_code == 200:
        print("Success!")
        print(json.dumps(response.json(), indent=2))
    else:
        print("Failed:", response.status_code)
        print(response.text)

if __name__ == '__main__':
    test_generate_quiz()
