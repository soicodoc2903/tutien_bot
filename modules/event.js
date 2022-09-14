import {chat, getItem, getKeys, getTcvNameFromTcvId, setItem, formatBac} from '../helper.js';
import {updateRuong} from "./chuyen-do.js";
import axios from "axios";

const getRndInteger = (min, max) => {
  return Math.floor(Math.random() * (max - min) ) + min;
}

const MAX_BAC = 20220;
const LUCKY_NUMBER = 22;

export const bacQuyEvent = async () => {
    let quyEvent = await getItem('quy_event');
    //console.log('quyEvent', quyEvent);
    quyEvent = parseInt(quyEvent);
    if (quyEvent == null || quyEvent == "NaN" || quyEvent == NaN) {
        await setItem('quy_event', 0);
        quyEvent = 0;
    }
    let bacEvent = quyEvent ? parseInt(quyEvent) : 0;
    if (bacEvent < 0) {
        await setItem('quy_event', 0);
        quyEvent = 0;
    }
    //console.log(bacEvent);
    chat(`Quỹ Event còn lại: ${formatBac(bacEvent)} bạc.`);
    return;
}

export const napQuyEvent = async (tcvId, amount) => {
    let fromName = await getTcvNameFromTcvId(tcvId);
    
    let quyEvent = await getItem('quy_event');
    quyEvent = parseInt(quyEvent);
    if (quyEvent == null || quyEvent == "NaN" || quyEvent == NaN) {
        await setItem('quy_event', 0);
        quyEvent = 0;
    }
    //let bacEvent = quyEvent ? parseInt(quyEvent) : 0;
    await setItem('quy_event', quyEvent + amount);
    await chat(`${fromName} - Đã nạp ${formatBac(amount)} bạc vào Quỹ Event.`);
    //await pmCbox(fromCbox, `Đã nạp ${amount} ${item} cho ${toName}`);
}

export const checkEvent = async () => {
    var today = new Date().getDate();
    //var month = new Date().getMonth();
    if (today < 10) {
        today = '0' + today;
    }
    var m = new Array();
    m[0] = "01";
    m[1] = "02";
    m[2] = "03";
    m[3] = "04";
    m[4] = "05";
    m[5] = "06";
    m[6] = "07";
    m[7] = "08";
    m[8] = "09";
    m[9] = "10";
    m[10] = "11";
    m[11] = "12";
    var month = m[new Date().getMonth()];
    const preKey = `_${today}_${month}_lixi`;
    const keys = await getKeys(`*${preKey}`);
    const items = [`Danh sách mở bao lì xì ngày ${today}/${month}:`];
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const bac = await getItem(key);
        const accountId = key.replace(preKey, '');
        const accountName = await getTcvNameFromTcvId(accountId);
    	const bacText = `${bac} bạc`.padEnd(11);
        items.push(`✦ ${accountName} mở được ${bacText}`);
    }

    chat(items.join('[br]'));
}

export const haiLoc = async (tcvId) => {
    const fromName = await getTcvNameFromTcvId(tcvId);
    var today = new Date().getDate(); 
    if (today < 10) {
        today = '0' + today;
    }
    var m = new Array();
    m[0] = "01";
    m[1] = "02";
    m[2] = "03";
    m[3] = "04";
    m[4] = "05";
    m[5] = "06";
    m[6] = "07";
    m[7] = "08";
    m[8] = "09";
    m[9] = "10";
    m[10] = "11";
    m[11] = "12";
    var month = m[new Date().getMonth()];
    let isNhanLiXi = await getItem(`${tcvId}_${today}_${month}_baolixi`); 
    let baoLiXi = isNhanLiXi ? parseInt(isNhanLiXi) : 0;
    if (isNhanLiXi) {
        chat(`${fromName} đã tham gia hái lộc trong ngày nên không thể tham gia lại.`);
        return;
    } else {
        baoLiXi += 1;
        await setItem(`${tcvId}_${today}_${month}_baolixi`, baoLiXi);
        chat(`${fromName} vừa hái được 1 [img]https://love-thiduong.xyz/images/baolixi.png[/img]`);
    }
}

export const moLiXi = async (tcvId) => {
    const fromName = await getTcvNameFromTcvId(tcvId); 
    var today = new Date().getDate();
    var month = new Date().getMonth();
    if (today < 10) {
        today = '0' + today;
    }
    var m = new Array();
    m[0] = "01";
    m[1] = "02";
    m[2] = "03";
    m[3] = "04";
    m[4] = "05";
    m[5] = "06";
    m[6] = "07";
    m[7] = "08";
    m[8] = "09";
    m[9] = "10";
    m[10] = "11";
    m[11] = "12";
    var month = m[new Date().getMonth()];
    const isNhanLiXi = await getItem(`${tcvId}_${today}_${month}_baolixi`);
    const nhanLiXi = await getItem(`${tcvId}_${today}_${month}_lixi`);
    /*if (isNhanLiXi == null || isNhanLiXi == "NaN" || isNhanLiXi == NaN) {
        await setItem(`${tcvId}_${today}_${month}_lixi`, 0);
        isNhanLiXi = 0;
    }*/
    let baoLiXi = isNhanLiXi ? parseInt(isNhanLiXi) : 0;
    if (baoLiXi === 0 || baoLiXi === null || nhanLiXi) {
        chat(`${fromName} không có [img]https://love-thiduong.xyz/images/baolixi.png[/img] mà mở cái gì /gach`);
        return;
    }
    if (baoLiXi === 1) {
        const randomNumber = getRndInteger(0,100);
        const isLuckyNumber = randomNumber === LUCKY_NUMBER;
        let quyEvent = await getItem('quy_event');
        quyEvent = parseInt(quyEvent);
        
        if (isLuckyNumber) {
            if (quyEvent <= 0) {
                chat(`${fromName} vừa mở [img]https://love-thiduong.xyz/images/baolixi.png[/img] nhận được ${formatBac(MAX_BAC)} bạc nhưng trong lúc mang bảo vật về động phủ đã bị đạo tặc cướp mất /denm`);
                await setItem(`${tcvId}_${today}_${month}_lixi`, 0);
                return;
            } else if (quyEvent < MAX_BAC) {
                chat(`${fromName} [class=tukim]vừa mở [img]https://love-thiduong.xyz/images/baolixi.png[/img] nhận được ${formatBac(quyEvent)} bạc[/class] /phao`);
                await updateRuong(tcvId, 'bạc', quyEvent, true);
                await setItem('quy_event', 0);
                await setItem(`${tcvId}_${today}_${month}_lixi`, quyEvent);
                const key = "ruong_do_ao_" + tcvId + "_bac";
                let ruong = await getItem(key);

                ruong = JSON.parse(ruong);
                const soDu = parseInt(ruong["bạc"]);
                axios({
                    method: "POST",
                    url: "https://soi-tcvtool.xyz/truyencv/member/add-log-bac",
                    data: {
                        "tcvId": tcvId,
                        "updown": "+",
                        "amount": quyEvent,
                        "sodu": soDu,
                        "action": "Mở bao lì xì",
                    }
                });
                return;
            } else {
                chat(`${fromName} [class=tukim]vừa mở [img]https://love-thiduong.xyz/images/baolixi.png[/img] nhận được ${MAX_BAC} bạc[/class] /phao`);
                await updateRuong(tcvId, 'bạc', MAX_BAC, true);
                await setItem('quy_event', quyEvent-MAX_BAC);
                await setItem(`${tcvId}_${today}_${month}_lixi`, MAX_BAC);
                const key = "ruong_do_ao_" + tcvId + "_bac";
                let ruong = await getItem(key);

                ruong = JSON.parse(ruong);
                const soDu = parseInt(ruong["bạc"]);
                axios({
                    method: "POST",
                    url: "https://soi-tcvtool.xyz/truyencv/member/add-log-bac",
                    data: {
                        "tcvId": tcvId,
                        "updown": "+",
                        "amount": MAX_BAC,
                        "sodu": soDu,
                        "action": "Mở bao lì xì",
                    }
                });
            } 
                return;
        }
 
        const bacAmount = getRndInteger(100, 4567);
        if (quyEvent <= 0) {
            chat(`${fromName} vừa mở [img]https://love-thiduong.xyz/images/baolixi.png[/img] nhận được ${formatBac(bacAmount)} bạc nhưng trong lúc mang bảo vật về động phủ đã bị đạo tặc cướp mất /denm`);
            await setItem(`${tcvId}_${today}_${month}_lixi`, 0);
            return;
        } else if (quyEvent < bacAmount) {
            chat(`${fromName} [class=tukim]vừa mở [img]https://love-thiduong.xyz/images/baolixi.png[/img] nhận được ${formatBac(quyEvent)} bạc[/class] /phao`);
            await updateRuong(tcvId, 'bạc', quyEvent, true);
            await setItem('quy_event', 0);
            await setItem(`${tcvId}_${today}_${month}_lixi`, quyEvent);
            const key2 = "ruong_do_ao_" + tcvId + "_bac";
            let ruong2 = await getItem(key2);

            ruong2 = JSON.parse(ruong2);
            const soDu2 = parseInt(ruong2["bạc"]);
            axios({
                method: "POST",
                url: "https://soi-tcvtool.xyz/truyencv/member/add-log-bac",
                data: {
                    "tcvId": tcvId,
                    "updown": "+",
                    "amount": quyEvent,
                    "sodu": soDu2,
                    "action": "Mở bao lì xì",
                }
            });
            return;
        } else {
            chat(`${fromName} [class=tukim]vừa mở [img]https://love-thiduong.xyz/images/baolixi.png[/img] nhận được ${bacAmount} bạc[/class] /phao`);
            await updateRuong(tcvId, 'bạc', bacAmount, true);
            await setItem('quy_event', quyEvent-bacAmount);
            await setItem(`${tcvId}_${today}_${month}_lixi`, bacAmount);
            const key2 = "ruong_do_ao_" + tcvId + "_bac";
            let ruong2 = await getItem(key2);

            ruong2 = JSON.parse(ruong2);
            const soDu2 = parseInt(ruong2["bạc"]);
            axios({
                method: "POST",
                url: "https://soi-tcvtool.xyz/truyencv/member/add-log-bac",
                data: {
                    "tcvId": tcvId,
                    "updown": "+",
                    "amount": bacAmount,
                    "sodu": soDu2,
                    "action": "Mở bao lì xì",
                }
            });
        } 
    }
}

