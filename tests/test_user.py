import requests


def test_insert_users():
    url = f'http://localhost:11000/login'
    response = requests.post(
        url, json={
            'email': 'zexiny@andrew.cmu.edu',
            'password': '12345678'
        }
    )
    access_token = response.json()['access_token']

    url = f'http://localhost:11000/user/654ef9f8119e443581d3d1a6'
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'  # Set the appropriate content type for your request
    }
    response = requests.get(url, headers=headers).json()
    assert response['message']['user_info']['username'] == 'zexiny'
