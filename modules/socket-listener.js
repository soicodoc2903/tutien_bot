import {decode} from 'html-entities';
//const exec = require('child_process').exec;
import {
    checkSoDu,
    checkMemberSoDu,
    checkHanhTrang,
    checkMemberHanhTrang,
    checkNhanVat,
    checkMemberNhanVat,
    checkMemberRuong,
    checkRuong,
    showMyRuong,
    chuyenDoFromAdmin,
    chuyenDoFromBot,
    chuyenDoFromUser,
    chuyenDoNhieuUser,
    napRuong,
    napRuong2,
    xoaRuong,
    updateRuong,
    chuyenDo2Id
} from "./chuyen-do.js";
import {fetchDuocVien, fetchThuHoach} from "./duoc-vien.js";
import {checkInfo, checkBac, checkBank, checkMem, checkPhapKhi, duyetMem, duyetMemId, duyetAll, duyetNhieu, tuChoiMem, tuChoiNhieu, kickBang, kickNhieu, suaPhapKhi, xinVaoBang, getUserInfo, getLogBac} from "./member.js";
import {chuyenBac, chuyenBacFromUser, chuyenRuong, chuyenBacConfirmed, chuyenRuongConfirmed} from "./chuyen-bac.js";
import {ADMIN, BANK_ID, CHUYEN_DO_IDS, MOVE_IDS, DUYET_IDS, KICK_IDS, SHOP} from "./constant.js";
import {
    chat,
    setItem,
    getTcvIdFromCboxId,
    getTcvNameFromTcvId,
    is_numeric,
    mapCboxTcv,
    mapTcvCbox,
    pmCbox,
    setBasic,
    getItem,
    delKey,
    getKeys,
    getTtl,
    setTcvUsername,
    formatBac,
    resetMember,
    getRandomInteger
} from "../helper.js";
import {checkBaoKho, fetchItemCh} from "./bao-kho.js";
import {changeChucVu, congCongHien, addDongThien, searchPk, searchCp, vaoDong, vaoDongConfirmed, vaoDuocVien, vaoDuocVienConfirmed} from "./cong-hien.js";
import {camNgon, beQuan} from "./hinh-duong.js";
import {haiLoc, moLiXi, checkEvent, bacQuyEvent, napQuyEvent} from "./event.js";
import {setPrice,setAmount,buyItem,sellItem,listBuy,listSell, activeShop, inActiveShop} from "./hac-diem.js";
import {cap} from "./viettat.js";
import {thamDoChienTruong, suDungTruTienDan, suDungUanHuyetDan, suDungVanKhiDan} from "./tambao.js";
import {getRandom, chanLe, dice} from "./chan-le.js";
import {checkVietlott, muaVe} from "./vietlott.js";
//import {searchInYoutube} from "./music.js";
//const { execFile } = require('child_process');
import axios from "axios";

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

export async function parseMessage(parsed) {
    const fromCboxId = parsed[9];
    let fromTcvName = decode(parsed[3]);
    let chucVu = fromTcvName;

    // cc_sm: vtt
    if (fromTcvName.includes("cc_sm")) {
        chucVu = chucVu.split("<sup>")[1].split("</sup>")[0].trim();
    } else {
        chucVu = "";
    }

    if (fromTcvName.includes(">")) {
        fromTcvName = fromTcvName.split(">")[1].split("<")[0];
    }

    const fromTcvId = parseInt(parsed[5].split("member/")[1]);

    // Tạm thời chỉ bật bot cho ADMIN
    //if (!ADMIN.includes(fromTcvId)) {
    //	return;
    //}

    const content = decode(parsed[6]);
    await mapTcvCbox(fromTcvId, fromCboxId);
    await mapCboxTcv(fromTcvId, fromCboxId);
    await setTcvUsername(fromTcvId, fromTcvName);
    if (chucVu) {
        await setBasic({
            id: fromTcvId,
            name: fromTcvName,
            cboxId: fromCboxId,
            chucVu
        });
    }

    // Tạm thời chỉ bật bot cho ADMIN
    /*if (!ADMIN.includes(fromTcvId) && !MOVE_IDS.includes(fromTcvId)) {
        return;
    }*/

    try {
        await xuLyChat(content, parseInt(fromTcvId), fromCboxId, fromTcvName);
        //console.log(content);
    } catch (error) {
        console.log(error);
    }
}

export async function xuLyChat(content = '', tcvId = 0, cboxId = '', tcvName = '') {
    const msg = await parseMessageContent(content);
    const args = msg.split(' ');

    if (!content.startsWith(".")) {
        const text = msg.toLowerCase();

        if (text.toLowerCase().startsWith('list mem')) {
            if ((DUYET_IDS.includes(tcvId) || ADMIN.includes(tcvId))) {
                checkMem().then();
                return 1;
            }
            chat('Chỉ QTV mới thực hiện được chức năng này.');
        }

        if (text.toLowerCase().startsWith('check bank')) {
            await checkBank(); 
            return 1;
        }

        // ======================= START HẮC ĐIẾM ===========================
        // Lưu ý: không thể vừa bán - vừa mua cùng 1 vật phẩm
        try {
        if (text.toLowerCase().startsWith('cửa hàng') && args.length === 2) {
            let send = '[b]CỬA HÀNG MÔN PHÁI[/b]';

            send = send + '[br][b]cửa hàng bán:[/b] Xem vật phẩm đang BÁN trên shop';
            send = send + '[br][b]cửa hàng mua:[/b] Xem vật phẩm shop đang cần THU MUA';
            send = send + '[br][b]mua [số lượng] [vật phẩm]:[/b] Mua vật phẩm trên shop';
            send = send + '[br][b]bán [số lượng] [vật phẩm]:[/b] Bán vật phẩm trong hành trang cho shop';
            await pmCbox(cboxId, send);
            return;
        }
        if (text.toLowerCase().startsWith('cửa hàng mua')) {
            const shopStatus = await getItem('shop_status');    
            if (shopStatus == false || shopStatus == 'false') {
                chat('Cửa hàng đóng cửa trong thời gian này, vui lòng quay lại sau.');
                return;
            }
            //console.log(text);
            //if (tcvId != '666888' && tcvId != '132301') return;
            await listBuy(tcvId);
            return;
        }

        if (text.toLowerCase().startsWith('cửa hàng bán')) {
            //if (tcvId != '666888' && tcvId != '132301') return;
            await listSell(tcvId);
            return;
        } 

        // format: cửa hàng set giá tinh linh cp 30000
        if (text.toLowerCase().startsWith('cửa hàng set giá') && ADMIN.includes(tcvId)) {
            const price = parseInt(args[args.length - 1]);
            const itemName = content.toLowerCase().replace('cửa hàng set giá ', '').replace(` ${price}`, '').trim();
            await setPrice(itemName, price);
            await pmCbox(cboxId, 'Done!');
            return;
        }

        // format: cửa hàng set số lượng tinh linh cp 30000
        if (text.toLowerCase().startsWith('cửa hàng set số lượng') && ADMIN.includes(tcvId)) {
            const amount = parseInt(args[args.length - 1]);
            const itemName = content.toLowerCase().replace('cửa hàng set số lượng ', '').replace(` ${amount}`, '').trim();
            await setAmount(itemName, amount);
            await pmCbox(cboxId, 'Done!');
            return;
        }

        // Mở shop
        if (text.toLowerCase().startsWith('mở shop') && tcvId == 132301) {
            await activeShop(tcvId);
            return 1;
        }

        // Đóng shop
        if (text.toLowerCase().startsWith('đóng shop') && tcvId == 132301) {
            await inActiveShop(tcvId);
            return 1;
        }

        // format: mua 1 tạo hóa ngọc diệp
        if (text.toLowerCase().startsWith('mua')) {
            //if (tcvId != '666888') return;
            const amount = parseInt(args[1]);
            const itemName = content.toLowerCase().replace(`mua ${amount} `, '').trim();
            if (isNaN(amount)) {
                return;
            }
            await buyItem(tcvId, itemName, amount);
            return;
        }

        // format: bán 1 tinh linh cp
        if (text.toLowerCase().startsWith('bán')) {
            const shopStatus = await getItem('shop_status');    
            if (shopStatus == false || shopStatus == 'false') {
                chat('Cửa hàng đóng cửa trong thời gian này, vui lòng quay lại sau.');
                return;
            }
            //if (tcvId != '666888') return;
            const amount = parseInt(args[1]);
            const itemName = content.toLowerCase().replace(`bán ${amount} `, '').trim();
            if (isNaN(amount)) {
                return;
            }
            await sellItem(tcvId, itemName, amount);
            return;
        }
        } catch (error) { console.log(error); }
        
        // ======================= END HẮC ĐIẾM ===========================

        //hái lộc
        if (text.toLowerCase().startsWith('hái lộc')) {
            axios.get(`https://soi-tcvtool.xyz/truyencv/member/${tcvId}`).then(
                response => { 
                    const name = response.data.name;
                    const bp = response.data.bang_phai;
                    const tuVi = response.data.tu_vi;
                    const tuVis = [
                        'Phàm Nhân',
                        'Luyện Khí Tầng 1',
                        'Luyện Khí Tầng 2',
                        'Luyện Khí Tầng 3',
                        'Luyện Khí Tầng 4',
                        'Luyện Khí Tầng 5',
                        'Luyện Khí Tầng 6',
                        'Luyện Khí Tầng 7',
                        'Luyện Khí Tầng 8',
                        'Luyện Khí Tầng 9',
                        'Luyện Khí Viên Mãn',
                        'Trúc Cơ Tầng 1',
                        'Trúc Cơ Tầng 2',
                        'Trúc Cơ Tầng 3',
                        'Trúc Cơ Tầng 4',
                        'Trúc Cơ Tầng 5',
                        'Trúc Cơ Tầng 6',
                        'Trúc Cơ Tầng 7',
                        'Trúc Cơ Tầng 8',
                        'Trúc Cơ Tầng 9',
                        'Trúc Cơ Viên Mãn',
                        'Kim Đan Tầng 1',
                        'Kim Đan Tầng 2',
                        'Kim Đan Tầng 3',
                        'Kim Đan Tầng 4',
                        'Kim Đan Tầng 5',
                        'Kim Đan Tầng 6',
                        'Kim Đan Tầng 7',
                        'Kim Đan Tầng 8',
                        'Kim Đan Tầng 9',
                        'Kim Đan Viên Mãn',
                        'Nguyên Anh Tầng 1',
                        'Nguyên Anh Tầng 2',
                        'Nguyên Anh Tầng 3',
                        'Nguyên Anh Tầng 4',
                        'Nguyên Anh Tầng 5',
                        'Nguyên Anh Tầng 6',
                        'Nguyên Anh Tầng 7',
                        'Nguyên Anh Tầng 8',
                        'Nguyên Anh Tầng 9',
                        'Nguyên Anh Viên Mãn',
                        'Hóa Thần Tầng 1',
                        'Hóa Thần Tầng 2',
                        'Hóa Thần Tầng 3',
                        'Hóa Thần Tầng 4',
                        'Hóa Thần Tầng 5',
                        'Hóa Thần Tầng 6',
                        'Hóa Thần Tầng 7',
                        'Hóa Thần Tầng 8',
                        'Hóa Thần Tầng 9',
                        'Hóa Thần Viên Mãn',
                        'Luyện Hư Tầng 1',
                        'Luyện Hư Tầng 2',
                        'Luyện Hư Tầng 3',
                        'Luyện Hư Tầng 4',
                        'Luyện Hư Tầng 5',
                        'Luyện Hư Tầng 6',
                        'Luyện Hư Tầng 7',
                        'Luyện Hư Tầng 8',
                        'Luyện Hư Tầng 9',
                        'Luyện Hư Viên Mãn',
                        'Hợp Thể Tầng 1',
                        'Hợp Thể Tầng 2',
                        'Hợp Thể Tầng 3',
                        'Hợp Thể Tầng 4',
                        'Hợp Thể Tầng 5',
                        'Hợp Thể Tầng 6',
                        'Hợp Thể Tầng 7',
                        'Hợp Thể Tầng 8',
                        'Hợp Thể Tầng 9',
                        'Hợp Thể Viên Mãn',
                        'Đại Thừa Tầng 1',
                        'Đại Thừa Tầng 2',
                        'Đại Thừa Tầng 3',
                        'Đại Thừa Tầng 4'
                    ];

                    if (bp !== 'Vô Cực Ma Tông') {
                        chat(`${name} - Đạo hữu không thuộc bang này nên không thể tham gia vào hoạt động này.`); 
                        return;
                    }
                    if (bp === 'Vô Cực Ma Tông' && tuVis.includes(tuVi)) {
                        chat(`${name} - Tu vi của đạo hữu là [class=tukim]${tuVi}[/class], quá thấp để tham gia vào hoạt động này.`);
                        return;
                    }
                    if (bp === 'Vô Cực Ma Tông' && tuVis.includes(tuVi) === false) {
                        const xx = getRandom(1, 3);
                        if (xx == 1) {
                            var today = new Date().getDate(); 
                            if (today < 10) {
                                today = '0' + today;
                            }
                            var m = new Array();
                            m[0] = "01";
                            m[1] = "02";
                            m[2] = "03";
                            m[3] = "04";
                            m[4] = "05";
                            m[5] = "06";
                            m[6] = "07";
                            m[7] = "08";
                            m[8] = "09";
                            m[9] = "10";
                            m[10] = "11";
                            m[11] = "12";
                            var month = m[new Date().getMonth()];
                            setItem(`${tcvId}_${today}_${month}_baolixi`, 0);
                            chat(`${name} vừa hái được cục /gach này /bee003`);
                        } else {
                            haiLoc(tcvId);
                        }
                    }
                }
            )
            .catch(error => { 
                chat('Có lỗi xảy ra!');
                return;
            });
            
            return 1;
        } 

        if (text.toLowerCase().startsWith('mở lx') || text.toLowerCase().startsWith('mở lì xì')) {
            await moLiXi(tcvId);
            return 1;
        }

        if (text.toLowerCase().startsWith('check event') || text.toLowerCase().startsWith('check ev')) {
            await checkEvent();
            return 1;
        }

        if (text.toLowerCase() === 'quỹ ev') {
            await bacQuyEvent();
            return 1;
        }

        if (text.toLowerCase().startsWith('nạp') && text.toLowerCase().includes('vào quỹ ev')) {
            if (tcvId !== 132301) {
                chat('Chỉ CM mới thực hiện được chức năng này.');
                return;
            }
            var amount = args[1];
            amount = convertBac(amount);
            await napQuyEvent(tcvId, amount);
            return 1;
        }
        
        //vietlott
        if (text.toLowerCase().startsWith('check vietlott')) {
            if (tcvId != 132301) {
                return;
            }
            await checkVietlott();
            return 1;
        }

        if (text.toLowerCase().startsWith('đặt vé')) {
            if (tcvId != 132301) {
                return;
            }
            const amount = parseInt(args[2]);
            if (isNaN(amount)) {
                chat(`${tcvName} - ${amount} không phải là số hợp lệ.`);
                return;
            }
            await muaVe(tcvId, cboxId, tcvName, amount);
            return 1;
        }

        //Chẵn lẻ
        /*if (args[0] === 'tài' || args[0] === 'xỉu') {
            const curr = args[0];
            const amount = parseInt(args[1]);
            if (isNaN(amount)) {
                chat(`${tcvName} - args[1] không phải là số hợp lệ.`);
                return;
            }
            await chanLe(tcvId, cboxId, tcvName, curr, amount);
            return 1;
        }*/

        if (text.toLowerCase().startsWith('xx')) {
            await dice(tcvId, tcvName);
            return 1;
        }

        //tầm bảo
        if (text.toLowerCase().startsWith('thăm dò cổ chiến trường') || text.toLowerCase().startsWith('thăm dò chiến trường')) {
            if (tcvId != 132301 && tcvId != 300200) {
                return;
            }
            await thamDoChienTruong(tcvId, cboxId, tcvName);
            return 1;
        }

        if (text.toLowerCase().startsWith('sử dụng') && text.toLowerCase().includes('tru tiên đan')) {
            if (tcvId !== 132301) {
                return;
            }
            const sl = args[2];
            if (isNaN(sl)) {
                pmCbox(cboxId, 'Số lượng không đúng.');
                return;
            }
            await suDungTruTienDan(tcvId, cboxId, sl);
            return 1;
        }

        if (text.toLowerCase().startsWith('sử dụng') && text.toLowerCase().includes('uẩn huyết đan')) {
            if (tcvId !== 132301) {
                return;
            }
            const sl = args[2];
            if (isNaN(sl)) {
                pmCbox(cboxId, 'Số lượng không đúng.');
                return;
            }
            await suDungUanHuyetDan(tcvId, cboxId, sl);
            return 1;
        }

        if (text.toLowerCase().startsWith('sử dụng') && text.toLowerCase().includes('vận khí đan')) {
            if (tcvId !== 132301) {
                return;
            }
            const sl = args[2];
            if (isNaN(sl)) {
                pmCbox(cboxId, 'Số lượng không đúng.');
                return;
            }
            await suDungVanKhiDan(tcvId, cboxId, sl);
            return 1;
        }

        if (text.toLowerCase().startsWith('log bạc')) {
            if (args.length == 2) {
                getLogBac(tcvId).then(r => {
                    if (r == '') {
                        pmCbox(cboxId, 'Không có dữ liệu.');
                        return;
                    }
                    pmCbox(cboxId, 'Log 10 giao dịch gần đây:[br]' + r);
                });
                return;
            }
            if (args.length == 3) {
                const memberId = args[2];
                getLogBac(memberId).then(r => {
                    if (r == '') {
                        pmCbox(cboxId, 'Không có dữ liệu.');
                        return;
                    }
                    pmCbox(cboxId, 'Log 10 giao dịch gần đây:[br]' + r);
                });
                return;
            }
            if (args.length == 4) {
                const memberId = args[3];
                getLogBac(memberId).then(r => {
                    if (r == '') {
                        pmCbox(cboxId, 'Không có dữ liệu.');
                        return;
                    }
                    pmCbox(cboxId, 'Log 10 giao dịch gần đây:[br]' + r);
                });
                return;
            } 
            return 1;
        }

        //số dư
        if (text.toLowerCase().startsWith('số dư')) {
            if (args.length == 2) {
                checkSoDu(tcvId, cboxId).then();
                return;
            }
            if (args.length == 3) {
                const targetId = parseInt(args[2]);
                checkMemberSoDu(targetId, cboxId).then();
                return;
            }
            if (args.length == 4) {
                const targetId = parseInt(args[3]);
                checkMemberSoDu(targetId, cboxId).then();
                return;
            }
        }

        if (text.toLowerCase().startsWith('hành trang')) {
            if (args.length == 2) {
                checkHanhTrang(tcvId, cboxId).then();
                return;
            }
            if (args.length == 3) {
                const targetId = parseInt(args[2]);
                checkMemberHanhTrang(targetId, cboxId).then();
                return;
            }
            if (args.length == 4) {
                const targetId = parseInt(args[3]);
                checkMemberHanhTrang(targetId, cboxId).then();
                return;
            }
        }

        //nhân vật
        /*if (text.toLowerCase().startsWith('nhân vật')) {
            if (args.length == 2) {
                checkNhanVat(tcvId, cboxId).then();
                return;
            }
            if (args.length == 3) {
                const targetId = parseInt(args[2]);
                checkMemberNhanVat(targetId, cboxId).then();
                return;
            }
            if (args.length == 4) {
                const targetId = parseInt(args[3]);
                checkMemberNhanVat(targetId, cboxId).then();
                return;
            }
        }*/
 
        //chuyen bac
        if (text.toLowerCase().startsWith('chuyển') && text.toLowerCase().includes('cho') && !text.toLowerCase().includes('số dư') && (text.toLowerCase().includes('bạc') || text.toLowerCase().includes('kb') || text.toLowerCase().includes('mb') || text.toLowerCase().includes('b'))) {
            const basic = await getUserInfo(tcvId);
            var fromName = basic.name;
            
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
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
                for (let i = 0; i < keysChuyenDo.length; i++) {
                    const key = keysChuyenDo[i];
                    const fromId = key.replace('queue_chuyen_do_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
                for (let i = 0; i < keysChuyenRuong.length; i++) {
                    const key = keysChuyenRuong[i];
                    const fromId = key.replace('queue_chuyen_ruong_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
                for (let i = 0; i < keysVaoDong.length; i++) {
                    const key = keysVaoDong[i];
                    const fromId = key.replace('queue_vao_dong_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
                for (let i = 0; i < keysVaoDuocVien.length; i++) {
                    const key = keysVaoDuocVien[i];
                    const fromId = key.replace('queue_vao_duoc_vien_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
            } catch (error) { console.log(error); }
            if (args[2].toLowerCase() == 'cho' || args[2].toLowerCase() == 'bạc') {
                var sl = args[1];
                //let memberId = text.split('cho ')[1];
                sl = convertBac(sl);
                
                if (args.length == 6 && args[3].toLowerCase() == 'cho' && args[4].toLowerCase() == 'id') {
                    if (args[2].toLowerCase() == 'bạc') {
                        var memberId = args[args.length - 1];
                        //var memberId = text.split('id ')[1].trim();
                    } else {
                        chat('Số bạc không hợp lệ.');
                        return;
                    }
                }
                if (args.length == 5 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() == 'id') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        var memberId = args[args.length - 1];
                        //var memberId = text.split('id ')[1].trim();
                    } else {
                        chat('Số bạc không hợp lệ.');
                        return;
                    }
                }
                if (args.length == 6 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() == 'id') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        var memberId = args[args.length - 1];
                        //var memberId = text.split('id ')[1];
                    } else {
                        chat('Số bạc không hợp lệ.');
                        return;
                    }
                }
                
                if (args.length == 6 && args[3].toLowerCase() == 'cho' && args[4].toLowerCase() != 'id') {
                    if (args[2].toLowerCase() == 'bạc') {
                        var memberId = args[args.length - 2];
                        //var memberId = text.split('cho ')[1];
                        //memberId = args[4];
                    } else {
                        chat('Số bạc không hợp lệ.');
                        return;
                    }
                }
                
                if (args.length == 5 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() != 'id') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        //memberid = args[3];
                        var memberId = args[args.length - 2];
                        //var memberid = text.split('cho ')[1];
                    } else {
                        chat('số bạc không hợp lệ.');
                        return;
                    }
                }

                if (args.length == 4 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() != 'id' && args[4] != '') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        //memberid = args[3];
                        var memberId = args[args.length - 1];
                        //var memberid = text.split('cho ')[1];
                    } else {
                        chat('số bạc không hợp lệ.');
                        return;
                    }
                }
            }
            if (isNaN(memberId)) {
                chat(`${fromName} - ID không hợp lệ.`);
                return;
            }
            await chuyenBacFromUser(tcvId, cboxId, memberId, parseInt(sl));
            return; 
        }

        //chuyển số dư
        if (text.toLowerCase().startsWith('chuyển') && text.toLowerCase().includes('số dư cho')) {
                const basic = await getUserInfo(tcvId);
                var fromName = basic.name;
                
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
                        if (parseInt(expire) > 2) {
                            const fromName = await getTcvNameFromTcvId(fromId); 
                            chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                            return;
                        }
                    }
                    for (let i = 0; i < keysChuyenDo.length; i++) {
                        const key = keysChuyenDo[i];
                        const fromId = key.replace('queue_chuyen_do_', '');
                        const expire = await getTtl(key);
                        if (parseInt(expire) > 2) {
                            const fromName = await getTcvNameFromTcvId(fromId); 
                            chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                            return;
                        }
                    }
                    for (let i = 0; i < keysChuyenRuong.length; i++) {
                        const key = keysChuyenRuong[i];
                        const fromId = key.replace('queue_chuyen_ruong_', '');
                        const expire = await getTtl(key);
                        if (parseInt(expire) > 2) {
                            const fromName = await getTcvNameFromTcvId(fromId); 
                            chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                            return;
                        }
                    }
                    for (let i = 0; i < keysVaoDong.length; i++) {
                        const key = keysVaoDong[i];
                        const fromId = key.replace('queue_vao_dong_', '');
                        const expire = await getTtl(key);
                        if (parseInt(expire) > 2) {
                            const fromName = await getTcvNameFromTcvId(fromId); 
                            chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                            return;
                        }
                    }
                    for (let i = 0; i < keysVaoDuocVien.length; i++) {
                        const key = keysVaoDuocVien[i];
                        const fromId = key.replace('queue_vao_duoc_vien_', '');
                        const expire = await getTtl(key);
                        if (parseInt(expire) > 2) {
                            const fromName = await getTcvNameFromTcvId(fromId); 
                            chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                            return;
                        }
                    }
                } catch (error) { console.log(error); }
                
                var sl = args[1];
                if (sl.endsWith('kb') || sl.endsWith('mb')) {
                    chat(`${fromName} - Số dư không hợp lệ.`);
                    return;
                }
                
                sl = convertSoDu(sl);
                if (sl < 0) {
                    chat(`${fromName} - Số dư không hợp lệ.`);
                    return;
                }

                if (args.length == 7 && args[4].toLowerCase() == 'cho' && args[5].toLowerCase() == 'id') {
                    //var memberId = msg.split('cho id ')[1];
                    var memberId = args[args.length - 1]; 
                }
                if (args.length == 6 && args[4].toLowerCase() == 'cho' && args[5].toLowerCase() == 'id') {
                    //var memberId = msg.split('cho id ')[1];
                    var memberId = args[args.length - 1]; 
                }
                if (args.length == 6 && args[4].toLowerCase() == 'cho' && args[5].toLowerCase() != 'id' && args[6] != '') {
                    //var memberId = msg.split('cho id ')[1];
                    var memberId = args[args.length - 1]; 
                }
                if (args.length == 7 && args[4].toLowerCase() == 'cho' && args[5].toLowerCase() != 'id') {
                    var memberId = args[args.length - 2];
                    //var memberId = msg.split('cho ')[1]; 
                }
                if (isNaN(memberId)) {
                    chat(`${fromName} - ID không hợp lệ.`);
                    return;
                }
                if (memberId === tcvId) {
                    chat(`${fromName} - ID không hợp lệ.`);
                    return;
                }
                chuyenRuong(tcvId, cboxId, memberId, parseInt(sl)).then();
                return;
        }

        //chuyển đồ
        /*if (text.toLowerCase().startsWith('chuyển') && args[2].toLowerCase() != 'cho' && !text.toLowerCase().includes('bạc') && !text.toLowerCase().includes('số dư cho') && !text.toLowerCase().includes('kb') && !text.toLowerCase().includes('mb'))  {
                const basic = await getUserInfo(tcvId);
                var fromName = basic.name;
                if (args.length == 6 && text.toLowerCase().includes('id' + ' ')) {
                    var toId = args[args.length - 1];
                    if (isNaN(toId)) {
                        chat(`${fromName} - ID không hợp lệ.`);
                        return;
                    }
                } else
                    if (args.length == 6 && text.toLowerCase().includes('cho' + ' ')) {
                        var toId = args[args.length - 2];
                        if (isNaN(toId)) {
                            chat(`${fromName} - ID không hợp lệ.`);
                            return;
                        }
                    } else
                        if (args.length > 6 && text.toLowerCase().includes('id' + ' ')) {
                            var toId = args[args.length - 1];
                            if (isNaN(toId)) {
                                chat(`${fromName} - ID không hợp lệ.`);
                                return;
                            }
                        } else
                            if (args.length > 6 && text.toLowerCase().includes('cho' + ' ')) {
                                var toId = args[args.length - 2];
                                if (isNaN(toId)) {
                                    chat(`${fromName} - ID không hợp lệ.`);
                                    return;
                                }
                            }
                
                var sl = args[1];
                
                if (isNaN(sl)) {
                    //chat(`${fromName} - Số lượng vật phẩm không đúng.`);
                    return;
                }
                //if (isNaN(toId)) {
                //    chat(`${fromName} - ID không hợp lệ.`);
                //    return;
                //}
                await chuyenDoFromUser(tcvId, toId, text);
                return;
        }*/
        
        if (msg.toLowerCase().includes('hi tini') || msg.toLowerCase().includes('tini ơi')) {
            const basic = await getUserInfo(tcvId);
            const fromName = basic.name;
            chat(`${fromName} [img]https://cbox.im/i/R50RI.png[/img]`);
        }

        if (text.toLowerCase().includes('ta là ai') || text.toLowerCase().includes('tôi là ai') || text.toLowerCase().includes('mình là ai')) {
            const basic = await getUserInfo(tcvId);
            const fromName = basic.name;
            chat(`${fromName} là con sâu kiến ất ơ giữa dòng đời xô đẩy /buon`);
        }

        if (text.toLowerCase().includes('sói là ai')) {
            const basic = await getUserInfo(132301);
            const fromName = basic.name;
            chat(`${fromName} là hắc thủ phía sau màn /denm`);
        }

        if (text.toLowerCase().includes('diêu là ai')) {
            const basic = await getUserInfo(150858);
            const fromName = basic.name;
            chat(`${fromName} là trùm ăn xin giả nghèo giả khổ của bang /thodai giấu sau lưng là khối tài sản kết xù nhằm âm mưu lật đổ CM /denm`);
        }

        /*if (msg.toLowerCase().startsWith('mai là ai')) {
            const basic = await getUserInfo(45217);
            const toName = basic.name;
            chat(`${toName} là trùm Yasuo của Vô Cực Ma Tông /sn`);
        }*/

        if (msg.toLowerCase().startsWith('tpl là gì') || msg.toLowerCase().startsWith('tiên phủ lệnh là gì') || msg.toLowerCase().startsWith('vật phẩm tiên phủ lệnh')) {
            chat('Tiên Phủ Lệnh là chìa khóa để vào Động Thiên tu luyện/đột phá.');
        }

        if (msg.toLowerCase().startsWith('tnl là gì') || msg.toLowerCase().startsWith('thần nông lệnh là gì') || msg.toLowerCase().startsWith('vật phẩm thần nông lệnh')) {
            chat('Thần Nông Lệnh là chìa khóa để vào Dược Viên Môn Phái trồng linh thảo.');
        }

        //check dv
        if (msg.toLowerCase().startsWith('check giá cỏ')) {
            fetchDuocVien(true);
            return;
        }

        if (msg.toLowerCase().startsWith('check dv')) {
            fetchDuocVien(false);
            return;
        }

        if (msg.toLowerCase().startsWith('check thu hoạch')) {
            fetchThuHoach();
            return;
        }

        if (msg.toLowerCase().startsWith('check cỏ cá nhân')) {
            //fetchDuocVienCaNhan(true);
            return;
        }

        //ytb
        /*if (msg.toLowerCase().startsWith('ytb')) {
            const songName = msg.toLowerCase().split('ytb')[1].trim();
            searchInYoutube(songName);
            return;
        }*/

        //check bac
        if (text.toLowerCase().startsWith('check bạc')) {
            await checkBac(tcvId); 
            return 1;
        } 

        /*if (text.toLowerCase().startsWith('info')) {
            const userid = args[1];
            await checkInfo(userid);
            return 1;
        }*/

        //check bảo khố
        if (text.toLowerCase().startsWith('check item')) {
            checkBaoKho(msg.split("item ")[1].trim().replace(/\s\s+/g, " "), tcvName).then(() => {
            });
            return;
        }

        //cộng bạc
        if (text.toLowerCase().startsWith('cộng') && text.toLowerCase().includes('cho') && ADMIN.includes(tcvId)) {
            if (args[2].toLowerCase() == 'cho' || args[2].toLowerCase() == 'bạc') {
                var sl = args[1];
                sl = convertBac(sl);
                //let memberId = 0;
                const basic = await getUserInfo(tcvId);
                var fromName = basic.name;
                //var memberId = args[args.length - 2];
                if (args.length == 6 && args[3].toLowerCase() == 'cho' && args[4].toLowerCase() == 'id') {
                    if (args[2].toLowerCase() == 'bạc') {
                        var memberId = args[args.length - 1];
                        //memberId = text.split('id ')[1];
                    } else {
                        chat('Số bạc không hợp lệ.');
                        return;
                    }
                }
                if (args.length == 5 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() == 'id') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        var memberId = args[args.length - 1];
                        //memberId = text.split('id ')[1];
                    } else {
                        chat('Số bạc không hợp lệ.');
                        return;
                    }
                }
                if (args.length == 6 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() == 'id') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        var memberId = args[args.length - 1];
                        //memberId = text.split('id ')[1];
                    } else {
                        chat('Số bạc không hợp lệ.');
                        return;
                    }
                }
                if (args.length == 5 && args[3].toLowerCase() == 'cho') {
                    if (args[2].toLowerCase() == 'bạc') {
                        var memberId = args[args.length - 2];
                        //memberId = text.split('cho ')[1];
                    } else {
                        chat('Số bạc không hợp lệ.');
                        return;
                    }
                }
                if (args.length == 6 && args[3].toLowerCase() == 'cho' && args[4].toLowerCase() != 'id') {
                    if (args[2].toLowerCase() == 'bạc') {
                        var memberId = args[args.length - 2];
                        //memberId = text.split('cho ')[1];
                    } else {
                        chat('Số bạc không hợp lệ.');
                        return;
                    }
                }
                if (args.length == 5 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() != 'id') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        //memberId = text.split('cho ')[1];
                        var memberId = args[args.length - 2];
                    } else {
                        chat('Số bạc không hợp lệ.');
                        return;
                    }
                }
                if (args.length == 4 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() != 'id' && args[4] != '') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        //memberid = args[3];
                        var memberId = args[args.length - 1];
                        //var memberid = text.split('cho ')[1];
                    } else {
                        chat('số bạc không hợp lệ.');
                        return;
                    }
                }
            }
            if (isNaN(memberId)) {
                chat(`${fromName} - ID không hợp lệ.`);
                return;
            }
            if (memberId == undefined || memberId == 'undefined') {
                chat('ID không hợp lệ.');
                return;
            }
            await napRuong(tcvId, memberId, parseInt(sl));
        }

        //trừ bạc
        if (text.toLowerCase().startsWith('trừ') && text.toLowerCase().includes('cho') && ADMIN.includes(tcvId)) {
            if (args[2].toLowerCase() == 'cho' || args[2].toLowerCase() == 'bạc') {
                var sl = args[1];
                sl = convertBac(sl);
                //let memberId = 0;
                const basic = await getUserInfo(tcvId);
                var fromName = basic.name;
                //var memberId = args[args.length - 2];
                if (args.length == 6 && args[3].toLowerCase() == 'cho' && args[4].toLowerCase() == 'id') {
                    if (args[2].toLowerCase() == 'bạc') {
                        var memberId = args[args.length - 1];
                        //memberId = text.split('id ')[1];
                    } else {
                        chat('Số bạc không hợp lệ.');
                        return;
                    }
                }
                if (args.length == 5 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() == 'id') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        var memberId = args[args.length - 1];
                        //memberId = text.split('id ')[1];
                    } else {
                        chat('Số bạc không hợp lệ.');
                        return;
                    }
                }
                if (args.length == 6 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() == 'id') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        var memberId = args[args.length - 1];
                        //memberId = text.split('id ')[1];
                    } else {
                        chat('Số bạc không hợp lệ.');
                        return;
                    }
                }
                if (args.length == 5 && args[3].toLowerCase() == 'cho') {
                    if (args[2].toLowerCase() == 'bạc') {
                        var memberId = args[args.length - 2];
                        //memberId = text.split('cho ')[1];
                    } else {
                        chat('Số bạc không hợp lệ.');
                        return;
                    }
                }
                if (args.length == 6 && args[3].toLowerCase() == 'cho' && args[4].toLowerCase() != 'id') {
                    if (args[2].toLowerCase() == 'bạc') {
                        var memberId = args[args.length - 2];
                        //memberId = text.split('cho ')[1];
                    } else {
                        chat('Số bạc không hợp lệ.');
                        return;
                    }
                }
                if (args.length == 5 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() != 'id') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        //memberId = text.split('cho ')[1];
                        var memberId = args[args.length - 2];
                    } else {
                        chat('Số bạc không hợp lệ.');
                        return;
                    }
                }
                if (args.length == 4 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() != 'id' && args[4] != '') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        //memberid = args[3];
                        var memberId = args[args.length - 1];
                        //var memberid = text.split('cho ')[1];
                    } else {
                        chat('số bạc không hợp lệ.');
                        return;
                    }
                }
            }
            if (isNaN(memberId)) {
                chat(`${fromName} - ID không hợp lệ.`);
                return;
            }
            if (memberId == undefined || memberId == 'undefined') {
                chat('ID không hợp lệ.');
                return;
            }
            await napRuong2(tcvId, memberId, parseInt(-sl));
        }

        //duyệt all
        if (msg.toLowerCase().startsWith('duyệt all')) {
           if ((DUYET_IDS.includes(tcvId) || ADMIN.includes(tcvId))) {
               await duyetAll(tcvId).then();
               return 1;
           }

            chat('Chỉ QTV mới thực hiện được chức năng này.');
           //pmCbox(cboxId, "Bạn không có duyệt /tat");
           return 1;
        }

        //duyet mem
        if (msg.toLowerCase().startsWith('duyệt đơn') && args.length === 3) {
           if ((DUYET_IDS.includes(tcvId) || ADMIN.includes(tcvId))) {
               if (!is_numeric(args[2])) {
                   return;
               }
               duyetMem(args[2], tcvId).then();
               return 1;
           }

            chat('Chỉ QTV mới thực hiện được chức năng này.');
           //pmCbox(cboxId, "Bạn không có duyệt /tat");
           return 1;
        }

        //duyệt id
        if (msg.toLowerCase().startsWith('duyệt id') && args.length === 3) {
           if ((DUYET_IDS.includes(tcvId) || ADMIN.includes(tcvId))) {
               if (!is_numeric(args[2])) {
                   return;
               }
                const memberId = args[2];
                axios.get(`https://soi-tcvtool.xyz/truyencv/member/${memberId}`).then(
                    response => { 
                        const userName = response.data.name;
                        const bp = response.data.bang_phai; 
                        duyetMemId(memberId, userName, tcvId).then(); 
                        return 1;
                    }
                    )
                    .catch(error => {
                        chat("Có lỗi xảy ra!"); 
                    }
                );
           } else {
                chat('Chỉ QTV mới thực hiện được chức năng này.');
                //pmCbox(cboxId, "Bạn không có duyệt /tat");
                return 1;
           } 
        }

        if (msg.toLowerCase().startsWith('duyệt các đơn')) {
            if ((DUYET_IDS.includes(tcvId) || ADMIN.includes(tcvId)) && args.length > 3) {
                duyetNhieu(msg, tcvId).then();
                return 1;
            }
            chat('Chỉ QTV mới thực hiện được chức năng này.');
            return;
        }

        //từ chối duyệt
        if (msg.toLowerCase().startsWith('từ chối đơn') && args.length === 4) {
           if ((DUYET_IDS.includes(tcvId) || ADMIN.includes(tcvId))) {
               if (!is_numeric(args[3])) {
                   return;
               }
               tuChoiMem(args[3], tcvId).then();
               return 1;
           }

            chat('Chỉ QTV mới thực hiện được chức năng này.');
           //pmCbox(cboxId, "Bạn không có duyệt /tat");
           return 1;
        }

        if (msg.toLowerCase().startsWith('từ chối các đơn')) {
            if ((DUYET_IDS.includes(tcvId) || ADMIN.includes(tcvId)) && args.length > 3) {
                tuChoiNhieu(msg, tcvId).then();
                return 1;
            }
            chat('Chỉ QTV mới thực hiện được chức năng này.');
            return;
        }

        //ban
        //console.log(text);
        if ((text.toLowerCase().startsWith('cho') && text.toLowerCase().includes('ra đảo') && (ADMIN.includes(tcvId) || CHUYEN_DO_IDS.includes(tcvId)))) {
            let time = getRandomInteger(1, 120);
            let memberId = 0;
            const basic = await getUserInfo(tcvId);
            const toName = basic.name;
            let isIdBan = !isNaN(args[1]);
            if (isIdBan) {
                if (args.length == 4) {
                    memberId = text.split('cho ')[1].split('ra')[0];
                    time = getRandomInteger(1, 120);
                }
                if (args.length == 5) {
                    memberId = text.split('cho ')[1].split('ra')[0];
                    time = args[4];
                    if (time.endsWith('p')) {
                        time = time.replace('p', '');
                        time *= 1;
                    }
                }
                if (args.length > 5) {
                    memberId = text.split('cho ')[1].split('ra')[0];
                    time = args[4];
                    if (time.endsWith('p')) {
                        time = time.replace('p', '');
                        time *= 1;
                    } else
                        if (isNaN(time) || time <= 0) {
                            time = getRandomInteger(1, 120);
                        }
                }
            }

            if (text.includes('phút')) {
                time = text.split('ra đảo ')[1].split(' phút');
            }

            if (memberId == 132301) {
                chat(`${toName} quá mạnh, không ban được /thodai`);
                return;
            }

            await camNgon(memberId, time, tcvName, tcvId);
        }

        //bế quan
        if (text.toLowerCase().startsWith('cho') && text.toLowerCase().includes('bế quan') && ADMIN.includes(tcvId)) {
            let time = getRandomInteger(1, 120);
            let memberId = 0;
            const basic = await getUserInfo(tcvId);
            const toName = basic.name;
            let isIdBan = !isNaN(args[1]);
            if (isIdBan) {
                if (args.length == 4) {
                    memberId = text.split('cho ')[1].split('bế')[0];
                    time = getRandomInteger(1, 120);
                }
                if (args.length == 5) {
                    memberId = text.split('cho ')[1].split('bế')[0];
                    time = args[4];
                    if (time.endsWith('p')) {
                        time = time.replace('p', '');
                        time *= 1;
                    }
                }
                if (args.length > 5) {
                    memberId = text.split('cho ')[1].split('bế')[0];
                    time = args[4];
                    if (time.endsWith('p')) {
                        time = time.replace('p', '');
                        time *= 1;
                    } else
                        if (isNaN(time) || time <= 0) {
                            time = getRandomInteger(1, 120);
                        }
                }
            }

            if (text.includes('phút')) {
                time = text.split('bế quan ')[1].split(' phút');
            }

            if (memberId == 132301) {
                chat(`${toName} quá mạnh, không phạt được /thodai`);
                return;
            }

            await beQuan(memberId, time, tcvName, tcvId);
        }
        
        //update bảo khố
        /*if (text.toLowerCase().startsWith('updatebk')) {
	        await fetchItemCh();
	        chat("Done!");
        }*/
        //update
        if (text.toLowerCase().startsWith('update')) {
            if (ADMIN.includes(tcvId) && args.length == 2) {
                const memberId = args[1];
                resetMember(memberId);
                chat('Done!');
                return;
            }

            if (ADMIN.includes(tcvId) && args.length == 3) {
                const memberId = args[2];
                resetMember(memberId);
                chat('Done!');
                return;
            }

            if (args.length == 1) {
                resetMember(tcvId);
                chat('Done!');
                return;
            }
        }

        if (text.toLowerCase().startsWith('kick')) {
            if ((ADMIN.includes(tcvId) || KICK_IDS.includes(tcvId)) && args.length == 2) {
                const memberId = args[1];
                kickBang(memberId).then();
                return;
            }
            if (ADMIN.includes(tcvId) && args.length == 3) {
                const memberId = args[2];
                kickBang(memberId).then();
                return;
            }
        }

        if (text.toLowerCase().startsWith('kicks')) {
            if ((ADMIN.includes(tcvId) || KICK_IDS.includes(tcvId)) && args.length > 2) {
                kickNhieu(msg).then();
                return;
            }
        }

        if (text.toLowerCase().startsWith('set điểm')) {
            const itemName = text.replace('set điểm ', '').trim();
            //chat(`Đang đặt dch cho: [b]${cap(itemName, false)}[/b]....`);
            searchPk(itemName, tcvName).then();
            return;
        }

        /*if (text.toLowerCase().startsWith('set cp')) {
            const itemName = text.replace('set cp ', '').trim();
            //chat(`Đang đặt dch cho: [b]${cap(itemName, false)}[/b]....`);
            searchCp(itemName, tcvName).then();
            return;
        }*/

        if (text.toLowerCase().startsWith('set chức') && text.toLowerCase().includes('cho')) {
            if (ADMIN.includes(tcvId)) {
                const chuc = text.split('chức ')[1].split(' cho')[0];
                if (args.length == 6 && text.toLowerCase().includes('id' + ' ')) {
                    var memberId = args[args.length - 1];
                } else
                    if (args.length == 6 && text.toLowerCase().includes('cho' + ' ')) {
                        var memberId = args[args.length - 2];
                    } else 
                        if (args.length == 5 && text.toLowerCase().includes('cho' + ' ')) {
                            var memberId = args[args.length - 1];
                        } else
                            if (args.length > 6 && text.toLowerCase().includes('id' + ' ')) {
                                var memberId = args[args.length - 1];
                            } else
                                if (args.length > 6 && text.toLowerCase().includes('cho' + ' ')) {
                                    var memberId = args[args.length - 2];
                                }
                if (isNaN(memberId)) {
                    chat('ID không hợp lệ.');
                    return;
                }
                //const memberId = args[args.length - 1];
                changeChucVu(tcvId, chuc, memberId).then(async () => {
                    //chat('Done!');
                    await resetMember(memberId);
                });
                return;
            }
            chat('Chỉ QTV mới thực hiện được chức năng này.');
            //pmCbox(cboxId, "Bạn không có quyền set chức /tat");
            return;
        }

        //vào động
        if (text.toLowerCase().startsWith('sử dụng tiên phủ lệnh')) {
            
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
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
                for (let i = 0; i < keysChuyenDo.length; i++) {
                    const key = keysChuyenDo[i];
                    const fromId = key.replace('queue_chuyen_do_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
                for (let i = 0; i < keysChuyenRuong.length; i++) {
                    const key = keysChuyenRuong[i];
                    const fromId = key.replace('queue_chuyen_ruong_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
                for (let i = 0; i < keysVaoDong.length; i++) {
                    const key = keysVaoDong[i];
                    const fromId = key.replace('queue_vao_dong_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
                for (let i = 0; i < keysVaoDuocVien.length; i++) {
                    const key = keysVaoDuocVien[i];
                    const fromId = key.replace('queue_vao_duoc_vien_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
            } catch (error) { console.log(error); }
            
            if (args.length == 5) {
                const toId = tcvId;
                await vaoDongConfirmed(tcvId, toId);
                return 1;
            } else
                if (args.length > 5 && args[5].toLowerCase() == 'cho' && args[6].toLowerCase() == 'id') {
                    const toId = args[args.length - 1];
                    if (isNaN(toId)) {
                        chat('ID không hợp lệ.');
                        return;
                    }
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
                                vaoDongConfirmed(tcvId, toId);
                                return 1;
                            }
                        }
                        )
                        .catch(error => {
                            chat("Có lỗi xảy ra!"); 
                        }
                    ); 
                } else
                    if (args.length > 5 && args[5].toLowerCase() == 'cho' && args[6].toLowerCase() != 'id') {
                        const toId = args[args.length - 2];
                        if (isNaN(toId)) {
                            chat('ID không hợp lệ.');
                            return;
                        }
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
                                    vaoDongConfirmed(tcvId, toId);
                                    return 1;
                                }
                            }
                            )
                            .catch(error => {
                                chat("Có lỗi xảy ra!"); 
                            }
                        ); 
                    } 
        }
        
        //vào dược viên
        if (text.toLowerCase().startsWith('sử dụng thần nông lệnh')) {
            
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
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
                for (let i = 0; i < keysChuyenDo.length; i++) {
                    const key = keysChuyenDo[i];
                    const fromId = key.replace('queue_chuyen_do_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
                for (let i = 0; i < keysChuyenRuong.length; i++) {
                    const key = keysChuyenRuong[i];
                    const fromId = key.replace('queue_chuyen_ruong_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
                for (let i = 0; i < keysVaoDong.length; i++) {
                    const key = keysVaoDong[i];
                    const fromId = key.replace('queue_vao_dong_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
                for (let i = 0; i < keysVaoDuocVien.length; i++) {
                    const key = keysVaoDuocVien[i];
                    const fromId = key.replace('queue_vao_duoc_vien_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
            } catch (error) { console.log(error); }
            
            if (args.length == 5) {
                const toId = tcvId;
                await vaoDuocVienConfirmed(tcvId, toId);
                return 1;
            } else
                if (args.length > 5 && args[5].toLowerCase() == 'cho' && args[6].toLowerCase() == 'id') {
                    const toId = args[args.length - 1];
                    if (isNaN(toId)) {
                        chat('ID không hợp lệ.');
                        return;
                    }
                    await vaoDuocVienConfirmed(tcvId, toId);
                    return 1;
                } else
                    if (args.length > 5 && args[5].toLowerCase() == 'cho' && args[6].toLowerCase() != 'id') {
                        const toId = args[args.length - 2];
                        if (isNaN(toId)) {
                            chat('ID không hợp lệ.');
                            return;
                        }
                        await vaoDuocVienConfirmed(tcvId, toId);
                        return 1;
                    } 
        }

        // ======================== Confirm chuyen do ===============================
        if (content == 'y' || content == 'Y') {
            const chuyenBacKey = `queue_chuyen_bac_${tcvId}`;
            const chuyenBacData = await getItem(chuyenBacKey);
            if (chuyenBacData !== null && chuyenBacData !== '') {
                const jsonData = JSON.parse(chuyenBacData);
                const {fromId, fromCboxId, toId, amount, total} = jsonData;
                await delKey(`queue_chuyen_bac_${tcvId}`);
                await chuyenBacConfirmed(fromId, fromCboxId, toId, amount, total); 
                // Chuyen bac
                return;
            }

            //Chuyen ruong
            const chuyenRuongKey = `queue_chuyen_ruong_${tcvId}`;
            const chuyenRuongData = await getItem(chuyenRuongKey);
            if (chuyenRuongData !== null && chuyenRuongData !== '') {
                const jsonData = JSON.parse(chuyenRuongData);
                const {fromId, fromCboxId, toId, amount, total} = jsonData;
                await delKey(`queue_chuyen_ruong_${tcvId}`);
                await chuyenRuongConfirmed(fromId, fromCboxId, toId, amount, total); 
                return;
            }

            // Chuyen do
            const chuyenDoKey = `queue_chuyen_do_${tcvId}`;
            const chuyenDoData = await getItem(chuyenDoKey);
            if (chuyenDoData !== null && chuyenDoData !== '') {
                const jsonData = JSON.parse(chuyenDoData);
                const {fromId, bacPhi, listItems, toId} = jsonData;
                const items = new Map(Object.entries(listItems));
                await delKey(`queue_chuyen_do_${tcvId}`);
                await chuyenDo2Id(items, fromId, toId);
                //await delKey(`queue_chuyen_do_${tcvId}`);
                return;
            }

            //Vào động
            const vaoDongKey = `queue_vao_dong_${tcvId}`;
            const vaoDongData = await getItem(vaoDongKey);
            if (vaoDongData !== null && vaoDongData !== '') {
                const jsonData = JSON.parse(vaoDongData);
                const {tcvId, toId} = jsonData;
                await delKey(`queue_vao_dong_${tcvId}`);
                await vaoDong(tcvId, toId); 
                return;
            }

            //vào dược viên
            const vaoDuocVienKey = `queue_vao_duoc_vien_${tcvId}`;
            const vaoDuocVienData = await getItem(vaoDuocVienKey);
            if (vaoDuocVienData !== null && vaoDuocVienData !== '') {
                const jsonData = JSON.parse(vaoDuocVienData);
                const {tcvId, toId} = jsonData;
                await delKey(`queue_vao_duoc_vien_${tcvId}`);
                await vaoDuocVien(tcvId, toId); 
                return;
            }
            return;
             //pmCbox(cboxId, 'Xác nhận muộn /tat');
        }

        if (content == 'n' || content == 'N') {
            const chuyenBacData = await getItem(`queue_chuyen_bac_${tcvId}`);
            const chuyenDoData = await getItem(`queue_chuyen_do_${tcvId}`);
            const chuyenRuongData = await getItem(`queue_chuyen_ruong_${tcvId}`);
            const vaoDongData = await getItem(`queue_vao_dong_${tcvId}`);
            const vaoDuocVienData = await getItem(`queue_vao_duoc_vien_${tcvId}`);
            if ((chuyenBacData !== null && chuyenBacData !== '') || (chuyenDoData !== null && chuyenDoData !== '') || (chuyenRuongData !== null && chuyenRuongData !== '') || (vaoDongData !== null && vaoDongData !== '') || (vaoDuocVienData !== null && vaoDuocVienData !== '')) {
                await delKey(`queue_chuyen_bac_${tcvId}`);
                await delKey(`queue_chuyen_do_${tcvId}`);
                await delKey(`queue_chuyen_ruong_${tcvId}`);
                await delKey(`queue_vao_dong_${tcvId}`);
                await delKey(`queue_vao_duoc_vien_${tcvId}`);
                chat(`${tcvName} - Đã hủy.`);
                return;
            }
        }
        return;
    }

    // Chuyen do (admin / TL)
    if (args[0] === ".cd" || args[0] === ".chuyendo") {
        if (!ADMIN.includes(tcvId) && !CHUYEN_DO_IDS.includes(tcvId)) {
            chat("Chỉ QTV mới thực hiện được chức năng này.");
            return;
        }

        if (args[3] === 'cho') {
            chuyenDoNhieuUser(msg, args, tcvId);
            return;
        }

        if (!is_numeric(args[3])) {
            const toId = parseInt(args[1]);
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
                        chuyenDoFromBot(msg, args, tcvId);  
                    }
                })
                .catch(error => {
                    chat('Không nhận được phản hồi từ server.');
                    chat('Đã tạm dừng bot 1 phút /bee109');
                }); 
        } else {
            await chuyenDoFromAdmin(args, msg);
        }
        return 1;
    }

    // Them quyen
    if (args[0] === '.quyen') {
        // Hiện tại đang set quyền cứng trong modules/constant.js
        // Có thể thực hiện set mềm trong redis

        // if (content.includes('<')) {
        //     parseTag(content).then(tag => {
        //         args = tag.split(" ");
        //         setPermission(args, tcvId).then(async () => {
        //             await pmTcv(cboxId, 'Xong /xga');
        //         });
        //     });
        // }
        //
        // setPermission(args, tcvId).then(async () => {
        //     await pmTcv(cboxId, 'Xong /xga');
        // });

        return;
    }

    // Chuyen bac
    /*if (args[0] === '.chuyenbac') {
        if (ADMIN.includes(tcvId)) {
            if (args.length === 1) {
                pmCbox(cboxId, "Cho phép chuyển bạc không giới hạn. Cú pháp: [b].chuyenbac ID_NHAN SO_LUONG[/b]")
                return;
            }

            if (is_numeric(args[1]) && is_numeric(args[2])) {
                const toId = args[1];
                const amount = args[2];
                chuyenBac(tcvId, args[1], args[2]).then(async () => {
                    let toName = await getTcvNameFromTcvId(toId);
                    chat(`Đã chuyển ${formatBac(amount)} bạc cho ${toName} ([url=https://tutien.net/member/${toId}]${toId}[/url])`);
                });
                return;
            }
        }
    }*/

    /*if (args[0] === '.hd') {
        if (args.length === 2 && args[1] === 'm') {
            listBuy(cboxId).then();
            return;
        }
    }*/

    if (args[0] === '.move') {
        if ((ADMIN.includes(tcvId) || MOVE_IDS.includes(tcvId)) && args.length >= 3) {
            const memberId = args[1];
            const bangPhai = msg.replace(`${args[0]} ${args[1]}`, '').trim();
            xinVaoBang(memberId, bangPhai).then();
            return;
        }
    }

    /*if (args[0] === '.update') {
        if (ADMIN.includes(tcvId) && args.length == 2) {
            const memberId = args[1];
            resetMember(memberId);
            chat('Done!');
            return;
        }

        if (args.length == 1) {
            resetMember(tcvId);
            chat('Done!');
            return;
        }
    }*/

    /*if (args[0] === '.kick') {
        if (ADMIN.includes(tcvId) && args.length == 2) {
            const memberId = args[1];
            kickBang(memberId).then();
            return;
        }
    }

    if (args[0] === '.kicks') {
        if (ADMIN.includes(tcvId) && args.length > 2) {
            kickNhieu(msg).then();
            return;
        }
    }*/

    /*if (args[0] === '.restart' && ADMIN.includes(tcvId)) {
        execFile(`/home/soisoi/bot/restart_bot.sh`, (error, stdout, stderr) => {
            if (error) {
                console.error(error);
                return;
            }
            console.log(stdout);
            chat('Done!');
        });
        return;
    }*/

    // Chuyen do (member)
    if (args[0] === '.c' || args[0] === '.chuyen') {
        // [chuyen, 300200, 1000, bac]
        /*if (args.length === 4 && args[3] === 'bạc') {
            if (args[2].endsWith('kb') || args[2].endsWith('mb')) {
                chat('Số bạc không hợp lệ.');
                return;
            }
            await chuyenBacFromUser(tcvId, cboxId, args[1], convertSoDu(args[2]));
            return;
        }

        if (msg.toLowerCase().includes('bạc') && args[2].toLowerCase().includes('k') || args[2].toLowerCase().includes('m') || args[2].toLowerCase().includes('b')) {
            //chat('Không chuyển lẫn bạc với đồ /tat');
            return;
        }*/
        if (args.length === 1) {
            return;
        }
        
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
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
                for (let i = 0; i < keysChuyenDo.length; i++) {
                    const key = keysChuyenDo[i];
                    const fromId = key.replace('queue_chuyen_do_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
                for (let i = 0; i < keysChuyenRuong.length; i++) {
                    const key = keysChuyenRuong[i];
                    const fromId = key.replace('queue_chuyen_ruong_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
                for (let i = 0; i < keysVaoDong.length; i++) {
                    const key = keysVaoDong[i];
                    const fromId = key.replace('queue_vao_dong_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
                for (let i = 0; i < keysVaoDuocVien.length; i++) {
                    const key = keysVaoDuocVien[i];
                    const fromId = key.replace('queue_vao_duoc_vien_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Hoàn tất giao dịch để tiếp tục.`);
                        return;
                    }
                }
        } catch (error) { console.log(error); }

        await chuyenDoFromUser(tcvId, args, msg);
        return;
    }

    // Chuyen ruong (member)
    /*if (args[0] === '.cr' || args[0] === '.chuyenruong') {
        // [".cr", "300200", "200 bạc"]
        if (args.length === 4 && args[3].toLowerCase() === 'bạc') {
            if (args[2].endsWith('kb') || args[2].endsWith('mb')) {
                chat('Số dư không hợp lệ.');
                return;
            }
                    //sl = convertSoDu(sl);
            chuyenRuong(tcvId, cboxId, args[1], convertSoDu(args[2])).then();
            return;
        }
        return;
    }*/

    /*if (args[0].toLowerCase() === 'chuyển' && args[2].toLowerCase() === 'số' && args[3].toLowerCase() === 'dư' && args[4].toLowerCase() === 'cho') {
        if (args[1].endsWith('kb') || args[1].endsWith('mb')) {
                        chat('Số dư không hợp lệ.');
                        return;
                    }
                    //sl = convertSoDu(sl);
            chuyenRuong(tcvId, cboxId, args[5], convertSoDu(args[2])).then();
            return;
    }*/

    // Check ruong (member)
    /*if (args[0] === '.ruong') {
        if (args.length === 1) {
            checkRuong(tcvId, cboxId).then();
            return;
        }

        if (args.length === 2 && is_numeric(args[1]) && ADMIN.includes(tcvId)) {
            const targetId = parseInt(args[1]);
            checkMemberRuong(targetId, cboxId).then();
            return;
        }

        if ((args[1] === 'nạp' || args[1] === 'nap') && ADMIN.includes(tcvId)) {
            await napRuong(tcvId, args);
            return;
        }

        if (args[1] == 'xoa' || args[1] == 'xóa') {
            if (args.length === 2) {
                xoaRuong(tcvId).then();
                return;
            }

            if (args.length === 3 && is_numeric(args[2]) && ADMIN.includes(tcvId)) {
                xoaRuong(args[2]).then();
            }
        }
    }*/

    // Show ruong (member)
    /*if (args[0] === '.show') {
        await showMyRuong(tcvId).then();
    }*/

    // Check bao kho
    /*if (args[0].startsWith('.cbk')) {
        checkBaoKho(msg.replace(".cbk", '').trim().replace(/\s\s+/g, " "), tcvName).then(() => {
        });
        return;
    }*/

    // Check phap khi
    if (args[0] === '.cpk') {
        //return;
        if (args.length === 1) {
            const toId = tcvId;
            checkPhapKhi(tcvId, toId).then(() => {
            });
        }
        if (args.length === 2) {
            const toId = args[1];
            checkPhapKhi(tcvId, toId).then(() => {
            });
        }
    }

    // Sua phap khi
    if (args[0] === '.spk') {
        if (args.length === 2) {
            const toId = tcvId;
            const itemName = msg.toLowerCase().replace('.spk ', '').trim();
            suaPhapKhi(tcvId, toId, itemName).then(() => {});
        }
        if (args.length === 3) {
            const toId = args[1];
            const itemName = args[2];
            //const itemName = msg.toLowerCase().replace('.spk ' + '+ toId  + ', '').trim();
            suaPhapKhi(tcvId, toId, itemName).then(() => {});
        }
    }

    // update bao kho
    if (args[0] === '.updatebk') {
	    await fetchItemCh();
	    chat("Done!");
    }

    // Chuc
    /*if (args[0] === '.chuc') {
        if (ADMIN.includes(tcvId) && args.length >= 3) {
            changeChucVu(tcvId, args).then(async () => {
                //chat('Done!');
                await resetMember(tcvId);
            });
            return;
        }

        chat('Chỉ QTV mới thực hiện được chức năng này.');
        //pmCbox(cboxId, "Bạn không có quyền set chức /tat");
        return;
    }*/

    // Cong cong hien
    if (args[0] === '.cch') {
        if (ADMIN.includes(tcvId) && args.length === 3) {
            congCongHien(args, cboxId).then();
            return;
        }
        chat('Chỉ QTV mới thực hiện được chức năng này.');
        //pmCbox(cboxId, "Bạn không có quyền cộng cống hiến /tat");
        return;
    }

    // Tru cong hien
    /*if (args[0] === '.cn') {
        if (ADMIN.includes(tcvId) && args.length === 3) {
            camNgon(args, tcvName, tcvId).then();
            return;
        }

        pmCbox(cboxId, "Bạn không có quyền cấm ngôn /tat");
        return;
    }*/

    /*if (args[0] === '.cb') {
        checkBank(tcvId).then(r => {
            chat('Bạn đang có: ' + r + " bạc")
        });
        return 1;
    }*/

    /*if (args[0] === '.dong') {
        if (ADMIN.includes(tcvId) && args.length === 2) {
            const dongId = args[1];
            addDongThien(dongId).then();
            return;
        }
        return 1;
    }*/

    // Check bank
    /*if (args[0] == '.bank') {
        checkBank(BANK_ID).then(r => {
            chat('Ngân quỹ đang có: ' + r + " bạc")
        });
        return 1;
    }*/

    // Check bank
    /*if (args[0] === '.cmem' && args.length === 1) {
        checkMem().then();
        return 1;
    }*/

    // Check bank
    /*if (args[0] === '.duyet' && args.length === 2) {
        if ((CHUYEN_DO_IDS.includes(tcvId) || ADMIN.includes(tcvId))) {
            duyetMem(args[1], tcvId).then();
            return 1;
        }

        pmCbox(cboxId, "Bạn không có duyệt /tat");
        return 1;
    }*/

    // Set CH
    /*if (args[0] === '.setpk') {
        const itemName = msg.replace('.setpk', '').trim();
        chat(`Đang đặt dch cho: [b]${cap(itemName, false)}[/b]....`);
        searchPk(itemName, tcvName).then();
        return;
    }*/

    /*if (args[0] === '.setcp') {
        const itemName = msg.replace('.setcp','');
        searchCp(itemName).then();
        return;
    }*/

    // Set CH
    if (args[0] === '.clear' && ADMIN.includes(tcvId)) {
        chat("[br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br]");
        chat("[br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br]");
        chat("[br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br]");
        chat("[br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br]");
        chat("[br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br][br]");
        chat("Đã sạch sẽ /denm");
        return;
    }

    if (args[0] === '.help') {
        const messages = [
            'Các chức năng của bot:',
            `✦ Chuyển đồ: .c [id nhận] [số lượng] [tên vật phẩm]`,
            `✦ Chuyển bạc: chuyển [số lượng] bạc cho id [id nhận]`,
            `✦ Chuyển số dư: chuyển [số lượng] số dư cho id [id nhận]`,
            `✦ Kiểm tra số dư của bản thân: số dư`,
            `✦ Xem lịch sử giao dịch bạc: log bạc`,
            `✦ Check vật phẩm bảo khố: check item [tên vp]`,
            `✦ Check đơn vào bang: list mem`,
            `✦ Duyệt mem: duyệt đơn [id đơn]`,
            //`✦ Set cống hiến: .setch [tên pháp khí/công pháp]`,
            `✦ Kiểm tra ngân quỹ của bang: check bank`,
            `✦ Kiểm tra bạc của bản thân: check bạc`,
            `✦ Kiểm tra độ bền pháp khí của bản thân: .cpk`,
            `✦ Kiểm tra độ bền pháp khí của người khác: .cpk [id]`,
            `✦ Sửa bền pháp khí của bản thân: .spk [tên pháp khí] (chỉ được sửa 1 vật phẩm/1 lần)`,
            `✦ Sửa bền pháp khí của người khác: .spk [id] [tên pháp khí] (chỉ được sửa 1 vật phẩm/1 lần)`,
        ];

        if (ADMIN.includes(tcvId) || CHUYEN_DO_IDS.includes(tcvId)) {
            //messages.push(`✦ Chuyển đồ 2 ID: .cd [id nộp] [id nhận] [tên vp]`);
        }

        if (ADMIN.includes(tcvId)) {
            //messages.push(`✦ Nạp bạc: [b].ruong nạp [id nhận] [số lượng] bạc`);
            messages.push(`✦ Chuyển đồ 1 ID: .cd [id nhận] [số lượng] [tên vp]`);
            messages.push(`✦ Cấm ngôn: cho [id] ra đảo [số phút]`);
            //messages.push(`✦ Cộng cống hiến: .cch [id nhận] [số CH]`);
            //messages.push(`✦ Kiểm tra rương của member: .show [id]`);
            //messages.push(`✦ Set chức cho member: .chuc [id] [tên chức]`);
        }

        pmCbox(cboxId, messages.join("[br]"));
        return 1;
    }
}

const dict = { b: 1, k: 1000, m: 1000000 };
export function strRepeat(str, length) {
    let r = '';
    for (let i = 0; i < length; i++) {
        r += str;
    }
    return r;
}

export function strPad(str, maxLength, fillString = '0') {
    return (str + strRepeat(fillString, maxLength)).slice(0, maxLength);
}

export function convertBac(sl) {
    let preMulti;
    return sl
        .replace(/([^\d])/g, ':$1-')
        .split('-')
        .reduce((pre, curr) => {
            let [num, multi] = curr.split(':');
            num = +num;
            if (multi && dict[multi]) {
                num = dict[multi] * num;
            } else if (preMulti) {
                num = +strPad(num, dict[preMulti].toString().length -1, '0');
            }
            preMulti = multi;
            return pre + num;
        }, 0);
}

const dictSoDu = { k: 1000, m: 1000000 };
export function soDuRepeat(str, length) {
    let r = '';
    for (let i = 0; i < length; i++) {
        r += str;
    }
    return r;
}

export function soDuPad(str, maxLength, fillString = '0') {
    return (str + soDuRepeat(fillString, maxLength)).slice(0, maxLength);
}

export function convertSoDu(sl) {
    let preMulti;
    return sl
        .replace(/([^\d])/g, ':$1-')
        .split('-')
        .reduce((pre, curr) => {
            let [num, multi] = curr.split(':');
            num = +num;
            if (multi && dictSoDu[multi]) {
                num = dictSoDu[multi] * num;
            } else if (preMulti) {
                num = +soDuPad(num, dictSoDu[preMulti].toString().length -1, '0');
            }
            preMulti = multi;
            return pre + num;
        }, 0);
}

async function parseTag(str) {
    const tag = str.slice(str.indexOf('<'), str.lastIndexOf('>') + 1);
    const cboxId = tag.split('uid="')[1].split('"')[0];
    const tcvId = await getTcvIdFromCboxId(cboxId);
    return str.replace(tag, tcvId);
}

async function parseMessageContent(message) {
    let replaced = message.replace(/<(.+?)[\s]*\/?[\s]*>/g, '')
        .replaceAll('CM', '')
        .replaceAll('ĐTL', '')
        .replaceAll('TL', '')
        .replaceAll('HP', '')
        .replaceAll('HT', '')
        .replaceAll('NM', '')
        .replaceAll('NGM', '')
        .replaceAll('Top 1', '')
        .replaceAll('Top 2', '')
        .replaceAll('Top 3', '')
        .replace(/\s\s+/g, " ");

    const ids = message.split('data-uid="');
    if (ids.length === 1) {
        return replaced;
    }

    const cboxId1 = ids[1].split('"')[0];
    const memberId1 = await getTcvIdFromCboxId(cboxId1);
    const cboxName1 = await getTcvNameFromTcvId(memberId1);
    if (ids.length === 2) { // 1 id
        return replaced.replace(cboxName1, memberId1);
    }

    // 2 id
    const cboxId2 = ids[2].split('"')[0];
    const memberId2 = await getTcvIdFromCboxId(cboxId2);
    const cboxName2 = await getTcvNameFromTcvId(memberId2);
    return replaced.replace(cboxName1, memberId1)
        .replace(cboxName2, memberId2);
}
