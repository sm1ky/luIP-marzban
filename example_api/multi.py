import requests

BASE_URL = "http://127.0.0.1:3000/api"

USERNAME = "admin"
PASSWORD = "admin"

def get_token():
    endpoint = "/token"
    data = {"username": USERNAME, "password": PASSWORD}
    response = requests.post(BASE_URL + endpoint, json=data)
    return response.json()

def add_user(email, limit, api_key):
    endpoint = "/add"
    headers = {"api_key": api_key}
    data = {"email": email, "limit": limit}
    response = requests.post(BASE_URL + endpoint, headers=headers, json=data)
    returned = response.json()
    if returned['status'] == 0:
        # ОБНОВЛЕНИЕ ЛИМИТОВ ЕСЛИ ПОЛЬЗОВАТЕЛЬ В БАЗЕ
        returned = update_user(name=email, limit=limit, api_key=api_key)
    return returned

def update_user(email, limit, api_key):
    endpoint = "/update"
    headers = {"api_key": api_key}
    data = {"email": email, "limit": limit}
    response = requests.post(BASE_URL + endpoint, headers=headers, json=data)
    return response.json()

def delete_user(email, api_key):
    endpoint = f"/delete/{email}"
    headers = {"api_key": api_key}
    response = requests.get(BASE_URL + endpoint, headers=headers)
    return response.json()

def clear_users(api_key):
    endpoint = "/clear"
    headers = {"api_key": api_key}
    response = requests.get(BASE_URL + endpoint, headers=headers)
    return response.json()

if __name__ == "__main__":
    # Получение токена
    token_data = get_token()
    api_key = token_data["data"]["api_key"]
    print(f"Token: {api_key}")

    # Пример добавления нового пользователя
    result_add = add_user("admin", 2, api_key)
    print("Add User Result:", result_add)

    # # Пример обновления данных пользователя
    # result_update = update_user("admin", 2, api_key)
    # print("Update User Result:", result_update)

    # # Пример удаления пользователя
    # result_delete = delete_user("test@example.com", api_key)
    # print("Delete User Result:", result_delete)

    # Пример очистки файла users.csv
    # result_clear = clear_users(api_key)
    

    # print("Clear Users Result:", result_clear)