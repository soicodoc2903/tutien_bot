import {arrayRemove, chat, getItem, pmTcv, setItem} from "../helper.js";
import {PERMISSIONS} from "./constant.js";

export async function setPermission(args, userid) {
    // .quyen 1234 chuyendo 1
    // 0      1    2        3
    const targetId = parseInt(args[1]);
    const perm = args[2];

    if (!PERMISSIONS.includes(perm)) {
        chat("Hệ thống không có quyền: [color=blue][b]" + perm + "[/b][/color]")
        return;
    }

    let ids = await getPermissionByName(perm);
    if (!ids) {
        ids = [];
    } else {
        ids = JSON.parse(ids);
    }

    const allow = parseInt(args[3]);
    if (allow && !ids.includes(targetId)) {
        ids.push(targetId);
    } else {
        ids = arrayRemove(targetId, ids);
    }

    await setPermissionByName(perm, ids);
    await setPermissionForUser(targetId, perm, allow);
}

export async function getPermissionForUser(userid) {
    const perms = await getItem('perm_user_' + userid);
    return JSON.parse(perms);
}

export async function setPermissionForUser(userid, permName, allow = 0) {
    let perms = getPermissionForUser(userid);
    if (!perms) {
        for (let i = 0; i < PERMISSIONS.length; i ++) {
            perms[PERMISSIONS[i]] = 0;
        }
    }

    perms[permName] = allow;
    return await setItem('perm_user_' + userid, JSON.stringify(perms));
}

export async function getPermissionByName(permName) {
    const perms = await getItem('perm_' + permName);
    return JSON.parse(perms);
}

export async function setPermissionByName(permName, ids) {
    await setItem('perm_' + permName, JSON.stringify(ids));
}
