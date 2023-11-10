from hsg.database.user import UserTable


def test_insert_users():
    user_table = UserTable.user_table()
    user_table.insert_one({
        "user": "zexiny",
        "phone": "6693386680"
    })
    for each in user_table.find():
        print(f'each: {each}')
