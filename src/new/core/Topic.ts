import { ActionEnum } from "../../@types/ActionEnum";
import { ModeEnum } from "../../@types/ModeEnum";
import Queue from "./Queue";

export default class Topic {
    options: ITopic;
    consumers: string[] = [];
    queue: Queue;

    constructor(options: ITopic) {
        this.options = {
            name: options.name,
            queue: options.queue
        }

        this.queue = new Queue(this.options.queue!);
    }

    getName() {
        return this.options.name;
    }

    publish(message: IMessage) {
        this.queue.enqueue(message);
    }

    subscribe(uid: string, topic: string, mode: ModeEnum) {

    }

    unsubscribe(uid: string, topic: string) {

    }
}