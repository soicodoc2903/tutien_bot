import fetch from "node-fetch";
import cheerio from "cheerio";
import {chuyenBac} from "../modules/chuyen-bac.js";
//import {checkBac} from "../modules/member.js";
import {updateRuong} from "../modules/chuyen-do.js";
import {getItem, setExpire, setItem} from "../helper.js";
import axios from "axios";

const BAN_DAO_THU = 'Bàn Đào Thụ';
const BO_DE_THU = 'Bồ Đề Thụ';
const NGO_DONG_THU = 'Ngô Đồng Thụ';

const BAN_DAO_THU_ID = 32004;
const BO_DE_THU_ID = 35680;
const NGO_DONG_THU_ID = 40912;

const ACCOUNTS = [
  {
    id: 132301,
    cookie: 'USER=',
    type: [BO_DE_THU]
  },
  {
    id: 301356,
    cookie: 'USER=',
    type: [BAN_DAO_THU]
  }
];

const willCanhTac = (types = [], name) => {
  return types.findIndex((item) => name.includes(item)) != -1;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const fetchTienPhu = async (accountId, cookie, types) => {
  const response = await fetch("https://tutien.net/account/tu_luyen/tien_phu/", {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-US,en;q=0.9,vi;q=0.8",
      "cache-control": "max-age=0",
      "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"96\", \"Google Chrome\";v=\"96\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "cookie": cookie
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET"
  });

  const body = await response.text();
  const $ = cheerio.load(body);
  let skipCheckDangTrong = false;
 
  const linhKhiText = $('.text-muted p:first-child').text().replaceAll(',', '').split('có ')[1].split(' linh')[0];
  const linhKhi = parseInt(linhKhiText);

  // Trong
  const availableDuocDien = $('#duocdien button.btn-read');
  if (linhKhi >= 800000) {
    for (let i = 0; i < availableDuocDien.length; i++) {
      let element = $(availableDuocDien[i]);
      const name = element.text();
      if (willCanhTac(types, name)) {
        const tienqua_id = name.includes(BO_DE_THU) ? BO_DE_THU_ID :
          (name.includes(BAN_DAO_THU) ? BAN_DAO_THU_ID : NGO_DONG_THU_ID);
        console.log(accountId + " - Canh tác");
        await canhTac(accountId, tienqua_id, cookie);
      }
    }
  }
  // Thu hoach
  const thuHoachDuocDien = $('#duocdien button.btn-warning');
  if (thuHoachDuocDien.length !== 0) {
    for (let i = 0; i < thuHoachDuocDien.length; i++) {
      let element = $(thuHoachDuocDien[i]);
      const dvId = element.attr('id').replace('div_linhdien_', '');
      await thuHoach(dvId, cookie);
    }
  }

  // Dang trong
  const duocDienDangTrong = $('#duocdien button.btn-info');
  if (duocDienDangTrong.length !== 0) {
    let minCountDown = 0;
    for (let i = 0; i < duocDienDangTrong.length; i++) {
      let element = $(duocDienDangTrong[i]);
      const html = element.html();
      if (html) {
        const countdown = parseInt(html.split('data-seconds-left="')[1].split('"')[0]);
        minCountDown = (minCountDown === 0) ? countdown : (minCountDown > countdown ? countdown : minCountDown)
      }
    }

    await setItem(`${accountId}_countdown`, 1);
    await setExpire(`${accountId}_countdown`, minCountDown + 10);
  }
}

const canhTac = async (accountId, tienqua_id, cookie) => {
  const bacAmount = tienqua_id === BAN_DAO_THU_ID ? 15360 : (tienqua_id === BO_DE_THU_ID ? 30720 : 61440);
  const response = await axios.get(`https://soi-tcvtool.xyz/truyencv/member/${accountId}`);
  const amount = await response.data.tai_san;
  const currentBac = parseInt(amount);
  if (currentBac < bacAmount) {
    const bacChuyen = bacAmount - currentBac;
    await chuyenBac('AUTO', accountId, bacChuyen);
  }

  const body = 'btnCanhTac=1&tienqua_id='+tienqua_id;
  await fetch("https://tutien.net/account/tu_luyen/tien_phu/", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9,vi;q=0.8",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"96\", \"Google Chrome\";v=\"96\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      "cookie": cookie,
      "Referer": "https://tutien.net/account/tu_luyen/tien_phu/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": body,
    "method": "POST"
  });
}

const thuHoach = async (duocdien_id, cookie) => {
  const body = 'btnThuHoach=1&duocdien_id='+duocdien_id;
  const res = await fetch("https://tutien.net/account/tu_luyen/tien_phu/", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9,vi;q=0.8",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"96\", \"Google Chrome\";v=\"96\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      "cookie": cookie,
      "Referer": "https://tutien.net/account/tu_luyen/tien_phu/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    body,
    "method": "POST",
  });

   //const response = await res.text();
}

setInterval(async () => {
  let date_ob = new Date();
  // 0-23
  if (date_ob.getHours() == 3 && date_ob.getMinutes() < 30) {
    console.log('===================== ' + date_ob.toLocaleTimeString() + ' - SKIP =====================');
    return;
  }
  if (date_ob.getHours() == 2 && date_ob.getMinutes() >= 55) {
    console.log('===================== ' + date_ob.toLocaleTimeString() + ' - SKIP =====================');
    return;
  }
  console.log("================="+ date_ob.toLocaleTimeString() +"==================");
  for (let i = 0; i < ACCOUNTS.length; i++) {
    const account = ACCOUNTS[i];
    const isDangTrong = await getItem(`${account.id}_countdown`);
    // if (isDangTrong && (account.id != '243885' && account.id != '98455' && account.id != '176877')) {
    console.log(account.id, 'Check tiên phủ');
    try {
      await fetchTienPhu(account.id, account.cookie, account.type);
      await delay(2000);
    } catch (error) {
      console.log(error);
    }
  }
}, 2 * 60 * 1000); // every 2 minutes

