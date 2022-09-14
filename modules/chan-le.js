import {chat, pmCbox, getItem, getKeys, getTcvNameFromTcvId, setItem, formatBac} from '../helper.js';
import {updateRuong, napRuongTaiXiu, napRuongTaiXiu2} from "./chuyen-do.js";
import axios from "axios";
import {cap, viettat} from "./viettat.js";

export const getRandom = (min, max) => {
    max++;
    let bb = 0;
    for (let l = 1; l <= 10; l++) {
        bb = Math.floor(Math.random() * (max - min) ) + min;
    }
    return bb;
}

const getRuong = async tcvId => {
    const key = "ruong_do_ao_" + tcvId + "_*";
    const itemKeys = await getKeys(key);
    if (itemKeys.length === 0) {
        return null;
    }

    const items = {};
    for (let i = 0; i < itemKeys.length; i ++) {
        let item = await getItem(itemKeys[i]);
        if (item === "{}" || item === "") {
            await delKey(itemKeys[i]);
            continue;
        }

        item = JSON.parse(item);
        Object.assign(items, item);
    }

    return items;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const chanLe = async (tcvId, cboxId, fromName, curr, amount) => {
    const current = 'xỉu';
    let xiu;
    /*if (curr == current) {
        sed = true;
    } else {
        sed = false;
    }*/
    //const sed = curr ? false : true;

    const key = "ruong_do_ao_" + tcvId + "_bac";
    let ruong = await getItem(key);
    if (!ruong) {
         pmCbox(cboxId, 'Số dư không đủ để chơi.');
        //await pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }
    if (ruong === "") {
         pmCbox(cboxId, 'Số dư không đủ để chơi.');
        //await pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }

    ruong = JSON.parse(ruong);
    //const currentAmount = parseInt(ruong["bạc"]);
    if (ruong == null) {
        await setItem(key, 0);
        ruong['bạc'] = 0;
    }
    
    const currentAmount = parseInt(ruong['bạc'] == null ? 0 : parseInt(ruong['bạc'])); 
    if (currentAmount < amount) {
        pmCbox(cboxId, 'Số dư không đủ để chơi.');
        //await pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }

    if (amount < 1000) {
        pmCbox(cboxId, 'Chơi tối thiểu 1000 bạc.');
		return;
	}
	if (amount > 100000) {
		pmCbox(cboxId, 'Chơi tối đa 100.000 bạc.');
		return;
	}

    //const xx1 = getRandom(1, 6);
    //const xx2 = getRandom(1, 6);
    //const xx3 = getRandom(1, 6);

    const xx1 = Math.floor(1 + Math.random()*(6));
    const xx2 = Math.floor(1 + Math.random()*(6));
    const xx3 = Math.floor(1 + Math.random()*(6));
    const result = xx1 + xx2 + xx3 <=9 ? 'xỉu' : 'tài';
    if (result == curr) {
        //xiu = true;
        await napRuongTaiXiu(tcvId, amount);
        const sum = xx1 + xx2 + xx3;
        chat(`${xx1} + ${xx2} + ${xx3} = ${sum} ➻ ${fromName} [img]https://i.imgur.com/RMbC5Cf.gif[/img] Chúc mừng bạn đã chiến thắng và nhận được ${amount} bạc /votay`);
    } else {
        await napRuongTaiXiu2(tcvId, -amount);
        const sum = xx1 + xx2 + xx3;
        chat(`${xx1} + ${xx2} + ${xx3} = ${sum} ➻ ${fromName} [img]https://i.imgur.com/RMbC5Cf.gif[/img] Giờ ta chẳng còn chi, mãi trắng tay mà thôi /nhac`);
    }
}

export const dice = async (tcvId, fromName) => {
    const xx1 = Math.floor(1 + Math.random()*(6));
    const xx2 = Math.floor(1 + Math.random()*(6));
    const xx3 = Math.floor(1 + Math.random()*(6));
    const result = xx1 + xx2 + xx3;
    chat(`${xx1} + ${xx2} + ${xx3} [img]https://i.imgur.com/RMbC5Cf.gif[/img] ${fromName} đổ xúc xắc được ${result} điểm.`);
}
