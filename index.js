import WebSocket from 'ws';
import {parseMessage} from "./modules/socket-listener.js";
import {chat, getKeys, getTtl, getTcvNameFromTcvId, delKey} from "./helper.js";
import {duyetMem2} from './modules/member.js';

//const WSS_URL = "wss://flr-eu1.cbox.ws:4431/?pool=2-2397766-13";
//const WSS_URL = "wss://flr-eu2.cbox.ws:4432/?pool=2-2397766-13";
const WSS_URL = "wss://flr-eu3.cbox.ws:4432/?pool=2-2397766-13";
const ws = new WebSocket(WSS_URL);

ws.on('open', function open() {
  ws.send('test');
});

const IGNORE_ID = [
    '6550468', // bot
    '5095765', // truyencv bot
];

const AUTO_DUYET = [
    '✰ßυôи ßậи ßịu✰',
    "✰ßυôи ßαиƙ✰",
    'nuoimotdancho',
    'Quỷ Kiếm Sầu',
    '•๖ۣۜTiểυ ༒ ๖ۣۜHâη•',
    'Nhất kiến sinh tài'
];

ws.on('message', async function incoming(data) {
    const parsed = data.split("\t");
    if (parsed.length < 9) {
        return;
    }

    //console.log(parsed);
    const fromCboxId = parsed[9];
    if (IGNORE_ID.includes(fromCboxId)) {
        return;
    }

    if (fromCboxId == '6311236') {
        const content = parsed[6];
        if (content.includes('Có ai không, duyệt')) {
            const memberName = content.split('Có ai không, duyệt ')[1].split(' (')[0].trim();
            const requestId = content.split('(')[1].split(')')[0].trim();
            for (let i = 0; i < AUTO_DUYET.length; i++) { 
                 if (memberName.includes(AUTO_DUYET[i])) {
                     await duyetMem2(requestId);
                     chat('Đã duyệt ' + AUTO_DUYET[i] + ' vào bang.')
                 }
            }
        }
        return;
    }
    
    try {
        await parseMessage(parsed);
        //console.log(parsed);
    } catch (error) {
        const minute = new Date().getMinutes();
        const minutes = 59 - minute;
        chat('Không nhận được phản hồi từ server.');
        chat(`Đã tạm dừng bot ${minutes} phút /bee109`);
        console.log(error);
    }
});

setInterval(async function () {
try {
    const keysChuyenBac = await getKeys('*queue_chuyen_bac_*');
    const keysChuyenDo = await getKeys('*queue_chuyen_do_*');
    const keysChuyenRuong = await getKeys('*queue_chuyen_ruong_*');
    const keysVaoDong = await getKeys('*queue_vao_dong_*');
    const keysVaoDuocVien = await getKeys('*queue_vao_duoc_vien_*');
    for (let i = 0; i < keysChuyenBac.length; i++) {
        const key = keysChuyenBac[i];
        const fromId = key.replace('queue_chuyen_bac_', '');
        const expire = await getTtl(key);
        if (parseInt(expire) <= 1) {
            const fromName = await getTcvNameFromTcvId(fromId); 
            chat(`${fromName} - Hết thời gian xác nhận, hủy giao dịch.`);
            await delKey(key);
        }
    }
    for (let i = 0; i < keysChuyenDo.length; i++) {
        const key = keysChuyenDo[i];
        const fromId = key.replace('queue_chuyen_do_', '');
        const expire = await getTtl(key);
        if (parseInt(expire) <= 1) {
            const fromName = await getTcvNameFromTcvId(fromId); 
            chat(`${fromName} - Hết thời gian xác nhận, hủy giao dịch.`);
            await delKey(key);
        }
    }
    for (let i = 0; i < keysChuyenRuong.length; i++) {
        const key = keysChuyenRuong[i];
        const fromId = key.replace('queue_chuyen_ruong_', '');
        const expire = await getTtl(key);
        if (parseInt(expire) <= 1) {
            const fromName = await getTcvNameFromTcvId(fromId); 
            chat(`${fromName} - Hết thời gian xác nhận, hủy giao dịch.`);
            await delKey(key);
        }
    }
    for (let i = 0; i < keysVaoDong.length; i++) {
        const key = keysVaoDong[i];
        const fromId = key.replace('queue_vao_dong_', '');
        const expire = await getTtl(key);
        if (parseInt(expire) <= 1) {
            const fromName = await getTcvNameFromTcvId(fromId); 
            chat(`${fromName} - Hết thời gian xác nhận, hủy giao dịch.`);
            await delKey(key);
        }
    }
    for (let i = 0; i < keysVaoDuocVien.length; i++) {
        const key = keysVaoDuocVien[i];
        const fromId = key.replace('queue_vao_duoc_vien_', '');
        const expire = await getTtl(key);
        if (parseInt(expire) <= 1) {
            const fromName = await getTcvNameFromTcvId(fromId); 
            chat(`${fromName} - Hết thời gian xác nhận, hủy giao dịch.`);
            await delKey(key);
        }
    }
} catch (error) { console.log(error); }
}, 1200);

//chat("Server connected.");
//chat("Hệ thống đã khởi động lại [img]https://love-thiduong.xyz/images/sharingan.gif[/img]");
