import * as bodyParser from 'body-parser';
import * as express from 'express';
import { IServer } from '../@types/IServer';
import ConsumerManager from './core/ConsumerManager';
import TopicManager from './core/TopicManager';

export default class Server {
    options: IServer;
    app: express.Application;

    consumerManager: ConsumerManager = new ConsumerManager();
    topicManager: TopicManager = new TopicManager();

    constructor(options: IServer) {
        this.options = {
            port: options.port || 9999,
            path: options.path || ''
        };

        this.app = options.app || express();
        this.initApp(!!options.app);
    }

    initApp(hasApp: boolean) {
        const router = express.Router();
        router.use(bodyParser.json());
        router.post('/register', this.handleRegister.bind(this));
        router.post('/publish', this.handlePublish.bind(this));
        router.post('/subscribe', this.handleSubscribe.bind(this));
        router.post('/unsubscribe', this.handleUnsubscribe.bind(this));

        this.app.use(this.options.path, router);

        if (!hasApp) {
            this.app.listen(this.options.port);
        }
    }

    handleRegister(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { host, port, path } = req.body;
            const uid = this.consumerManager.createConsumer(host, port, path);
            res.status(200).send({ uid });
        } catch (error) {
            return next(error);
        }
    }

    handlePublish(req: express.Request, res: express.Response, _next: express.NextFunction) {

    }

    handleSubscribe(req: express.Request, res: express.Response, _next: express.NextFunction) {

    }

    handleUnsubscribe(req: express.Request, res: express.Response, _next: express.NextFunction) {

    }
}