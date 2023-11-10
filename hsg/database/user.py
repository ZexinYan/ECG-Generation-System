import pymongo
from bson.objectid import ObjectId
from hsg.database.constant import DataBaseConstant


class UserTable:
    _client = None
    _user_table = None

    @staticmethod
    def user_table():
        if UserTable._user_table is None:
            UserTable._client = pymongo.MongoClient("mongodb://localhost:27017/")
            UserTable._user_table = UserTable._client[DataBaseConstant.DATABASE_NAME][DataBaseConstant.USER_TABLE]
        return UserTable._user_table

    def find(self, condition=None):
        users_list = []
        user_table = UserTable.user_table()
        if condition is None:
            find_result = user_table.find()
        else:
            find_result = user_table.find(condition)
        for each in find_result:
            each['_id'] = str(each['_id'])
            users_list.append(each)
        return users_list

    def insert_one(self, item):
        user_table = UserTable.user_table()
        x = user_table.insert_one(item)
        return str(x.inserted_id)

    def update_one(self, _id, new_values):
        user_table = UserTable.user_table()
        query = {"_id": ObjectId(_id)}
        new_values = {"$set": new_values}
        user_table.update_one(query, new_values)

    def delete_one(self, _id):
        user_table = UserTable.user_table()
        user_table.delete_one({"_id": ObjectId(_id)})
