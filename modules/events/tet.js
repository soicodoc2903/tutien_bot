import {chat, getItem, setItem} from '../../helper.js';
import {updateRuong} from "../chuyen-do.js";

// // 25, 26, 27, 28, 29
// // 30
// // 31
// // 1-2-3
// const rewardAmount = [

// ]

// const itemTypes = [
//     'bạc',
//     'linh thạch hp',
//     'tẩy tủy đan',
//     'trúc cơ đan',
//     'bổ nguyên đan',
//     'bổ anh đan',
//     'hóa nguyên đan',
//     'luyện thần đan',
//     'nhân sâm vạn năm',
//     'ngọc tuyết linh sâm',
//     'la bàn',
//     'quy giáp',
//     'bộ tàng cao'
// ]

const getRndInteger = (min, max) => {
  return Math.floor(Math.random() * (max - min) ) + min;
}
const toTitleCase = (phrase) => {
  return phrase
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// const items = [
//     'Tẩy Tủy Đan',
//     'Bổ Nguyên Dan',
//     'Bổ Anh Dan',
//     'Hóa Nguyên Dan',
//     'Luyện Thần Dan',
//     'Linh Thạch HP',
//     'Ngọc Tuyết Linh Sâm',
//     'Tàng Cao',
//     'bạc'
// ];

export const nhanLiXi = async (tcvId, cboxId, tcvName) => {

    const today = new Date().getDay();
    const isNhanLiXi = await getItem(`${tcvId}_${today}_lixi`);
//   if (isNhanLiXi) {
        chat('[br][center][b][color=red]Chúc Mừng Năm Mới /phao [/color][/b][/center]');
        return;
  //  }

    const isLtExists = await getItem('event_lt');
    const randomLt = getRndInteger(0,10);
    const gotLt = randomLt == 5;
    await setItem(`${tcvId}_${today}_lixi`, 1);
    const bacAmount = [88888,99999,89898,98989,96969,96969,86868,88888,99999,89898,98989,96969,86868,112022,202200,999999,888888][getRndInteger(0,17)];
    if (!isLtExists && gotLt) {
        chat('[br][center][b][color=red]Chúc Mừng Năm Mới /phao [/color][/b][/center][br][center]Bạn nhận được [b][color=blue] 1 Linh Tuyền và '+bacAmount+' bạc[/color][/b] từ [b][color=red]Bao Lì Xì[/color][/b][/center]');
        await setItem('event_lt', 1);
        await updateRuong(tcvId, 'Linh Tuyền', 1, true);
        await updateRuong(tcvId, 'bạc', bacAmount, true);
        return;
    }


    chat('[br][center][b][color=red]Chúc Mừng Năm Mới /phao [/color][/b][/center][br][center]Bạn nhận được [b][color=blue]'+bacAmount+' bạc[/color][/b] từ [b][color=red]Bao Lì Xì[/color][/b][/center]');
    await updateRuong(tcvId, 'bạc', bacAmount, true);


    // const item = items[getRndInteger(0, items.length)];
    // if (item === 'Ngọc Tuyết Linh Sâm') {
    //     chat('[br][center][b][color=red]Chúc Mừng Năm Mới /phao [/color][/b][/center][br][center]Bạn nhận được [b][color=blue]1 Ngọc Tuyết Linh Sâm[/color][/b] từ [b][color=red]Bao Lì Xì[/color][/b][/center]');
    //     await updateRuong(tcvId, item, 1, true);
    // } else if (item === 'bạc') {
    //     // const amount = [11111,22222,33333,44444,55555,66666,77777,88888,99999][getRndInteger(0,9)];
    //     const amount = [88888,99999,112022,202200][getRndInteger(0,4)];
    //     chat('[br][center][b][color=red]Chúc Mừng Năm Mới /phao [/color][/b][/center][br][center]Bạn nhận được [b][color=blue]'+amount+' bạc[/color][/b] từ [b][color=red]Bao Lì Xì[/color][/b][/center]');
    //     await updateRuong(tcvId, item, amount, true);
    // } else if (item === 'Tàng Cao') {
    //     chat('[br][center][b][color=red]Chúc Mừng Năm Mới /phao [/color][/b][/center][br][center]Bạn nhận được [b][color=blue]1 Bộ Tàng Cao[/color][/b] từ [b][color=red]Bao Lì Xì[/color][/b][/center]');
    //     await updateRuong(tcvId, 'La Bàn', 1, true);
    //     await updateRuong(tcvId, 'Quy Giáp', 1, true);
    // } else if (['Bổ Anh Dan','Hóa Nguyên Dan','Luyện Thần Dan'].includes(item)) {
    //     const amount = [5,10,15][getRndInteger(0,3)];
    //     chat('[br][center][b][color=red]Chúc Mừng Năm Mới /phao [/color][/b][/center][br][center]Bạn nhận được [b][color=blue]'+amount+' ' + item +'[/color][/b] từ [b][color=red]Bao Lì Xì[/color][/b][/center]');
    //     await updateRuong(tcvId, item, amount, true);
    // } else {
    //     chat('[br][center][b][color=red]Chúc Mừng Năm Mới /phao [/color][/b][/center][br][center]Bạn nhận được [b][color=blue] 99 ' + item + '[/color][/b] từ [b][color=red]Bao Lì Xì[/color][/b][/center]');
    //     await updateRuong(tcvId, item, 99, true);
    // }
}
