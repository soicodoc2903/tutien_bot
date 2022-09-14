import {chuyenBac} from "./modules/chuyen-bac.js";

import express from 'express';
import bodyParser from 'body-parser';
import {chuyenNhieuDo} from "./modules/chuyen-do.js";
import {getUserInfo} from "./modules/member.js";
import {log} from "./modules/winston.js";
const app = express();
app.use(bodyParser.urlencoded({extended: true}));

// const BaoKho = require('./modules/bao-kho');

// import { checkBaoKho } from "./modules/bao-kho";
// checkBaoKho("Thảo").then(r => console.log(r));

// import { getUserInfo } from "./modules/member";

import {fetchItemCh} from './modules/bao-kho.js'
//
 fetchItemCh().then(r => {
     console.log(r);
})

// import {chuyenDoFromAdmin} from "./modules/chuyen-do.js";
// await chuyenDoFromAdmin([ '.cd', '52780', '600600', '1 Vẫn Thiết THP' ]);
//
// const user = {
//     name: "✰ßυôи ßαиƙ✰",
//     id: "300200",
//     chucVu: "Linh Đồng",
// }
//
// const items = [
//     {name: "Tinh Thiết HP", amount: 1},
//     {name: "Tinh Thiết TP", amount: 1},
//     {name: "Tinh Thiết THP", amount: 1},
//     {name: "Tinh Thiết CP", amount: 1},
//     {name: "Vẫn Thiết HP", amount: 1},
//     {name: "Vẫn Thiết TP", amount: 1},
// ];
//
// chuyenNhieuDo(user, items).then(r => {});

// import {checkBaoKho, loginBaoKho} from "./modules/bao-kho.js";
//
// loginBaoKho().then(() => {
//     console.log("check bao kho")
//     checkBaoKho("Thảo").then((r) => {console.log(r)});
// })

// checkBaoKho("Thảo").then((r) => {console.log(r)});

// const PORT = 3000;
//
// const server = app.listen(PORT, function () {
//     console.log(`Example app listening at ${PORT}`)
// });
//
//
// app.get("/", (req, res) => {
//     console.log("Got a GET request for the homepage");
//     res.send('Hello!');
// });
//
// app.get("/user-info", (req, res) => {
//     const userid = req.query.userid;
//     getUserInfo(userid).then(r => {
//         res.contentType('json');
//         res.end(JSON.stringify(r));
//     })
// });
//
// app.post("/chuyen-bac", (req, res) => {
//     const {from, to, amount} = req.body;
//     chuyenBac(from, to, amount).then(isSuccess => {
//         if (isSuccess) {
//             res.contentType('json');
//             res.end(`{"status": 1}`);
//             log.info({from, to, amount});
//         } else {
//             res.contentType('json');
//             res.end(`{"status": 0}`);
//         }
//     });
// });
//
// app.post("/chuyen-do", (req, res) => {
//     let {user, items} = req.body;
//     user = JSON.parse(user);
//     items = JSON.parse(items);
//     chuyenNhieuDo(user, items).then(response => {
//         res.contentType('json');
//         res.end(`{"status": 1}`);
//     });
// });
