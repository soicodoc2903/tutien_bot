import fetch from 'node-fetch';
import {CM_COOKIE} from "./constant.js";
import cheerio from 'cheerio';
import {chat, delKey, getItem, getKeys, parseCookies, setItem, snake_case} from '../helper.js'
import {cap} from "./viettat.js";

export async function fetchItemCh() {
    const response = await fetch("https://tutien.net/account/bang_phai/chap_su_duong/", {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
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
    const ids = ['tangexp', 'tanghp', 'congphap', 'dotpha', 'binhkhi', 'linhthao', 'phutro'];
    ids.forEach(itemId => {
        const rows = $('#' + itemId + ' > table > tbody > tr').toArray();
        for (let i = 0; i < rows.length; i++) {
            const tds = $(rows[i]).find('td');
            const name = $(tds[0]).text();
            const nhapInput = $(tds[1]).find('input').first();
            const nhap = nhapInput.val();
            const xuat = $(tds[2]).find('input').first().val();
            const itemId = nhapInput.attr('id').replace("txtVatPham_", "").replace("_nhap", "");

            const key = 'bk_' + snake_case(name);
            setItem(key, JSON.stringify({name, nhap, xuat, itemId})).then();
        }
    });
}

export async function checkBaoKho(searchText, memberName) {
    const itemName = parseName(searchText);
    const key = "bk_*" + snake_case(itemName) + "*";
    const matches = await getKeys(key);
    if (matches.length === 0) {
        await chat(`Kh??ng c?? v???t ph???m ${cap(itemName)} trong b???o kh???.`);
        return;
    }

    const items = [];
    for (let i = 0; i < matches.length; i ++) {
        let item = await getItem(matches[i]);
        if (item === "{}" || item === "") {
            await delKey(matches[i]);
            continue;
        }

        item = JSON.parse(item);
        const itemName = item['name'];
        items[itemName] = {
            name: itemName,
            id: item['itemId']
        }
    }

    await checkBkItems(memberName, items);
    return 1;
}

export async function checkBkItems(tcvName, items) {
    const response = await fetch("https://tutien.net/account/bang_phai/bao_kho_duong/", {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
            "cache-control": "max-age=0",
            "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": CM_COOKIE
        },
        "referrer": "https://tutien.net/account/bang_phai/bao_kho_duong/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors"
    });

    const body = await response.text();
    const $ = cheerio.load(body);
    const itemNames = Object.keys(items);
    const messages = [`B???o kh??? hi???n c??:`];
    for (let i = 0; i < itemNames.length; i++) {
        const itemName = itemNames[i];
        const item = items[itemName];
        const amount = $('#shopnum' + item.id).text();
        if (parseInt(amount) > 0) {
            messages.push(`??? ${amount} ${cap(itemName)}`);
            //chat(messages.join("[br]"));
            //messages.push(`??? ${amount} ${cap(itemName)}`);
        } //else {
        //    messages.push(`Kh??ng c?? v???t ph???m ${cap(itemName)} trong b???o kh???.`);
        //}
    }

    chat(messages.join("[br]"));
}

export async function loginBaoKho() {
    const response = await fetch("https://tutien.net/account/bang_phai/bao_kho_duong/", {
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
        "referrer": "https://tutien.net/account/bang_phai/bao_kho_duong/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": "btnLoginBaoKho=1&txtPassword=11111111",
        "method": "POST",
        "mode": "cors"
    });

    const newCookie = parseCookies(response);
    await setItem('R_CM_COOKIE', newCookie);
}

export async function redirectBaoKho(cookie) {
    if (!cookie) {
        cookie = CM_COOKIE;
    }

    const response = await fetch("https://tutien.net/account/bang_phai/bao_kho_duong/", {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7,de;q=0.6,ja;q=0.5",
            "cache-control": "max-age=0",
            "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": cookie
        },
        "referrer": "https://tutien.net/account/bang_phai/bao_kho_duong/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors"
    });
}

function parseName(name) {
    const vps = {
        'att': 'Anh T??m Th???o',
        'bdq': 'B??n ????o Qu???',
        'bdt': 'B??n ????o Th???',
        'btt': 'B??nh Trung Thu',
        'bhn': 'B??ng H???a Ng???c',
        'bad': 'B??? Anh ??an',
        'badp': 'B??? Anh ??an Ph????ng',
        'bhd': 'B??? Huy???t ??an',
        'bhdp': 'B??? Huy???t ??an Ph????ng',
        'bnd': 'B??? Nguy??n ??an',
        'bndp': 'B??? Nguy??n ??an Ph????ng',
        'cs': 'Chu Sa',
        'cptq': 'C??ng Ph??p T??n Quy???n',
        'ctd': 'C??? Th???n ??an',
        'dtd': 'Dung Th???n ??an',
        'dmc': 'D??? Minh Ch??u',
        'hkl': 'Ho??ng Kim L???nh',
        'hdc': 'Ho??n Di???n Ch??u',
        'hkd': 'Huy???t Kh?? ??an',
        'hkdp': 'Huy???t Kh?? ??an Ph????ng',
        'htt': 'Huy???t Tinh Th???o',
        'htd': 'Huy???t Tinh ??an',
        'htdp': 'Huy???t Tinh ??an Ph????ng',
        'htb': 'H??a Th??? B??ch',
        'hlt': 'H??a Long Th???o',
        'hlt2': 'H??? Linh Tr???n',
        'hnt': 'H??a Nguy??n Th???o',
        'hnd': 'H??a Nguy??n ??an',
        'hndp': 'H??a Nguy??n ??an Ph????ng',
        'hkct': 'H?? Kh??ng Chi Th???ch',
        'hdt': 'H???c Di???u Th???ch',
        'hmd': 'H???c Ma ?????nh',
        'hnc': 'H???a Ng???c Ch??u',
        'hhd': 'H???i Huy???t ??an',
        'hhthp': 'H???ng Hoang Th???ch HP',
        'hht': 'H???ng Hoang Th???ch HP',
        'hpt': 'H??? Ph??ch Th???ch',
        'hnt2': 'H???p Nguy??n Th???o',
        'hnd2': 'H???p Nguy??n ??an',
        'hndp2': 'H???p Nguy??n ??an Ph????ng',
        'kttt': 'Khai Thi??n Th???n Th???ch',
        'kt': 'Kim Thu???ng',
        'ktc': 'Kim Th??? Ch???',
        'lb': 'La B??n',
        'ltcp': 'Linh Th???ch CP',
        'lthp': 'Linh Th???ch HP',
        'ltthp': 'Linh Th???ch THP',
        'lttp': 'Linh Th???ch TP',
        'lt': 'Linh Tuy???n',
        'ltt': 'Luy???n Th???n Th???o',
        'ltd': 'Luy???n Th???n ??an',
        'ltdp': 'Luy???n Th???n ??an Ph????ng',
        'ls': 'L??ng S??i',
        'nbt': 'Nguy???t B???ch Th???ch',
        'ntd': ['Ng??ng Th???n ??an', 'Nh??n Ti??n ??an'],
        'ngtc': 'Ng???c Gi???n Truy???n C??ng',
        'ntls': 'Ng???c Tuy???t Linh S??m',
        'ntc': 'Ng???c T???y Chi',
        'ntln cp': 'Ng???c T???y Linh Nh?? CP',
        'ntln hp': 'Ng???c T???y Linh Nh?? HP',
        'ntln thp': 'Ng???c T???y Linh Nh?? THP',
        'ntln tp': 'Ng???c T???y Linh Nh?? TP',
        'nh?? cp': 'Ng???c T???y Linh Nh?? CP',
        'nh?? hp': 'Ng???c T???y Linh Nh?? HP',
        'nh?? thp': 'Ng???c T???y Linh Nh?? THP',
        'nh?? tp': 'Ng???c T???y Linh Nh?? TP',
        'ntlncp': 'Ng???c T???y Linh Nh?? CP',
        'ntlnhp': 'Ng???c T???y Linh Nh?? HP',
        'ntlnthp': 'Ng???c T???y Linh Nh?? THP',
        'ntlntp': 'Ng???c T???y Linh Nh?? TP',
        'ndc1': 'N???i ??an C1',
        'ndc2': 'N???i ??an C2',
        'ndc3': 'N???i ??an C3',
        'ndc4': 'N???i ??an C4',
        'ndc5': 'N???i ??an C5',
        'ndc6': 'N???i ??an C6',
        'ndc7': 'N???i ??an C7',
        'ndc8': 'N???i ??an C8',
        'ndc9': 'N???i ??an C9',
        'nd1': 'N???i ??an C1',
        'nd2': 'N???i ??an C2',
        'nd3': 'N???i ??an C3',
        'nd4': 'N???i ??an C4',
        'nd5': 'N???i ??an C5',
        'nd6': 'N???i ??an C6',
        'nd7': 'N???i ??an C7',
        'nd8': 'N???i ??an C8',
        'nd9': 'N???i ??an C9',
        'ptd': 'Ph?? Thi??n ??an',
        'pmt c1': 'Ph??? Ma Th???ch C1',
        'pmt c2': 'Ph??? Ma Th???ch C2',
        'pmt c3': 'Ph??? Ma Th???ch C3',
        'pmt c4': 'Ph??? Ma Th???ch C4',
        'pmt c5': 'Ph??? Ma Th???ch C5',
        'pmt c6': 'Ph??? Ma Th???ch C6',
        'pmt c7': 'Ph??? Ma Th???ch C7',
        'pmt c8': 'Ph??? Ma Th???ch C8',
        'pmtc1': 'Ph??? Ma Th???ch C1',
        'pmtc2': 'Ph??? Ma Th???ch C2',
        'pmtc3': 'Ph??? Ma Th???ch C3',
        'pmtc4': 'Ph??? Ma Th???ch C4',
        'pmtc5': 'Ph??? Ma Th???ch C5',
        'pmtc6': 'Ph??? Ma Th???ch C6',
        'pmtc7': 'Ph??? Ma Th???ch C7',
        'pmtc8': 'Ph??? Ma Th???ch C8',
        'pmt1': 'Ph??? Ma Th???ch C1',
        'pmt2': 'Ph??? Ma Th???ch C2',
        'pmt3': 'Ph??? Ma Th???ch C3',
        'pmt4': 'Ph??? Ma Th???ch C4',
        'pmt5': 'Ph??? Ma Th???ch C5',
        'pmt6': 'Ph??? Ma Th???ch C6',
        'pmt7': 'Ph??? Ma Th???ch C7',
        'pmt8': 'Ph??? Ma Th???ch C8',
        'qg': 'Quy Gi??p',
        'qb': 'Quy??n B???ch',
        'snc': 'Sa Ng???c Ch??u',
        'ttd2': 'Thanh T??m ??an',
        'ttd': 'T???y T???y ??an',
        'tkl': 'Thi??n Ki???m L???nh',
        'tlq': 'Thi??n Linh Qu???',
        'tld': 'Thi??n Linh ?????nh',
        'tnt': 'Thi??n Nguy??n Th???o',
        'tdl': 'Thi??n ?????a L??',
        'tdd': 'Th??nh Di???u ?????nh',
        'tnc': 'Th???i Ng???c Ch??u',
        'tnd': 'Th???n N??ng ?????nh',
        'tgct': 'Th???i Gian Chi Th???y',
        'tlcp': 'Tinh Linh CP',
        'tlhp': 'Tinh Linh HP',
        'tlthp': 'Tinh Linh THP',
        'tltp': 'Tinh Linh TP',
        'ttcp': 'T??? Tinh CP',
        'tthp': 'T??? Tinh HP',
        'ttthp': 'T??? Tinh THP',
        'tttp': 'T??? Tinh TP',
        'ttt': 'Tr??ch Tinh Th???o',
        'tcd': 'Tr??c C?? ??an',
        'tcdp': 'Tr??c C?? ??an Ph????ng',
        'tlt': 'T??n L??i Tr???n',
        'tnlp': 'T??n Ni??n L??? Ph???c',
        'tpb': 'T??i Ph??n B??n',
        'ttv': 'T??i Tr??? V???t',
        'thl': 'T???o H??a L??',
        'ttdp': 'T???y T???y ??an Ph????ng',
        'tlc': 'T??? L??i Ch??u',
        'tbb': 'T??? B???o B??i',
        'ukt': 'U???n Kim Th???o',
        'utd': 'U???n Thi??n ??an',
        'utdp': 'U???n Thi??n ??an Ph????ng',
        'vht': 'V??nh H???ng Th???ch',
        'vtd': 'V???n Th?? ?????nh',
        'vtcp': 'V???n Thi???t CP',
        'vthp': 'V???n Thi???t HP',
        'vtthp': 'V???n Thi???t THP',
        'vttp': 'V???n Thi???t TP',
        'dgt': '???? Giai Thu???n',
        'dlktd': '?????i La Kim Ti??n ??an',
        'dlt': '?????i Linh Th???o',
        'dld': '?????i Linh ??an',
        'dpd': '?????i Ph?? ??an',
        'dhd': '????? H?? ??an',
        'ktt': 'Kh??c T????ng T??',
        'tsv': 'T??i S???ng V???t'
    };

    if (vps.hasOwnProperty(name)) {
        return vps[name];
    }

    return name;
}

export default {
    // checkBaoKho,
    loginBaoKho,
    fetchBaoKhoItems: fetchItemCh
}
