import fetch from "node-fetch";
import axios from "axios";
import {
    chat,
    delKey,
    getBasic,
    getCboxIdFromTcvId,
    getItem,
    getKeys,
    getTcvNameFromTcvId,
    getTtl,
    parse_chuc,
    pmCbox,
    pmTcv,
    setExpire,
    setItem,
    formatBac,
    snake_case
} from '../helper.js';
import {changeCongHien, searchPk} from './cong-hien.js'
import {CD_PRICE, CHUYEN_DO_IDS, CM_COOKIE, ITEM_EXPIRE_IN, QUEUE_MAX_RETRY} from "./constant.js";
import {getUserInfo} from "./member.js";
import {chuyenDoQueue} from "./queue.js";
import {cap, viettat} from "./viettat.js";
import {log} from "./winston.js";

const SPECIAL_ITEMS = ['bạc', 'thần nông lệnh', 'tiên phủ lệnh'];

export async function chuyenDoHacDiem(name, amount, toUserId) {
    const items = [{name, amount}];
    const user = {id: toUserId, toId: toUserId}
    await chuyenNhieuDo(user, items, false);
}

// Nhan lenh chuyen do tu code (function khac)
async function chuyenNhieuDo(user, items, isChat = true) {
    let totalCh = 0;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const name = viettat(item.name);
        const itemName = "bk_" + snake_case(name);
        const reply = await getItem(itemName);
        if (reply) {
            let rItem = JSON.parse(reply);
            item.itemId = rItem.itemId;
            totalCh += item.amount * parseInt(rItem.xuat);
        } else {
            chat("Không có vật phẩm " + cap(item.name) + " trong bảo khố.");
            return;
            //continue;
        }
    }

    if (totalCh === 0) {
        //const cboxId = await getCboxIdFromTcvId(user.id);
        //pmCbox(cboxId, "Xong!");
        return;
    }

    isChat && getTcvNameFromTcvId(user.id).then(name => {
        chat("Đang duyệt đơn chuyển đồ của " + name);
    });
    let userInfo = await getBasic(user.toId);
    if (!userInfo) {
        userInfo = await getUserInfo(user.toId);
    }

    user.chucVu = userInfo.chucVu;
    user.toName = userInfo.name;

    if (user.toId == 52780 || user.toId == 98455 || user.toId == 300200 || user.toId == 600600) {
        // Skip change CH
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            await chuyenDoQueue.createJob({user, item}).retries(QUEUE_MAX_RETRY).backoff("fixed", 2000).save();
        }

        return;
    }

    const quyenHan = parse_chuc(user.chucVu);
    await changeCongHien(user.toId, totalCh, quyenHan);

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await chuyenDoQueue.createJob({user, item}).retries(QUEUE_MAX_RETRY).backoff("fixed", 2000).save();
    }
}

async function chuyenDo(user, item) {
    const formEncoded = `btnChuyenVatPham=1&shop=${item.itemId}&txtNumber=${item.amount}&txtMember=${user.toId}`;
    const response = await fetch("https://tutien.net/account/bang_phai/bao_kho_duong/", {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,fr-FR;q=0.6,fr;q=0.5",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Google Chrome\";v=\"90\"",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "cookie": CM_COOKIE
        },
        "referrer": "https://tutien.net/account/bang_phai/bao_kho_duong/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": formEncoded,
        "method": "POST",
        "mode": "cors"
    });

    const body = await response.text();
    if (body === '1') {
        log.info(`[success] ${item.amount} ${item.name}: ${user.id} => ${user.toId}`);
        const cboxId = await getCboxIdFromTcvId(user.id);
        //if (user.id !== 132301) {
            pmCbox(cboxId, `Đã chuyển ${item.amount} ${cap(item.name)} cho ${user.toName} ([url=https://tutien.net/member/${user.toId}]${user.toId}[/url])`);
            //return;
        //}
        return;
    } else {
        chat(body);
        //chat(`Giao dịch ${cap(item.name)} bị từ chối. Liên hệ CM để kiểm tra.`);
    }
    //chat('Done!');

    return body;
}

// Chuyen 1 do cho nhieu id
function chuyenDoNhieuUser(content = '', args, userid) {
    const cdi = parseInt(args[1]);
    const ids = content.split("cho")[1].split(",").map((id) => id.trim());
    const listItems = parseItemToTrans(content.replace(`${args[0]}`, '').split("cho")[0]);

    if (!CHUYEN_DO_IDS.includes(parseInt(userid))) {
        chat("Chỉ QTV mới thực hiện được chức năng này.");
        return;
    }

    // const listItems = parseItemToTrans(content.replace(`${args[0]} ${cdi}`, ''));
    const items = [];
    for (let keys of listItems) {
        let sxj = [];
        if (cap(keys[0]).toLowerCase() == 'bộ châu') {
            sxj = ["1 Sa Ngọc Châu", "1 Thải Ngọc Châu", "1 Hỏa Ngọc Châu"];
        }
        if (cap(keys[0]).toLowerCase() == 'bộ tàng siêu') {
            sxj = ["1 Mảnh Tàn Đồ S1", "1 Mảnh Tàn Đồ S2", "1 Mảnh Tàn Đồ S3", "1 Mảnh Tàn Đồ S4", "1 Mảnh Tàn Đồ S5"];
        }
        if (cap(keys[0]).toLowerCase() == 'bts') {
            sxj = ["1 Mảnh Tàn Đồ S1", "1 Mảnh Tàn Đồ S2", "1 Mảnh Tàn Đồ S3", "1 Mảnh Tàn Đồ S4", "1 Mảnh Tàn Đồ S5"];
        }
        if (cap(keys[0]).toLowerCase() == 'bộ tàng cao') {
            sxj = ["1 La Bàn", "1 Quy Giáp", "1 Quyên Bạch", "1 Lông Sói", "1 Chu Sa"];
        }
        if (cap(keys[0]).toLowerCase() == 'btc') {
            sxj = ["1 La Bàn", "1 Quy Giáp", "1 Quyên Bạch", "1 Lông Sói", "1 Chu Sa"];
        }
        if (cap(keys[0]).toLowerCase() == 'bộ đột phá' || cap(keys[0]).toLowerCase() == 'bộ dp') {
            sxj = ["1 Thanh Tâm Đan", "1 Tị Lôi Châu", "1 Đê Giai Thuẫn"];
        }
        if (cap(keys[0]).toLowerCase() == 'lò bad' || cap(keys[0]).toLowerCase() == 'lò bổ anh đan') {
            sxj = ["3 Anh Tâm Thảo", "1 Trích Tinh Thảo", "15 Linh Thạch HP"];
        }
        if (cap(keys[0]).toLowerCase() == 'lò dld' || cap(keys[0]).toLowerCase() == 'lò đại linh đan') {
            sxj = ["2 Uẩn Kim Thảo", "2 Hóa Long Thảo", "1 Trích Tinh Thảo", "3 Luyện Thần Thảo", "3 Hợp Nguyên Thảo", "6 Đại Linh Thảo", "32 Linh Thạch HP"];
        }
        if (cap(keys[0]).toLowerCase() == 'lò ltd' || cap(keys[0]).toLowerCase() == 'lò luyện thần đan') {
            sxj = ["1 Anh Tâm Thảo", "2 Hóa Long Thảo", "1 Hóa Nguyên Thảo", "3 Luyện Thần Thảo", "1 Trích Tinh Thảo", "25 Linh Thạch HP"];
        }
        if (cap(keys[0]).toLowerCase() == 'lò bnd' || cap(keys[0]).toLowerCase() == 'lò bổ nguyên đan') {
            sxj = ["2 Thiên Nguyên Thảo", "2 Trích Tinh Thảo", "10 Linh Thạch HP"];
        }
        if (cap(keys[0]).toLowerCase() == 'lò hnd' || cap(keys[0]).toLowerCase() == 'lò hóa nguyên đan') {
            sxj = ["2 Anh Tâm Thảo", "3 Hóa Nguyên Thảo", "1 Trích Tinh Thảo", "2 Uẩn Kim Thảo", "20 Linh Thạch HP"];
        }
        if (cap(keys[0]).toLowerCase() == 'lò tcd' || cap(keys[0]).toLowerCase() == 'lò trúc cơ đan') {
            sxj = ["1 Hóa Long Thảo", "2 Ngọc Tủy Chi", "1 Thiên Linh Quả", "1 Trích Tinh Thảo", "5 Linh Thạch HP"];
        }
        if (cap(keys[0]).toLowerCase() == 'lò ttd' || cap(keys[0]).toLowerCase() == 'lò tẩy tủy đan') {
            sxj = ["2 Thiên Linh Quả", "1 Trích Tinh Thảo", "5 Linh Thạch HP"];
        }
        if (cap(keys[0]).toLowerCase() == 'lkvm') {
            sxj = ["2 Trúc Cơ Đan", "23 Bổ Nguyên Đan"];
        }
        if (cap(keys[0]).toLowerCase() == 'tcvm') {
            sxj = ["17 Bổ Anh Đan", "1 Uẩn Thiên Đan", "1 Tị Lôi Châu", "1 Đê Giai Thuẫn"];
        }
        if (cap(keys[0]).toLowerCase() == 'kdvm' || cap(keys[0]).toLowerCase() == 'kđvm') {
            sxj = ["13 Hóa Nguyên Đan", "1 Phá Thiên Đan", "1 Thanh Tâm Đan", "1 Tị Lôi Châu", "1 Đê Giai Thuẫn"];
        }

        if (sxj.length === 0) {
            sxj = ['1 ' + cap(keys[0])];
        }

        for (const juo of sxj) {
            const amount = parseInt(juo.split(" ")[0]);
            const name = juo.slice((amount + " ").length);

            // chat("Start: " + Date.now());
            items.push({
                "name": name,
                "amount": +parseInt(keys[1]) * amount
            });
        }
    }

    getTcvNameFromTcvId(userid).then(name => {
        chat("Đang duyệt đơn chuyển đồ của " + name);
    });
    ids.forEach((cdi) => {
        const user = {id: userid, toId: cdi}
        chuyenNhieuDo(user, items, false).then(response => {});
    });
}

// Chuyen do 1 id
function chuyenDoFromBot(content = '', args, userid) {
    const cdi = parseInt(args[1]);
    if (!CHUYEN_DO_IDS.includes(parseInt(userid))) {
        chat("Chỉ QTV mới thực hiện được chức năng này.");
        return;
    }
    const listItems = parseItemToTrans(content.replace(`${args[0]} ${cdi}`, ''));
    const items = [];
    for (let keys of listItems) {
         let sxj = [];
         if (cap(keys[0]).toLowerCase() == 'bộ tàng siêu') {
             sxj = ["1 Mảnh Tàn Đồ S1", "1 Mảnh Tàn Đồ S2", "1 Mảnh Tàn Đồ S3", "1 Mảnh Tàn Đồ S4", "1 Mảnh Tàn Đồ S5"];
         }
         if (cap(keys[0]).toLowerCase() == 'bts') {
             sxj = ["1 Mảnh Tàn Đồ S1", "1 Mảnh Tàn Đồ S2", "1 Mảnh Tàn Đồ S3", "1 Mảnh Tàn Đồ S4", "1 Mảnh Tàn Đồ S5"];
         }
         if (cap(keys[0]).toLowerCase() == 'bộ tàng cao') {
             sxj = ["1 La Bàn", "1 Quy Giáp", "1 Quyên Bạch", "1 Lông Sói", "1 Chu Sa"];
         }
         if (cap(keys[0]).toLowerCase() == 'btc') {
             sxj = ["1 La Bàn", "1 Quy Giáp", "1 Quyên Bạch", "1 Lông Sói", "1 Chu Sa"];
         }
         if (cap(keys[0]).toLowerCase() == 'bộ đột phá' || cap(keys[0]).toLowerCase() == 'bộ dp') {
             sxj = ["1 Thanh Tâm Đan", "1 Tị Lôi Châu", "1 Đê Giai Thuẫn"];
         }
         if (cap(keys[0]).toLowerCase() == 'lò bad' || cap(keys[0]).toLowerCase() == 'lò bổ anh đan') {
             sxj = ["3 Anh Tâm Thảo", "1 Trích Tinh Thảo", "15 Linh Thạch HP"];
         }
         if (cap(keys[0]).toLowerCase() == 'lò dld' || cap(keys[0]).toLowerCase() == 'lò đại linh đan') {
             sxj = ["2 Uẩn Kim Thảo", "2 Hóa Long Thảo", "1 Trích Tinh Thảo", "3 Luyện Thần Thảo", "3 Hợp Nguyên Thảo", "6 Đại Linh Thảo", "32 Linh Thạch HP"];
         }
         if (cap(keys[0]).toLowerCase() == 'lò ltd' || cap(keys[0]).toLowerCase() == 'lò luyện thần đan') {
             sxj = ["1 Anh Tâm Thảo", "2 Hóa Long Thảo", "1 Hóa Nguyên Thảo", "3 Luyện Thần Thảo", "1 Trích Tinh Thảo", "25 Linh Thạch HP"];
         }
         if (cap(keys[0]).toLowerCase() == 'lò bnd' || cap(keys[0]).toLowerCase() == 'lò bổ nguyên đan') {
             sxj = ["2 Thiên Nguyên Thảo", "2 Trích Tinh Thảo", "10 Linh Thạch HP"];
         }
         if (cap(keys[0]).toLowerCase() == 'lò hnd' || cap(keys[0]).toLowerCase() == 'lò hóa nguyên đan') {
             sxj = ["2 Anh Tâm Thảo", "3 Hóa Nguyên Thảo", "1 Trích Tinh Thảo", "2 Uẩn Kim Thảo", "20 Linh Thạch HP"];
         }
         if (cap(keys[0]).toLowerCase() == 'lò tcd' || cap(keys[0]).toLowerCase() == 'lò trúc cơ đan') {
             sxj = ["1 Hóa Long Thảo", "2 Ngọc Tủy Chi", "1 Thiên Linh Quả", "1 Trích Tinh Thảo", "5 Linh Thạch HP"];
         }
         if (cap(keys[0]).toLowerCase() == 'lò ttd' || cap(keys[0]).toLowerCase() == 'lò tẩy tủy đan ') {
             sxj = ["2 Thiên Linh Quả", "1 Trích Tinh Thảo", "5 Linh Thạch HP"];
         }
         if (cap(keys[0]).toLowerCase() == 'lkvm') {
             sxj = ["2 Trúc Cơ Đan", "23 Bổ Nguyên Đan"];
         }
         if (cap(keys[0]).toLowerCase() == 'tcvm') {
             sxj = ["17 Bổ Anh Đan", "1 Uẩn Thiên Đan", "1 Tị Lôi Châu", "1 Đê Giai Thuẫn"];
         }
         if (cap(keys[0]).toLowerCase() == 'kdvm' || cap(keys[0]).toLowerCase() == 'kđvm') {
             sxj = ["13 Hóa Nguyên Đan", "1 Phá Thiên Đan", "1 Thanh Tâm Đan", "1 Tị Lôi Châu", "1 Đê Giai Thuẫn"];
         }
          if (sxj.length === 0) {
             sxj = ['1 ' + cap(keys[0])];
         }
          for (const juo of sxj) {
             const amount = parseInt(juo.split(" ")[0]);
             const name = juo.slice((amount + " ").length);
              // chat("Start: " + Date.now());
             items.push({
                 "name": name,
                 "amount": +parseInt(keys[1]) * amount
             });
         }
     }

     const user = {id: userid, toId: cdi}
     chuyenNhieuDo(user, items).then(response => {}); 
}

// Chuyen do tinh phi
async function chuyenDoFromUser(fromId, args, msg = '') {
    const toId = args[1];
    //const toId = args[args.length - 1];
    const listItems = parseItemToTrans(msg.replace(`${args[0]} ${toId}`, ''));
    //const listItems = parseItemToTrans(text.split('chuyển' + ' ')[1].split(' ' + 'cho')[0]);
    const ruong = await getRuong(fromId);
    const total = listItems.size;
    let currentBac = ruong['bạc'];
    /*if (!currentBac) {
        await pmTcv(fromId, "Bạc không đủ để chuyển!");
        return;
    }*/
    const basic = await getUserInfo(toId);
    const toName = basic.name;
    const bangPhai = basic.bangPhai;
    let fromName = await getTcvNameFromTcvId(fromId);
    if (!fromName) {
        const basic2 = await getUserInfo(toId);
        fromName = basic2.name;
    }

    currentBac = parseInt(currentBac);
    const bacPhi = total * CD_PRICE;
    /*if (currentBac < bacPhi) {
        await pmTcv(fromId, "Bạc không đủ để chuyển!");
        return;
    }*/

    const items = [];
    for (let keys of listItems) {
         const name = keys[0];
         const amount = parseInt(keys[1]);
         if (ruong.hasOwnProperty(name)) {
             const currentAmount = parseInt(ruong[name]);
             if (currentAmount < amount) {
                 await chat(`${fromName} - Số lượng ${cap(name)} không đủ để chuyển (còn ${currentAmount}).`);
                 //await pmTcv(fromUser, "Số lượng không đủ để chuyển!");
                 return;
             }
         } else {
             await chat(`${fromName} - Không tìm thấy log đã nộp ${amount} ${cap(name)}.`);
             //await pmTcv(fromUser, "Số lượng không đủ để chuyển!");
             return;
         }
     }

    const jsonData = {
        bacPhi,
        listItems: Object.fromEntries(listItems),
        fromId,
        toId
    };

    const jsonText = JSON.stringify(jsonData); 

    const listItemArray = [];
    listItems.forEach((value, key) => {
        listItemArray.push(`${value} ${key}`);
    });
    const listItemText = listItemArray.join(', ');
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
                chat(`Thành viên ID: ${toId} không có trong bang.`);
                return;
            }
            if (name !== '' && bp !== 'Vô Cực Ma Tông') {
                chat(`Thành viên ID: ${toId} không có trong bang.`);
                return;
            }
            if (name !== '' && bp === 'Vô Cực Ma Tông') {
                setItem(`queue_chuyen_do_${fromId}`, jsonText);
                setExpire(`queue_chuyen_do_${fromId}`, 15);
                pmTcv(fromId, `Chuyển ${cap(listItemText)} cho ${toName} ([url=https://tutien.net/member/${toId}]${toId}[/url]) (Y/N)?`);  
            }
        })
        .catch(error => {
            chat('Không nhận được phản hồi từ server.');
            chat('Đã tạm dừng bot 1 phút /bee109');
        }); 
    //pmTcv(fromId, `Chuyển ${listItemText} cho ${toName} ([url=https://tutien.net/member/${toId}]${toId}[/url]) (Y/N)?`);
    // await updateRuong(fromId, 'bạc', -1 * bacPhi);
    // await chuyenDo2Id(listItems, fromId, toId);
}

// Chuyen do 2 id
async function chuyenDoFromAdmin(args, msg = '') {
    const fromUser = parseInt(args[1]);
    const toUser = parseInt(args[2]);
    const listItems = parseItemToTrans(msg.replace(`${args[0]} ${fromUser} ${toUser}`, ''));
    await chuyenDo2Id(listItems, fromUser, toUser);
}

async function chuyenDo2Id(listItems, fromUser, toUser) {
    try {
    let userInfo = await getBasic(fromUser);
    if (!userInfo) {
        userInfo = await getUserInfo(fromUser);
    }
    let fromName = userInfo.name;
    const ruong = await getRuong(fromUser);
    const items = [];
    for (let keys of listItems) {
        const name = keys[0];
        const amount = parseInt(keys[1]);
        if (ruong.hasOwnProperty(name)) {
            const currentAmount = parseInt(ruong[name]);
            if (currentAmount < amount) {
                await chat(`${fromName} - Số lượng ${cap(name)} không đủ để chuyển.`);
                //await pmTcv(fromUser, "Số lượng không đủ để chuyển!");
                return;
            }
        } else {
            await chat(`${fromName} - Số lượng ${cap(name)} không đủ để chuyển.`);
            //await pmTcv(fromUser, "Số lượng không đủ để chuyển!");
            return;
        }

        await updateRuong(fromUser, name, -1 * amount);
        items.push({
            name,
            amount
        });
    }

    const user = {id: fromUser, toId: toUser}
    chuyenNhieuDo(user, items).then();
    } catch (error) {
        console.log(error);
    }
}

const updateNopDo = async (memberId, memberName, item, amount, pmUser = false) => {
    
    if (
        memberName.includes('loveanh') || 
        memberName.includes('lovemy') || 
        memberName.includes('thiduong') || 
        memberName.includes('tranhtranh') || 
        memberName.includes('hackhuyen') || 
        memberName.includes('bachkhuyen') || 
        memberName.includes('kimkhuyen') || 
        memberName.includes('thienkhuyen') || 
        memberName.includes('diakhuyen') || 
        memberName.includes('dockhuyen') || 
        memberName.includes('docthancau') || 
        memberName.includes('tukhuyen') ||
        memberName.includes('vodanhkhuyen') ||
        memberName.includes('hoahoc')
        ) {
        return;
    }
    
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
    const body = await response.json();
    const id = body.id;
    const name = body.name;
    const bp = body.bang_phai;
    
    if (id == '150184' || 
        id == '235579' || 
        id == '399989' || 
        id == '289602' || 
        id == '339811' || 
        id == '233972' || 
        id == '150495' || 
        id == '146752' || 
        id == '573444') {
        return;
    } 
    
    if (name !== '' && bp === 'Chưa gia nhập bang phái') {
        //chat(`Thành viên ID: ${toId} không có trong bang.`);
        return;
    }
    if (name !== '' && bp !== 'Vô Cực Ma Tông') {
        //chat(`Thành viên ID: ${toId} không có trong bang.`);
        return;
    }
    if (name !== '' && bp === 'Vô Cực Ma Tông') {
        const key = "ruong_do_ao_" + memberId + "_" + snake_case(item);
        let ruong = JSON.parse(await getItem(key));
        if (!ruong) {
            ruong = {};
        } 
     
        if (ruong.hasOwnProperty(item)) {
            if (SPECIAL_ITEMS.includes(item.toLowerCase())) {
                ruong[item] = parseInt(ruong[item]) + parseInt(Math.floor(amount/1.03));
                if (ruong[item] === 0) {
                    delete ruong[item];
                    await delKey(key);
                    return;
                }
                axios({
                    method: "POST",
                    url: "https://soi-tcvtool.xyz/truyencv/member/add-log-bac",
                    data: {
                        "tcvId": memberId,
                        "updown": "+",
                        "amount": parseInt(Math.floor(amount/1.03)),
                        "sodu": parseInt(ruong[item]),
                        "action": "Nộp quỹ",
                    }
                });
            } else {
                ruong[item] = parseInt(ruong[item]) + amount;
            }
        } //else {
            //ruong[item] = amount;
        //}
        if (!ruong.hasOwnProperty(item)) {
            if (SPECIAL_ITEMS.includes(item.toLowerCase())) {
                ruong[item] = parseInt(Math.floor(amount/1.03));
                if (ruong[item] === 0) {
                    delete ruong[item];
                    await delKey(key);
                    return;
                }
                axios({
                    method: "POST",
                    url: "https://soi-tcvtool.xyz/truyencv/member/add-log-bac",
                    data: {
                        "tcvId": memberId,
                        "updown": "+",
                        "amount": parseInt(Math.floor(amount/1.03)),
                        "sodu": parseInt(ruong[item]),
                        "action": "Nộp quỹ",
                    }
                });
            } else {
                ruong[item] = amount;
            }
        }

        const currentTtl = await getTtl(key);
        await setItem(key, JSON.stringify(ruong));
        if (SPECIAL_ITEMS.includes(item.toLowerCase())) {
            const cboxId = await getCboxIdFromTcvId(memberId); 
            //if (cboxId && pmUser) {
                //pmCbox(cboxId, "+" + amount + " " + item)
            //}
            return;
        }

        // Tru ruong
        if (amount < 0) {
            if (currentTtl > 0) {
                await setExpire(key, currentTtl);
            }

            return;
        }

        await setExpire(key, ITEM_EXPIRE_IN);
    }   
}


const updateRuong = async (memberId, item, amount, pmUser = false) => {
    const key = "ruong_do_ao_" + memberId + "_" + snake_case(item);
    let ruong = JSON.parse(await getItem(key));
    if (!ruong) {
        ruong = {};
    }

    if (ruong.hasOwnProperty(item)) {
        ruong[item] = parseInt(ruong[item]) + parseInt(amount);
        if (ruong[item] === 0) {
            delete ruong[item];
            await delKey(key); 
            return;
        }
        if (ruong['bạc'] == null) {
            await setItem(`ruong_do_ao_${memberId}_bac`, 0);
            ruong['bạc'] = 0;
        }
    } else {
        ruong[item] = amount;
    }

    const currentTtl = await getTtl(key);
    await setItem(key, JSON.stringify(ruong));
    if (SPECIAL_ITEMS.includes(item.toLowerCase())) {
        const cboxId = await getCboxIdFromTcvId(memberId);
        /*if (cboxId && pmUser) {
            pmCbox(cboxId, "+" + amount + " " + item)
        }*/
        return;
    }

    // Tru ruong
    if (amount < 0) {
        if (currentTtl > 0) {
            await setExpire(key, currentTtl);
        }

        return;
    }

    await setExpire(key, ITEM_EXPIRE_IN);
    /*if (amount > 0 && pmUser) {
        const cboxId = await getCboxIdFromTcvId(memberId);
        if (cboxId) {
            pmCbox(cboxId, amount + " " + item)
        }
        // else {
        //     chat("[TEST] [b]@" + memberName + "[/b]: +" + amount + " " + item);
        // }
    }*/
}

/**
 *
 * @param itemText
 * @returns {Map<any, any>}
 */
function parseItemToTrans(itemText) {
    let listItems = new Map();
    const splitText = itemText.split(",")
    for (let o = 0; o < splitText.length; o++) {
        const item = splitText[o].trim().replace(/\s\s+/g, ' ');
        let amount = item.split(' ')[0];
        if (!isNaN(amount)) {
            let itemName = item.replace(amount + " ", '').replace(/\s\s+/g, ' ');
            if (itemName == null) {
                continue;
            }

            itemName = cap(viettat(itemName), false);
            let preAmount = parseInt(listItems.has(itemName) ? listItems.get(itemName) : 0);
            amount = preAmount + parseInt(amount);
            listItems.set(itemName, amount);
        }
    }

    return listItems;
}

const getRuong = async memberId => {
    const key = "ruong_do_ao_" + memberId + "_*";
    const itemKeys = await getKeys(key);
    if (itemKeys.length === 0) {
        return null;
    }

    const items = {};
    for (let i = 0; i < itemKeys.length; i ++) {
        let item = await getItem(itemKeys[i]);
        if (item === "{}" || item === "") {
            await delKey(itemKeys[i]);
            continue;
        }

        item = JSON.parse(item);
        Object.assign(items, item);
    }

    return items;
}

const xoaRuong = async (memberId) => {
    const key = "ruong_do_ao_" + memberId + "_*";
    const itemKeys = await getKeys(key);
    for (let i = 0; i < itemKeys.length; i++) {
        await delKey(itemKeys[i]);
    }

    chat("Xong!");
}

const showMyRuong = async (member) => {
    await showRuong(member, null, false);
}

const checkRuong = async (memberId, memberCboxId) => {
    await showRuong(memberId, memberCboxId, true);
}

const checkMemberRuong = async (memberId, adminCboxId) => {
    await showRuong(memberId, adminCboxId, true);
}

const showRuong = async (memberId, toCboxId, isPm = true) => {
    const key = "ruong_do_ao_" + memberId + "_*"; 
    const itemKeys = await getKeys(key);
    if (itemKeys.length === 0) {
        if (!toCboxId) {
            chat("Rương trống!");
            return;
        }

        if (isPm) {
            pmCbox(toCboxId, "Rương trống!")
            return null;
        }

        return null;
    } 

    const items = ["Rương:"];
    for (let i = 0; i < itemKeys.length; i ++) {
        let item = await getItem(itemKeys[i]);
        if (item === "{}" || item === "") {
            await delKey(itemKeys[i]);
            continue;
        }

        item = JSON.parse(item);
        const itemName = Object.keys(item)[0];
        const amount = parseInt(item[itemName]);
        const ttl = await getTtl(itemKeys[i]);
        /*if (["thần nông lệnh", "tiên phủ lệnh", "cổ chiến lệnh", "tru tiên đan", "uẩn huyết đan", "vận khí đan"].includes(itemName.toLowerCase())) {
            items.push(`${amount} ${itemName}`);
        } else 
            if (["sức mạnh", "sinh lực", "vận khí"].includes(itemName.toLowerCase())) {
                //items.push(``);
            } else 
                if (itemName !== "bạc") {
                    items.push(`${amount} ${itemName}: [color=gray]Hết hạn sau ${parseInt(ttl/60)} phút[/color]`);
                } //else {
                    //items.push(`✦ [b]${amount} ${itemName}[/b]: [color=gray]Hết hạn sau ${parseInt(ttl/60)} phút[/color]`);
                //}*/
        
        if (itemName === "bạc") {
            //items.push(`✦ ${formatBac(amount)} ${itemName}`);
        } else {
            items.push(`✦ ${amount} ${itemName}: [color=gray]Hết hạn sau ${parseInt(ttl/60)} phút[/color]`);
        }
    }

    if (!toCboxId) {
        chat(items.join("[br]"));
        return;
    }

    if (toCboxId) {
        await pmCbox(toCboxId, items.join("[br]"))
        return null;
    }

    await pmTcv(memberId, items.join("[br]"));
    return null;
}

const checkSoDu = async (memberId, memberCboxId) => {
    await showSoDu(memberId, memberCboxId, true);
}

const checkMemberSoDu = async (memberId, adminCboxId) => {
    await showSoDu(memberId, adminCboxId, true);
}

const showSoDu = async (memberId, toCboxId, isPm = true) => {
    const key = "ruong_do_ao_" + memberId + "_bac";
    //const itemKeys = await getKeys(key);
    let item = await getItem(key);
    item = JSON.parse(item);
    if (item == null) {
        await setItem(key, 0);
        item = 0;
    }
    const soDu = parseInt(item['bạc'] == null ? 0 : parseInt(item['bạc']));
    const today = new Date().getDate();
    const month = new Date().getMonth();
    let itemChuyen = await getItem(`${memberId}_${today}_${month}_luot_chuyen`); 
    let luotchuyen = itemChuyen ? parseInt(itemChuyen) : 0;
    var phiDichVu = 0;
    if (luotchuyen >= 3) {
        phiDichVu = (luotchuyen + 1) * 100;
    } else {
        phiDichVu = 0;
    }
    if (item.length === 0) {
        if (!toCboxId) {
            chat(`Số dư hiện tại là 0 bạc[br]Đã chuyển ${luotchuyen} lượt trong ngày (Phí dịch vụ lượt chuyển tiếp theo là ${phiDichVu} bạc)`);
            return;
        }

        if (isPm) {
            pmCbox(toCboxId, `Số dư hiện tại là 0 bạc.[br]Đã chuyển ${luotchuyen} lượt trong ngày (Phí dịch vụ lượt chuyển tiếp theo là ${phiDichVu} bạc)`);
            return null;
        }

        return null;
    } 

    /*const items = ["Số dư hiện tại là: "];
    for (let i = 0; i < itemKeys.length; i ++) {
        let item = await getItem(itemKeys[i]);
        if (item === "{}" || item === "") {
            await delKey(itemKeys[i]);
            continue;
        }

        item = JSON.parse(item);
        const itemName = Object.keys(item)[0];
        const amount = parseInt(item[itemName]);
        const ttl = await getTtl(itemKeys[i]);
        if (itemName === "bạc") { 
            //items.push(`${formatBac(amount)} ${itemName}`);
            items.push(`${formatBac(amount)} ${itemName}[br]Đã chuyển ${luotchuyen} lượt trong ngày (Phí dịch vụ lượt chuyển tiếp theo là ${phiDichVu} bạc)`);
        } //else {
            //items.push(`✦ [b]${amount} ${itemName}[/b]: [color=gray]Hết hạn sau ${parseInt(ttl/60)} phút[/color]`);
        //}
    }*/

    /*if (!toCboxId) {
        chat(items.join(""));
        return;
    }*/

    if (toCboxId) {
        await pmCbox(toCboxId, `Số dư hiện tại là: ${formatBac(soDu)} bạc[br]Đã chuyển ${luotchuyen} lượt trong ngày (Phí dịch vụ lượt chuyển tiếp theo là ${phiDichVu} bạc)`);
        //await pmCbox(toCboxId, items.join(""))
        return null;
    }

    await pmTcv(memberId, `Số dư hiện tại là: ${formatBac(soDu)} bạc[br]Đã chuyển ${luotchuyen} lượt trong ngày (Phí dịch vụ lượt chuyển tiếp theo là ${phiDichVu} bạc)`);
    //await pmTcv(memberId, items.join(""));
    return null;
}

//hành trang
const checkHanhTrang = async (memberId, memberCboxId) => {
    await showHanhTrang(memberId, memberCboxId, true);
}

const checkMemberHanhTrang = async (memberId, adminCboxId) => {
    await showHanhTrang(memberId, adminCboxId, true);
}

const showHanhTrang = async (memberId, toCboxId, isPm = true) => {
    const key = "ruong_do_ao_" + memberId + "_*"; 
    const itemKeys = await getKeys(key);
    if (itemKeys.length === 0) {
        if (!toCboxId) {
            chat("Hành trang trống!");
            return;
        }

        if (isPm) {
            pmCbox(toCboxId, "Hành trang trống!")
            return null;
        }

        return null;
    } 

    const items = ["đang có: "];
    for (let i = 0; i < itemKeys.length; i ++) {
        let item = await getItem(itemKeys[i]);
        if (item === "{}" || item === "") {
            await delKey(itemKeys[i]);
            continue;
        }

        item = JSON.parse(item);
        const itemName = Object.keys(item)[0];
        const amount = parseInt(item[itemName]);
        const ttl = await getTtl(itemKeys[i]);
        if (["thần nông lệnh", "tiên phủ lệnh"].includes(itemName.toLowerCase())) {
            items.push(`${amount} ${itemName}`);
        } else 
            if (itemName != "bạc") {
                items.push(`${amount} ${itemName}: [color=gray]Hết hạn sau ${parseInt(ttl/60)} phút[/color]`); 
            }
    }
    if (!toCboxId) {
        chat(items.join("[br]"));
        return;
    }

    if (toCboxId) {
        await pmCbox(toCboxId, items.join("[br]"))
        return null;
    }

    await pmTcv(memberId, items.join("[br]"));
    return null;
}

//nhân vật
const checkNhanVat = async (memberId, memberCboxId) => {
    await showNhanVat(memberId, memberCboxId, true);
}

const checkMemberNhanVat = async (memberId, adminCboxId) => {
    await showNhanVat(memberId, adminCboxId, true);
}

const showNhanVat = async (memberId, toCboxId, isPm = true) => {
    const key = "ruong_do_ao_" + memberId + "_*";
    const itemKeys = await getKeys(key);
    if (itemKeys.length === 0) {
        if (!toCboxId) {
            chat("Nhân vật trống!");
            return;
        }

        if (isPm) {
            pmCbox(toCboxId, "Nhân vật trống!")
            return;
        }

        return null;
    }

    const items = ["đang có: "];
    for (let i = 0; i < itemKeys.length; i ++) {
        let item = await getItem(itemKeys[i]);
        if (item === "{}" || item === "") {
            await delKey(itemKeys[i]);
            continue;
        }

        item = JSON.parse(item);
        const itemName = Object.keys(item)[0];
        const amount = parseInt(item[itemName]);
        const ttl = await getTtl(itemKeys[i]);
        if (["sức mạnh", "sinh lực", "vận khí"].includes(itemName.toLowerCase())) {
            items.push(`${amount} ${itemName}`);
        } 
    }

    if (!toCboxId) {
        chat(items.join("[br]"));
        return;
    }

    if (toCboxId) {
        await pmCbox(toCboxId, items.join("[br]"))
        return;
    }

    await pmTcv(memberId, items.join("[br]"));
    return null;
}

const napRuongBiCanh = async (tcvId, amount) => { 
    let fromName = await getTcvNameFromTcvId(tcvId); 
    await updateRuong(tcvId, "bạc", amount);
    
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
                "amount": amount,
                "sodu": soDu,
                "action": `Thăm dò cổ chiến trường`,
            }
        }); 
}

const napRuongVietlott = async (tcvId, amount) => { 
    let fromName = await getTcvNameFromTcvId(tcvId); 
    await updateRuong(tcvId, "bạc", amount);
    
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
                "amount": amount,
                "sodu": soDu,
                "action": `Chơi game Vietlott`,
            }
        }); 
}

const napRuongVietlott2 = async (tcvId, amount) => { 
    let fromName = await getTcvNameFromTcvId(tcvId); 
    await updateRuong(tcvId, "bạc", amount);
    
    const key = "ruong_do_ao_" + tcvId + "_bac";
    let ruong = await getItem(key);

    ruong = JSON.parse(ruong);
    const soDu = parseInt(ruong["bạc"]); 
 
        axios({
            method: "POST",
            url: "https://soi-tcvtool.xyz/truyencv/member/add-log-bac",
            data: {
                "tcvId": tcvId,
                "updown": "",
                "amount": amount,
                "sodu": soDu,
                "action": `Chơi game Vietlott`,
            }
        }); 
}

const napRuongTaiXiu = async (tcvId, amount) => { 
    let fromName = await getTcvNameFromTcvId(tcvId); 
    await updateRuong(tcvId, "bạc", amount);
    
    const key = "ruong_do_ao_" + tcvId + "_bac";
    let ruong = await getItem(key);

    ruong = JSON.parse(ruong);
    if (ruong == null) {
        await setItem(key, 0);
        ruong = 0;
    }
    const soDu = parseInt(ruong["bạc"]); 
 
        axios({
            method: "POST",
            url: "https://soi-tcvtool.xyz/truyencv/member/add-log-bac",
            data: {
                "tcvId": tcvId,
                "updown": "+",
                "amount": amount,
                "sodu": soDu,
                "action": `Chơi game Tài Xỉu`,
            }
        }); 
}

const napRuongTaiXiu2 = async (tcvId, amount) => { 
    let fromName = await getTcvNameFromTcvId(tcvId); 
    await updateRuong(tcvId, "bạc", amount);
    
    const key = "ruong_do_ao_" + tcvId + "_bac";
    let ruong = await getItem(key);

    ruong = JSON.parse(ruong);
    if (ruong == null) {
        await setItem(key, 0);
        ruong = 0;
    }
    const soDu = parseInt(ruong["bạc"]); 
 
        axios({
            method: "POST",
            url: "https://soi-tcvtool.xyz/truyencv/member/add-log-bac",
            data: {
                "tcvId": tcvId,
                "updown": "",
                "amount": amount,
                "sodu": soDu,
                "action": `Chơi game Tài Xỉu`,
            }
        }); 
}

const napRuong = async (tcvId, toId, amount) => {
    //const toId = args[2];
    //const amount = parseInt(args[3]);
    //let item = cap(viettat(args.splice(4).join(" ")), false);
    let fromName = await getTcvNameFromTcvId(tcvId);
    /*if (item === 'Bạc') {
        item = 'bạc';
    }

    if (item !== 'bạc') {
        chat("Sai cú pháp.");
        return;
    }*/
    await updateRuong(toId, "bạc", amount);
    
    const key = "ruong_do_ao_" + toId + "_bac";
    let ruong = await getItem(key);

    ruong = JSON.parse(ruong);
    const soDu = parseInt(ruong["bạc"]); 
 
        axios({
            method: "POST",
            url: "https://soi-tcvtool.xyz/truyencv/member/add-log-bac",
            data: {
                "tcvId": toId,
                "updown": "+",
                "amount": amount,
                "sodu": soDu,
                "action": `${fromName} (${tcvId}) cộng bạc`,
            }
        });
    
    //let toName = await getTcvNameFromTcvId(toId);
    //if (!toName) {
    //    toName = toId;
    //} 

    await chat(`${fromName} - Xong /xga`);
    //await pmCbox(fromCbox, `Đã nạp ${amount} ${item} cho ${toName}`);
}

const napRuong2 = async (tcvId, toId, amount) => {
    //const toId = args[2];
    //const amount = parseInt(args[3]);
    //let item = cap(viettat(args.splice(4).join(" ")), false);
    let fromName = await getTcvNameFromTcvId(tcvId);
    /*if (item === 'Bạc') {
        item = 'bạc';
    }

    if (item !== 'bạc') {
        chat("Sai cú pháp.");
        return;
    }*/
    await updateRuong(toId, "bạc", amount);
    
    const key = "ruong_do_ao_" + toId + "_bac";
    let ruong = await getItem(key); 

    ruong = JSON.parse(ruong);
    if (ruong == null) {
        await setItem(key, 0);
        ruong = 0;
    }
    const soDu = parseInt(ruong["bạc"]); 
 
        axios({
            method: "POST",
            url: "https://soi-tcvtool.xyz/truyencv/member/add-log-bac",
            data: {
                "tcvId": toId,
                "updown": "",
                "amount": amount,
                "sodu": soDu,
                "action": `${fromName} (${toId}) trừ bạc`,
            }
        });
    
    //let toName = await getTcvNameFromTcvId(toId);
    //if (!toName) {
    //    toName = toId;
    //} 

    await chat(`${fromName} - Xong /xga`);
    //await pmCbox(fromCbox, `Đã nạp ${amount} ${item} cho ${toName}`);
}

export {
    chuyenDoFromBot,
    chuyenDoNhieuUser,
    chuyenDoFromAdmin,
    chuyenDoFromUser,
    chuyenDo,
    chuyenNhieuDo,
    updateRuong,
    updateNopDo,
    showRuong,
    napRuongBiCanh,
    napRuongTaiXiu,
    napRuongTaiXiu2,
    napRuongVietlott,
    napRuongVietlott2,
    napRuong,
    napRuong2,
    checkMemberRuong,
    showMyRuong,
    checkRuong,
    checkSoDu,
    checkMemberSoDu,
    checkHanhTrang,
    checkMemberHanhTrang,
    checkNhanVat,
    checkMemberNhanVat,
    xoaRuong,
    chuyenDo2Id
}
