# RadonJS

An event backbone for microservices architectures using express

Version: ALPHA

## Installation

Use the package manager [npm](https://www.npmjs.com) to install radonjs.

```bash
npm install @keegpt/radonjs
```

## Server

```js
import radon from '@keegpt/radonjs';

const app = express();
new radon.Server({
    app,
    path: '/radon'
});
serverApp.listen(8000);
```

## Clients

```js
import radon from '@keegpt/radonjs';

const authMicroServiceApp = express();
const authMicroService = new radon.Client({
    app: authMicroServiceApp,
    host: 'http://localhost',
    port: 8001,
    path: '/radon',
    serverHost: 'http://localhost',
    serverPort: 8000,
    serverPath: '/radon'
});
authMicroServiceApp.listen(8001);

authMicroService.subscribe({ name: 'USER.GET', mode: 0 }, async (data: any) => {
    const user = await db.query('SELECT * FROM users WHERE id = $1', data.id);
    return user;
});
```

```js
import radon from '@keegpt/radonjs';

const anotherMicroServiceApp = express();
const anotherMicroService = new radon.Client({
    app: anotherMicroServiceApp,
    host: 'http://localhost',
    port: 8002,
    path: '/radon',
    serverHost: 'http://localhost',
    serverPort: 8000,
    serverPath: '/radon'
});
anotherMicroServiceApp.listen(8002);

(async () => {
    const result = await anotherMicroService.publishAndGet('USER.GET', { id: 1 });
    console.log(result);
})
```

## Todo
Some of this are simple to do, i'm just trying to find time :(
* Simplify configuration parameters
* Remove request-promise dependency (use native http/https)
* Allow to customize event timeout and concurrency values
* Clients should have a unique id to handle some tasks, like unsubscribe
* Create an event sub queue for handle responses, instead of creating a new event + queue for waiting responses
* Create a system to get all updated stats from each event
* Export modes interface to use when subscribing

## Docs

### Server options

Property  | Description
------------- | -------------
app  | An express application
path  | Internal radon router path

### Client options

Property  | Description
------------- | -------------
app  | An express application
host | Client host
port | Client port
path | Internal radon router path
serverHost | Server host
serverPort| Server port
serverPath | Server internal radon router path

### Event Modes

Mode | Value | Description
------------- | ------------- | -------------
0 | ACKOWNLEDGE | Client just wants to receive information and do not need to return any data to the publisher
1 | LOAD_BALANCE | Client wants to reply some data. It will load balance the requests with all other clients in load_balance

### Client methods

#### subscribe(eventName, callback)
```js
client.subscribe('EVENT_NAME', async (data: any) => {
    // logic
    // default mode is acknowledge, so any return will not be delivery to the publisher
});
```
#### subscribe({ name, mode }, callback)
```js
client.subscribe({ name: 'EVENT_NAME', mode: 1 }, async (data: any) => {
    // logic
    // in load_balance mode, you can return information to the publisher
    return data;
});
```
#### publish(eventName)
```js
(async () => {
    anotherMicroService.publish('EVENT_NAME', { some: 'data' });
})
```

#### publishAndGet(eventName, callback)
```js
(async () => {
    const result = await anotherMicroService.publishAndGet('EVENT_NAME', { some: 'data' });
    console.log(result);
})
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)