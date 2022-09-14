export const BANK_COOKIE = "USER=";

export const CM_COOKIE = "PHPSESSID=; USER=; reada=10";
export const BOT_ID = "";
export const BOT_URL = "";
export const CHUYEN_DO_IDS = [132301,666888,230983,249237,150858,308555];
export const ADMIN = [132301,666888,150858];
export const MOVE_IDS = [608485,132301,150858];
export const DUYET_IDS = [230983,308555,608485,230833];
export const KICK_IDS = [];

// Dùng cho lệnh move
export const USER_COOKIES = [
    {
        user_id: ,
        cookie: 'USER='
    },
    {
        user_id: ,
        cookie: 'USER='
    },
    {
        user_id: ,
        cookie: 'USER='
    },
];

// Log nop do
export const ITEM_EXPIRE_IN = 30 * 60; // 30p
export const INTERVAL_CHECK_LOG = 10;

// QUEUE
export const QUEUE_MAX_RETRY = 5;

// Chuyen Do
export const CD_PRICE = 0;

// Chuyen bac
export const MAX_CHUYEN_BAC = 200000;

// SHOP
export const SHOP = true;

// BANK
export const BANK_ID = '445566';

// PERMISSIONS
export const PERMISSIONS = [
    'chuyendo',
    'chuc',
    'clear',
    'ch',
    'dong',
    'duyet',
    'kick',
    'ban',
    'info',
    'dong'
];

export default {
    BANK_COOKIE,
    CM_COOKIE,
    BOT_ID,
    BOT_URL
}
