import Store from 'electron-store';
import { deSignStr, signStr } from '../utils';
import logger from './log4js';

const store = new Store();
const CURRENTLOGPREFIX = "store";


const svcVerKey = "localSvcVer";
const svchashKey = "localSvcHash";

/**
 * 获取存储的服务版本
 * @returns 
 */
export const getStoreSvcVer = (): string => (store.get(svcVerKey) as string);

/**
 * 设置存储的版本
 * @param ver 
 * @returns 
 */
export const setStoreSvcVer = (ver: string) => store.set(svcVerKey, ver);

/**
 * 获取存储的服务hash
 * @returns 
 */
export const getStoreSvcHash = () => {
    const storeHash = (store.get(svchashKey) as string);
    try {
        return deSignStr(storeHash);
    } catch (error) {
        logger.error(CURRENTLOGPREFIX, `解密存储的hash失败,存储的hash为：${storeHash}`);
        return "";
    }

}

/**
 * 设置存储的服务hash
 * @param hash 
 */
export const setStoreSvcHash = (hash: string) => {
    store.set(svchashKey, signStr(hash));
}

/**
 * 清空缓存
 */
export const clearStore = () => {
    store.clear();
}