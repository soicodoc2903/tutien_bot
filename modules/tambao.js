import {chat, pmCbox, getItem, getKeys, getTcvNameFromTcvId, setItem, formatBac} from '../helper.js';
import {updateRuong, chuyenDoHacDiem, napRuongBiCanh} from "./chuyen-do.js";
import axios from "axios";
import {cap, viettat} from "./viettat.js";

const getRndInteger = (min, max) => {
    max++;
    let bb = 0;
    for (let l = 1; l <= 10; l++) {
        bb = Math.floor(Math.random() * (max - min) ) + min;
    }
    return bb;
}

const getRuong = async tcvId => {
    const key = "ruong_do_ao_" + tcvId + "_*";
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

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

const getRandomVp = () => {
    const vp = ["La Bàn", "Quy Giáp", "Nội Đan C1", "Nội Đan C2", "Nội Đan C3", "Nội Đan C4", "Nội Đan C5", "Nội Đan C6", "Nội Đan C7", "Nội Đan C8", "Nội Đan C9", "Nội Đan C10", "Linh Thạch HP", "Linh Thạch TP", "Bổ Huyết Đan", "Huyết Tinh Đan", "Trúc Cơ Đan", "Bổ Nguyên Đan", "Bổ Anh Đan", "Tẩy Tủy Đan"];
    return vp[Math.floor(Math.random() * vp.length)];
}

const getRandomTienNhan = () => {
    const vp = ["La Bàn", "Quy Giáp", "Linh Thạch HP", "Linh Thạch TP", "Linh Thạch THP", "Linh Thạch CP", "Tinh Linh HP", "Tinh Linh TP", "Tinh Linh THP", "Tinh Linh CP", "Tử Tinh HP", "Tử Tinh TP", "Bàn Đào Quả", "Bồ Đề Quả", "Huyết Tinh Đan", "Bổ Huyết Đan", "Tụ Bảo Bài", "Hóa Nguyên Đan", "Luyện Thần Đan"];
    return vp[Math.floor(Math.random() * vp.length)];
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function suDungDonPhu(tcvId) {
    //let toName = await getTcvNameFromTcvId(userid);
    //if (!toName) {
    const basic = await getUserInfo(tcvId);
    let fromName = basic.name;
    const basic2 = await getUserInfo(toId);
    let toName = basic2.name;
    let toBangPhai = basic2.bangPhai;
    //}
    const key = "ruong_do_ao_" + tcvId + "_vo_cuc_don_phu";
    let ruong = await getItem(key); 

    if (!ruong) {
         chat(`${fromName} - Không có Vô Cực Độn Phù để sử dụng.`);
        //await pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }

    ruong = JSON.parse(ruong);
    const voCucDonPhu = !!ruong["Vô Cực Độn Phù"] ? parseInt(ruong["Vô Cực Độn Phù"]) : 0;
    if (voCucDonPhu < 1) {
        chat(`${fromName} - Không có Vô Cực Độn Phù để sử dụng.`);
        //await pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }
    let queueKeyDonPhu = `queue_don_phu_${tcvId}`;
    let queueDataDonPhu = JSON.stringify({tcvId});
    if (voCucDonPhu > 0) {
        
    } else {
        chat(`${fromName} - Không có Vô Cực Độn Phù để sử dụng.`);
        return;
    }
}

export const thamDoChienTruong = async (tcvId, cboxId, fromName) => {
    // const fromName = await getTcvNameFromTcvId(tcvId);
    //const ruong = await getRuong(tcvId);
    
    //chiến lệnh 
    const lenhBai = "ruong_do_ao_" + tcvId + "_co_chien_lenh";
    let lenhBais = await getItem(lenhBai);

    if (!lenhBais) {
        pmCbox(cboxId, "Không có Cổ Chiến Lệnh để tham gia tầm bảo.");
        //pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }

    lenhBais = JSON.parse(lenhBais);
    const coChienLenh = !!lenhBais["Cổ Chiến Lệnh"] ? parseInt(lenhBais["Cổ Chiến Lệnh"]) : 0;
    if (coChienLenh < 1) {
        pmCbox(cboxId, "Không có Cổ Chiến Lệnh để tham gia tầm bảo.");
        //pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }
    let truyenTong = getRndInteger(1, 6);
    let rdBac = getRndInteger(1, 2000);
    
    //sinh lực
    const sinhLuc = "ruong_do_ao_" + tcvId + "_sinh_luc";
    var sinhLucs = await getItem(sinhLuc); 
    if (!sinhLucs) {
        pmCbox(cboxId, "Không đủ Sinh Lực để tham gia tầm bảo.");
        return;
    }
    if (sinhLucs == null) {
        await setItem(sinhLuc, 0);
        sinhLucs = 0;
    }
    sinhLucs = JSON.parse(sinhLucs);
    let hp = !!sinhLucs["Sinh Lực"] ? parseInt(sinhLucs["Sinh Lực"]) : 0;
    if (hp < 1) {
        pmCbox(cboxId, "Không đủ Sinh Lực để tham gia tầm bảo.");
        return;
    }
    
    //sức mạnh
    const sucManh = "ruong_do_ao_" + tcvId + "_suc_manh";
    var sucManhs = await getItem(sucManh); 
    if (sucManhs == null) {
        await setItem(sucManh, 0);
        sucManhs = 0;
    }
    sucManhs = JSON.parse(sucManhs);
    let dame = !!sucManhs["Sức Mạnh"] ? parseInt(sucManhs["Sức Mạnh"]) : 0;
    
    //vận khí
    const vanKhi = "ruong_do_ao_" + tcvId + "_van_khi";
    var vanKhis = await getItem(vanKhi); 
    if (vanKhis == null) {
        await setItem(vanKhi, 0);
        vanKhis = 0;
    }
    
    vanKhis = JSON.parse(vanKhis);
    let vk = !!vanKhis["Vận Khí"] ? parseInt(vanKhis["Vận Khí"]) : 0;

    //vận khí đạo tặc
    let vkDaoTac = getRndInteger(1, 5);

    //đi lạc
    let rdHongHoang = getRndInteger(1, 3);

    //random sức mạnh
    let rdSucManh = getRndInteger(1000, 3000);

    //get random sinh lực
    let rdSinhLuc = getRndInteger(1000, 5000);

    //random vận khí
    let rdVanKhi = getRndInteger(1, 5);

    //thăm dò
    if (coChienLenh > 0) {
        await updateRuong(tcvId, "Cổ Chiến Lệnh", -1);
        if (truyenTong == 1 || vk < 9) {
            await updateRuong(tcvId, "Sinh Lực", -rdSinhLuc);
            pmCbox(cboxId, `Đạo hữu lọt vào đạo tặc tập kích, thụ thương mất ${rdSinhLuc} Sinh Lực /denm`);
            return;
        }

        if (truyenTong == 2) {
            const rdBacLum = getRndInteger(1000, 3000);
            chat(`${fromName} đã phát hiện được ${rdBacLum} bạc khi thăm dò Cổ Chiến Trường.`);
            await napRuongBiCanh(tcvId, rdBacLum); 
            return;
        }

        if (truyenTong == 3) {
            chat(`${fromName} vô tình lạc vào Hồng Hoang Chi Địa khi thăm dò Cổ Chiến Trường.`);
            var dameBoss = (dame * hp) / 10;
            var hpBoss = 55000;
            const vpLum = getRandomVp();
            await sleep(10000);
            // setTimeout(function () {
            if (rdHongHoang == 1) {
                await updateRuong(tcvId, "Vận Khí", -rdVanKhi);
                chat(`${fromName} đã bị Chu Tước dọa sợ, không dám vào bí cảnh /thodai`);
                return;
            } else if (dameBoss < hpBoss) {
                await updateRuong(tcvId, "Sinh Lực", -rdSinhLuc);
                chat(`${fromName} đã bị Chu Tước hạ gục.`);
                return;
            } else {
                await updateRuong(tcvId, "Sức Mạnh", -rdSucManh);
                chat(`${fromName} đã đánh bại Chu Tước, lụm được 1 ${cap(vpLum)}.`);
                await chuyenDoHacDiem(vpLum, 1, tcvId);
                return;
            }
            // }, 10000);
            return;
        }

        if (truyenTong == 4) {
            const vpLum = getRandomVp();
            await sleep(3000);
            if (vkDaoTac == 1) {
                await updateRuong(tcvId, "Vận Khí", -rdVanKhi);
                chat(`${fromName} đã phát hiện được 1 ${cap(vpLum)} khi thăm dò Cổ Chiến Trường nhưng trong lúc mang bảo vật về động phủ đã bị đạo tặc cướp mất, vận khí -${rdVanKhi} /denm`);
                return;
            } else {
                chat(`${fromName} đã phát hiện được 1 ${cap(vpLum)} khi thăm dò Cổ Chiến Trường.`);
                await chuyenDoHacDiem(vpLum, 1, tcvId);
                return;
            }
            return;
        }

        /*if (truyenTong == 4) {
            const vpLum = getRandomVp();
            //await sleep(2000);
            chat(`${fromName} đã phát hiện được 1 ${cap(vpLum)} khi thăm dò Cổ Chiến Trường.`);
            await chuyenDoHacDiem(vpLum, 1, tcvId);
            return; 
        }*/

        if (truyenTong == 5) {
            const vpLum = getRandomTienNhan();
            await sleep(3000);
            if (vkDaoTac == 1) {
                await updateRuong(tcvId, "Vận Khí", -rdVanKhi);
                chat(`${fromName} may mắn đi lạc vào động phủ của [class=tukim]Tiên Nhân[/class], tại đây phát hiện được 1 ${cap(vpLum)} nhưng trong lúc mang bảo vật về động phủ đã bị đạo tặc cướp mất, vận khí -${rdVanKhi} /denm`);
                return;
            } else {
                chat(`${fromName} may mắn đi lạc vào động phủ của [class=tukim]Tiên Nhân[/class], tại đây phát hiện được 1 ${cap(vpLum)}.`);
                await chuyenDoHacDiem(vpLum, 1, tcvId); 
                return;
            }
             
        }

        /*if (truyenTong == 5) {
            const vpLum = getRandomTienNhan();
            //await sleep(2000);
            chat(`${fromName} may mắn đi lạc vào động phủ của [class=tukim]Tiên Nhân[/class], tại đây phát hiện được 1 ${cap(vpLum)}.`);
            await chuyenDoHacDiem(vpLum, 1, tcvId); 
            return;
        }*/

        /*if (truyenTong == 5) {
            let queueKeyDonPhu = `queue_don_phu_${tcvId}`;
            let queueDataDonPhu = JSON.stringify({tcvId});
            setItem(queueKeyDonPhu, queueDataDonPhu);
            setExpire(queueKeyDonPhu, 15);
            pmCbox(cboxId, "Đạo hữu đi lạc vào hang ổ của Hung Thú, sử dụng Vô Cực Độn Phù để lẫn trốn (Y/N)?");
            return;
        }*/
        if (truyenTong == 6) {
            chat(`${fromName} đi lạc vào Hư Vô Chi Địa, tu vi quá yếu không thể thoát ra /thodai`);
            return;
        }
    }

}


//sử dụng đan
export const suDungTruTienDan = async (tcvId, fromCboxId, amount) => {
    const fromName = await getTcvNameFromTcvId(tcvId);
    const ruong = await getRuong(tcvId);
    
    const truTienDan = "ruong_do_ao_" + tcvId + "_tru_tien_dan";
    let truTienDans = await getItem(truTienDan);

    if (!truTienDans) {
         pmCbox(fromCboxId, 'Không có Tru Tiên Đan để sử dụng.');
        //pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }

    truTienDans = JSON.parse(truTienDans);
    const truTien = !!truTienDans["Tru Tiên Đan"] ? parseInt(truTienDans["Tru Tiên Đan"]) : 0;
    if (truTien < 1) {
        pmCbox(fromCboxId, 'Không có Tru Tiên Đan để sử dụng.');
        //pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }
    if (truTien < amount) {
        pmCbox(fromCboxId, 'Số lượng Tru Tiên Đan không đủ để sử dụng.');
        return;
    }
    await updateRuong(tcvId, "Tru Tiên Đan", -amount);
    const total = amount * 1000;
    
    await updateRuong(tcvId, "Sức Mạnh", total);
    pmCbox(fromCboxId, `Đã sử dụng ${amount} Tru Tiên Đan.`);
}

export const suDungUanHuyetDan = async (tcvId, fromCboxId, amount) => {
    const fromName = await getTcvNameFromTcvId(tcvId);
    const ruong = await getRuong(tcvId);
    
    const uanHuyetDan = "ruong_do_ao_" + tcvId + "_uan_huyet_dan";
    let uanHuyetDans = await getItem(uanHuyetDan);

    if (!uanHuyetDans) {
         pmCbox(fromCboxId, 'Không có Uẩn Huyết Đan để sử dụng.');
        //pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }

    uanHuyetDans = JSON.parse(uanHuyetDans);
    const uanHuyet = !!uanHuyetDans["Uẩn Huyết Đan"] ? parseInt(uanHuyetDans["Uẩn Huyết Đan"]) : 0;
    if (uanHuyet < 1) {
        pmCbox(fromCboxId, 'Không có Uẩn Huyết Đan để sử dụng.');
        //pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }
    if (uanHuyet < amount) {
        pmCbox(fromCboxId, 'Số lượng Uẩn Huyết Đan không đủ để sử dụng.');
        return;
    }
    await updateRuong(tcvId, "Uẩn Huyết Đan", -amount);
    const total = amount * 2000;
    
    await updateRuong(tcvId, "Sinh Lực", total);
    pmCbox(fromCboxId, `Đã sử dụng ${amount} Uẩn Huyết Đan.`);
}

export const suDungVanKhiDan = async (tcvId, fromCboxId, amount) => {
    const fromName = await getTcvNameFromTcvId(tcvId);
    const ruong = await getRuong(tcvId);
    
    const vanKhiDan = "ruong_do_ao_" + tcvId + "_van_khi_dan";
    let vanKhiDans = await getItem(vanKhiDan);

    if (!vanKhiDans) {
         pmCbox(fromCboxId, 'Không có Vận Khí Đan để sử dụng.');
        //pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }

    vanKhiDans = JSON.parse(vanKhiDans);
    const vanKhi = !!vanKhiDans["Vận Khí Đan"] ? parseInt(vanKhiDans["Vận Khí Đan"]) : 0;
    if (vanKhi < 1) {
        pmCbox(fromCboxId, 'Không có Vận Khí Đan để sử dụng.');
        //pmCbox(fromCboxId, "Bạc không đủ để chuyển.");
        return;
    }
    if (vanKhi < amount) {
        pmCbox(fromCboxId, 'Số lượng Vận Khí Đan không đủ để sử dụng.');
        return;
    }
    await updateRuong(tcvId, "Vận Khí Đan", -amount);
    const total = amount * 3;
    
    await updateRuong(tcvId, "Vận Khí", total);
    pmCbox(fromCboxId, `Đã sử dụng ${amount} Vận Khí Đan.`);
}
