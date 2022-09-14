import fetch from "node-fetch";
import {CM_COOKIE, INTERVAL_CHECK_LOG} from "../modules/constant.js";
import cheerio from "cheerio";
import {getLastLogBac, getLastLogDo, setLastLogBac, setLastLogDo, setTcvUsername} from "../helper.js";
import {updateNopDo} from "../modules/chuyen-do.js";

export async function fetchNopDo() {
    const response = await fetch("https://tutien.net/account/bang_phai", {
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
        "referrer": "https://tutien.net/account/bang_phai/nghi_su_dien",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": "btnLogBang=1",
        "method": "POST",
        "mode": "cors"
    });

    const body = await response.text();
    const {logbang, logquybac} = JSON.parse(body);
    await parseLogBang(logbang);
    await parseLogBac(logquybac);
}

const parseLogBang = async logbang => {
    const $ = cheerio.load(logbang);
    let lastId = await getLastLogDo();

    const logs = $('li');
    let current = logs.first();
    const tempId = current.attr("data-id");

    let index = 0;
    const max = logs.length;
    do {
        if (current.attr("data-id") === lastId) {
            index = max;
            continue;
        }
        const text = current.text();
        if (text.includes("nộp")) {
            const parsed = text.split("nộp ")[1].split(" vào")[0].trim();
            const amount = parseInt(parsed.split(" ")[0]);
            const item = parsed.replace(amount, "").replace(" (đã luyện hóa)", "").trim();

            const url = current.find("a").first().attr("href");
            const memberName = text.split(" nộp")[0];
            const memberId = url.replace("\/member\/", "");
            await setTcvUsername(memberId, memberName);
            console.log(memberId, amount, item);
            await updateNopDo(memberId, memberName, item, amount, true);
        }
        current = current.next();
        index++;
    } while (index < max);

    await setLastLogDo(tempId);
}

const parseLogBac = async (logbac) => {
    const $ = cheerio.load(logbac);
    let lastId = await getLastLogBac();

    const logs = $('li');
    let current = logs.first().next();
    const tempId = current.attr("data-id");
    let index = 0;
    const max = logs.length;
    do {
        if (current.attr("data-id") === lastId) {
            index = max;
            continue;
        }
        const text = current.text();
        if (text.includes("nộp")) {
            const amount = text.split("nộp ")[1]
                .split(" bạc")[0]
                .replaceAll(".", "")
                .trim();
            const url = current.find("a").first().attr("href");
            const memberId = url.replace("\/member\/", "");
            const memberName = text.split(" nộp")[0];
            await setTcvUsername(memberId, memberName); 
            console.log(memberId, amount, "bạc");
            await updateNopDo(memberId, memberName, "bạc", amount, true);
        }
        current = current.next();
        index++;
    } while (index < max);

    await setLastLogBac(tempId);
}

setInterval(async () => {
    console.log("============= LOG NOP DO / BAC =============");
    await fetchNopDo();
}, INTERVAL_CHECK_LOG * 1000);

//await fetchNopDo();
// await showRuong(52780, null);
