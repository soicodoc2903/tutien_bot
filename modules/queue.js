import Queue from 'bee-queue';
import {chuyenDo} from "./chuyen-do.js";

const chuyenDoQueue = new Queue('chuyen-do', {
    activateDelayedJobs: true,
    removeOnSuccess: true,
    removeOnFailure: true
});

const TIMEOUT = 30 * 1000;

process.on('uncaughtException', async () => {
    // Queue#close is idempotent - no need to guard against duplicate calls.
    try {
        await chuyenDoQueue.close(TIMEOUT);
    } catch (err) {
        console.error('bee-queue failed to shut down gracefully', err);
    }
    process.exit(1);
});

chuyenDoQueue.process((job, done) => {
    const {user, item} = job.data;
    chuyenDo(user, item).then(res => {
        // Remove job when success
        if (res === '1') {
            return done(null, item.name);
        }

        // Remove job when html returned
        if (res !== '') {
           return done(null, item.name);
        }

        return done({message: `Chuyển ${item.amount} ${item.name} gặp lỗi, đang thử lại!`});
    })
});

chuyenDoQueue.on('retrying', (job, err) => {
    console.log(`${err.message}`);
});

chuyenDoQueue.on('job succeeded', (jobId, result) => {
    console.log(`[succeeded] ${result}`);
});

chuyenDoQueue.on('failed', (job, err) => {
    const {user, item} = job.data;

    // getCboxIdFromTcvId(user.id).then((cboxId) => {
        // pmCbox(cboxId,`Chuyển ${item.amount} ${item.name} gặp lỗi, đang thử lại!`);
    // });
    console.log(`Job ${job.id} failed with error ${err.message}`);
});

export {
    chuyenDoQueue
}
