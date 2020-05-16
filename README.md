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
    app
});
serverApp.listen(8000);
```

## Clients

```js
import radon from '@keegpt/radonjs';

const authMicroServiceApp = express();
const authMicroService = new radon.Client({
    app: authMicroServiceApp,
    port: 8001,
    serverPort: 8000
});
authMicroServiceApp.listen(8001);

authMicroService.subscribe('USER.GET', async (data: any) => {
    const user = await db.query('SELECT * FROM users WHERE id = $1', data.id);
    return user;
});
```

```js
import radon from '@keegpt/radonjs';

const anotherMicroServiceApp = express();
const anotherMicroService = new radon.Client({
    app: anotherMicroServiceApp,
    port: 8002,
    serverPort: 8000
});
anotherMicroServiceApp.listen(8002);

(async () => {
    const user = await anotherMicroService.get('USER.GET', { id: 1 });
    console.log(user);
})
```

## Todo
Some of this are simple to do, i'm just trying to find time :(
* Ready event (to known when it can register and subscribe)
* Remove request-promise dependency (use native http/https)
* Allow to customize event timeout and concurrency values
* Create a system to get all updated stats from each event
* Fix build types (lol)
* A good error handling system
* A good debug system
* Integrate with redis
* With redis we can create an event history to allow dead subscribers to get up and get updated about what happened in the system

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

### Client methods

#### subscribe(eventName, callback)
```js
client.subscribe('EVENT_NAME', async (data: any) => {
    // logic
    // we can return data to the publisher, just returning something in this function
});
```

#### send(eventName)
```js
(async () => {
    anotherMicroService.send('EVENT_NAME', { some: 'data' });
})
```

#### get(eventName, callback)
```js
(async () => {
    const result = await anotherMicroService.get('EVENT_NAME', { some: 'data' });
    console.log(result);
})
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)