import pymongo
from bson.objectid import ObjectId
from hsg.database.constant import DataBaseConstant


class CSVTable:
    _client = None
    _table = None

    @staticmethod
    def table():
        if CSVTable._table is None:
            CSVTable._client = pymongo.MongoClient("mongodb://localhost:27017/")
            CSVTable._table = CSVTable._client[DataBaseConstant.DATABASE_NAME][DataBaseConstant.CSV_TABLE]
        return CSVTable._table

    def find(self, condition=None):
        users_list = []
        table = self.table()
        if condition is None:
            find_result = table.find()
        else:
            find_result = table.find(condition)
        for each in find_result:
            each['_id'] = str(each['_id'])
            users_list.append(each)
        return users_list

    def insert_one(self, item):
        table = self.table()
        x = table.insert_one(item)
        return str(x.inserted_id)

    def update_one(self, _id, new_values):
        table = self.table()
        query = {"_id": ObjectId(_id)}
        new_values = {"$set": new_values}
        return table.update_one(query, new_values)

    def delete_one(self, _id):
        table = self.table()
        return table.delete_one({"_id": ObjectId(_id)})
