import * as bodyParser from 'body-parser';
import * as express from 'express';
import Event from './Event';
import { IClient, IEvent, IServerOptions } from './types';

export default class Server {
    router: express.Router;
    events: Event[] = [];

    constructor(options: IServerOptions) {
        this.router = express.Router();
        this.router.use(bodyParser.json());
        this.router.post('/unsubscribe', this.handleUnsubscribe.bind(this));
        this.router.post('/subscribe', this.handleSubscribe.bind(this));
        this.router.post('/publish', this.handlePublish.bind(this));

        options.app.use(options.path, this.router);
    }

    handleUnsubscribe(req: express.Request, res: express.Response, _next: express.NextFunction) {
        const { client, event }: { client: IClient, event: IEvent } = req.body;

        const mEvent = this.getEvent(event.name);

        if (mEvent) {
            mEvent.unsubscribe(client);

            if (mEvent.subscribers.length === 0) {
                this.delEvent(event.name);
            }
        }

        return res.status(200).send();
    }

    handleSubscribe(req: express.Request, res: express.Response, _next: express.NextFunction) {
        const { client, event }: { client: IClient, event: IEvent } = req.body;

        let mEvent = this.getEvent(event.name);

        if (!mEvent) {
            mEvent = new Event({
                name: event.name
            });

            this.events.push(mEvent);
        }

        mEvent.subscribe(client, event.mode);

        return res.status(200).send();
    }

    handlePublish(req: express.Request, res: express.Response, _next: express.NextFunction) {
        const { cid, data, event } : { cid: string, data: any, event: IEvent } = req.body;

        const mEvent = this.getEvent(event.name);

        if (mEvent) {
            mEvent.publish({
                cid,
                data
            });
        }

        return res.status(200).send();
    }

    getEvent(name: string) {
        const event = this.events.find((event) => event.options.name === name);
        return event ? event : null;
    }

    delEvent(name: string) {
        const index = this.events.findIndex((event) => event.options.name === name);

        if (index > -1) {
            this.events.splice(index, 1);
        }
    }
}