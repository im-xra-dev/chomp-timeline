import { Test, TestingModule } from '@nestjs/testing';
import { RedisCacheDriverService } from './redis-cache-driver.service';
import { ConfigModule } from '@nestjs/config';

describe('RedisCacheDriverService', () => {
    let service: RedisCacheDriverService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [RedisCacheDriverService],
            imports: [ConfigModule.forRoot()],
        }).compile();

        service = module.get<RedisCacheDriverService>(RedisCacheDriverService);
    });

    afterEach(() => {
        service.shutdown();
    })

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe.skip('successful connection and shutdown integration test', () => {
        it('should connect to the redis instance', async () => {
            const client = await service.getClient();
            expect(client.isReady).toEqual(true);
            service.shutdown();
            expect(client.isReady).toEqual(false);
        })
    });
    describe.skip('reconnection integration test', () => {
        it('should test the reconnection to the redis instance after outage', async () => {
            const pushSpy = jest.spyOn(RedisCacheDriverService['waitingToOpenQueue'], 'push');
            //sets up the initial connection
            await service.getClient();
            console.log("terminate redis to test reconnection integration.")
            console.log("connection attempt will occur in 10 seconds.")

            //this simulates what happens if the connection client is requested
            //during brief downtime. Redis instance should be manually shut down to simulate this

            return new Promise((resolve) => {
                //timeout gives time to shut instance down and for the connection
                //attempts to slow down
                setTimeout(async () => {
                    console.log('timeout ended, attempting to get new client.');
                    console.log('restart redis instance.');
                    //attempts to access the client. The request should be queued
                    //until the instance comes online
                    const client = await service.getClient();

                    //check it was infact queued and the current instance is ready
                    expect(pushSpy).toHaveBeenCalledTimes(1);
                    expect(client.isReady).toEqual(true);
                    resolve(null);
                }, 10000);
            });
        }, 60000);
    });
});
