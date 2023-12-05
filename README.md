# Heartbeat Signal Generation(Deployment Guide)

* authors: Zexin Yan, Krystal Wu, Kate Zhang, Jiali Xu

## Installation

### step-1: git clone codebase

```
git clone https://github.com/ZexinYan/Heartbeat-Signal-Generation-Backend
```

### step-2: install python enviroment

```
pip install -r requirements.txt
```

### step-3: install redis-server

[install redis on linux](https://redis.io/docs/install/install-redis/install-redis-on-linux/)
[install redis on macOS](https://redis.io/docs/install/install-redis/install-redis-on-mac-os/)
[install redis on Windows](https://redis.io/docs/install/install-redis/install-redis-on-windows/)

### step-4: install mongodb

[install mongodb on linux](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/)

## Deployment

### step-1: start mongodb

```
sudo mongod --dbpath ~/data/db --logpath ~/data/log/mongodb/mongo.log --fork
```

### step-2: start redis server

```
redis-server --port 10088
```

### step-3: start HSG backend

```
cd Heartbeat-Signal-Generation-Backend
python hsg/app.py --config config/local_debug.json
```

### step-4: start inference service

```
cd Heartbeat-Signal-Generation-Backend/models
python inference.py --config ../config/local_debug.json 
```

