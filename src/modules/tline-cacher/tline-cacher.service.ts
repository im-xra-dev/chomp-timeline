import {Injectable} from '@nestjs/common';
import {TLineCacheQueriesEnum as Q} from '../../utils/TLineCacheQueriesEnum'

@Injectable()
export class TlineCacherService {

    //TODO: interacts with redis
    //TODO mutex, parse, run, errors, return

    async dispatch(mode:Q, params:{[key:string]:string}, data:unknown): Promise<unknown>{
        return null;
    }

    async mutex(state:boolean, userid:string): Promise<unknown>{
        return null;
    }

}
