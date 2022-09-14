import fetch from "node-fetch";
import {CM_COOKIE} from "./constant.js";
import {getUserInfo} from "./member.js";
import {updateRuong} from "./chuyen-do.js";
import {chat, parse_chuc, resetMember, pmCbox, setItem, getItem, snake_case, setExpire, getKeys} from "../helper.js";

import cheerio from 'cheerio';

export async function changeChucVu(tcvId, chucVu, memberId) {
    //const memberId = args[1];
    //const chucVu = args[2]; 
    const basic = await getUserInfo(tcvId);
    const fromName = basic.name;
    const quyenHan = parse_chuc(chucVu);
    await changeCongHien(memberId, 0, quyenHan);
    await resetMember(memberId);
    chat(`${fromName} - Đã set /xga`);
}

export async function congCongHien(args, cboxId) {
    const memberId = args[1];
    const amount = args[2];
    const accountInfo = await getUserInfo(memberId, true);
    const quyenHan = parse_chuc(accountInfo.chucVu);
    await changeCongHien(memberId, amount, quyenHan);
    chat("Xong!");
}

export async function addDongThien(memberId) {
    const accountInfo = await getUserInfo(memberId, true);
    const quyenHan = parse_chuc(accountInfo.chucVu);
    await changeCongHien(memberId, 0, quyenHan, 1);
    chat("Xong!");
}

export async function changeCongHien(userid, amount, quyenHan, dongThien = 0) {
    const body = "btnDoiMemberBang=1&member_id=" + userid + "&txtTenMoi=&txtCongHien=" + amount + "&selQuyenHan=" + quyenHan + "&chkDongThien=" + dongThien;
    const referrer = "https://tutien.net/account/bang_phai/chap_su_duong/?txtMember=" + userid;
    const response = await fetch("https://tutien.net/account/bang_phai/chap_su_duong/", {
        "headers": {
            "accept": "*/*",
            "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "cookie": CM_COOKIE
        },
        referrer,
        "referrerPolicy": "strict-origin-when-cross-origin",
        body,
        "method": "POST",
        "mode": "cors"
    });
    return await response.text();
}

export async function vaoDuocVien(tcvId, toId) { 
    const accountInfo = await getUserInfo(toId, true);
    const quyenHan = 2;
    const toName = accountInfo.name;
    const body = "btnDoiMemberBang=1&member_id=" + toId + "&txtTenMoi=&txtCongHien=&selQuyenHan=" + quyenHan + "&chkDongThien=0";
    const referrer = "https://tutien.net/account/bang_phai/chap_su_duong/?txtMember=" + toId;
    const response = await fetch("https://tutien.net/account/bang_phai/chap_su_duong/", {
        "headers": {
            "accept": "*/*",
            "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "cookie": CM_COOKIE
        },
        referrer,
        "referrerPolicy": "strict-origin-when-cross-origin",
        body,
        "method": "POST",
        "mode": "cors"
    });
    const res = await response.text();
    console.log(res);
    if (res == '1') {
        await updateRuong(tcvId, "Thần Nông Lệnh", -1);
        chat(`Đã cho phép ${toName} vào Dược Viên.`); 
    } else {
        chat(res);
    }
    return;
}

export async function vaoDuocVienConfirmed(tcvId, toId) {
    //let toName = await getTcvNameFromTcvId(userid);
    //if (!toName) {
    const basic = await getUserInfo(tcvId);
    let fromName = basic.name;
    const basic2 = await getUserInfo(toId);
    let toName = basic2.name;
    let toBangPhai = basic2.bangPhai;
    //}
    const key = "ruong_do_ao_" + tcvId + "_than_nong_lenh";
    let ruong = await getItem(key); 

    if (!ruong) {
         chat(`${fromName} - Không có Thần Nông Lệnh để sử dụng.`);
        //await pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }

    ruong = JSON.parse(ruong);
    const thanNongLenh = !!ruong["Thần Nông Lệnh"] ? parseInt(ruong["Thần Nông Lệnh"]) : 0;
    if (thanNongLenh < 1) {
        chat(`${fromName} - Không có Thần Nông Lệnh để sử dụng.`);
        //await pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }
    let queueKeyVaoDuocVien = `queue_vao_duoc_vien_${tcvId}`;
    let queueDataVaoDuocVien = JSON.stringify({tcvId, toId});
    if (thanNongLenh > 0) {
        setItem(queueKeyVaoDuocVien, queueDataVaoDuocVien);
        setExpire(queueKeyVaoDuocVien, 15);
        if (toId === tcvId) {
            chat(`${fromName} - Sử dụng Thần Nông Lệnh vào Dược Viên (Y/N)?`);
        } else {
            chat(`${fromName} - Sử dụng Thần Nông Lệnh cho phép ${toName} vào Dược Viên (Y/N)?`);
        }
    } else {
        chat(`${fromName} - Không có Thần Nông Lệnh để sử dụng.`);
    }
}

export async function vaoDong(tcvId, toId) { 
    const accountInfo = await getUserInfo(toId, true);
    const quyenHan = parse_chuc(accountInfo.chucVu);
    const toName = accountInfo.name;
    const body = "btnDoiMemberBang=1&member_id=" + toId + "&txtTenMoi=&txtCongHien=&selQuyenHan=" + quyenHan + "&chkDongThien=1";
    const referrer = "https://tutien.net/account/bang_phai/chap_su_duong/?txtMember=" + toId;
    const response = await fetch("https://tutien.net/account/bang_phai/chap_su_duong/", {
        "headers": {
            "accept": "*/*",
            "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "cookie": CM_COOKIE
        },
        referrer,
        "referrerPolicy": "strict-origin-when-cross-origin",
        body,
        "method": "POST",
        "mode": "cors"
    });
    const res = await response.text();
    console.log(res);
    if (res == '1') {
        await updateRuong(tcvId, "Tiên Phủ Lệnh", -1);
        chat(`Đã cho phép ${toName} vào Động Thiên.`);
    } else {
        chat(res);
    }
    return;
}

export async function vaoDongConfirmed(tcvId, toId) {
    //let toName = await getTcvNameFromTcvId(userid);
    //if (!toName) {
    const basic = await getUserInfo(tcvId);
    let fromName = basic.name;
    const basic2 = await getUserInfo(toId);
    let toName = basic2.name;
    let toBangPhai = basic2.bangPhai;
    //}
    const key = "ruong_do_ao_" + tcvId + "_tien_phu_lenh";
    let ruong = await getItem(key);

    if (!ruong) {
         chat(`${fromName} - Không có Tiên Phủ Lệnh để sử dụng.`);
        //await pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }

    ruong = JSON.parse(ruong);
    const tienPhuLenh = !!ruong["Tiên Phủ Lệnh"] ? parseInt(ruong["Tiên Phủ Lệnh"]) : 0;
    if (tienPhuLenh < 1) {
        chat(`${fromName} - Không có Tiên Phủ Lệnh để sử dụng.`);
        //await pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }
    let queueKeyVaoDong = `queue_vao_dong_${tcvId}`;
    let queueDataVaoDong = JSON.stringify({tcvId, toId});
    if (tienPhuLenh > 0) {
        setItem(queueKeyVaoDong, queueDataVaoDong);
        setExpire(queueKeyVaoDong, 15);
        if (toId == tcvId) {
            chat(`${fromName} - Sử dụng Tiên Phủ Lệnh vào Động Thiên (Y/N)?`);
        } else {
            chat(`${fromName} - Sử dụng Tiên Phủ Lệnh cho phép ${toName} vào Động Thiên (Y/N)?`);
        }
    } else {
        chat(`${fromName} - Không có Tiên Phủ Lệnh để sử dụng.`);
    }
}

export async function searchCp(itemName, tcvName, isReturnCh = false) {
    const body = `btnTimCongPhap=1&txtTenCongPhap=${itemName}`;
    const response = await fetch("https://tutien.net/account/bang_phai/chap_su_duong/", {
        "headers": {
            "accept": "*/*",
            "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "cookie": CM_COOKIE
        },
        "referrer": "https://tutien.net/account/bang_phai/chap_su_duong/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": body,
        "method": "POST",
        "mode": "cors"
    });

    //const basic = await getUserInfo(tcvId);
    //const fromName = basic.name;

    const res = response.text();
    if (!res.includes("txtVatPham_")) {
        chat(res);
        return null;
    }

    // txtVatPham_32408_nhap
    const itemId = res.split("_nhap")[0].split("txtVatPham_")[1];
    const chs = res.split('value="');
    const nhap = 1;
    const xuat = 1;
    const name = res.split('</td>')[0].split('<td>')[1].trim();

    const key = 'bk_' + snake_case(name);
    await setItem(key, JSON.stringify({name, nhap, xuat, itemId}));
    if (isReturnCh) {
        return {name, nhap, xuat, itemId};
    }

    console.log({name, nhap, xuat, itemId});
    await setCh(itemId);
    //chat("Done!");
    chat(`${tcvName} - Đã set [img]https://love-thiduong.xyz/images/ETcmb.gif[/img]`);
}


export async function searchPk(itemName, tcvName, isReturnCh = false) {
    //const basic = await getUserInfo(tcvId);
    //const fromName = basic.name;
    
    const body = `btnTimPhapKhi=1&txtTenPhapKhi=${itemName}`;
    const response = await fetch("https://tutien.net/account/bang_phai/chap_su_duong/", {
        "headers": {
            "accept": "*/*",
            "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "cookie": CM_COOKIE
        },
        "referrer": "https://tutien.net/account/bang_phai/chap_su_duong/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": body,
        "method": "POST",
        "mode": "cors"
    });

    const res = await response.text();
    if (!res.includes("txtVatPham_")) {
        chat(res);
        return null;
    }
    
    const name = res.split('</td>')[0].split('<td>')[1].trim();
    const itemId = res.split("_nhap")[0].split("txtVatPham_")[1];
    const nhap = 1;
    const xuat = 1;

    const key = 'bk_' + snake_case(name);
    await setItem(key, JSON.stringify({name, nhap, xuat, itemId}));
    if (isReturnCh) {
        return {name, nhap, xuat, itemId};
    }

    await setCh(itemId);
    chat(`${tcvName} - Đã set [img]https://love-thiduong.xyz/images/ETcmb.gif[/img]`); 
}

export async function getFormCh() {
    const response = await fetch("https://tutien.net/account/bang_phai/chap_su_duong/", {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "en-US,en;q=0.9,vi;q=0.8",
            "cache-control": "max-age=0",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"96\", \"Google Chrome\";v=\"96\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": CM_COOKIE
        },
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET"
    });

    const body = await response.text();
    const $ = cheerio.load(body);
    const elements = $('input[id^="txtVatPham_"]');
    const form = ["btnCaiDat=Lưu"];
    for (let i = 0; i < elements.length; i++) {
        const elm = $(elements[i]);
        const elementId = elm.attr('id');
        const itemId = elementId.replace("txtVatPham_", "").split("_")[0];
        const type = elementId.replace(`txtVatPham_${itemId}_`, '');
        const ch = elm.val();
        form.push(`txtVatPham[${itemId}][${type}]=${ch}`);
    }

    return form.join('&');
}

export async function setCh(itemId) {
    const form = await getFormCh();
    const body = `${form}&txtVatPham[${itemId}][nhap]=1&txtVatPham[${itemId}][xuat]=1`;
    const response = await fetch("https://tutien.net/account/bang_phai/chap_su_duong/", {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
            "cache-control": "max-age=0",
            "content-type": "application/x-www-form-urlencoded",
            "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": CM_COOKIE
        },
        "referrer": "https://tutien.net/account/bang_phai/chap_su_duong/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": body,
        "method": "POST",
        "mode": "cors"
    });

    const res = await response.text();
    console.log(res);
}


export default {
    changeCongHien
}
