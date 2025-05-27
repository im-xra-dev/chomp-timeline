import { Injectable } from '@nestjs/common';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';

export type AquiredLock = {
    uniqueSignature: string,
    lockPath: string,
    dataPath: string,
    expAt: number,
}

@Injectable()
export class AquireMutexService {
    constructor(private readonly cacheClient: RedisCacheDriverService) {}

    async aquireLock(lockPath: string, dataPath: string): Promise<AquiredLock> {
        return {
            dataPath: dataPath,
            lockPath: lockPath,
            uniqueSignature: "",
            expAt: new Date().getTime(),
        }
    }

    async releaseLock(lock: AquiredLock): Promise<boolean> {
        return false
    }

    private genUniqueSignature() {
        let output = '';
        for (let i = 0; i < 6; i++) {
            output += (Math.floor(Math.random() * 16)).toString(16);
        }
        return output;
    }
}
