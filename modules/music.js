import {chat, pmCbox, getItem, getKeys, getTcvNameFromTcvId, setItem, formatBac} from '../helper.js';
import axios from "axios";

export const searchInYoutube = async (songName) => {
    //const baseUrl = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&key=AIzaSyAAuhWWF0_4I-WBEwz-LYbncDjNf1uoCt0&q=";
    const baseUrl = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&key=AIzaSyCclNrwg8T0j31oBx8ECNDVJ5DI3LnCUnA&q=";
    const searchUrl = baseUrl + encodeURI(songName);
    axios.get(searchUrl).then(response => {
        const videoId = response.items[0].id.videoId;
        await leechMp3(videoId);
    });
}

export const leechMp3 = async (videoId) => {
    const videoUrl = "https://www.youtube.com/watch?v=" + videoId;
    axios.post("https://luanxt.com/get-link-mp3-320-lossless-vip-zing/api/get-link", {
        link: videoUrl,
        sig: xtSign(videoUrl + userToken)
    }).then(response => {
        if (response.status == "failed") {
            chat('Có lỗi xảy ra!');
            return;
        }
        const songData = response.data.downloads;
        const mp3Url = songData.audio[0].link;
        const videoTitle = response.data.name;
        const videoThumbnail = response.data.image;
        const message = `${videoTitle}[br][audio]${mp3Url}[/audio]`;

        if (mp3Url.toLowerCase().includes('stv') ||
            mp3Url.toLowerCase().includes('sangtacviet') ||
            mp3Url.toLowerCase().includes('sáng tác việt')
           ) {
            chat('Có lỗi xảy ra!');
            return;
        }

        if (videoTitle.toLowerCase().includes('stv') ||
            videoTitle.toLowerCase().includes('sangtacviet') ||
            videoTitle.toLowerCase().includes('sáng tác việt')
           ) {
            chat('Có lỗi xảy ra!');
            return;
        }

        //const message = `[center][img]${videoThumbnail}[/img][/center][center][audio]${mp3Url}[/audio][/center][center][b][url=${videoUrl}]${videoTitle}[/url][/b][/center]`;
        chat(message);
    });
}
