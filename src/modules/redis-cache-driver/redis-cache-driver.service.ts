import { Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

type WaitingPromise = {
    resolve: (value: PromiseLike<RedisClientType> | RedisClientType) => void;
    reject: (reason?: any) => void;
};

@Injectable()
export class RedisCacheDriverService {
    private static client: RedisClientType;
    private static bootupCalled = false;
    private static waitingToOpenQueue: WaitingPromise[] = [];

    constructor(private readonly configService: ConfigService) {}

    /**getClient
     *
     * gets the redis client instance
     */
    async getClient(): Promise<RedisClientType> {
        //if bootup has not been initialized, start booting up
        if (!RedisCacheDriverService.bootupCalled) await this.bootup();

        //if the client is booted/ing up, then if its ready for connections return it
        if (RedisCacheDriverService.client.isReady) return RedisCacheDriverService.client;

        //if the client is not ready (still connecting/reconnecting in an outage)
        //then promise to return it, this is handled by the ready event listener
        return new Promise<RedisClientType>((resolve, reject) => {
            RedisCacheDriverService.waitingToOpenQueue.push({ resolve, reject });
        });
    }

    /**shutdown
     *
     * destroys the current instance. All shutdown logic should be handled
     * by the event listener. This ensures if someone decides to manually
     * destroy a client instead of using this shutdown method, then the
     * system still handles the shutdown correctly.
     */
    shutdown(): void {
        if(RedisCacheDriverService.client !== undefined)
            RedisCacheDriverService.client.destroy();
    }

    /**bootup
     *
     * boots up a new instance of the client.
     *
     * @private
     */
    private async bootup(): Promise<void> {
        //initialize bootup
        console.log('redis instance booting up');
        RedisCacheDriverService.bootupCalled = true;

        //setup connection string to the redis instance
        const SCHEME = this.configService.get('REDIS_SCHEME');
        const HOST = this.configService.get('REDIS_HOST');
        const PORT = this.configService.get('REDIS_PORT');
        const USER  = this.configService.get('REDIS_USER');
        const PASS = this.configService.get('REDIS_PASS');

        //configures the client
        RedisCacheDriverService.client = createClient({
            url: `${SCHEME}://${USER}:${PASS}@${HOST}:${PORT}`,
        });

        //register all the event listeners
        RedisCacheDriverService.client.on('connect', this.handleConnecting);
        RedisCacheDriverService.client.on('ready', this.handleReady);
        RedisCacheDriverService.client.on('end', this.handleEnd);
        RedisCacheDriverService.client.on('reconnecting', this.handleReconnecting);
        RedisCacheDriverService.client.on('error', this.handleError);

        //finally connect
        await RedisCacheDriverService.client.connect();
    }

    //----------- handlers -----------\\

    //logging errors
    private handleError(error: Error) {
        console.error(error);
    }

    //connection complete and ready for requests
    private handleReady(): void {
        console.log('redis instance ready');

        //once the instance is ready, resolve all the promises awaiting the connection to start
        while (RedisCacheDriverService.waitingToOpenQueue.length !== 0) {
            const bufferedPromise = RedisCacheDriverService.waitingToOpenQueue.shift();
            bufferedPromise.resolve(RedisCacheDriverService.client);
        }
    }

    //clean up after the redis client has disconnected
    private handleEnd() {
        console.log('redis connection terminated');
        //cleanup
        RedisCacheDriverService.bootupCalled = false;
        RedisCacheDriverService.client = undefined;
    }

    //redis is currently connecting
    private handleConnecting() {
        console.log('redis connecting in progress');
    }

    //redis is currently re-connecting
    private handleReconnecting() {
        console.log('redis reconnecting');
    }
}
