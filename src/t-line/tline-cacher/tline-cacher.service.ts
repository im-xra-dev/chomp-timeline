import {Injectable} from '@nestjs/common';

@Injectable()
export class TlineCacherService {

    //TODO this will contain one function which take QUERY enum and data object
    //TODO mutex, parse, run, errors, return

    //these are notes not functions
    getPool(userid: string): string[] {
        return [];
    }

    setPool(userid: string, pool: string[]): void {
    }

    getPoolPostData(userid: string, postid: string, value: string): string|number {
        return 0;
    }

    setPoolPostData(userid: string, postid: string, setterString: string): void {
    }

    getSeen(userid: string, postid:string): string[] {
        return [];
    }

    setSeen(userid: string, postid:string): void {
    }

    getSecList(userid: string): string[] {
        return [];
    }

    setSecList(userid: string, list: string[]): void {
    }

    getUserList(userid: string): string[] {
        return [];
    }

    setUserList(userid: string, list: string[]): void {
    }

    getSecInfo(userid: string, secid:string, key:string): number {
        return 0;
    }

    setSecInfo(userid: string, secid:string, setterString:string): void {
    }

    getUserInfo(userid: string, followedUserId:string, key:string): number {
        return 0;
    }

    setUserInfo(userid: string, followedUserId:string, setterString:string): void {
    }


}
