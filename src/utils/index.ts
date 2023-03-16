import crypto from 'crypto';


/**
 * 当前环境是否是开发环境
 * @returns boolean
 */
export const isDev = () => process.env.NODE_ENV === 'development';

/**
 * 检测对象是否为空
 * @param {*} e 入参
 * @returns 如果对象为空，返回true
 */
export const isNull = (e: any) => {
    //基础情况
    if (e === null || e === undefined) {
        return true;
    }
    //空字符串情况
    if (e === '') {
        return true;
    }
    //对象情况
    if (e.toString() === "[object Object]" && JSON.stringify(e) === '{}') {
        return true;
    }
    return false;
}


export const signStr = (data: string) => {
    if (isNull(data)) {
        return "";
    }
    let sign = "";
    const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from('ikunidzaikunidza', 'utf8'), Buffer.from('qqerqeqiqiuqowee', 'utf8'));
    sign += cipher.update(data, 'utf8', 'hex');
    sign += cipher.final('hex');
    return sign;
}

export const deSignStr = (data: string) => {
    if (isNull(data)) {
        return "";
    }
    let src = "";
    const cipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from('ikunidzaikunidza', 'utf8'), Buffer.from('qqerqeqiqiuqowee', 'utf8'));
    src += cipher.update(data, 'hex', 'utf8');
    src += cipher.final('utf8');
    return src;
}