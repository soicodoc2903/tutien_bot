import fetch from "node-fetch";
import cheerio from "cheerio";
import { chat } from "../helper.js";
import { CM_COOKIE } from "../modules/constant.js";
const cookie = CM_COOKIE;

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
        const listItems = ["Danh sách linh thảo tại dược viên bang:"];
        for (let i = 0; i < options.length; i++) {
            element = element.next();
            element.text() && listItems.push("✦ " + element.text());
        }

        chat(listItems.join("[br]"));
        return;
    }

    const dangTrongs = $('button[id^="div_linhdien_"]');
    const message = [];
    const dangTrongArr = {};
    for (let i = 0; i < dangTrongs.length; i++) {
        const linhDienName = $(dangTrongs[i]).text();
        const name = linhDienName.split("(")[0].trim();
        if (dangTrongArr[name]) {
            dangTrongArr[name] += 1;
        } else {
            dangTrongArr[name] = 1;
        }
    }

    let keys = Object.keys(dangTrongArr);
    let dangTrongMesssage = '';
    if (!keys.length) {
        chat(`Dược viên đang trống.`);
        return;
    }
    if (keys.length) {
        dangTrongMesssage += `Dược viên đang trồng:[br]`;
    }
    for (let i = 0; i < keys.length; i++) {
        const name = keys[i];
        dangTrongMesssage += `${dangTrongArr[name]} luống ${name}`;
    }

    dangTrongMesssage && message.push(dangTrongMesssage);
    const thuHoachs = $('.text-muted li.list-group-item');
    const thuHoachArr = {};
    for (let i = 0; i < thuHoachs.length && i < 16; i++) {
        const thuHoachName = $(thuHoachs[i]).text();
        const name = thuHoachName.split("cây ")[1].split(" (")[0];
        const amount = thuHoachName.split("được ")[1].split(" cây")[0];
        if (thuHoachArr[name]) {
            thuHoachArr[name] += parseInt(amount);
        } else {
            thuHoachArr[name] = parseInt(amount);
        }
    }

    keys = Object.keys(thuHoachArr);
    let thuHoachMessage = '';
    if (keys.length) {
        thuHoachMessage += `Dược viên vừa thu hoạch:[br]`;
    }
    for (let i = 0; i < keys.length; i++) {
        const name = keys[i];
        thuHoachMessage += `${thuHoachArr[name]} cây ${name}`;
    }

    //thuHoachMessage && message.push(thuHoachMessage);
    chat(message.join('[br]'));
}

export async function fetchThuHoach() {
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

    const dangTrongs = $('button[id^="div_linhdien_"]');
    const message = [];
    const dangTrongArr = {};
    for (let i = 0; i < dangTrongs.length; i++) {
        const linhDienName = $(dangTrongs[i]).text();
        const name = linhDienName.split("(")[0].trim();
        if (dangTrongArr[name]) {
            dangTrongArr[name] += 1;
        } else {
            dangTrongArr[name] = 1;
        }
    }

    let keys = Object.keys(dangTrongArr);
    let dangTrongMesssage = '';
    //if (!keys.length) {
    //    chat(`Dược viên đang trống.`);
    //    return;
    //}
    //if (keys.length) {
    //    dangTrongMesssage += `Dược viên đang trồng:[br]`;
    //}
    for (let i = 0; i < keys.length; i++) {
        const name = keys[i];
        //dangTrongMesssage += `${dangTrongArr[name]} luống ${name}`;
    }

    //dangTrongMesssage && message.push(dangTrongMesssage);
    const thuHoachs = $('.text-muted li.list-group-item');
    const thuHoachArr = {};
    for (let i = 0; i < thuHoachs.length && i < 16; i++) {
        const thuHoachName = $(thuHoachs[i]).text();
        const name = thuHoachName.split("cây ")[1].split(" (")[0];
        const amount = thuHoachName.split("được ")[1].split(" cây")[0];
        if (thuHoachArr[name]) {
            thuHoachArr[name] += parseInt(amount);
        } else {
            thuHoachArr[name] = parseInt(amount);
        }
    }

    keys = Object.keys(thuHoachArr);
    let thuHoachMessage = '';
    if (!keys.length) {
        chat('Không có linh thảo nào được thu hoạch.');
        return;
    }
    if (keys.length) {
        thuHoachMessage += `Dược viên đã thu hoạch được:[br]`;
    }
    for (let i = 0; i < keys.length; i++) {
        const name = keys[i];
        thuHoachMessage += `${thuHoachArr[name]} cây ${name}`;
    }

    thuHoachMessage && message.push(thuHoachMessage);
    chat(message.join('[br]'));
}
