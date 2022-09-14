import fetch from "node-fetch";
import axios from "axios";
import {CM_COOKIE, USER_COOKIES} from "./constant.js";
import cheerio from 'cheerio';
import {
    getCboxIdFromTcvId,
    getPks,
    pmCbox,
    pmTcv,
    setBasic,
    chat,
    setPks,
    setTcvUsername,
    formatBac,
    snake_case,
    convert_vnese_2_eng
} from "../helper.js";
import {cap} from "./viettat.js";
export function decodeUtf16(t) {
    let w = "";
    const v = "\\\\u"
    return t.replace(new RegExp(v + "([0-9a-fA-F]{4})", "g"), function (u, x) {
        w = parseInt(x, 16);
        return String.fromCharCode(w)
    }).replaceAll("\\\/", "-");
}

// Get user info
export async function getUserInfo(userid, basicOnly = true) {
    const url = "https://tutien.net/member/" + userid;
    const response = await fetch(url, {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
            "cache-control": "max-age=0",
            "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": CM_COOKIE
        },
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors"
    });

    const body = await response.text();
    const $ = cheerio.load(body);

    let bangPhai = '';
    let chucVu = '';
    const name = $('h2.name').text().trim();
    const bac = $($('.statistic .item-value')[2]).text().trim();
    const overviews = $('.block-detail-sidebar-author .overview');
    if (overviews.length >= 4) {
        bangPhai = $(overviews[1]).text().trim();
        chucVu = $(overviews[2]).text().trim();
    }

    if (!chucVu) {
        chucVu = 'Tạp Dịch';
    }
    const basic = {id: userid, name, bac, bangPhai, chucVu};
    await setBasic(basic);
    await setTcvUsername(userid, name);
    if (basicOnly) {
        return basic;
    }

    const items = $('[id^="suaphapkhi"]');
    const pks = [];
    items.each((index, item) => {
        const j = $(item);
        const name = j.find('.text-warning').text().trim();
        const chkItem = j.find('input[name="chkItem"]').first().val();
        const price = j.find('p > small').first().text().trim();
        pks.push({name, chkItem, price});
    });

    basic.pks = pks;
    await setPks(userid, pks);
    return basic;
}

// Check phap khi
export async function checkPhapKhi(userid, toId) {
    const userDetail = await getUserInfo(toId, false);
    const pks = userDetail.pks;
    const messages = ["Danh sách pháp khí đang sử dụng:"];
    for (let i = 0; i < pks.length; i++) {
        const pk = pks[i];
        messages.push(`༶ ${cap(pk.name)}: ${cap(pk.price)}`);
    }

    const response = messages.join("[br]");
    const cboxId = await getCboxIdFromTcvId(userid);
    pmCbox(cboxId, response);
    return 1;
}

// Sua phap khi
export async function suaPhapKhi(userid, toId, itemName) {
    const memberUrl = "https://tutien.net/member/" + toId;
    const userDetail = await getUserInfo(toId, false);
    const basic = await getUserInfo(userid, false);
    const fromName = basic.name;
    const pks = userDetail.pks;
    const pk = pks.find((item) => item.name.toLowerCase().includes(itemName));
    if (!pk) {
        chat(`${fromName} - Không tìm thấy pháp khí ${cap(itemName)}`);
        //pmTcv(userid, `Không tìm thấy pháp khí ${itemName}`);
        return;
    }

    const form = "btnSuaPhapKhi=1&chkItem=" + pk.chkItem;
    const response = await fetch(memberUrl, {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"96\", \"Google Chrome\";v=\"96\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "cookie": CM_COOKIE,
        },
        "body": form,
        "method": "POST"
    });

    const body = await response.text();
    if (body == '1') {
        chat(`${fromName} - Xong /xga`);
        //pmTcv(userid, 'Xong!');
    } else {
        chat(`${body}`);
        //pmTcv(userid, body);
    }
    return;
}

export async function getLogBac(memberId) {
    const url = `https://soi-tcvtool.xyz/truyencv/member/${memberId}/get-log-bac`;
    const response = await fetch(url, {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
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

    const body = await response.text();
    //console.log(decodeUtf16(body));
    //if (body['success'] == 1) {
    //    return body['data']['BAC'];
    //}

    return decodeUtf16(body).replace('"', '');
}

export async function checkBank() {
    try {
        const response = await axios.get(`https://soi-tcvtool.xyz/truyencv/member/445566`);
        const amount = await response.data.tai_san;
        chat(`Ngân quỹ còn lại: ${formatBac(amount)} bạc`);
    } catch (error) {
        chat('Có lỗi xảy ra!');
    }
    return 0; 
}

export async function checkBac(memberId) {
    try {
        const response = await axios.get(`https://soi-tcvtool.xyz/truyencv/member/${memberId}`);
        const name = await response.data.name; 
        const amount = await response.data.tai_san;
        chat(`${name} đang có: ${formatBac(amount)} bạc`);
    } catch (error) {
        chat('Có lỗi xảy ra!');
    }
    return 0; 
}

export async function checkInfo(userid) { 
    const referrer = "https://tutien.net/account/bang_phai/chap_su_duong/?txtMember=" + userid;
    const response = await fetch("https://tutien.net/account/bang_phai/chap_su_duong/?txtMember=" + userid, {
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
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors"
    });
    const body = await response.text();
    const $ = cheerio.load(body);
    const info = $('.info-member-bang > p > strong');
    const listRequest = [];
    info.each((index, request) => {
       const infos = $(request).text();       
       listRequest.push(`${infos}`); 
    });
    //console.log(listRequest);
}

export async function checkMem() {
    const response = await fetch("https://tutien.net/account/bang_phai/", {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
            "cache-control": "max-age=0",
            "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": CM_COOKIE
        },
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors"
    });

    const body = await response.text();
    const $ = cheerio.load(body);
    const listRequest = [];
    const requests = $('li[id^="don_"]');
    requests.each((index, request) => {
        const requestId = $(request).attr("id").replace("don_", "");
        const memberName = $(request).text().split(" (")[0];
        listRequest.push(`${memberName} [${requestId}]`);
    });

    if (listRequest.length === 0) {
        chat("Không có đơn yêu cầu vào bang nào.");
        return;
    }

    listRequest.unshift("Danh sách member yêu cầu vào bang:");
    chat(listRequest.join("[br]"));
}

export async function duyetNhieu(msg, tcvId) {
    const basic = await getUserInfo(tcvId);
    const fromName = basic.name;
    const donIds = msg.replace('duyệt các đơn', '').trim().split(' ');
    for (let index = 0; index < donIds.length; index++) {
        const donId = donIds[index]; 
        await duyetMem2(donId); 
    }
    chat(`${fromName} - Xong [img]https://love-thiduong.xyz/images/ETcmb.gif[/img]`);
}

export async function duyetAll(tcvId) {
    const basic = await getUserInfo(tcvId);
    const fromName = basic.name;
    const responselistmem = await fetch("https://tutien.net/account/bang_phai/", {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
            "cache-control": "max-age=0",
            "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": CM_COOKIE
        },
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors"
    });

    const bodymem = await responselistmem.text();
    const $ = cheerio.load(bodymem);
    const listRequest = [];
    const name = [];
    const requests = $('li[id^="don_"]');
    //const requestdonId = $("#don_" + donId);
    requests.each((index, request) => {
        const requestId = $(request).attr("id").replace("don_", "");
        const memberName = $(request).text().split(" (")[0];
        listRequest.push(`${requestId}`);
        name.push(`${memberName}`);
    });
    if (listRequest.length === 0) {
        chat("Không có đơn yêu cầu vào bang nào.");
        return;
    }
    const donIds = listRequest.join(" ");
    const ids = donIds.split(" ");
    const userName = name.join(", "); 

    for (let index = 0; index < ids.length; index++) {
        const donId = ids[index]; 
        await duyetMem2(donId); 
    } 

    
    chat(`${fromName} - Đã duyệt ${userName} vào bang`);
}

export async function tuChoiNhieu(msg, tcvId) {
    const basic = await getUserInfo(tcvId);
    const fromName = basic.name;
    const donIds = msg.replace('từ chối các đơn', '').trim().split(' ');
    for (let index = 0; index < donIds.length; index++) {
        const donId = donIds[index]; 
        await tuChoiMem2(donId); 
    }
    chat(`${fromName} - Xong [img]https://love-thiduong.xyz/images/ETcmb.gif[/img]`);
}

export async function duyetMem(donId, tcvId, showMeesage = true) {
    const responselistmem = await fetch("https://tutien.net/account/bang_phai/", {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
            "cache-control": "max-age=0",
            "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": CM_COOKIE
        },
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors"
    });

    const bodymem = await responselistmem.text();
    const $ = cheerio.load(bodymem);
    const listRequest = [];
    const name = [];
    const requests = $('li[id^="don_"]');
    const requestdonId = $("#don_" + donId);
    requests.each((index, request) => {
        const requestId = $(request).attr("id").replace("don_", "");
        const memberName = $(request).text().split(" (")[0];
        listRequest.push(`${memberName} [${requestId}]`);
        if (donId == requestId) {
            name.push(`${memberName}`);
        }
    });
    if (listRequest.length === 0) {
        chat("Không có đơn yêu cầu vào bang nào.");
        return;
    }
    if (!requestdonId.length) {
        chat(`Không tìm thấy đơn ID: ${donId}`);
        return;
    }
    const basic = await getUserInfo(tcvId);
    const fromName = basic.name;
    const body = `btnDuyetMem=1&don_id=${donId}&act=1`;
    const response = await fetch("https://tutien.net/account/bang_phai/", {
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
        "referrer": "https://tutien.net/account/bang_phai/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": body,
        "method": "POST",
        "mode": "cors"
    });

    const res = await response.text();
    if (res == '1') {
        chat(`${fromName} - Đã duyệt ${name} vào bang`);
        //chat(`${fromName} - Duyệt xong [img]https://love-thiduong.xyz/images/ETcmb.gif[/img]`);
    } else {
        chat(res);
    }
    /*if (showMeesage) {
        //chat(`${fromName} - Đã duyệt ${memberName} vào bang.`);
        chat(`${fromName} - Xong [img]https://love-thiduong.xyz/images/ETcmb.gif[/img]`);
    }*/
}

export async function duyetMem2(donId) {
    const body = `btnDuyetMem=1&don_id=${donId}&act=1`;
    const response = await fetch("https://tutien.net/account/bang_phai/", {
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
        "referrer": "https://tutien.net/account/bang_phai/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": body,
        "method": "POST",
        "mode": "cors"
    });

    const res = await response.text();
    if (res == '1') {
        
    } else if (res) {
        chat(`Đơn ID: ${donId} có lỗi xảy ra. ${res}`);
    } else {
        duyetMem2(donId);
    }

    //if (showMeesage) {
    //    chat(`${fromName} - Xong [img]https://love-thiduong.xyz/images/ETcmb.gif[/img]`);
    //}
}

export async function duyetMemId(memberId, userName, tcvId, showMeesage = true) {
    const responselistmem = await fetch("https://tutien.net/account/bang_phai/", {
                "headers": {
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                    "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
                    "cache-control": "max-age=0",
                    "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-fetch-dest": "document",
                    "sec-fetch-mode": "navigate",
                    "sec-fetch-site": "none",
                    "sec-fetch-user": "?1",
                    "upgrade-insecure-requests": "1",
                    "cookie": CM_COOKIE
                },
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "GET",
                "mode": "cors"
            });

            const bodymem = await responselistmem.text();
            const $ = cheerio.load(bodymem);
            const listRequest = [];
            const donId = [];
            const requests = $('li[id^="don_"]');
            //const requestdonId = $("#don_" + donId);
            requests.each((index, request) => {
                const requestId = $(request).attr("id").replace("don_", "");
                const memberName = $(request).text().split(" (")[0];
                listRequest.push(`${memberName} [${requestId}]`);
                if (memberName == userName) {
                    donId.push(`${requestId}`);
                }
            });
            if (listRequest.length === 0) {
                chat("Không có đơn yêu cầu vào bang nào.");
                return;
            }
            if (!donId.length) {
                chat(`Không tìm thấy đơn ID: ${memberId}`);
                return;
            }
            const basic = await getUserInfo(tcvId);
            const fromName = basic.name;
            const body = `btnDuyetMem=1&don_id=${donId}&act=1`;
            const response = await fetch("https://tutien.net/account/bang_phai/", {
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
                "referrer": "https://tutien.net/account/bang_phai/",
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": body,
                "method": "POST",
                "mode": "cors"
            });

            const res = await response.text();
            if (res == '1') {
                chat(`${fromName} - Đã duyệt ${userName} vào bang`);
        //chat(`${fromName} - Duyệt xong [img]https://love-thiduong.xyz/images/ETcmb.gif[/img]`);
            } else {
                chat(res);
            } 
}

export async function tuChoiMem(donId, tcvId, showMeesage = true) {
    const responselistmem = await fetch("https://tutien.net/account/bang_phai/", {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
            "cache-control": "max-age=0",
            "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": CM_COOKIE
        },
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors"
    });

    const bodymem = await responselistmem.text();
    const $ = cheerio.load(bodymem);
    const listRequest = [];
    const requests = $('li[id^="don_"]');
    const requestdonId = $("#don_" + donId);
    requests.each((index, request) => {
        const requestId = $(request).attr("id").replace("don_", "");
        const memberName = $(request).text().split(" (")[0];
        listRequest.push(`${memberName} [${requestId}]`);
    });
    if (listRequest.length === 0) {
        chat("Không có đơn yêu cầu vào bang nào.");
        return;
    }
    if (!requestdonId.length) {
        chat(`Không tìm thấy đơn ID: ${donId}`);
        return;
    }
    const basic = await getUserInfo(tcvId);
    const fromName = basic.name;
    const body = `btnDuyetMem=1&don_id=${donId}&act=0`;
    const response = await fetch("https://tutien.net/account/bang_phai/", {
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
        "referrer": "https://tutien.net/account/bang_phai/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": body,
        "method": "POST",
        "mode": "cors"
    });
    const res = await response.text();
    if (res == '1') {
        chat(`${fromName} - Duyệt xong [img]https://love-thiduong.xyz/images/ETcmb.gif[/img]`);
    } else {
        chat(res);
    }
    /*if (showMeesage) {
        //chat(`${fromName} - Đã duyệt ${memberName} vào bang.`);
        chat(`${fromName} - Xong [img]https://love-thiduong.xyz/images/ETcmb.gif[/img]`);
    }*/
}

export async function tuChoiMem2(donId) { 
    const body = `btnDuyetMem=1&don_id=${donId}&act=0`;
    const response = await fetch("https://tutien.net/account/bang_phai/", {
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
        "referrer": "https://tutien.net/account/bang_phai/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": body,
        "method": "POST",
        "mode": "cors"
    });

    //if (showMeesage) {
    //    chat(`${fromName} - Xong [img]https://love-thiduong.xyz/images/ETcmb.gif[/img]`);
    //}
}

export async function xinVaoBang(memberId, bangPhai = 'vcmt') {
    const member = USER_COOKIES.find(data => data.user_id == memberId);
    if (!member) {
        chat("Chưa cài đặt cookie cho ID: " + memberId + "");
        return;
    }

    const bangId = getBangId(bangPhai);
    if (bangId === 0) {
        chat("Không tìm thấy bang [b]" + bangPhai + "[/b]. Vui lòng sử dụng tên đầy đủ hoặc viết tắt đầy đủ");
        return;
    }

    const bangName = getBangName(bangPhai);

    const url = `https://soi-tcvtool.xyz/truyencv/member/${memberId}`;
    const response = await fetch(url, {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
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
    const bodyUser = await response.json();
    const name = bodyUser.name;

    const body = "btnXinVaoBang=1&txtBang=" + bangId;
    const res = await fetch("https://tutien.net/account/bang_phai/", {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,vi;q=0.8",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Google Chrome\";v=\"90\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "cookie": member.cookie
        },
        "referrer": "https://tutien.net/account/bang_phai",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": body,
        "method": "POST",
        "mode": "cors"
    });
    if (bangName == 'vcmt' || bangName == 'Vô Cực Ma Tông') {
        return 1;    
    } else {
        chat(`Đã chuyển đạo hữu ${name} sang bang ${bangName}`);
    }
}

function getBangId(bangPhai = '') {
    let bangId = 0;
    let vietTat = snake_case(bangPhai)
    switch (vietTat) {
        case 'vtt':
            bangId = 27;
            break;
        case 'avt':
            bangId = 28;
            break;
        case 'add':
            bangId = 29;
            break;
        case 'tnng':
            bangId = 30;
            break;
        case 'tnhg':
            bangId = 37;
            break;
        case 'mtd':
            bangId = 36;
            break;
        case 'tlmd':
        case 'tl':
            bangId = 38;
            break;
        case 'vc':
        case 'vcmt':
            bangId = 39;
            break;
        case 'mn':
            bangId = 40;
            break;
        default:
            break;
    }

    if (bangId == 0) {
        vietTat = convert_vnese_2_eng(str).toLowerCase();
        switch (vietTat) {
            case 'vo ta':
            case 'vo ta team':
                bangId = 27;
                break;
            case 'an vu':
            case 'an vu thon':
                bangId = 28;
                break;
            case 'am duong':
            case 'am duong diem':
                bangId = 29;
                break;
            case 'tieu ngao':
            case 'tieu ngao nhan gian':
                bangId = 30;
                break;
            case 'thien nhai':
            case 'thien nhai hai giac':
                bangId = 37;
                break;
            case 'ma than thien':
                bangId = 36;
                break;
            case 'tu la ma dien':
            case 'tu la':
                bangId = 38;
                break;
            case 'vo cuc':
            case 'vo cuc ma tong':
                bangId = 39;
                break;
            case 'my nhan':
                bangId = 40;
                break;
            default:
                break;
        }
    }

    return bangId;
}

function getBangName(bangPhai = '') {
    let bangName = '';
    let vietTat = snake_case(bangPhai)
    switch (vietTat) {
        case 'vtt':
            bangName = '๖ۣۜVô ๖ۣۜTà ๖ۣۜTeam';
            break;
        case 'avt':
            bangName = 'Ẩn Vụ Thôn';
            break;
        case 'add':
            bangName = 'Âm Dương Điếm';
            break;
        case 'tnng':
            bangName = '๖ۣۜTiếu ๖ۣۜNgạo ๖ۣۜNhân ๖ۣۜGian';
            break;
        case 'tnhg':
            bangName = '๖ۣۜThiên ๖ۣۜNhai ๖ۣۜHải ๖ۣۜGiác';
            break;
        case 'mtd':
            bangName = '๖ۣۜMa ๖ۣۜThần ๖ۣۜĐiện';
            break;
        case 'tlmd':
            bangName = 'Tu La Ma Điện';
            break;
        case 'vcmt':
            bangName = 'Vô Cực Ma Tông';
            break;
        case 'mn':
            bangName = 'Mỹ Nhân';
            break;
        default:
            break;
    }
 
    return bangName;
}

export async function kickNhieu(msg) {
    const memberIds = msg.replace('kicks', '').trim().split(' ');
    for (let index = 0; index < memberIds.length; index++) {
        const memberId = memberIds[index];
        await kickBang(memberId);
    }
}

export async function kickBang(memberId) {
    const body = "btnKickBang=1&member_id=" + memberId;
    const basic = await getUserInfo(memberId);
    const toName = basic.name;
    const referrer = "https://tutien.net/account/bang_phai/chap_su_duong/?txtMember=" + memberId;
    const res = await fetch("https://tutien.net/account/bang_phai/chap_su_duong/", {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Google Chrome\";v=\"90\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "cookie": CM_COOKIE
        },
        "referrer": referrer,
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": body,
        "method": "POST",
        "mode": "cors"
    });

    const response = await res.text();
    console.log(response);
    if (response == '1') {
        chat(`Đã khai trừ ${toName} ra khỏi bang.`);
    } else {
        chat(response);
    }
    
    //console.log(res.json());
    //console.log(res.text());
    //console.log(res);
    return;
}

export default {
    getUserInfo
}
