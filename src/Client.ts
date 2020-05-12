import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as request from 'request-promise';
import { getId } from './utils';
import { IClientOptions, IClientEvent, EventModeEnum } from './types';

export default class Client {
    options: IClientOptions;
    router: express.Router = express.Router();
    serverEndpoint: string;
    events: IClientEvent[] = [];

    constructor(options: IClientOptions) {
        this.options = options;
        this.router.use(bodyParser.json());
        this.router.post('/onevent', this.handleEvent.bind(this));
        this.serverEndpoint = `${options.serverHost}:${options.serverPort}${options.serverPath}`;

        options.app.use(options.path, this.router);
    }

    async publish(event: string, data: any) {
        const cid = getId();

        const payload = {
            cid,
            event: {
                name: event
            },
            data
        };

        await request.post(`${this.serverEndpoint}/publish`, {
            method: 'POST',
            body: payload,
            json: true
        });
    }

    async publishAndGet(event: string, data: any) {
        return new Promise(async (resolve, reject) => {
            const cid = getId();

            await this.subscribe({ name: cid, mode: EventModeEnum.ACKNOWLEDGE }, (data: any) => {
                this.unsubscribe(cid);
                resolve(data);
            });

            const payload = {
                cid,
                event: {
                    name: event
                },
                data
            };

            await request.post(`${this.serverEndpoint}/publish`, {
                method: 'POST',
                body: payload,
                json: true
            });
        });
    }

    async handleEvent(req: express.Request, res: express.Response, _next: express.NextFunction) {
        const { cid, event, data } = req.body;
        const mEvent = this.events.find((ev) => ev.name === event.name);

        if (mEvent && mEvent.callback) {
            await mEvent.callback(cid, data);
        }

        return res.status(200).send();
    }

    async subscribe(eventOptions: string | IClientEvent, callback: (data: any) => any) {
        let event: IClientEvent;
        if (typeof eventOptions !== 'object') {
            event = {
                name: eventOptions,
                mode: EventModeEnum.ACKNOWLEDGE
            };
        } else {
            event = {
                name: eventOptions.name,
                mode: eventOptions.mode
            };
        }

        await request.post(`${this.serverEndpoint}/subscribe`, {
            method: 'POST',
            body: {
                client: {
                    host: this.options.host,
                    port: this.options.port,
                    path: this.options.path
                },
                event
            },
            json: true
        });

        this.events.push({
            name: event.name,
            mode: event.mode,
            callback: async (cid: string, data: any) => {
                const result = await callback(data);

                if (event.mode === EventModeEnum.LOAD_BALANCE) {
                    await this.publish(cid, result);
                }
            }
        });
    }

    async unsubscribe(event: string) {
        const payload = {
            client: {
                host: this.options.host,
                port: this.options.port,
                path: this.options.path
            },
            event: {
                name: event
            }
        };

        await request.post(`${this.serverEndpoint}/unsubscribe`, {
            method: 'POST',
            body: payload,
            json: true
        });

        const index = this.events.findIndex((ev) => ev.name === event);

        if (index > -1) {
            this.events.splice(index, 1);
        }
    }
}