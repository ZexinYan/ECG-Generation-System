import requests


def test_upload_csv():
    url = f'http://localhost:11000/csv'
    filename = './tests/AppId_1377bf24e3.resident_2022-08-15T120000_2022-08-15T235959_Impact.csv'

    with open(filename, 'rb') as file:
        response = requests.post(
            url=url,
            json={
                'filename': filename,
                'owner': '654ef9f8119e443581d3d1a6'
            },
            files={
                'file': file
            },
        )
        print(f'response: {response.json()}')
