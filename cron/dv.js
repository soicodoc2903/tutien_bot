import fetch from "node-fetch";
import cheerio from "cheerio";
import { chat } from "../helper.js";
const cookie = 'USER=YJ3sUpWx7yIE%3A8Nlft9vtqtiARKHKhwDZu6yyzdnVDVaQ8a5yVliScF%2B0';

export async function fetchDuocVienCaNhan(checkCo = false) {
    const response = await fetch("https://tutien.net/account/tu_luyen/duoc_vien/", {
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
		cookie,
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
        const listItems = ["[color=black]Danh sách linh thảo tại dược viên cá nhân:[/color]"];
        for (let i = 0; i < options.length; i++) {
            element = element.next();
            element.text() && listItems.push("✦ " + element.text());
        }

        chat(listItems.join("[br]"));
        return;
    }

    const dangTrongs = $('button[id^="div_linhdien_"]');
    if (dangTrongs.length === 0) {
	trongCo('ttt');
	return;
    }
    let element = dangTrongs.first();
    let index = 1;
    for (let i = 0; i < element.length; i++) {
        const dvClasses = element.attr("class");
        if (!element.is(':disabled') && dvClasses) {
            const dvClasses = element.attr("class");
            const dvId = element.attr('id').replace('div_linhdien_', '');
            if (dvClasses.includes("btn-danger")) {
                console.log(`Dược viên ${i+1} - Tưới nước!`);
                await tuoiNuoc(dvId);
            } else {
                console.log(`Dược viên ${i+1} - Thu hoạch!`);
                await thuHoach(dvId);
            }
        } else {
            console.log(`Dược viên ${i+1} - Chờ.......`);
        }
        element = element.next();
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
    const body = 'btnTuoiNuoc=1&duocvien_id=' + duocVienId;
    await fetch("https://tutien.net/account/tu_luyen/duoc_vien/", {
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
}

export async function thuHoach(duocVienId) {
    const body = 'btnThuHoach=1&duocvien_id=' + duocVienId;
    await fetch("https://tutien.net/account/tu_luyen/duoc_vien/", {
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
}

setInterval(async () => {
    await fetchDuocVien();
}, 1 * 60 * 1000);
