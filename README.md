# iot-rest

REST application with three modules:  
- Server: Connects with the database to read/write/delete data about devices and their sensors. Serves endpoints for clients so they can perform these operations.  
- Dashboard: Web Application that retrieves data from the server and displays it in a table. Every time a device or sensor is updated, the server pings the dashboard so it is updated.  
- Simulator: Web Application where user can create a new device, update a device's sensor or delete a device. Endpoints are available through curl or at /explorer page, which provides a visual implementation of those operations.  
  
All modules are dockerized.  
To run the application, use the "run" script included in this folder. It will build and run each Docker image and container required.  
  
Exposed ports:  
- DB: 3306  
- Server: 3000  
- Dashboard: 3100  
- Simulator: 3200  
  
The dashboard can be accessed at $DOCKER_HOST_IP:3100/  
The simulator can be accessed at $DOCKER_HOST_IP:3200/explorer  
  
Each module also includes its own "run" script, which can be modified to change environment variables.  
