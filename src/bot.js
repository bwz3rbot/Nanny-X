const dotenv = require('dotenv').config({
    path: "pw.env"
});

const colors = require('colors');
const Snoolicious = require('./lib/Snoolicious');
const snoolicious = new Snoolicious();
const SUBS = process.env.SUBREDDITS.split(',').map((sub) => sub.trim());

/*
    [Handle Submission]
        - Passed in as the second argument to queryTasks()
        - Awaited by Snoolicious for each submission dequeued from the task queue

        [Submission Task Object]
            - The Submission Task object will be passed with these key/value pairs:
                task: {
                    item: {
                        <Reddit Submission Object>
                    },
                    priority: <Number you set when calling getCommands or getMentions>,
                    time: <new Date().getTime()>
                }
*/
let count = 0;
async function handleSubmission(task) {
    console.log("RECEIVED TASK!");
    console.log(`title:${task.item.title}`.green);
    const saved = await snoolicious.requester.getSubmission(task.item.id).saved;
    console.log("was already saved: ", saved);
    if (!saved) {
        await xpost(task.item);
        console.log("saving");
        await snoolicious.requester.getSubmission(task.item.id).save();
    } else {
        console.log("Item was already saved".red);
    }
    console.log("Size of the queue: ", snoolicious.tasks.size());
    console.log("TOTAL TASKS COMPLETED: ", ++count);
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
async function run() {
        console.log("Running Test!!!");
        await snoolicious.nannyUser('bwz3r', 1);
        console.log("APP CHECKING SIZE OF TASKS QUEUE: ".america, snoolicious.tasks.size());
        await snoolicious.queryTasks(null, handleSubmission);
        console.log(`Finished Quereying Tasks. Sleeping for ${INTERVAL/1000/60} minutes...`.rainbow);
        setTimeout(async () => {
            await run()
        }, (INTERVAL));
    }
    (async () => {
        await run();
    })();