import fetch from "node-fetch";
import {ADMIN, CM_COOKIE} from "./constant.js";
import {chat, getTcvNameFromTcvId} from "../helper.js";
import {getUserInfo} from "./member.js";

export async function camNgon(memberId, time, cboxName, doId) {
    //const memberId = args[1];
    //const time = args[4];
    let toName = await getTcvNameFromTcvId(memberId);
    if (!toName) {
        const basic = await getUserInfo(memberId);
        toName = basic.name;
    }
    let basicFrom = await getUserInfo(doId);
    let fromChucVu = basicFrom.chucVu;
    
    let chucs = [
        'Chưởng Môn',
        'Đại Trưởng Lão',
        'Trưởng Lão',
        'Hộ Pháp',
        'Hạch Tâm Đệ Tử',
        'Nội Môn Đệ Tử',
        'Ngoại Môn Đệ Tử',
        'Ngân Quỹ',
        'Linh Đồng'
    ];
    if (chucs.includes(fromChucVu) === false) {
        fromChucVu = '';
    }
    let body = `btnHinhDuong=1&txtMember=${memberId}&txtCamNgon=${time}&txtBeQuan=&txtLyDo=bot ban theo yêu cầu của ${fromChucVu} ${cboxName}`;
    if (memberId === 132301) {
        chat(`${toName} quá mạnh, không ban được /thodai`);
        return;
    }
    /*if (ADMIN.includes(memberId)) {
        chat("Bạn đang vượt quyền để ban người không nên ban. RIP!");
        body = `btnHinhDuong=1&txtMember=${doId}&txtCamNgon=${time}&txtBeQuan=&txtLyDo=vượt quyền`;
    }*/
    const response = await fetch("https://tutien.net/account/bang_phai/hinh_duong/", {
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
        "referrer": "https://tutien.net/account/bang_phai/hinh_duong/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": body,
        "method": "POST",
        "mode": "cors"
    });
    const res = await response.text();
    console.log(res);
    if (res == '1') {
        chat(`Đã cho ${toName} ra đảo ${time} phút /camchat`);
    } else {
        chat(res);
    }
    //await response.text();
    //if (response.status === 200) {
    //    chat(`Đã cho ${toName} ra đảo ${time} phút /camchat`); 
    //}
    
}

export async function beQuan(memberId, time, cboxName, doId) {
    //const memberId = args[1];
    //const time = args[4];
    let toName = await getTcvNameFromTcvId(memberId);
    if (!toName) {
        const basic = await getUserInfo(memberId);
        toName = basic.name;
    }
    let basicFrom = await getUserInfo(doId);
    let fromChucVu = basicFrom.chucVu;
    
    let chucs = [
        'Chưởng Môn',
        'Đại Trưởng Lão',
        'Trưởng Lão',
        'Hộ Pháp',
        'Hạch Tâm Đệ Tử',
        'Nội Môn Đệ Tử',
        'Ngoại Môn Đệ Tử',
        'Ngân Quỹ',
        'Linh Đồng'
    ];
    if (chucs.includes(fromChucVu) === false) {
        fromChucVu = '';
    }
    let body = `btnHinhDuong=1&txtMember=${memberId}&txtCamNgon=&txtBeQuan=${time}&txtLyDo=bot phạt theo yêu cầu của ${fromChucVu} ${cboxName}`;
    if (memberId === 132301) {
        chat(`${name} quá mạnh, không phạt được /thodai`);
        return;
    }
    /*if (ADMIN.includes(memberId)) {
        chat("Bạn đang vượt quyền để ban người không nên ban. RIP!");
        body = `btnHinhDuong=1&txtMember=${doId}&txtCamNgon=${time}&txtBeQuan=&txtLyDo=vượt quyền`;
    }*/
    const response = await fetch("https://tutien.net/account/bang_phai/hinh_duong/", {
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
        "referrer": "https://tutien.net/account/bang_phai/hinh_duong/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": body,
        "method": "POST",
        "mode": "cors"
    });
    const res = await response.text();
    console.log(res);
    if (res == '1') {
        chat(`Đã cho ${toName} bế quan tư quá ${time} phút /camchat`);
    } else {
        chat(res);
    }
    //console.log(response);
    //if (response.status === 200) {
    //    chat(`Đã cho ${toName} bế quan tư quá ${time} phút /camchat`); 
    //}
    
}
