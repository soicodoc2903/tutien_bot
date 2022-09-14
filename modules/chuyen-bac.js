import fetch from "node-fetch";
import axios from "axios";
import {BANK_COOKIE, MAX_CHUYEN_BAC} from "./constant.js";
import {chat, getItem, getTcvNameFromTcvId, pmCbox, formatBac, setItem, setExpire, getTtl, getKeys} from "../helper.js";
import {updateRuong} from "./chuyen-do.js";
import {getUserInfo} from "./member.js";
import {log} from "./winston.js";

export async function chuyenRuong(fromId, fromCboxId, toId, amount) {
    
    //let toName = await getTcvNameFromTcvId(toId);
    //if (!toName) {
    //    const basic = await getUserInfo(toId);
    //    toName = basic.name;
    //}
    const basic = await getUserInfo(toId);
    const toName = basic.name;
    const toBangPhai = basic.bangPhai;

    let fromName = await getTcvNameFromTcvId(fromId);
    if (!fromName) {
        const basic2 = await getUserInfo(toId);
        fromName = basic2.name;
    }
    const key = "ruong_do_ao_" + fromId + "_bac";
    let ruong = await getItem(key);
    if (!ruong) {
         chat(`${fromName} - Số dư không đủ để thực hiện giao dịch này.`);
        //await pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }
    if (ruong === "") {
         chat(`${fromName} - Số dư không đủ để thực hiện giao dịch này.`);
        //await pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }

    ruong = JSON.parse(ruong);
    //const currentAmount = parseInt(ruong["bạc"]);
    if (ruong == null) {
        await setItem(key, 0);
        ruong = 0;
    }
    
    const currentAmount = parseInt(ruong['bạc'] == null ? 0 : parseInt(ruong['bạc']));
    //const currentAmount = !!ruong["bạc"] ? parseInt(ruong["bạc"]) : 0;
    //if (currentAmount == null || currentAmount == '' || currentAmount == NaN || currentAmount == 'NaN') {
    //    currentAmount = 0;
    //}
    //const currentAmount = ruong ? parseInt(ruong) : 0;
    if (currentAmount < amount) {
        chat(`${fromName} - Số dư không đủ để thực hiện giao dịch này.`);
        //await pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }

    const today = new Date().getDate();
    const month = new Date().getMonth();
    //let item = 0;
    let item = await getItem(`${fromId}_${today}_${month}_luot_chuyen`);
    item = parseInt(item);
    let total = amount;
    if (item >= 3) {
        total *= 1;
        total += (item + 1) * 100;
    } else {
        total *= 1;
    }

    let soDu = currentAmount - total;
    let phiChuyen = total - amount;
    let queueKeyRuong = `queue_chuyen_ruong_${fromId}`;
    let queueDataRuong = JSON.stringify({fromId, fromCboxId, toId, amount, total});
    
    //const url = `https://soi-tcvtool.xyz/truyencv/member/${toId}`;
    //const response = await fetch(url, {
    //    "headers": {
    //        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    /*        "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
            "cache-control": "max-age=0",
            "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1"
        },
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors"
    });
    const body = await response.json();
    const name = body.name;
    const bp = body.bang_phai;*/
    
    axios.get(`https://soi-tcvtool.xyz/truyencv/member/${toId}`).then(
        response => { 
            const name = response.data.name;
            const bp = response.data.bang_phai;
            
            if (name === '') {
                chat(`Thành viên ID: ${toId} không tồn tại.`);
                return;
            }
            if (name !== '' && bp === 'Chưa gia nhập bang phái') {
                chat(`${fromName} - Chuyển ${formatBac(amount)} số dư ([color=red]Không phải bạc[/color]) cho ${toName} ([url=https://tutien.net/member/${toId}]${toId}[/url]) - [color=red]Không có bang[/color] (Y/N)?[br][Phí dịch vụ: ${phiChuyen} bạc][br][color=red]Giao dịch này cần chờ 5s để xác nhận[/color]`);
                setTimeout(function () {
                    setItem(queueKeyRuong, queueDataRuong);
                    setExpire(queueKeyRuong, 15);  
                }, 5000);
                return;
            }
            if (name !== '' && bp !== 'Vô Cực Ma Tông') {
                chat(`${fromName} - Chuyển ${formatBac(amount)} số dư ([color=red]Không phải bạc[/color]) cho ${toName} ([url=https://tutien.net/member/${toId}]${toId}[/url]) - [color=red]Không thuộc bang Vô Cực[/color] (Y/N)?[br][Phí dịch vụ: ${phiChuyen} bạc][br][color=red]Giao dịch này cần chờ 5s để xác nhận[/color]`);
                setTimeout(function () {
                    setItem(queueKeyRuong, queueDataRuong);
                    setExpire(queueKeyRuong, 15); 
                }, 5000); 
                return;
            }
            if (name !== '' && bp === 'Vô Cực Ma Tông') {
                setItem(queueKeyRuong, queueDataRuong);
                setExpire(queueKeyRuong, 15);
                pmCbox(fromCboxId, `Chuyển ${formatBac(amount)} số dư ([color=red]Không phải bạc[/color]) cho ${toName} ([url=https://tutien.net/member/${toId}]${toId}[/url]) (Y/N)?[br]Số dư còn lại: ${formatBac(soDu)} [Phí dịch vụ: ${phiChuyen} bạc]`);
            }
         }
       )
       .catch(error => {
            chat(`${fromName} - Chuyển ${formatBac(amount)} số dư ([color=red]Không phải bạc[/color]) cho [color=red]Lỗi hệ thống, tự check[/color] ([url=https://tutien.net/member/${toId}]${toId}[/url]) (Y/N)?[br][Phí dịch vụ: ${phiChuyen} bạc][br][color=red]Giao dịch này cần chờ 5s để xác nhận[/color]`);
                setTimeout(function () {
                    setItem(queueKeyRuong, queueDataRuong);
                    setExpire(queueKeyRuong, 15); 
                }, 5000); 
                return;
        }
      );
    
    
    //await setItem(queueKeyRuong, queueDataRuong);
    //await setExpire(queueKeyRuong, 15);
    //pmCbox(fromCboxId, `Chuyển ${formatBac(amount)} số dư ([color=red]Không phải bạc[/color]) cho ${toName} ([url=https://tutien.net/member/${toId}]${toId}[/url]) (Y/N)?[br]Số dư còn lại: ${soDu}`);
 
    //await updateRuong(fromId, "bạc", -1 * amount);
    //await updateRuong(toId, "bạc", amount);
    //chat(`${fromName} - Xong [img]https://love-thiduong.xyz/images/ETcmb.gif[/img]`);
}

export async function chuyenBacFromUser(fromId, fromCboxId, toId, amount) {
    //let toName = await getTcvNameFromTcvId(toId);
    //if (!toName) {
    const basic = await getUserInfo(toId);
    const toName = basic.name;
    const toBangPhai = basic.bangPhai;

    //console.log(basic);
    //}
    let fromName = await getTcvNameFromTcvId(fromId);
    if (!fromName) {
        const basic2 = await getUserInfo(toId);
        fromName = basic2.name;
    }
    if (amount < 1000) {
        chat(`${fromName} - Số bạc cần chuyển phải lớn hơn 1000.`);
        //await pmCbox(fromCboxId, '[b][color=red]Chuyển tối thiểu 1000 bạc[/color][/b] :@');
        return;
    }
    
    /*
    if (amount > MAX_CHUYEN_BAC) {
        await pmCbox(fromCboxId, `[b][color=red]Chuyển tối đa ${MAX_CHUYEN_BAC} bạc[/color][/b] :@`);
        return;
    }
    */

    const key = "ruong_do_ao_" + fromId + "_bac";
    let ruong = await getItem(key);
    if (!ruong) {
         chat(`${fromName} - Số dư không đủ để thực hiện giao dịch này.`);
        //await pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }
    if (ruong === "") {
         chat(`${fromName} - Số dư không đủ để thực hiện giao dịch này.`);
        //await pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }

    ruong = JSON.parse(ruong);
    if (ruong == null) {
        await setItem(key, 0);
        ruong = 0;
    }
    const currentAmount = parseInt(ruong['bạc'] == null ? 0 : parseInt(ruong['bạc']));
    //const currentAmount = !!ruong["bạc"] ? parseInt(ruong["bạc"]) : 0;
    //const currentAmount = parseInt(ruong);
    //if (currentAmount == null || currentAmount == '' || currentAmount == NaN || currentAmount == 'NaN') {
    //    currentAmount = 0;
    //}
    
    //const currentAmount = ruong ? parseInt(ruong) : 0;
    let total = amount;
    //if (amount < 50000) {
    //    total *= 1.02;
    //    total += 500;
    //} else {
    //total *= 1.03;
    //}
    const today = new Date().getDate();
    const month = new Date().getMonth();
    //let item = 0;
    let item = await getItem(`${fromId}_${today}_${month}_luot_chuyen`);
    item = parseInt(item);
    if (item >= 3) {
        total *= 1;
        total += (item + 1) * 100;
    } else {
        total *= 1;
    }
    
    if (currentAmount < total) {
         chat(`${fromName} - Số dư không đủ để thực hiện giao dịch này.`);
        //await pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }
    
    const phiChuyen = total - amount;
    const soDu = currentAmount - total;
    const queueKey = `queue_chuyen_bac_${fromId}`;
    const queueData = JSON.stringify({fromId, fromCboxId, toId, amount, total});
    //const url = `https://soi-tcvtool.xyz/truyencv/member/${toId}`;
    //const response = await fetch(url, {
    //    "headers": {
    //        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    /*        "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
            "cache-control": "max-age=0",
            "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1"
        },
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors"
    });
    const body = await response.json(); 
    const name = body.name;
    const bp = body.bang_phai;*/
    //setItem(queueKey, queueData);
    //setExpire(queueKey, 15);
    //pmCbox(fromCboxId, `Chuyển ${formatBac(amount)} bạc cho ${toName} ([url=https://tutien.net/member/${toId}]${toId}[/url]) (Y/N)?[br]Số dư còn lại: ${soDu} [Phí dịch vụ: ${phiChuyen} bạc]`);  
            
    axios.get(`https://soi-tcvtool.xyz/truyencv/member/${toId}`).then(
        response => {
            const name = response.data.name;
            const bp = response.data.bang_phai;
            if (name === '') {
                chat(`Thành viên ID: ${toId} không tồn tại.`);
                return;
            }
            if (name !== '' && bp === 'Chưa gia nhập bang phái') {
                chat(`${fromName} - Chuyển ${formatBac(amount)} bạc cho ${toName} ([url=https://tutien.net/member/${toId}]${toId}[/url]) - [color=red]Không có bang[/color] (Y/N)?[br][Phí dịch vụ: ${phiChuyen} bạc][br][color=red]Giao dịch này cần chờ 5s để xác nhận[/color]`);
                setTimeout(function () {
                    setItem(queueKey, queueData);
                    setExpire(queueKey, 15);  
                }, 5000);
                return;
            }
            if (name !== '' && bp !== 'Vô Cực Ma Tông') {
                chat(`${fromName} - Chuyển ${formatBac(amount)} bạc cho ${toName} ([url=https://tutien.net/member/${toId}]${toId}[/url]) - [color=red]Không thuộc bang Vô Cực[/color] (Y/N)?[br][Phí dịch vụ: ${phiChuyen} bạc][br][color=red]Giao dịch này cần chờ 5s để xác nhận[/color]`);
                setTimeout(function () {
                    setItem(queueKey, queueData);
                    setExpire(queueKey, 15); 
                }, 5000); 
                return;
            }
            if (name !== '' && bp === 'Vô Cực Ma Tông') {
                setItem(queueKey, queueData);
                setExpire(queueKey, 15);
                pmCbox(fromCboxId, `Chuyển ${formatBac(amount)} bạc cho ${toName} ([url=https://tutien.net/member/${toId}]${toId}[/url]) (Y/N)?[br]Số dư còn lại: ${formatBac(soDu)} [Phí dịch vụ: ${phiChuyen} bạc]`); 
            }
        })
        .catch(error => {
            chat(`${fromName} - Chuyển ${formatBac(amount)} bạc cho [color=red]Lỗi hệ thống, tự check[/color] ([url=https://tutien.net/member/${toId}]${toId}[/url]) (Y/N)?[br][Phí dịch vụ: ${phiChuyen} bạc][br][color=red]Giao dịch này cần chờ 5s để xác nhận[/color]`);
            setTimeout(function () {
                setItem(queueKey, queueData);
                setExpire(queueKey, 15); 
            }, 5000); 
            return;
    });
    /*
    const fromName = await getTcvNameFromTcvId(fromId);
    await updateRuong(fromId, "bạc", -1 * total);
    const isSuccess = await chuyenBac(fromId, toId, amount);
    if (isSuccess) {
        let toName = await getTcvNameFromTcvId(toId);
        if (!toName) {
            const basic = await getUserInfo(toId);
            toName = basic.name;
        }

        chat(`@${fromName} Đã chuyển ${formatBac(amount)} bạc cho ${toName} ([url=https://tutien.net/member/${toId}]${toId}[/url])`);
        return;
    }

    chat(`@${fromName} Có lỗi xảy ra, bạn được nhận lại bạc!`);
    await updateRuong(fromId, "bạc", total);
    */
    //setInterval(async () => {
       
    //},1000);*/
}

export async function chuyenBacConfirmed(fromId, fromCboxId, toId, amount, total) {
    const fromName = await getTcvNameFromTcvId(fromId);
    const toName = await getTcvNameFromTcvId(toId);
    await updateRuong(fromId, "bạc", -1 * total);
    const key = "ruong_do_ao_" + fromId + "_bac";
    let ruong = await getItem(key);
    //const soDu = ruong ? parseInt(ruong) : 0;
    if (ruong == null) {
        await setItem(key, 0);
        ruong = 0;
    }
    ruong = JSON.parse(ruong);
    const soDu = parseInt(ruong['bạc'] == null ? 0 : parseInt(ruong['bạc']));
    //const soDu = !!ruong["bạc"] ? parseInt(ruong["bạc"]) : 0;
    //let soDu = parseInt(ruong["bạc"]);
    //if (soDu == null || soDu == '') {
    //    soDu = 0;
    //}
    if (toId == 445566) {
        chat(`${fromName} - Xin nha /ngai`);
        const basic1 = await getUserInfo(toId);
        let toName1 = basic1.name;
        const today = new Date().getDate();
        const month = new Date().getMonth();
        //let luotchuyen = 0;
        let item = await getItem(`${fromId}_${today}_${month}_luot_chuyen`);
        if (item == null || item == "NaN" || item == NaN) {
            await setItem(`${fromId}_${today}_${month}_luot_chuyen`, 0);
            item = 0;
        }
        let luotchuyen = item ? parseInt(item) : 0;
        //let luotchuyen = parseInt(item);
        luotchuyen += 1;        
        await setItem(`${fromId}_${today}_${month}_luot_chuyen`, luotchuyen); 
        
        axios({
            method: "POST",
            url: "https://soi-tcvtool.xyz/truyencv/member/add-log-bac",
            data: {
                "tcvId": fromId,
                "updown": "-",
                "amount": total,
                "sodu": soDu,
                "action": `Chuyển bạc cho ${toName1} (${toId})`,
            }
        });
         
        return;
    }
    const isSuccess = await chuyenBac(fromId, toId, amount);
    console.log(isSuccess);
    if (isSuccess === '1') {
        let toName = await getTcvNameFromTcvId(toId);
        if (!toName) {
            const basic = await getUserInfo(toId);
            toName = basic.name;
        }
        chat(`${fromName} - Xong [img]https://love-thiduong.xyz/images/ETcmb.gif[/img]`);
        
        axios({
            method: "POST",
            url: "https://soi-tcvtool.xyz/truyencv/member/add-log-bac",
            data: {
                "tcvId": fromId,
                "updown": "-",
                "amount": total,
                "sodu": soDu,
                "action": `Chuyển bạc cho ${toName} (${toId})`,
            }
        });

        const today = new Date().getDate();
        const month = new Date().getMonth();
        //let luotchuyen = 0;
        let item = await getItem(`${fromId}_${today}_${month}_luot_chuyen`);
        if (item == null || item == "NaN" || item == NaN) {
            await setItem(`${fromId}_${today}_${month}_luot_chuyen`, 0);
            item = 0;
        }
        let luotchuyen = item ? parseInt(item) : 0;
        //let luotchuyen = parseInt(item);
        luotchuyen += 1;        
        await setItem(`${fromId}_${today}_${month}_luot_chuyen`, luotchuyen);
        
        //chat(''+fromName+' - Xong [img]https://love-thiduong.xyz/images/ETcmb.gif[/img]');
        //chat(`${fromName} Đã chuyển ${formatBac(amount)} bạc cho ${toName} ([url=https://tutien.net/member/${toId}]${toId}[/url])`);
        return;
    }
    chat(isSuccess);
    //chat(`${fromName} - Có lỗi xảy ra, vui lòng thực hiện lại.`);
    await updateRuong(fromId, "bạc", total);
}

export async function chuyenRuongConfirmed(fromId, fromCboxId, toId, amount, total) {
    const fromName = await getTcvNameFromTcvId(fromId);
    let toName = await getTcvNameFromTcvId(toId);
    if (!toName) {
        const basic = await getUserInfo(toId);
        toName = basic.name;
    }
    
    await updateRuong(fromId, "bạc", -1 * total);
    await updateRuong(toId, "bạc", amount);
    chat(`${fromName} - Xong [img]https://love-thiduong.xyz/images/ETcmb.gif[/img]`);
    const key = "ruong_do_ao_" + fromId + "_bac";
    let ruong = await getItem(key);
    //const soDu = ruong ? parseInt(ruong) : 0;
    
    if (ruong == null) {
        await setItem(key, 0);
        ruong = 0;
    }
    ruong = JSON.parse(ruong);
    const soDu = parseInt(ruong['bạc'] == null ? 0 : parseInt(ruong['bạc']));
    //const soDu = !!ruong["bạc"] ? parseInt(ruong["bạc"]) : 0;
    //const soDu = parseInt(ruong);
    //if (soDu == null || soDu == '' || soDu == NaN || soDu == 'NaN') {
    //    soDu = 0;
    //}
   
    const key1 = "ruong_do_ao_" + toId + "_bac";
    let ruong1 = await getItem(key1);
    //const soDu1 = ruong1 ? parseInt(ruong1) : 0;
    if (ruong1 == null) {
        await setItem(key, 0);
        ruong1 = 0;
    }
    ruong1 = JSON.parse(ruong1);
    const soDu1 = parseInt(ruong1['bạc'] == null ? 0 : parseInt(ruong1['bạc']));
    //const soDu1 = !!ruong1["bạc"] ? parseInt(ruong1["bạc"]) : 0;
    //const soDu1 = parseInt(ruong1);
    //if (soDu1 == null || soDu1 == '' || soDu1 == NaN || soDu1 == 'NaN') {
    //    soDu1 = 0;
    //}
    axios({
        method: "POST",
        url: "https://soi-tcvtool.xyz/truyencv/member/add-log-bac",
        data: {
            "tcvId": fromId,
            "updown": "-",
            "amount": total,
            "sodu": soDu,
            "action": `Chuyển số dư cho ${toName} (${toId})`,
        }
    });
    axios({
        method: "POST",
        url: "https://soi-tcvtool.xyz/truyencv/member/add-log-bac",
        data: {
            "tcvId": toId,
            "updown": "+",
            "amount": amount,
            "sodu": soDu1,
            "action": `Nhận số dư từ ${fromName} (${fromId})`,
        }
    });
    const today = new Date().getDate();
    const month = new Date().getMonth();
    let item = await getItem(`${fromId}_${today}_${month}_luot_chuyen`);
    if (item == null || item == "NaN" || item == NaN) {
        await setItem(`${fromId}_${today}_${month}_luot_chuyen`, 0);
        item = 0;
    }
    let luotchuyen = item ? parseInt(item) : 0;
    luotchuyen += 1;        
    await setItem(`${fromId}_${today}_${month}_luot_chuyen`, luotchuyen); 
        

    return;
}

export async function chuyenBac(fromId, toId, amount, cookie = BANK_COOKIE) {
    const referrer = `https://tutien.net/member/${toId}`;
    const body = `btntangNganLuong=1&txtMoney=${amount}&member=${toId}`;
    const response = await fetch("https://tutien.net/index.php", {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,vi;q=0.8",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "cookie": cookie
        },
        referrer,
        "referrerPolicy": "strict-origin-when-cross-origin",
        body,
        "method": "POST",
        "mode": "cors"
    });

    const res = await response.text();
    if (res == '1') { 
        log.info(`[success] ${amount} bạc: ${fromId} => ${toId}`)
    } else { 
        log.info(`[false] ${amount} bạc: ${fromId} => ${toId}`);
    }
    return res;
    //return res === '1';
}

export default {
    chuyenBac
}
