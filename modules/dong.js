import {getItem, setItem} from "../helper";

const add_dong_thien = async (cookie) => {
    let cookies = await getItem("cookie_dong") || "[]";
    cookies = JSON.parse(cookies);
    cookies.push(cookie);
    await setItem("cookie_dong", JSON.stringify(cookies));
}

const list_dong_thien = async () => {
    let cookies = await getItem("cookie_dong") || "[]";
    cookies = JSON.parse(cookies);
    const res = [];
    for (let i = 0; i < cookies.length; i ++) {
        res.push("✦ [" + (i+1) + "] " + cookies[i]);
    }
    return res.join("[br]")
}

const remove_dong_thien = async (index) => {
    let cookies = await getItem("cookie_dong") || "[]";
    cookies = JSON.parse(cookies);
    cookies.splice(index - 1, 1);
    await setItem("cookie_dong", JSON.stringify(cookies));
}