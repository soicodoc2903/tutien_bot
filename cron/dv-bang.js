import fetch from "node-fetch";
import cheerio from "cheerio";
import { chat } from "../helper.js";
import {CM_COOKIE} from "../modules/constant.js";

const cookie = CM_COOKIE;
let isAlertResult = false;

export async function fetchDuocVien(checkCo = false) {
    const response = await fetch("https://tutien.net/account/bang_phai/duoc_vien/", {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "en-US,en;q=0.9,vi;q=0.8",
            "cache-control": "max-age=0",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Google Chrome\";v=\"90\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
		    "cookie": CM_COOKIE,
        },
        "referrer": "https://tutien.net/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors"
    });

    const body = await response.text();
    const $ = cheerio.load(body);

    if (checkCo) {
        const options = $('#selDuocThao option');
        let element = options.first();
        const listItems = ["[color=black]Danh sách linh thảo tại dược viên bang:[/color]"];
        for (let i = 0; i < options.length; i++) {
            element = element.next();
            element.text() && listItems.push("✦ " + element.text());
        }

        chat(listItems.join("[br]"));
        return;
    }

    const dangTrongs = $('button[id^="div_linhdien_"]');
    
    // Set auto trồng - tạm thời comment
    // if (dangTrongs.length === 0) {
	//    trongCo('ttt');
	//    return;
    //}


    // ============================= AUTO TƯỚI + THU HOẠCH =============================
    
    //let index = 16;
    //let element = dangTrongs;
    for (let i = 0; i < dangTrongs.length; i++) { 
        const element = $(dangTrongs[i]);
        const dvClasses = element.attr("class");
        const dvId = element.attr('id').replace('div_linhdien_', '');
        if (!element.is(':disabled') && dvClasses) { 
            if (dvClasses.includes("btn-danger")) {
                console.log(`Dược viên ${i+1} - Tưới nước!`);
                await tuoiNuoc(dvId);
            } else {
                console.log(`Dược viên ${i+1} - Thu hoạch!`);
                await thuHoach(dvId);
            }
        } else {
            //console.log(`Dược viên ${i+1} - Chờ.......`);
        }
        isAlertResult = false;
    } 

    // Thông báo thu hoạch
    if (dangTrongs.length === 0 && !isAlertResult) {
        const thuHoachs = $('.text-muted li.list-group-item');
        const thuHoachArr = {};
        for (let i = 0; i < thuHoachs.length && i < 16; i++) {
            const thuHoachName = $(thuHoachs[i]).text();
            if (thuHoachName.includes('giờ trước')) {
                const hour = parseInt(thuHoachName.split(' (')[1].split(' giờ')[0]);
                if (isNaN(hour) || hour >= 5) {
                    continue;
                }
            } 

            const name = thuHoachName.split("cây ")[1].split(" (")[0];
            const amount = thuHoachName.split("được ")[1].split(" cây")[0];
            if (thuHoachArr[name]) {
                thuHoachArr[name] += parseInt(amount);
            } else {
                thuHoachArr[name] = parseInt(amount);
            }
        }

        const keys = Object.keys(thuHoachArr);
        let thuHoachMessage = '';
        //if (keys.length) {
        //    thuHoachMessage += ``;
        //}
        for (let i = 0; i < keys.length; i++) {
            const name = keys[i];
            thuHoachMessage += `${thuHoachArr[name]} cây ${name}`; 
        }
        if (keys.length && !isAlertResult) {
            chat('Dược viên vừa thu hoạch:[br] ' + thuHoachMessage); 
        }
        isAlertResult = true;
    }
}

export async function trongCo(loaiCo) {
    const coId = getCoId(loaiCo);
    if (coId == 0) {
        chat('[b]' + loaiCo + '[/b] không được support. Liên hệ Buôn để giải quyết /xga');
        return;
    }

    const body = "btnGieoHat=1&selDuocThao=" + coId + "&chkThueTuoi=0&chkBaoVe=0&txtTinhNhanh=0";
    const response = await fetch("https://tutien.net/account/tu_luyen/duoc_vien/", {
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
	    cookie,
        },
        "referrer": "https://tutien.net/account/tu_luyen/duoc_vien/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": body,
        "method": "POST",
        "mode": "cors"
    });

    const bodyText = await response.text();
    chat(bodyText);
}

export function getCoId(loaiCo) {
    let coId = 0;
    switch (key) {
        case 'ntc':
            coId = 25;
            break;
        case 'ttt':
            coId = 32;
            break;
        case 'tnt':
            coId = 33;
            break;
        case 'hlt':
            coId = 24;
            break;
        case 'tlq':
            coId = 26;
            break;
        case 'ukt':
            coId = 23;
            break;
        case 'att':
            coId = 63;
            break;
        case 'hnt':
            coId = 65;
            break;
        case 'ltt':
            coId = 7906;
            break;
        case 'dlt':
            coId = 33204;
            break;
        case 'hnt2':
            coId = 30497;
            break;
        default:
            break;
    }

    return coId;
}

export async function tuoiNuoc(duocVienId) {
    const bodyForm = 'btnTuoiNuoc=1&duocvien_id=' + duocVienId;
    const res = await fetch("https://tutien.net/account/bang_phai/duoc_vien/", {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,vi;q=0.8",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"96\", \"Google Chrome\";v=\"96\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "cookie": CM_COOKIE,
            "Referer": "https://tutien.net/account/bang_phai/duoc_vien/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": bodyForm,
        "method": "POST"
    });

    const text = await res.text();
    console.log('tuoiNuoc', duocVienId, text);
}

export async function thuHoach(duocVienId) {
        const bodyForm = 'btnThuHoach=1&duocvien_id=' + duocVienId;
    const res = await fetch("https://tutien.net/account/bang_phai/duoc_vien/", {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,vi;q=0.8",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"96\", \"Google Chrome\";v=\"96\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "cookie": CM_COOKIE,
            "Referer": "https://tutien.net/account/bang_phai/duoc_vien/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": bodyForm,
        "method": "POST"
    });
    const text = await res.text();
    console.log('thuHoach', duocVienId, text);
}


// Chạy 1p 1 lần
setInterval(async () => {
    await fetchDuocVien();
}, 30 * 1000);
