import axios from "axios";
import FormData from 'form-data';
import redis from "redis";

import {promisify} from 'util';


// Create redis client
const redisClient = redis.createClient();
redisClient.get = promisify(redisClient.get).bind(redisClient);
redisClient.set = promisify(redisClient.set).bind(redisClient);
redisClient.expire = promisify(redisClient.expire).bind(redisClient);
redisClient.ttl = promisify(redisClient.ttl).bind(redisClient);
redisClient.keys = promisify(redisClient.keys).bind(redisClient);
redisClient.del = promisify(redisClient.del).bind(redisClient);

const submitUrl = "https://www2.cbox.ws/box/?sec=submit&boxid=2397766&boxtag=zvyqep&tid=13&tkey=5a458b5391759474&_v=1063";
const baseFormData = {
    aj: 1063,
    lp: 42098988,
    pst: "123",
    fp: 0,
    lid: 20607,
    nme: "☯๖ۣۜßotᵛᶜᵐᵗ",
    //eml: "https://tutien.net/member/586634",
    key: "91f047175d9e57d170a280bd5b7e011a",
    ekey: "878985e24bdfd07a1d7aa0bcf08948e2",
    pic: "https://tutien.net/images/no_avatar.jpg",
};

export const chat = message => sendMessage(message);
export const pmCbox = (cbox_userid, message) => sendMessage(`//pm ${cbox_userid} ${message}`);
export const pmTcv = async (tcv_userid, message) => {
    const cboxId = await getCboxIdFromTcvId(tcv_userid);

    if (cboxId) {
        pmCbox(cboxId, message);
        return null;
    }

    const memberName = await getTcvNameFromTcvId(tcv_userid);
    if (memberName) {
        chat("[b]@" + memberName + "[/b] " + message);
        return null;
    }

    chat(message);
}

export const sendMessage = message => {
    const formData = baseFormData;
    formData.pst = message;
    const form = new FormData();
    Object.keys(formData).map(key => {
        form.append(key, formData[key]);
    });
    axios.post(submitUrl, form, {headers: form.getHeaders()}).then(() => {
    });
}

export const formUrlEncoded = x => Object.keys(x).reduce((p, c) => p + `&${c}=${encodeURIComponent(x[c])}`, '');

export const setTcvUsername = async (tcv_userid, tcv_username) => {
    const exists = await getTcvNameFromTcvId(tcv_userid);
    if (!exists) {
        await setItem(`${tcv_userid}_name`, tcv_username);
    }
}
export const mapTcvCbox = async (tcv_userid, cbox_userid) => {
    const exists = await getCboxIdFromTcvId(tcv_userid);
    if (!exists) {
        await setItem(`${tcv_userid}_cbox`, cbox_userid);
    }
};
export const mapCboxTcv = async (tcv_userid, cbox_userid) => {
    const exists = await getTcvIdFromCboxId(cbox_userid);
    if (!exists) {
        await setItem(`${cbox_userid}_tcv`, tcv_userid);
    }
}

export const resetMember = async (tcv_userid) => {
    await delKey('basic-' + tcv_userid);
    await delKey(`${tcv_userid}_name`);
    await delKey(`${tcv_userid}_cbox`);
}

export const getTcvNameFromTcvId = async (tcv_userid) => await getItem(`${tcv_userid}_name`);
export const getTcvIdFromCboxId = async (cbox_userid) => await getItem(`${cbox_userid}_tcv`);
export const getCboxIdFromTcvId = async (tcv_userid) => await getItem(`${tcv_userid}_cbox`);

export const setBasic = async (user) => {
    await setItem("basic-" + user.id, JSON.stringify(user));
}

export const getBasic = async (userid) => {
    const basic = await getItem("basic-" + userid);
    if (basic) {
        return JSON.parse(basic);
    }

    return null;
}

export const setItem = async (name, value) => await redisClient.set(name, value);
export const getItem = async name => await redisClient.get(name);
export const setExpire = async (key, time) => await redisClient.expire(key, time);
export const getKeys = async key => await redisClient.keys(key);
export const delKey = async key => await redisClient.del(key);
export const getTtl = async key => await redisClient.ttl(key);
export const setPks = async (userid, value) => await setItem(`user-pk-${userid}`, JSON.stringify(value));
export const getPks = async userid => await getItem(`user-pk-${userid}`);
export const getLastLogDo = async () => await getItem('last-log-do');
export const setLastLogDo = async logId => await setItem('last-log-do', logId);
export const getLastLogBac = async () => await getItem('last-log-bac');
export const setLastLogBac = async logId => await setItem('last-log-bac', logId);

export const convert_vnese_2_eng = (str) => {
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    // Some system encode vietnamese combining accent as individual utf-8 characters
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
    return str;
}

export const snake_case = (string) => {
    let str = string.replace("[sup]", "").replace("[/sup]", "").trim();
    return convert_vnese_2_eng(str).toLowerCase().split(" +")[0].replaceAll(" ", "_");
}

export const capitalize_words = str => {
    return str.toLocaleString().replace(/\w\S*/g, function (txt) {
        if (txt == 'hp' || txt == 'tp' || txt == 'thp' || txt == 'cp') {
            return txt.toUpperCase();
        }

        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

export function is_numeric(str) {
    if (typeof str != "string") return false // we only process strings!
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

export const parse_chuc = chuc => {
    let chucLower = chuc.toLowerCase();
    switch (chucLower) {
        case "ngoại môn đệ tử":
        case "ngm":
        case "NGM":
            return 4;
        case "nội môn đệ tử":
        case "nm":
        case "NM":
            return 5;
        case "trưởng lão":
        case "tl":
        case "TL":
            return 8;
        case "đại trưởng lão":
        case "đtl":
        case "dtl":
        case "DTL":
        case "ĐTL":
            return 9;
        case "hộ pháp":
        case "hp":
        case "HP":
            return 7;
        case "hạch tâm đệ tử":
        case "ht":
        case "HT":
            return 6;
        case "tạp dịch":
        case "td":
        case "TD":
            return 0;
        case "linh đồng":
        case "ld":
        case "lđ":
        case "LD":
        case "LĐ":
            return 2;
    }

    return 0;
}

export function getChuc(chucNum) {
    switch (chucNum) {
        case 0:
            return 'TD';
        case 2:
            return 'LD';
        case 3:
            return 'NQ';
        case 4:
            return 'NGM';
        case 5:
            return 'NM';
        case 6:
            return 'HT';
        case 7:
            return 'HP';
        case 8:
            return 'TL';
        case 9:
            return 'DTL';
        case 10:
            return 'CM';
        default:
            return '';
    }
}

export function parseCookies(response) {
    const raw = response.headers.raw()['set-cookie'];
    return raw.map((entry) => {
        const parts = entry.split(';');
        return parts[0];
    }).join(';');
}

export function arrayRemove(value, array) {
    return array.filter(function (ele) {
        return ele !== value;
    });
}

/*export function formatBac(number) {
    let str = `${number}`;
    if (str.length < 6) {
        str = str.padStart(6, '0');
    } else if (str.length < 9) {
        str = str.padStart(9, '0');
    }

    var chunks = [];

    for (var i = 0, charsLength = str.length; i < charsLength; i += 3) {
        let num = str.substring(i, i + 3);
        if (i == 0) {
            num = parseInt(num);
        }

        if (num || i !== 0) {
            chunks.push(num);
        }
    }

    return chunks.join(".");
}*/

export function formatBac(number) {
    return ("" + number).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
}

export function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

export {
    // Redis
    redisClient,
};
