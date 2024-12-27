import { Injectable } from '@nestjs/common';
import { Driver, driver, auth, Session } from 'neo4j-driver';
import { NeoConnectionError } from '../../utils/NeoConnectionError';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NeoDriverService {
    private driverInstance: Driver;

    constructor(private readonly configService: ConfigService) {}

    /**bootup
     *
     * boot up the driver
     */
    async bootup(): Promise<boolean> {
        try {
            const SCHEME = this.configService.get('NEO_SCHEME');
            const HOST = this.configService.get('NEO_HOST');
            const PORT = this.configService.get('NEO_PORT');
            const USER = this.configService.get('NEO_USER');
            const PASS = this.configService.get('NEO_PASS');

            //set up the driver instance
            this.driverInstance = driver(`${SCHEME}://${HOST}:${PORT}`, auth.basic(USER, PASS));

            //verify the connection was made
            await this.driverInstance.verifyConnectivity();
            return true;
        } catch (e) {
            //if there was an error connecting to the database
            //then close the driver and log the issue.
            //this error should probably be reported as an alert to devs
            console.error(e);
            await this.close();
            return false;
        }
    }

    /** getSession
     *
     * Gets a new session instance from the driver
     */
    async getSession(): Promise<Session> {
        if (!this.driverInstance) {
            const success = await this.bootup();
            if (!success) throw new NeoConnectionError();
        }
        return this.driverInstance.session();
    }

    /**close
     *
     * close the current driver instance
     */
    async close() {
        //if the instance could not be created, it may be undefined
        if (!this.driverInstance) return;

        //shutdown the driver
        await this.driverInstance.close();
        this.driverInstance = undefined;
    }
}
