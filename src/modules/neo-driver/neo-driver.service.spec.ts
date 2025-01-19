    import { Test, TestingModule } from '@nestjs/testing';
    import { NeoDriverService } from './neo-driver.service';
    import { ConfigModule, ConfigService } from '@nestjs/config';

    describe('NeoDriverService', () => {
        let service: NeoDriverService;
        let configService: ConfigService;

        beforeEach(async () => {
            const module: TestingModule = await Test.createTestingModule({
                providers: [NeoDriverService],
                imports: [ConfigModule.forRoot()],
            }).compile();

            service = module.get<NeoDriverService>(NeoDriverService);
            configService = module.get<ConfigService>(ConfigService);
        });

        it('should be defined', async () => {
            expect(service).toBeDefined();
        });

        //skipped by default as it requires a successful connection to be made
        describe.skip('test cases against a successful connection', () => {
            it('should connect to the neo4j host with .env variables', async () => {
                //run the test
                const success = await service.bootup();
                expect(success).toBe(true);

                //cleanup
                await service.close();
            });

            it('should return a session if a driver is already connected', async () => {
                //setup the connection
                const success = await service.bootup();
                expect(success).toBe(true);

                //run the test
                const session = await service.getSession();
                expect(session).toBeDefined();

                //cleanup
                await session.close();
                await service.close();
            });

            it('should return a session after creating a driver if one is not connected', async () => {
                //run the test
                const session = await service.getSession();
                expect(session).toBeDefined();

                //cleanup
                await session.close();
                await service.close();
            });
        });

        describe('test cases against a failure connection', () => {
            it('should fail to connect to the neo4j host', async () => {
                //mock env values to failure values, and hide the expected error log
                jest.spyOn(configService, 'get').mockReturnValue('FAIL');
                jest.spyOn(console, 'error').mockImplementation();

                //fail to bootup
                const success = await service.bootup();
                expect(success).toBe(false);
                await service.close();
            });

            it('should attempt (and fail) to boot a new driver if the current one is closed', async () => {
                jest.spyOn(service, 'bootup').mockResolvedValue(false);
                try {
                    await service.getSession();
                } catch (e) {
                    expect(e.errorName).toBe('NeoConnectionError');
                }
            });
        });
    });
