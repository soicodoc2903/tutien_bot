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

    // T???m th???i ch??? b???t bot cho ADMIN
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

    // T???m th???i ch??? b???t bot cho ADMIN
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
            chat('Ch??? QTV m???i th???c hi???n ???????c ch???c n??ng n??y.');
        }

        if (text.toLowerCase().startsWith('check bank')) {
            await checkBank(); 
            return 1;
        }

        // ======================= START H???C ??I???M ===========================
        // L??u ??: kh??ng th??? v???a b??n - v???a mua c??ng 1 v???t ph???m
        try {
        if (text.toLowerCase().startsWith('c???a h??ng') && args.length === 2) {
            let send = '[b]C???A H??NG M??N PH??I[/b]';

            send = send + '[br][b]c???a h??ng b??n:[/b] Xem v???t ph???m ??ang B??N tr??n shop';
            send = send + '[br][b]c???a h??ng mua:[/b] Xem v???t ph???m shop ??ang c???n THU MUA';
            send = send + '[br][b]mua [s??? l?????ng] [v???t ph???m]:[/b] Mua v???t ph???m tr??n shop';
            send = send + '[br][b]b??n [s??? l?????ng] [v???t ph???m]:[/b] B??n v???t ph???m trong h??nh trang cho shop';
            await pmCbox(cboxId, send);
            return;
        }
        if (text.toLowerCase().startsWith('c???a h??ng mua')) {
            const shopStatus = await getItem('shop_status');    
            if (shopStatus == false || shopStatus == 'false') {
                chat('C???a h??ng ????ng c???a trong th???i gian n??y, vui l??ng quay l???i sau.');
                return;
            }
            //console.log(text);
            //if (tcvId != '666888' && tcvId != '132301') return;
            await listBuy(tcvId);
            return;
        }

        if (text.toLowerCase().startsWith('c???a h??ng b??n')) {
            //if (tcvId != '666888' && tcvId != '132301') return;
            await listSell(tcvId);
            return;
        } 

        // format: c???a h??ng set gi?? tinh linh cp 30000
        if (text.toLowerCase().startsWith('c???a h??ng set gi??') && ADMIN.includes(tcvId)) {
            const price = parseInt(args[args.length - 1]);
            const itemName = content.toLowerCase().replace('c???a h??ng set gi?? ', '').replace(` ${price}`, '').trim();
            await setPrice(itemName, price);
            await pmCbox(cboxId, 'Done!');
            return;
        }

        // format: c???a h??ng set s??? l?????ng tinh linh cp 30000
        if (text.toLowerCase().startsWith('c???a h??ng set s??? l?????ng') && ADMIN.includes(tcvId)) {
            const amount = parseInt(args[args.length - 1]);
            const itemName = content.toLowerCase().replace('c???a h??ng set s??? l?????ng ', '').replace(` ${amount}`, '').trim();
            await setAmount(itemName, amount);
            await pmCbox(cboxId, 'Done!');
            return;
        }

        // M??? shop
        if (text.toLowerCase().startsWith('m??? shop') && tcvId == 132301) {
            await activeShop(tcvId);
            return 1;
        }

        // ????ng shop
        if (text.toLowerCase().startsWith('????ng shop') && tcvId == 132301) {
            await inActiveShop(tcvId);
            return 1;
        }

        // format: mua 1 t???o h??a ng???c di???p
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

        // format: b??n 1 tinh linh cp
        if (text.toLowerCase().startsWith('b??n')) {
            const shopStatus = await getItem('shop_status');    
            if (shopStatus == false || shopStatus == 'false') {
                chat('C???a h??ng ????ng c???a trong th???i gian n??y, vui l??ng quay l???i sau.');
                return;
            }
            //if (tcvId != '666888') return;
            const amount = parseInt(args[1]);
            const itemName = content.toLowerCase().replace(`b??n ${amount} `, '').trim();
            if (isNaN(amount)) {
                return;
            }
            await sellItem(tcvId, itemName, amount);
            return;
        }
        } catch (error) { console.log(error); }
        
        // ======================= END H???C ??I???M ===========================

        //h??i l???c
        if (text.toLowerCase().startsWith('h??i l???c')) {
            axios.get(`https://soi-tcvtool.xyz/truyencv/member/${tcvId}`).then(
                response => { 
                    const name = response.data.name;
                    const bp = response.data.bang_phai;
                    const tuVi = response.data.tu_vi;
                    const tuVis = [
                        'Ph??m Nh??n',
                        'Luy???n Kh?? T???ng 1',
                        'Luy???n Kh?? T???ng 2',
                        'Luy???n Kh?? T???ng 3',
                        'Luy???n Kh?? T???ng 4',
                        'Luy???n Kh?? T???ng 5',
                        'Luy???n Kh?? T???ng 6',
                        'Luy???n Kh?? T???ng 7',
                        'Luy???n Kh?? T???ng 8',
                        'Luy???n Kh?? T???ng 9',
                        'Luy???n Kh?? Vi??n M??n',
                        'Tr??c C?? T???ng 1',
                        'Tr??c C?? T???ng 2',
                        'Tr??c C?? T???ng 3',
                        'Tr??c C?? T???ng 4',
                        'Tr??c C?? T???ng 5',
                        'Tr??c C?? T???ng 6',
                        'Tr??c C?? T???ng 7',
                        'Tr??c C?? T???ng 8',
                        'Tr??c C?? T???ng 9',
                        'Tr??c C?? Vi??n M??n',
                        'Kim ??an T???ng 1',
                        'Kim ??an T???ng 2',
                        'Kim ??an T???ng 3',
                        'Kim ??an T???ng 4',
                        'Kim ??an T???ng 5',
                        'Kim ??an T???ng 6',
                        'Kim ??an T???ng 7',
                        'Kim ??an T???ng 8',
                        'Kim ??an T???ng 9',
                        'Kim ??an Vi??n M??n',
                        'Nguy??n Anh T???ng 1',
                        'Nguy??n Anh T???ng 2',
                        'Nguy??n Anh T???ng 3',
                        'Nguy??n Anh T???ng 4',
                        'Nguy??n Anh T???ng 5',
                        'Nguy??n Anh T???ng 6',
                        'Nguy??n Anh T???ng 7',
                        'Nguy??n Anh T???ng 8',
                        'Nguy??n Anh T???ng 9',
                        'Nguy??n Anh Vi??n M??n',
                        'H??a Th???n T???ng 1',
                        'H??a Th???n T???ng 2',
                        'H??a Th???n T???ng 3',
                        'H??a Th???n T???ng 4',
                        'H??a Th???n T???ng 5',
                        'H??a Th???n T???ng 6',
                        'H??a Th???n T???ng 7',
                        'H??a Th???n T???ng 8',
                        'H??a Th???n T???ng 9',
                        'H??a Th???n Vi??n M??n',
                        'Luy???n H?? T???ng 1',
                        'Luy???n H?? T???ng 2',
                        'Luy???n H?? T???ng 3',
                        'Luy???n H?? T???ng 4',
                        'Luy???n H?? T???ng 5',
                        'Luy???n H?? T???ng 6',
                        'Luy???n H?? T???ng 7',
                        'Luy???n H?? T???ng 8',
                        'Luy???n H?? T???ng 9',
                        'Luy???n H?? Vi??n M??n',
                        'H???p Th??? T???ng 1',
                        'H???p Th??? T???ng 2',
                        'H???p Th??? T???ng 3',
                        'H???p Th??? T???ng 4',
                        'H???p Th??? T???ng 5',
                        'H???p Th??? T???ng 6',
                        'H???p Th??? T???ng 7',
                        'H???p Th??? T???ng 8',
                        'H???p Th??? T???ng 9',
                        'H???p Th??? Vi??n M??n',
                        '?????i Th???a T???ng 1',
                        '?????i Th???a T???ng 2',
                        '?????i Th???a T???ng 3',
                        '?????i Th???a T???ng 4'
                    ];

                    if (bp !== 'V?? C???c Ma T??ng') {
                        chat(`${name} - ?????o h???u kh??ng thu???c bang n??y n??n kh??ng th??? tham gia v??o ho???t ?????ng n??y.`); 
                        return;
                    }
                    if (bp === 'V?? C???c Ma T??ng' && tuVis.includes(tuVi)) {
                        chat(`${name} - Tu vi c???a ?????o h???u l?? [class=tukim]${tuVi}[/class], qu?? th???p ????? tham gia v??o ho???t ?????ng n??y.`);
                        return;
                    }
                    if (bp === 'V?? C???c Ma T??ng' && tuVis.includes(tuVi) === false) {
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
                            chat(`${name} v???a h??i ???????c c???c /gach n??y /bee003`);
                        } else {
                            haiLoc(tcvId);
                        }
                    }
                }
            )
            .catch(error => { 
                chat('C?? l???i x???y ra!');
                return;
            });
            
            return 1;
        } 

        if (text.toLowerCase().startsWith('m??? lx') || text.toLowerCase().startsWith('m??? l?? x??')) {
            await moLiXi(tcvId);
            return 1;
        }

        if (text.toLowerCase().startsWith('check event') || text.toLowerCase().startsWith('check ev')) {
            await checkEvent();
            return 1;
        }

        if (text.toLowerCase() === 'qu??? ev') {
            await bacQuyEvent();
            return 1;
        }

        if (text.toLowerCase().startsWith('n???p') && text.toLowerCase().includes('v??o qu??? ev')) {
            if (tcvId !== 132301) {
                chat('Ch??? CM m???i th???c hi???n ???????c ch???c n??ng n??y.');
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

        if (text.toLowerCase().startsWith('?????t v??')) {
            if (tcvId != 132301) {
                return;
            }
            const amount = parseInt(args[2]);
            if (isNaN(amount)) {
                chat(`${tcvName} - ${amount} kh??ng ph???i l?? s??? h???p l???.`);
                return;
            }
            await muaVe(tcvId, cboxId, tcvName, amount);
            return 1;
        }

        //Ch???n l???
        /*if (args[0] === 't??i' || args[0] === 'x???u') {
            const curr = args[0];
            const amount = parseInt(args[1]);
            if (isNaN(amount)) {
                chat(`${tcvName} - args[1] kh??ng ph???i l?? s??? h???p l???.`);
                return;
            }
            await chanLe(tcvId, cboxId, tcvName, curr, amount);
            return 1;
        }*/

        if (text.toLowerCase().startsWith('xx')) {
            await dice(tcvId, tcvName);
            return 1;
        }

        //t???m b???o
        if (text.toLowerCase().startsWith('th??m d?? c??? chi???n tr?????ng') || text.toLowerCase().startsWith('th??m d?? chi???n tr?????ng')) {
            if (tcvId != 132301 && tcvId != 300200) {
                return;
            }
            await thamDoChienTruong(tcvId, cboxId, tcvName);
            return 1;
        }

        if (text.toLowerCase().startsWith('s??? d???ng') && text.toLowerCase().includes('tru ti??n ??an')) {
            if (tcvId !== 132301) {
                return;
            }
            const sl = args[2];
            if (isNaN(sl)) {
                pmCbox(cboxId, 'S??? l?????ng kh??ng ????ng.');
                return;
            }
            await suDungTruTienDan(tcvId, cboxId, sl);
            return 1;
        }

        if (text.toLowerCase().startsWith('s??? d???ng') && text.toLowerCase().includes('u???n huy???t ??an')) {
            if (tcvId !== 132301) {
                return;
            }
            const sl = args[2];
            if (isNaN(sl)) {
                pmCbox(cboxId, 'S??? l?????ng kh??ng ????ng.');
                return;
            }
            await suDungUanHuyetDan(tcvId, cboxId, sl);
            return 1;
        }

        if (text.toLowerCase().startsWith('s??? d???ng') && text.toLowerCase().includes('v???n kh?? ??an')) {
            if (tcvId !== 132301) {
                return;
            }
            const sl = args[2];
            if (isNaN(sl)) {
                pmCbox(cboxId, 'S??? l?????ng kh??ng ????ng.');
                return;
            }
            await suDungVanKhiDan(tcvId, cboxId, sl);
            return 1;
        }

        if (text.toLowerCase().startsWith('log b???c')) {
            if (args.length == 2) {
                getLogBac(tcvId).then(r => {
                    if (r == '') {
                        pmCbox(cboxId, 'Kh??ng c?? d??? li???u.');
                        return;
                    }
                    pmCbox(cboxId, 'Log 10 giao d???ch g???n ????y:[br]' + r);
                });
                return;
            }
            if (args.length == 3) {
                const memberId = args[2];
                getLogBac(memberId).then(r => {
                    if (r == '') {
                        pmCbox(cboxId, 'Kh??ng c?? d??? li???u.');
                        return;
                    }
                    pmCbox(cboxId, 'Log 10 giao d???ch g???n ????y:[br]' + r);
                });
                return;
            }
            if (args.length == 4) {
                const memberId = args[3];
                getLogBac(memberId).then(r => {
                    if (r == '') {
                        pmCbox(cboxId, 'Kh??ng c?? d??? li???u.');
                        return;
                    }
                    pmCbox(cboxId, 'Log 10 giao d???ch g???n ????y:[br]' + r);
                });
                return;
            } 
            return 1;
        }

        //s??? d??
        if (text.toLowerCase().startsWith('s??? d??')) {
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

        if (text.toLowerCase().startsWith('h??nh trang')) {
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

        //nh??n v???t
        /*if (text.toLowerCase().startsWith('nh??n v???t')) {
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
        if (text.toLowerCase().startsWith('chuy???n') && text.toLowerCase().includes('cho') && !text.toLowerCase().includes('s??? d??') && (text.toLowerCase().includes('b???c') || text.toLowerCase().includes('kb') || text.toLowerCase().includes('mb') || text.toLowerCase().includes('b'))) {
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
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                        return;
                    }
                }
                for (let i = 0; i < keysChuyenDo.length; i++) {
                    const key = keysChuyenDo[i];
                    const fromId = key.replace('queue_chuyen_do_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                        return;
                    }
                }
                for (let i = 0; i < keysChuyenRuong.length; i++) {
                    const key = keysChuyenRuong[i];
                    const fromId = key.replace('queue_chuyen_ruong_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                        return;
                    }
                }
                for (let i = 0; i < keysVaoDong.length; i++) {
                    const key = keysVaoDong[i];
                    const fromId = key.replace('queue_vao_dong_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                        return;
                    }
                }
                for (let i = 0; i < keysVaoDuocVien.length; i++) {
                    const key = keysVaoDuocVien[i];
                    const fromId = key.replace('queue_vao_duoc_vien_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                        return;
                    }
                }
            } catch (error) { console.log(error); }
            if (args[2].toLowerCase() == 'cho' || args[2].toLowerCase() == 'b???c') {
                var sl = args[1];
                //let memberId = text.split('cho ')[1];
                sl = convertBac(sl);
                
                if (args.length == 6 && args[3].toLowerCase() == 'cho' && args[4].toLowerCase() == 'id') {
                    if (args[2].toLowerCase() == 'b???c') {
                        var memberId = args[args.length - 1];
                        //var memberId = text.split('id ')[1].trim();
                    } else {
                        chat('S??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
                if (args.length == 5 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() == 'id') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        var memberId = args[args.length - 1];
                        //var memberId = text.split('id ')[1].trim();
                    } else {
                        chat('S??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
                if (args.length == 6 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() == 'id') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        var memberId = args[args.length - 1];
                        //var memberId = text.split('id ')[1];
                    } else {
                        chat('S??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
                
                if (args.length == 6 && args[3].toLowerCase() == 'cho' && args[4].toLowerCase() != 'id') {
                    if (args[2].toLowerCase() == 'b???c') {
                        var memberId = args[args.length - 2];
                        //var memberId = text.split('cho ')[1];
                        //memberId = args[4];
                    } else {
                        chat('S??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
                
                if (args.length == 5 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() != 'id') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        //memberid = args[3];
                        var memberId = args[args.length - 2];
                        //var memberid = text.split('cho ')[1];
                    } else {
                        chat('s??? b???c kh??ng h???p l???.');
                        return;
                    }
                }

                if (args.length == 4 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() != 'id' && args[4] != '') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        //memberid = args[3];
                        var memberId = args[args.length - 1];
                        //var memberid = text.split('cho ')[1];
                    } else {
                        chat('s??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
            }
            if (isNaN(memberId)) {
                chat(`${fromName} - ID kh??ng h???p l???.`);
                return;
            }
            await chuyenBacFromUser(tcvId, cboxId, memberId, parseInt(sl));
            return; 
        }

        //chuy???n s??? d??
        if (text.toLowerCase().startsWith('chuy???n') && text.toLowerCase().includes('s??? d?? cho')) {
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
                            chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                            return;
                        }
                    }
                    for (let i = 0; i < keysChuyenDo.length; i++) {
                        const key = keysChuyenDo[i];
                        const fromId = key.replace('queue_chuyen_do_', '');
                        const expire = await getTtl(key);
                        if (parseInt(expire) > 2) {
                            const fromName = await getTcvNameFromTcvId(fromId); 
                            chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                            return;
                        }
                    }
                    for (let i = 0; i < keysChuyenRuong.length; i++) {
                        const key = keysChuyenRuong[i];
                        const fromId = key.replace('queue_chuyen_ruong_', '');
                        const expire = await getTtl(key);
                        if (parseInt(expire) > 2) {
                            const fromName = await getTcvNameFromTcvId(fromId); 
                            chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                            return;
                        }
                    }
                    for (let i = 0; i < keysVaoDong.length; i++) {
                        const key = keysVaoDong[i];
                        const fromId = key.replace('queue_vao_dong_', '');
                        const expire = await getTtl(key);
                        if (parseInt(expire) > 2) {
                            const fromName = await getTcvNameFromTcvId(fromId); 
                            chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                            return;
                        }
                    }
                    for (let i = 0; i < keysVaoDuocVien.length; i++) {
                        const key = keysVaoDuocVien[i];
                        const fromId = key.replace('queue_vao_duoc_vien_', '');
                        const expire = await getTtl(key);
                        if (parseInt(expire) > 2) {
                            const fromName = await getTcvNameFromTcvId(fromId); 
                            chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                            return;
                        }
                    }
                } catch (error) { console.log(error); }
                
                var sl = args[1];
                if (sl.endsWith('kb') || sl.endsWith('mb')) {
                    chat(`${fromName} - S??? d?? kh??ng h???p l???.`);
                    return;
                }
                
                sl = convertSoDu(sl);
                if (sl < 0) {
                    chat(`${fromName} - S??? d?? kh??ng h???p l???.`);
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
                    chat(`${fromName} - ID kh??ng h???p l???.`);
                    return;
                }
                if (memberId === tcvId) {
                    chat(`${fromName} - ID kh??ng h???p l???.`);
                    return;
                }
                chuyenRuong(tcvId, cboxId, memberId, parseInt(sl)).then();
                return;
        }

        //chuy???n ?????
        /*if (text.toLowerCase().startsWith('chuy???n') && args[2].toLowerCase() != 'cho' && !text.toLowerCase().includes('b???c') && !text.toLowerCase().includes('s??? d?? cho') && !text.toLowerCase().includes('kb') && !text.toLowerCase().includes('mb'))  {
                const basic = await getUserInfo(tcvId);
                var fromName = basic.name;
                if (args.length == 6 && text.toLowerCase().includes('id' + ' ')) {
                    var toId = args[args.length - 1];
                    if (isNaN(toId)) {
                        chat(`${fromName} - ID kh??ng h???p l???.`);
                        return;
                    }
                } else
                    if (args.length == 6 && text.toLowerCase().includes('cho' + ' ')) {
                        var toId = args[args.length - 2];
                        if (isNaN(toId)) {
                            chat(`${fromName} - ID kh??ng h???p l???.`);
                            return;
                        }
                    } else
                        if (args.length > 6 && text.toLowerCase().includes('id' + ' ')) {
                            var toId = args[args.length - 1];
                            if (isNaN(toId)) {
                                chat(`${fromName} - ID kh??ng h???p l???.`);
                                return;
                            }
                        } else
                            if (args.length > 6 && text.toLowerCase().includes('cho' + ' ')) {
                                var toId = args[args.length - 2];
                                if (isNaN(toId)) {
                                    chat(`${fromName} - ID kh??ng h???p l???.`);
                                    return;
                                }
                            }
                
                var sl = args[1];
                
                if (isNaN(sl)) {
                    //chat(`${fromName} - S??? l?????ng v???t ph???m kh??ng ????ng.`);
                    return;
                }
                //if (isNaN(toId)) {
                //    chat(`${fromName} - ID kh??ng h???p l???.`);
                //    return;
                //}
                await chuyenDoFromUser(tcvId, toId, text);
                return;
        }*/
        
        if (msg.toLowerCase().includes('hi tini') || msg.toLowerCase().includes('tini ??i')) {
            const basic = await getUserInfo(tcvId);
            const fromName = basic.name;
            chat(`${fromName} [img]https://cbox.im/i/R50RI.png[/img]`);
        }

        if (text.toLowerCase().includes('ta l?? ai') || text.toLowerCase().includes('t??i l?? ai') || text.toLowerCase().includes('m??nh l?? ai')) {
            const basic = await getUserInfo(tcvId);
            const fromName = basic.name;
            chat(`${fromName} l?? con s??u ki???n ???t ?? gi???a d??ng ?????i x?? ?????y /buon`);
        }

        if (text.toLowerCase().includes('s??i l?? ai')) {
            const basic = await getUserInfo(132301);
            const fromName = basic.name;
            chat(`${fromName} l?? h???c th??? ph??a sau m??n /denm`);
        }

        if (text.toLowerCase().includes('di??u l?? ai')) {
            const basic = await getUserInfo(150858);
            const fromName = basic.name;
            chat(`${fromName} l?? tr??m ??n xin gi??? ngh??o gi??? kh??? c???a bang /thodai gi???u sau l??ng l?? kh???i t??i s???n k???t x?? nh???m ??m m??u l???t ????? CM /denm`);
        }

        /*if (msg.toLowerCase().startsWith('mai l?? ai')) {
            const basic = await getUserInfo(45217);
            const toName = basic.name;
            chat(`${toName} l?? tr??m Yasuo c???a V?? C???c Ma T??ng /sn`);
        }*/

        if (msg.toLowerCase().startsWith('tpl l?? g??') || msg.toLowerCase().startsWith('ti??n ph??? l???nh l?? g??') || msg.toLowerCase().startsWith('v???t ph???m ti??n ph??? l???nh')) {
            chat('Ti??n Ph??? L???nh l?? ch??a kh??a ????? v??o ?????ng Thi??n tu luy???n/?????t ph??.');
        }

        if (msg.toLowerCase().startsWith('tnl l?? g??') || msg.toLowerCase().startsWith('th???n n??ng l???nh l?? g??') || msg.toLowerCase().startsWith('v???t ph???m th???n n??ng l???nh')) {
            chat('Th???n N??ng L???nh l?? ch??a kh??a ????? v??o D?????c Vi??n M??n Ph??i tr???ng linh th???o.');
        }

        //check dv
        if (msg.toLowerCase().startsWith('check gi?? c???')) {
            fetchDuocVien(true);
            return;
        }

        if (msg.toLowerCase().startsWith('check dv')) {
            fetchDuocVien(false);
            return;
        }

        if (msg.toLowerCase().startsWith('check thu ho???ch')) {
            fetchThuHoach();
            return;
        }

        if (msg.toLowerCase().startsWith('check c??? c?? nh??n')) {
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
        if (text.toLowerCase().startsWith('check b???c')) {
            await checkBac(tcvId); 
            return 1;
        } 

        /*if (text.toLowerCase().startsWith('info')) {
            const userid = args[1];
            await checkInfo(userid);
            return 1;
        }*/

        //check b???o kh???
        if (text.toLowerCase().startsWith('check item')) {
            checkBaoKho(msg.split("item ")[1].trim().replace(/\s\s+/g, " "), tcvName).then(() => {
            });
            return;
        }

        //c???ng b???c
        if (text.toLowerCase().startsWith('c???ng') && text.toLowerCase().includes('cho') && ADMIN.includes(tcvId)) {
            if (args[2].toLowerCase() == 'cho' || args[2].toLowerCase() == 'b???c') {
                var sl = args[1];
                sl = convertBac(sl);
                //let memberId = 0;
                const basic = await getUserInfo(tcvId);
                var fromName = basic.name;
                //var memberId = args[args.length - 2];
                if (args.length == 6 && args[3].toLowerCase() == 'cho' && args[4].toLowerCase() == 'id') {
                    if (args[2].toLowerCase() == 'b???c') {
                        var memberId = args[args.length - 1];
                        //memberId = text.split('id ')[1];
                    } else {
                        chat('S??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
                if (args.length == 5 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() == 'id') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        var memberId = args[args.length - 1];
                        //memberId = text.split('id ')[1];
                    } else {
                        chat('S??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
                if (args.length == 6 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() == 'id') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        var memberId = args[args.length - 1];
                        //memberId = text.split('id ')[1];
                    } else {
                        chat('S??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
                if (args.length == 5 && args[3].toLowerCase() == 'cho') {
                    if (args[2].toLowerCase() == 'b???c') {
                        var memberId = args[args.length - 2];
                        //memberId = text.split('cho ')[1];
                    } else {
                        chat('S??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
                if (args.length == 6 && args[3].toLowerCase() == 'cho' && args[4].toLowerCase() != 'id') {
                    if (args[2].toLowerCase() == 'b???c') {
                        var memberId = args[args.length - 2];
                        //memberId = text.split('cho ')[1];
                    } else {
                        chat('S??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
                if (args.length == 5 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() != 'id') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        //memberId = text.split('cho ')[1];
                        var memberId = args[args.length - 2];
                    } else {
                        chat('S??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
                if (args.length == 4 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() != 'id' && args[4] != '') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        //memberid = args[3];
                        var memberId = args[args.length - 1];
                        //var memberid = text.split('cho ')[1];
                    } else {
                        chat('s??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
            }
            if (isNaN(memberId)) {
                chat(`${fromName} - ID kh??ng h???p l???.`);
                return;
            }
            if (memberId == undefined || memberId == 'undefined') {
                chat('ID kh??ng h???p l???.');
                return;
            }
            await napRuong(tcvId, memberId, parseInt(sl));
        }

        //tr??? b???c
        if (text.toLowerCase().startsWith('tr???') && text.toLowerCase().includes('cho') && ADMIN.includes(tcvId)) {
            if (args[2].toLowerCase() == 'cho' || args[2].toLowerCase() == 'b???c') {
                var sl = args[1];
                sl = convertBac(sl);
                //let memberId = 0;
                const basic = await getUserInfo(tcvId);
                var fromName = basic.name;
                //var memberId = args[args.length - 2];
                if (args.length == 6 && args[3].toLowerCase() == 'cho' && args[4].toLowerCase() == 'id') {
                    if (args[2].toLowerCase() == 'b???c') {
                        var memberId = args[args.length - 1];
                        //memberId = text.split('id ')[1];
                    } else {
                        chat('S??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
                if (args.length == 5 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() == 'id') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        var memberId = args[args.length - 1];
                        //memberId = text.split('id ')[1];
                    } else {
                        chat('S??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
                if (args.length == 6 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() == 'id') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        var memberId = args[args.length - 1];
                        //memberId = text.split('id ')[1];
                    } else {
                        chat('S??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
                if (args.length == 5 && args[3].toLowerCase() == 'cho') {
                    if (args[2].toLowerCase() == 'b???c') {
                        var memberId = args[args.length - 2];
                        //memberId = text.split('cho ')[1];
                    } else {
                        chat('S??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
                if (args.length == 6 && args[3].toLowerCase() == 'cho' && args[4].toLowerCase() != 'id') {
                    if (args[2].toLowerCase() == 'b???c') {
                        var memberId = args[args.length - 2];
                        //memberId = text.split('cho ')[1];
                    } else {
                        chat('S??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
                if (args.length == 5 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() != 'id') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        //memberId = text.split('cho ')[1];
                        var memberId = args[args.length - 2];
                    } else {
                        chat('S??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
                if (args.length == 4 && args[2].toLowerCase() == 'cho' && args[3].toLowerCase() != 'id' && args[4] != '') {
                    if (args[1].toLowerCase().endsWith('kb') || args[1].toLowerCase().endsWith('mb') || args[1].toLowerCase().endsWith('b')) {
                        //memberid = args[3];
                        var memberId = args[args.length - 1];
                        //var memberid = text.split('cho ')[1];
                    } else {
                        chat('s??? b???c kh??ng h???p l???.');
                        return;
                    }
                }
            }
            if (isNaN(memberId)) {
                chat(`${fromName} - ID kh??ng h???p l???.`);
                return;
            }
            if (memberId == undefined || memberId == 'undefined') {
                chat('ID kh??ng h???p l???.');
                return;
            }
            await napRuong2(tcvId, memberId, parseInt(-sl));
        }

        //duy???t all
        if (msg.toLowerCase().startsWith('duy???t all')) {
           if ((DUYET_IDS.includes(tcvId) || ADMIN.includes(tcvId))) {
               await duyetAll(tcvId).then();
               return 1;
           }

            chat('Ch??? QTV m???i th???c hi???n ???????c ch???c n??ng n??y.');
           //pmCbox(cboxId, "B???n kh??ng c?? duy???t /tat");
           return 1;
        }

        //duyet mem
        if (msg.toLowerCase().startsWith('duy???t ????n') && args.length === 3) {
           if ((DUYET_IDS.includes(tcvId) || ADMIN.includes(tcvId))) {
               if (!is_numeric(args[2])) {
                   return;
               }
               duyetMem(args[2], tcvId).then();
               return 1;
           }

            chat('Ch??? QTV m???i th???c hi???n ???????c ch???c n??ng n??y.');
           //pmCbox(cboxId, "B???n kh??ng c?? duy???t /tat");
           return 1;
        }

        //duy???t id
        if (msg.toLowerCase().startsWith('duy???t id') && args.length === 3) {
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
                        chat("C?? l???i x???y ra!"); 
                    }
                );
           } else {
                chat('Ch??? QTV m???i th???c hi???n ???????c ch???c n??ng n??y.');
                //pmCbox(cboxId, "B???n kh??ng c?? duy???t /tat");
                return 1;
           } 
        }

        if (msg.toLowerCase().startsWith('duy???t c??c ????n')) {
            if ((DUYET_IDS.includes(tcvId) || ADMIN.includes(tcvId)) && args.length > 3) {
                duyetNhieu(msg, tcvId).then();
                return 1;
            }
            chat('Ch??? QTV m???i th???c hi???n ???????c ch???c n??ng n??y.');
            return;
        }

        //t??? ch???i duy???t
        if (msg.toLowerCase().startsWith('t??? ch???i ????n') && args.length === 4) {
           if ((DUYET_IDS.includes(tcvId) || ADMIN.includes(tcvId))) {
               if (!is_numeric(args[3])) {
                   return;
               }
               tuChoiMem(args[3], tcvId).then();
               return 1;
           }

            chat('Ch??? QTV m???i th???c hi???n ???????c ch???c n??ng n??y.');
           //pmCbox(cboxId, "B???n kh??ng c?? duy???t /tat");
           return 1;
        }

        if (msg.toLowerCase().startsWith('t??? ch???i c??c ????n')) {
            if ((DUYET_IDS.includes(tcvId) || ADMIN.includes(tcvId)) && args.length > 3) {
                tuChoiNhieu(msg, tcvId).then();
                return 1;
            }
            chat('Ch??? QTV m???i th???c hi???n ???????c ch???c n??ng n??y.');
            return;
        }

        //ban
        //console.log(text);
        if ((text.toLowerCase().startsWith('cho') && text.toLowerCase().includes('ra ?????o') && (ADMIN.includes(tcvId) || CHUYEN_DO_IDS.includes(tcvId)))) {
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

            if (text.includes('ph??t')) {
                time = text.split('ra ?????o ')[1].split(' ph??t');
            }

            if (memberId == 132301) {
                chat(`${toName} qu?? m???nh, kh??ng ban ???????c /thodai`);
                return;
            }

            await camNgon(memberId, time, tcvName, tcvId);
        }

        //b??? quan
        if (text.toLowerCase().startsWith('cho') && text.toLowerCase().includes('b??? quan') && ADMIN.includes(tcvId)) {
            let time = getRandomInteger(1, 120);
            let memberId = 0;
            const basic = await getUserInfo(tcvId);
            const toName = basic.name;
            let isIdBan = !isNaN(args[1]);
            if (isIdBan) {
                if (args.length == 4) {
                    memberId = text.split('cho ')[1].split('b???')[0];
                    time = getRandomInteger(1, 120);
                }
                if (args.length == 5) {
                    memberId = text.split('cho ')[1].split('b???')[0];
                    time = args[4];
                    if (time.endsWith('p')) {
                        time = time.replace('p', '');
                        time *= 1;
                    }
                }
                if (args.length > 5) {
                    memberId = text.split('cho ')[1].split('b???')[0];
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

            if (text.includes('ph??t')) {
                time = text.split('b??? quan ')[1].split(' ph??t');
            }

            if (memberId == 132301) {
                chat(`${toName} qu?? m???nh, kh??ng ph???t ???????c /thodai`);
                return;
            }

            await beQuan(memberId, time, tcvName, tcvId);
        }
        
        //update b???o kh???
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

        if (text.toLowerCase().startsWith('set ??i???m')) {
            const itemName = text.replace('set ??i???m ', '').trim();
            //chat(`??ang ?????t dch cho: [b]${cap(itemName, false)}[/b]....`);
            searchPk(itemName, tcvName).then();
            return;
        }

        /*if (text.toLowerCase().startsWith('set cp')) {
            const itemName = text.replace('set cp ', '').trim();
            //chat(`??ang ?????t dch cho: [b]${cap(itemName, false)}[/b]....`);
            searchCp(itemName, tcvName).then();
            return;
        }*/

        if (text.toLowerCase().startsWith('set ch???c') && text.toLowerCase().includes('cho')) {
            if (ADMIN.includes(tcvId)) {
                const chuc = text.split('ch???c ')[1].split(' cho')[0];
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
                    chat('ID kh??ng h???p l???.');
                    return;
                }
                //const memberId = args[args.length - 1];
                changeChucVu(tcvId, chuc, memberId).then(async () => {
                    //chat('Done!');
                    await resetMember(memberId);
                });
                return;
            }
            chat('Ch??? QTV m???i th???c hi???n ???????c ch???c n??ng n??y.');
            //pmCbox(cboxId, "B???n kh??ng c?? quy???n set ch???c /tat");
            return;
        }

        //v??o ?????ng
        if (text.toLowerCase().startsWith('s??? d???ng ti??n ph??? l???nh')) {
            
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
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                        return;
                    }
                }
                for (let i = 0; i < keysChuyenDo.length; i++) {
                    const key = keysChuyenDo[i];
                    const fromId = key.replace('queue_chuyen_do_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                        return;
                    }
                }
                for (let i = 0; i < keysChuyenRuong.length; i++) {
                    const key = keysChuyenRuong[i];
                    const fromId = key.replace('queue_chuyen_ruong_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                        return;
                    }
                }
                for (let i = 0; i < keysVaoDong.length; i++) {
                    const key = keysVaoDong[i];
                    const fromId = key.replace('queue_vao_dong_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                        return;
                    }
                }
                for (let i = 0; i < keysVaoDuocVien.length; i++) {
                    const key = keysVaoDuocVien[i];
                    const fromId = key.replace('queue_vao_duoc_vien_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
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
                        chat('ID kh??ng h???p l???.');
                        return;
                    }
                    axios.get(`https://soi-tcvtool.xyz/truyencv/member/${toId}`).then(
                        response => { 
                            const name = response.data.name;
                            const bp = response.data.bang_phai; 
                            if (name === '') {
                                chat(`Th??nh vi??n ID: ${toId} kh??ng t???n t???i.`);
                                return;
                            }
                            if (name !== '' && bp === 'Ch??a gia nh???p bang ph??i') {
                                chat(`Th??nh vi??n ID: ${toId} kh??ng c?? trong bang.`);
                                return;
                            }
                            if (name !== '' && bp !== 'V?? C???c Ma T??ng') {
                                chat(`Th??nh vi??n ID: ${toId} kh??ng c?? trong bang.`);
                                return;
                            }
                            if (name !== '' && bp === 'V?? C???c Ma T??ng') {
                                vaoDongConfirmed(tcvId, toId);
                                return 1;
                            }
                        }
                        )
                        .catch(error => {
                            chat("C?? l???i x???y ra!"); 
                        }
                    ); 
                } else
                    if (args.length > 5 && args[5].toLowerCase() == 'cho' && args[6].toLowerCase() != 'id') {
                        const toId = args[args.length - 2];
                        if (isNaN(toId)) {
                            chat('ID kh??ng h???p l???.');
                            return;
                        }
                        axios.get(`https://soi-tcvtool.xyz/truyencv/member/${toId}`).then(
                            response => { 
                                const name = response.data.name;
                                const bp = response.data.bang_phai; 
                                if (name === '') {
                                    chat(`Th??nh vi??n ID: ${toId} kh??ng t???n t???i.`);
                                    return;
                                }
                                if (name !== '' && bp === 'Ch??a gia nh???p bang ph??i') {
                                    chat(`Th??nh vi??n ID: ${toId} kh??ng c?? trong bang.`);
                                    return;
                                }
                                if (name !== '' && bp !== 'V?? C???c Ma T??ng') {
                                    chat(`Th??nh vi??n ID: ${toId} kh??ng c?? trong bang.`);
                                    return;
                                }
                                if (name !== '' && bp === 'V?? C???c Ma T??ng') {
                                    vaoDongConfirmed(tcvId, toId);
                                    return 1;
                                }
                            }
                            )
                            .catch(error => {
                                chat("C?? l???i x???y ra!"); 
                            }
                        ); 
                    } 
        }
        
        //v??o d?????c vi??n
        if (text.toLowerCase().startsWith('s??? d???ng th???n n??ng l???nh')) {
            
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
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                        return;
                    }
                }
                for (let i = 0; i < keysChuyenDo.length; i++) {
                    const key = keysChuyenDo[i];
                    const fromId = key.replace('queue_chuyen_do_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                        return;
                    }
                }
                for (let i = 0; i < keysChuyenRuong.length; i++) {
                    const key = keysChuyenRuong[i];
                    const fromId = key.replace('queue_chuyen_ruong_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                        return;
                    }
                }
                for (let i = 0; i < keysVaoDong.length; i++) {
                    const key = keysVaoDong[i];
                    const fromId = key.replace('queue_vao_dong_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                        return;
                    }
                }
                for (let i = 0; i < keysVaoDuocVien.length; i++) {
                    const key = keysVaoDuocVien[i];
                    const fromId = key.replace('queue_vao_duoc_vien_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
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
                        chat('ID kh??ng h???p l???.');
                        return;
                    }
                    await vaoDuocVienConfirmed(tcvId, toId);
                    return 1;
                } else
                    if (args.length > 5 && args[5].toLowerCase() == 'cho' && args[6].toLowerCase() != 'id') {
                        const toId = args[args.length - 2];
                        if (isNaN(toId)) {
                            chat('ID kh??ng h???p l???.');
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

            //V??o ?????ng
            const vaoDongKey = `queue_vao_dong_${tcvId}`;
            const vaoDongData = await getItem(vaoDongKey);
            if (vaoDongData !== null && vaoDongData !== '') {
                const jsonData = JSON.parse(vaoDongData);
                const {tcvId, toId} = jsonData;
                await delKey(`queue_vao_dong_${tcvId}`);
                await vaoDong(tcvId, toId); 
                return;
            }

            //v??o d?????c vi??n
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
             //pmCbox(cboxId, 'X??c nh???n mu???n /tat');
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
                chat(`${tcvName} - ???? h???y.`);
                return;
            }
        }
        return;
    }

    // Chuyen do (admin / TL)
    if (args[0] === ".cd" || args[0] === ".chuyendo") {
        if (!ADMIN.includes(tcvId) && !CHUYEN_DO_IDS.includes(tcvId)) {
            chat("Ch??? QTV m???i th???c hi???n ???????c ch???c n??ng n??y.");
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
                        chat(`Th??nh vi??n ID: ${toId} kh??ng t???n t???i.`);
                        return;
                    }
                    if (name !== '' && bp === 'Ch??a gia nh???p bang ph??i') {
                        chat(`Th??nh vi??n ID: ${toId} kh??ng c?? trong bang.`);
                        return;
                    }
                    if (name !== '' && bp !== 'V?? C???c Ma T??ng') {
                        chat(`Th??nh vi??n ID: ${toId} kh??ng c?? trong bang.`);
                        return;
                    }
                    if (name !== '' && bp === 'V?? C???c Ma T??ng') {
                        chuyenDoFromBot(msg, args, tcvId);  
                    }
                })
                .catch(error => {
                    chat('Kh??ng nh???n ???????c ph???n h???i t??? server.');
                    chat('???? t???m d???ng bot 1 ph??t /bee109');
                }); 
        } else {
            await chuyenDoFromAdmin(args, msg);
        }
        return 1;
    }

    // Them quyen
    if (args[0] === '.quyen') {
        // Hi???n t???i ??ang set quy???n c???ng trong modules/constant.js
        // C?? th??? th???c hi???n set m???m trong redis

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
                pmCbox(cboxId, "Cho ph??p chuy???n b???c kh??ng gi???i h???n. C?? ph??p: [b].chuyenbac ID_NHAN SO_LUONG[/b]")
                return;
            }

            if (is_numeric(args[1]) && is_numeric(args[2])) {
                const toId = args[1];
                const amount = args[2];
                chuyenBac(tcvId, args[1], args[2]).then(async () => {
                    let toName = await getTcvNameFromTcvId(toId);
                    chat(`???? chuy???n ${formatBac(amount)} b???c cho ${toName} ([url=https://tutien.net/member/${toId}]${toId}[/url])`);
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
        /*if (args.length === 4 && args[3] === 'b???c') {
            if (args[2].endsWith('kb') || args[2].endsWith('mb')) {
                chat('S??? b???c kh??ng h???p l???.');
                return;
            }
            await chuyenBacFromUser(tcvId, cboxId, args[1], convertSoDu(args[2]));
            return;
        }

        if (msg.toLowerCase().includes('b???c') && args[2].toLowerCase().includes('k') || args[2].toLowerCase().includes('m') || args[2].toLowerCase().includes('b')) {
            //chat('Kh??ng chuy???n l???n b???c v???i ????? /tat');
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
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                        return;
                    }
                }
                for (let i = 0; i < keysChuyenDo.length; i++) {
                    const key = keysChuyenDo[i];
                    const fromId = key.replace('queue_chuyen_do_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                        return;
                    }
                }
                for (let i = 0; i < keysChuyenRuong.length; i++) {
                    const key = keysChuyenRuong[i];
                    const fromId = key.replace('queue_chuyen_ruong_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                        return;
                    }
                }
                for (let i = 0; i < keysVaoDong.length; i++) {
                    const key = keysVaoDong[i];
                    const fromId = key.replace('queue_vao_dong_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                        return;
                    }
                }
                for (let i = 0; i < keysVaoDuocVien.length; i++) {
                    const key = keysVaoDuocVien[i];
                    const fromId = key.replace('queue_vao_duoc_vien_', '');
                    const expire = await getTtl(key);
                    if (parseInt(expire) > 2) {
                        const fromName = await getTcvNameFromTcvId(fromId); 
                        chat(`${fromName} - Ho??n t???t giao d???ch ????? ti???p t???c.`);
                        return;
                    }
                }
        } catch (error) { console.log(error); }

        await chuyenDoFromUser(tcvId, args, msg);
        return;
    }

    // Chuyen ruong (member)
    /*if (args[0] === '.cr' || args[0] === '.chuyenruong') {
        // [".cr", "300200", "200 b???c"]
        if (args.length === 4 && args[3].toLowerCase() === 'b???c') {
            if (args[2].endsWith('kb') || args[2].endsWith('mb')) {
                chat('S??? d?? kh??ng h???p l???.');
                return;
            }
                    //sl = convertSoDu(sl);
            chuyenRuong(tcvId, cboxId, args[1], convertSoDu(args[2])).then();
            return;
        }
        return;
    }*/

    /*if (args[0].toLowerCase() === 'chuy???n' && args[2].toLowerCase() === 's???' && args[3].toLowerCase() === 'd??' && args[4].toLowerCase() === 'cho') {
        if (args[1].endsWith('kb') || args[1].endsWith('mb')) {
                        chat('S??? d?? kh??ng h???p l???.');
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

        if ((args[1] === 'n???p' || args[1] === 'nap') && ADMIN.includes(tcvId)) {
            await napRuong(tcvId, args);
            return;
        }

        if (args[1] == 'xoa' || args[1] == 'x??a') {
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

        chat('Ch??? QTV m???i th???c hi???n ???????c ch???c n??ng n??y.');
        //pmCbox(cboxId, "B???n kh??ng c?? quy???n set ch???c /tat");
        return;
    }*/

    // Cong cong hien
    if (args[0] === '.cch') {
        if (ADMIN.includes(tcvId) && args.length === 3) {
            congCongHien(args, cboxId).then();
            return;
        }
        chat('Ch??? QTV m???i th???c hi???n ???????c ch???c n??ng n??y.');
        //pmCbox(cboxId, "B???n kh??ng c?? quy???n c???ng c???ng hi???n /tat");
        return;
    }

    // Tru cong hien
    /*if (args[0] === '.cn') {
        if (ADMIN.includes(tcvId) && args.length === 3) {
            camNgon(args, tcvName, tcvId).then();
            return;
        }

        pmCbox(cboxId, "B???n kh??ng c?? quy???n c???m ng??n /tat");
        return;
    }*/

    /*if (args[0] === '.cb') {
        checkBank(tcvId).then(r => {
            chat('B???n ??ang c??: ' + r + " b???c")
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
            chat('Ng??n qu??? ??ang c??: ' + r + " b???c")
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

        pmCbox(cboxId, "B???n kh??ng c?? duy???t /tat");
        return 1;
    }*/

    // Set CH
    /*if (args[0] === '.setpk') {
        const itemName = msg.replace('.setpk', '').trim();
        chat(`??ang ?????t dch cho: [b]${cap(itemName, false)}[/b]....`);
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
        chat("???? s???ch s??? /denm");
        return;
    }

    if (args[0] === '.help') {
        const messages = [
            'C??c ch???c n??ng c???a bot:',
            `??? Chuy???n ?????: .c [id nh???n] [s??? l?????ng] [t??n v???t ph???m]`,
            `??? Chuy???n b???c: chuy???n [s??? l?????ng] b???c cho id [id nh???n]`,
            `??? Chuy???n s??? d??: chuy???n [s??? l?????ng] s??? d?? cho id [id nh???n]`,
            `??? Ki???m tra s??? d?? c???a b???n th??n: s??? d??`,
            `??? Xem l???ch s??? giao d???ch b???c: log b???c`,
            `??? Check v???t ph???m b???o kh???: check item [t??n vp]`,
            `??? Check ????n v??o bang: list mem`,
            `??? Duy???t mem: duy???t ????n [id ????n]`,
            //`??? Set c???ng hi???n: .setch [t??n ph??p kh??/c??ng ph??p]`,
            `??? Ki???m tra ng??n qu??? c???a bang: check bank`,
            `??? Ki???m tra b???c c???a b???n th??n: check b???c`,
            `??? Ki???m tra ????? b???n ph??p kh?? c???a b???n th??n: .cpk`,
            `??? Ki???m tra ????? b???n ph??p kh?? c???a ng?????i kh??c: .cpk [id]`,
            `??? S???a b???n ph??p kh?? c???a b???n th??n: .spk [t??n ph??p kh??] (ch??? ???????c s???a 1 v???t ph???m/1 l???n)`,
            `??? S???a b???n ph??p kh?? c???a ng?????i kh??c: .spk [id] [t??n ph??p kh??] (ch??? ???????c s???a 1 v???t ph???m/1 l???n)`,
        ];

        if (ADMIN.includes(tcvId) || CHUYEN_DO_IDS.includes(tcvId)) {
            //messages.push(`??? Chuy???n ????? 2 ID: .cd [id n???p] [id nh???n] [t??n vp]`);
        }

        if (ADMIN.includes(tcvId)) {
            //messages.push(`??? N???p b???c: [b].ruong n???p [id nh???n] [s??? l?????ng] b???c`);
            messages.push(`??? Chuy???n ????? 1 ID: .cd [id nh???n] [s??? l?????ng] [t??n vp]`);
            messages.push(`??? C???m ng??n: cho [id] ra ?????o [s??? ph??t]`);
            //messages.push(`??? C???ng c???ng hi???n: .cch [id nh???n] [s??? CH]`);
            //messages.push(`??? Ki???m tra r????ng c???a member: .show [id]`);
            //messages.push(`??? Set ch???c cho member: .chuc [id] [t??n ch???c]`);
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
        .replaceAll('??TL', '')
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
