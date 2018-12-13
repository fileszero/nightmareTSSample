import * as Nightmare from "nightmare";
import * as cheerio from "cheerio";
import { logger } from "./logger";

// nohup xvfb-run forever ./dest/src/sample2.js &

interface IConstructorOptionsEx extends Nightmare.IConstructorOptions {
    switches?: object;
}
const opt: IConstructorOptionsEx = {
    show: true,
    typeInterval: 20,
    timeout: 1000 // in ms
    , ignoreSslErrors: true,
    switches: {
        // https://github.com/segmentio/nightmare/issues/993
        "ignore-certificate-errors": true
    }
};

const nm = new Nightmare(opt);

/**
 * wait ms
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function main() {
    try {
        while (true) {
            const body = await nm
                .goto("http://10.0.2.2:8000/staticsample.html")    // 10.0.2.2 = vagrant host PC
                .wait("#linktome")
                .click("#linktome")
                .evaluate((): string => {
                    return document.getElementsByTagName("body")[0].outerHTML;
                })
                .then((body: string) => {
                    return body;
                });

            const $ = cheerio.load(body);
            const now = $("#now").text();
            logger.info(now);
            await delay(5000);
        }
    } catch (error) {
        logger.error("Search failed:", error);
    }
    await nm.end();
}

main().then(() => {
    logger.info("Done");
});