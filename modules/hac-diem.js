import {getItem, pmTcv, setItem, snake_case, chat, getTcvNameFromTcvId} from "../helper.js";
import {updateRuong, chuyenDoHacDiem} from "./chuyen-do.js";
import {cap, viettat} from "./viettat.js";
import axios from "axios";
const HE_THONG = 1; // Vật phẩm hệ thống, có thể chuyển về acc
const HAC_DIEM = 2; // Vật phẩm hắc điểm, chỉ có thế chuyển rương

const SELL_ITEMS = [
  {
    name: 'Thần Nông Lệnh',
    type: HAC_DIEM,
  }, 
  {
    name: 'Tạo Hóa Ngọc Diệp',
    type: HAC_DIEM,
  },
  {
    name: 'Tiên Phủ Lệnh',
    type: HAC_DIEM,
  },
  {
    name: 'Cổ Chiến Lệnh',
    type: HAC_DIEM,
  },
  {
    name: 'Tru Tiên Đan',
    type: HAC_DIEM,
  },
  {
    name: 'Uẩn Huyết Đan',
    type: HAC_DIEM,
  },
  {
    name: 'Vận Khí Đan',
    type: HAC_DIEM,
  },
  {
    name: 'Hồi Linh Đan',
    type: HAC_DIEM,
  },
];
const BUY_ITEMS = [
  'Tinh Linh CP',
  'Tử Tinh HP',
  'Túi Sủng Vật',
  'Anh Tâm Thảo',
  'Bàn Đào Quả',
  'Bái Thiếp',
  'Bồ Đề Quả',
  'Bổ Nguyên Đan',
  'Cố Thần Đan',
  'Hóa Long Thảo',
  'Hóa Nguyên Thảo',
  'Hư Không Chi Thạch',
  'Hộ Linh Trận',
  'Kim Thuổng',
  'Linh Thạch HP',
  'Linh Thạch THP',
  'Linh Thạch CP',
  'Luyện Thần Thảo',
  'Ngọc Giản Truyền Công',
  'Ngọc Tủy Chi',
  'Ngọc Tủy Linh Nhũ HP',
  'Ngọc Tủy Linh Nhũ TP',
  'Thanh Tâm Đan',
  'Thiên Linh Quả',
  'Thiên Nguyên Thảo',
  'Tinh Linh THP',
  'Trích Tinh Thảo',
  'Trúc Cơ Đan',
  'Túi Thức Ăn',
  'Tẩy Tủy Đan',
  'Tị Lôi Châu',
  'Tử Tinh TP',
  'Uẩn Kim Thảo',
  'Đê Giai Thuẫn',
  'Hồi Huyết Đan',
  'Băng Hỏa Ngọc',
  'Thời Gian Chi Thủy',
  'Túi Phân Bón',
];

export const activeShop = async (tcvId) => {
    let fromName = await getTcvNameFromTcvId(tcvId);
    
    let shopStatus = await getItem('shop_status');
    if (shopStatus == false || shopStatus == 'false' || shopStatus == null || shopStatus == "NaN" || shopStatus == NaN) {
        await setItem('shop_status', true);
        shopStatus = true;
    }
    await chat(`${fromName} - Đã mở cửa hàng.`);
}

export const inActiveShop = async (tcvId) => {
    let fromName = await getTcvNameFromTcvId(tcvId);
    
    let shopStatus = await getItem('shop_status');
    if (shopStatus == true || shopStatus == 'true' || shopStatus == null || shopStatus == "NaN" || shopStatus == NaN) {
        await setItem('shop_status', false);
        shopStatus = false;
    }
    await chat(`${fromName} - Đã đóng cửa hàng.`);
}

export async function setPrice(itemName, price) {
  const name = viettat(itemName);
  console.log(name);
  const redisKey = `hac_diem_${snake_case(name)}_price`;
  console.log(redisKey);
  await setItem(redisKey, price);
}

export async function setAmount(itemName, amount) {
  const name = viettat(itemName);
  const redisKey = `hac_diem_${snake_case(name)}_amount`;
  await setItem(redisKey, amount);
}


export async function getPrice(itemName) {
  const name = viettat(itemName);
  const redisKey = `hac_diem_${snake_case(name)}_price`;
  const price = await getItem(redisKey);
  return price ? parseInt(price) : 0;
}

export async function getAmount(itemName) {
  const name = viettat(itemName);
  const redisKey = `hac_diem_${snake_case(name)}_amount`;
  const amount = await getItem(redisKey);
  return amount ? parseInt(amount) : 0;
}

// Member mua vật phẩm
export async function buyItem(accountId, itemName, amount) {
  const accountName = await getTcvNameFromTcvId(accountId);
  const name = cap(viettat(itemName), false);
  const item = SELL_ITEMS.find((buyItem) => buyItem.name === name);
  if (!item) { // Hệ thống không thu mua ${name}
    return;
  }

  const hacDiemAmount = await getAmount(itemName);
  const price = await getPrice(itemName);

  // Chưa set giá hoặc số lượng vật phẩm
  if (!hacDiemAmount || !price) {
    // Hắc điếm không mua vật phẩm
    chat(`${accountName} - Cửa hàng không bán ${cap(name)}`);
    return;
  }

  if (hacDiemAmount < amount) {
    // Hắc điếm chỉ còn hacDiemAmount vật phẩm
    chat(`${accountName} - Cửa hàng chỉ còn lại ${hacDiemAmount} ${cap(name)}`);
    return;
  }

  const redisItem = await getItem("ruong_do_ao_" + accountId + "_bac");
  // Rương không có bạc
  if (!redisItem) {
    chat(`${accountName} - Số dư không đủ để mua.`);
    return;
  }

  const ruongItem = JSON.parse(redisItem);
  const bacAmount = parseInt(`${Object.values(ruongItem)[0]}`);
  const totalPrice = amount*price;
  if (bacAmount < totalPrice) {
    // Không đủ bạc để mua
    chat(`${accountName} - Số dư không đủ để mua.`);
    return;
  }

  if (item.type === HE_THONG) {
    // Chuyển đồ về account
    //await updateRuong(accountId, name, -1*amount);
    await chuyenDoHacDiem(name, amount, accountId);
  } else {
    // Nạp rương
    //await updateRuong(accountId, name, amount);
    if (name == 'Cổ Chiến Lệnh') {
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
        let isMuaChienLenh = await getItem(`${accountId}_${today}_${month}_muachienlenh`); 
        if (isMuaChienLenh == null || isMuaChienLenh == "NaN" || isMuaChienLenh == NaN) {
            await setItem(`${accountId}_${today}_${month}_muachienlenh`, 0);
            isMuaChienLenh = 0;
        } 
        
        let muaChienLenh = isMuaChienLenh ? parseInt(isMuaChienLenh) : 0;
        let luotMuaConLai = 20 - muaChienLenh;
        if (amount + muaChienLenh > 20) {
            chat(`${accountName} chỉ được mua 20 Cổ Chiến Lệnh trong ngày, hiện tại còn mua được ${luotMuaConLai}.`);
            return;
        } else {
            muaChienLenh += amount;
            await setItem(`${accountId}_${today}_${month}_muachienlenh`, muaChienLenh);
            await updateRuong(accountId, name, amount);
            await updateRuong(accountId, 'bạc', -1*amount*price);
            await setAmount(name, hacDiemAmount - amount);
            //await pmTcv(accountId, 'Xong!');
            const key1 = "ruong_do_ao_" + accountId + "_bac";
            let ruong = await getItem(key1);

            ruong = JSON.parse(ruong);
            const soDu = parseInt(ruong["bạc"]);
            chat(`${accountName} - Đã bán ${amount} ${cap(name)}`);
            axios({
                method: "POST",
                url: "https://soi-tcvtool.xyz/truyencv/member/add-log-bac",
                data: {
                    "tcvId": accountId,
                    "updown": "-",
                    "amount": amount*price,
                    "sodu": soDu,
                    "action": `Mua ${amount} ${cap(name)}`,
                }
            });
        }
    } else {
        updateRuong(accountId, name, amount);
        await updateRuong(accountId, 'bạc', -1*amount*price);
        await setAmount(name, hacDiemAmount - amount);
        //await pmTcv(accountId, 'Xong!');
        const key2 = "ruong_do_ao_" + accountId + "_bac";
        let ruong2 = await getItem(key2);

        ruong2 = JSON.parse(ruong2);
        const soDu2 = parseInt(ruong2["bạc"]);
        chat(`${accountName} - Đã bán ${amount} ${cap(name)}`);
        axios({
            method: "POST",
            url: "https://soi-tcvtool.xyz/truyencv/member/add-log-bac",
            data: {
                "tcvId": accountId,
                "updown": "-",
                "amount": amount*price,
                "sodu": soDu2,
                "action": `Mua ${amount} ${cap(name)}`,
            }
        });
    }
  } 
}

// Member bán vật phẩm
export async function sellItem(accountId, itemName, amount) {
  const accountName = await getTcvNameFromTcvId(accountId);
  const name = cap(viettat(itemName), false);
  const key = "ruong_do_ao_" + accountId + "_" + snake_case(name);
  const hacDiemAmount = await getAmount(itemName);
  const price = await getPrice(itemName);

  // Chưa set giá hoặc số lượng vật phẩm
  if (!hacDiemAmount || !price) {
    // Hắc điếm không mua vật phẩm
    chat(`${accountName} [img]https://cbox.im/i/R50RI.png[/img]`);
    return;
  }

  if (amount > hacDiemAmount) {
    // Hắc điếm chỉ thu mua hacDiemAmount cái
    chat(`${accountName} - Cửa hàng chỉ thu thêm ${hacDiemAmount} ${cap(name)}`);
    return;
  }

  const redisItem = await getItem(key);
  if (!redisItem) {
    // Rương không có vật phẩm
    chat(`${accountName} - Không tìm thấy log đã nộp ${amount} ${cap(name)}`);
    return;
  }

  const ruongItem = JSON.parse(redisItem);
  const itemAmount = parseInt(`${Object.values(ruongItem)[0]}`);
  if (itemAmount < amount) {
    // Không đủ vật phẩm để bán
    chat(`${accountName} - Số lượng ${cap(name)} không đủ để bán (còn ${itemAmount}).`);
    return;
  }

  await updateRuong(accountId, name, -1*amount);
  await updateRuong(accountId, 'bạc', amount*price);
  await setAmount(name, hacDiemAmount - amount);
  //await pmTcv(accountId, 'Xong!');
  const key1 = "ruong_do_ao_" + accountId + "_bac";
  let ruong = await getItem(key1);

  ruong = JSON.parse(ruong);
  const soDu = parseInt(ruong["bạc"]);
  chat(`${accountName} - Đã thu ${amount} ${cap(name)}`);
  axios({
      method: "POST",
      url: "https://soi-tcvtool.xyz/truyencv/member/add-log-bac",
      data: {
          "tcvId": accountId,
          "updown": "+",
          "amount": amount*price,
          "sodu": soDu,
          "action": `Bán ${amount} ${name}`,
      }
  });
}

export async function listBuy(accountId) {
  console.log(accountId);
  console.log(BUY_ITEMS);
  const list = [];
  for (let i = 0; i < BUY_ITEMS.length; i++) {
    const vietTat = snake_case(BUY_ITEMS[i]);
    const amount = await getAmount(BUY_ITEMS[i]);
    const price =  await getPrice(BUY_ITEMS[i]);
    if (!amount || !price) {
      continue;
    }

    list.push(`[br]✦ ${cap(BUY_ITEMS[i])} (${amount}): ${price} bạc/vp`);
  }

  const message = list.join('');
  await pmTcv(accountId, message);
}

export async function listSell(accountId) {
  const list = [];
  for (let i = 0; i < SELL_ITEMS.length; i++) {
    const item = SELL_ITEMS[i];
    const amount = await getAmount(item.name);
    const price =  await getPrice(item.name)
    if (!amount || !price) {
      continue;
    }

    list.push(`[br]✦ ${cap(item.name)} (${amount}): ${price} bạc/vp`);
  }

  const message = list.join('');
  await pmTcv(accountId, message);
}
