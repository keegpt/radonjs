import cuid = require("cuid");

export default class ConsumerManager {
    private consumers: IConsumer[] = [];

    constructor() {

    }

    findConsumer(uid: string) {
        return this.consumers.find((consumer) => consumer.uid === uid);
    }

    createConsumer(host: string, port: string, path: string) {
        const consumer = this.consumers.find((consumer) => consumer.host === host && consumer.port === port && consumer.path === path);

        if (consumer) {
            throw new Error('Consumer already exists');
        }

        const uid = cuid();

        this.consumers.push({
            uid,
            host,
            port,
            path
        });

        return uid;
    }

    deleteConsumer(uid: string) {
        const index = this.consumers.findIndex((consumer) => consumer.uid === uid);

        if (index > -1) {
            this.consumers.splice(index, 1);
        }
    }
}