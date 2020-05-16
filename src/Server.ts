import * as bodyParser from 'body-parser';
import * as express from 'express';
import { IServerOptions } from './@types/IServerOptions';
import ClientManager from './core/ClientManager';
import TopicManager from './core/TopicManager';
import monitor from './monitor';

export default class Server {
    private options: IServerOptions;
    private app: express.Application;

    private clientManager: ClientManager = new ClientManager();
    private topicManager: TopicManager = new TopicManager(this.clientManager);

    constructor(options?: IServerOptions) {
        if (!options) {
            options = {};
        }

        this.options = {
            port: options.port || 9999,
            path: options.path || '/radon',
            healthcheckEnabled: options.healthcheckEnabled || true,
            healthcheckInterval: options.healthcheckInterval || 60, // seconds
            onReady: options.onReady
        };

        this.app = options.app || express();
        this.initApp(!!options.app);
    }

    initApp(hasApp: boolean) {
        const router = express.Router();
        router.use(bodyParser.json());
        router.post('/register', this.handleRegister.bind(this));
        router.post('/publish', this.isRegisted.bind(this), this.handlePublish.bind(this));
        router.post('/subscribe', this.isRegisted.bind(this), this.handleSubscribe.bind(this));
        router.post('/unsubscribe', this.isRegisted.bind(this), this.handleUnsubscribe.bind(this));

        this.app.use(this.options.path!, router);

        if (!hasApp) {
            this.app.listen(this.options.port, this.options.onReady);
        } else {
            this.options.onReady && this.options.onReady();
        }
    }

    isRegisted(req: express.Request, _res: express.Response, next: express.NextFunction) {
        try {
            const uid = req.get('RadonUID');
            if (!uid) {
                throw new Error('Client not registed');
            }
            const client = this.clientManager.findClient(uid);
            if (!client) {
                throw new Error('Client not registed');
            }
            req.uid = uid;
            return next();
        } catch (error) {
            return next(error);
        }
    }

    handleRegister(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { host, port, path } = req.body;
            const uid = this.clientManager.createClient(host, port, path);
            res.status(200).send({ uid });
        } catch (error) {
            return next(error);
        }
    }

    handlePublish(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { topic, message }: { topic: string, message: IMessage } = req.body;
            monitor(`Message ${message.cid} by ${req.uid} has arrived, publishing into topic manager`);
            this.topicManager.publish(topic, message);
            res.status(200).send();
        } catch (error) {
            return next(error);
        }
    }

    handleSubscribe(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { topic }: { topic: string } = req.body;
            this.topicManager.subscribe(req.uid!, topic);
            res.status(200).send();
        } catch (error) {
            return next(error);
        }
    }

    handleUnsubscribe(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { topic }: { topic: string } = req.body;
            this.topicManager.unsubscribe(req.uid!, topic);
            res.status(200).send();
        } catch (error) {
            return next(error);
        }
    }
}