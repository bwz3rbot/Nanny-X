const dotenv = require('dotenv').config({
    path: "pw.env"
});

const colors = require('colors');
const Snoolicious = require('./lib/Snoolicious');
const snoolicious = new Snoolicious();
const SUBS = process.env.SUBREDDITS.split(',').map((sub) => sub.trim());

let count = 0;
async function handleSubmission(task) {
    console.log("new task!".grey);
    console.log(`title:${task.item.title}`.green);
    const saved = await snoolicious.requester.getSubmission(task.item.id).saved;
    if (!saved) {
        await xpost(task.item);
        console.log("saving");
        await snoolicious.requester.getSubmission(task.item.id).save();
    } else {
        console.log("Item was already saved".magenta);
    }
    console.log("Size of the queue: ".grey, snoolicious.tasks.size());
    console.log("Total tasks completed: ".grey, ++count);
}

async function xpost(post) {
    for (const sub of SUBS) {
        console.log(`X-Posting to r/${sub}...`.grey);
        await snoolicious.requester._newObject('Submission', post, true).submitCrosspost({
            subredditName: sub,
            title: post.title,
            originalPost: this,
            resubmit: false,
            sendReplies: true
        });
        console.log(`X-Posting success!`.green);
    }
}

/* [Snoolicious Run Cycle] */
const INTERVAL = (process.env.INTERVAL * 1000 * 60);
console.log("Welcome to Snoolicious".random);
async function run() {
        await snoolicious.nannyUser('bwz3r', 1);
        console.log("Size of task queue: ".grey, snoolicious.tasks.size());
        await snoolicious.queryTasks(null, handleSubmission);
        console.log(`Finished Quereying Tasks. Sleeping for ${INTERVAL/1000/60} minutes...`.grey);
        setTimeout(async () => {
            await run()
        }, (INTERVAL));
    }
    (async () => {
        await run();
    })();