import * as log4js from "log4js";
import * as config from "config";

// please install forever
// > npm install forever -g
// execute
// > npm run forevertest

log4js.configure(config.get("log4js.configure"));
const logger = log4js.getLogger();
logger.level = "debug"; // don't show trace message

/**
 * wait ms
 */
function delay(ms: number): Promise<void> {
    logger.debug("delay " + ms + " ms");
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function main() {
    let counter = 0;
    while (true) {
        logger.info("counter = " + counter);
        counter++;
        await delay(5000);
    }
}

main().then(() => {
    logger.info("Done");
});