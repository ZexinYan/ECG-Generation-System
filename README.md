# Heartbeat Signal Generation

## Deployment

### Start Redis Server

```
./redis-server --port 10088

```

### Start Inference Service

```
cd models
python inference.py --config ../config/local_debug.json 
```


### Start Server

```
python hsg/app.py --config config/local_debug.json
```
