import monitor from "../monitor";
import ClientManager from "./ClientManager";
import Queue from "./Queue";

export default class Topic {
    private options: ITopic;
    private consumers: string[] = [];
    private queue: Queue;

    constructor(options: ITopic, clientManager: ClientManager) {
        this.options = {
            name: options.name,
            queue: options.queue
        }

        this.queue = new Queue(this.options.queue!, this, clientManager);
    }

    getName() {
        return this.options.name;
    }

    getConsumers() {
        return this.consumers;
    }

    publish(message: IMessage) {
        this.queue.enqueue(message);
    }

    subscribe(uid: string) {
        const consumer = this.consumers.find((consumer) => consumer === uid);

        if (!consumer) {
            this.consumers.push(uid);
            return;
        }

        monitor(`Consumer ${uid} already subscribed`);
    }

    unsubscribe(uid: string) {
        const index = this.consumers.indexOf(uid);

        if (index > -1) {
            this.consumers.splice(index, 1);
            return;
        }

        monitor(`Consumer ${uid} not found`);
    }
}