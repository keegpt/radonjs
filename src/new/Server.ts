import * as bodyParser from 'body-parser';
import * as express from 'express';
import { ActionEnum } from '../@types/ActionEnum';
import { IServer } from '../@types/IServer';
import { ModeEnum } from '../@types/ModeEnum';
import ClientManager from './core/ClientManager';
import TopicManager from './core/TopicManager';
import monitor from './monitor';

export default class Server {
    options: IServer;
    app: express.Application;

    clientManager: ClientManager = new ClientManager();
    topicManager: TopicManager = new TopicManager();

    constructor(options: IServer) {
        this.options = {
            port: options.port || 9999,
            path: options.path || '',
            healthcheckEnabled: options.healthcheckEnabled || true,
            healthcheckInterval: options.healthcheckInterval || 60 // seconds
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
            this.app.listen(this.options.port);
        }
    }

    isRegisted(req: express.Request, res: express.Response, next: express.NextFunction) {
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
            this.topicManager.publish(req.uid!, topic, message);
            res.status(200).send();
        } catch (error) {
            return next(error);
        }
    }

    handleSubscribe(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { topic, mode }: { topic: string, mode: ModeEnum } = req.body;
            this.topicManager.subscribe(req.uid!, topic, mode);
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