import * as Nightmare from "nightmare";
import * as cheerio from "cheerio";
import * as log4js from "log4js";
import * as config from "config";

// nohup xvfb-run forever ./dest/src/sample2.js &

interface IConstructorOptionsEx extends Nightmare.IConstructorOptions {
    switches?: object;
}

log4js.configure(config.get("log4js.configure"));
const logger = log4js.getLogger();
logger.level = "debug"; // don't show trace message

/**
 * wait ms
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function main() {
    try {
        const nms: Nightmare[] = [];
        for (let i = 0; i < 10; i++) {
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
            const inst = new Nightmare(opt);
            await inst.goto("about:blank").wait();
            nms.push(inst);
        }
        while (true) {
            for (const nm of nms) {
                const body = await nm
                    .goto("https://duckduckgo.com")
                    .wait("#search_form_input_homepage")
                    .type("#search_form_input_homepage", "nightmare js multi")
                    .click("#search_button_homepage")
                    .wait("#r1-0")
                    .evaluate((): string => {
                        return document.getElementsByTagName("body")[0].outerHTML;
                    })
                    .then((body: string) => {
                        return body;
                    });

                await nm.wait();
                const $ = cheerio.load(body);
                const now = $("#now").text();
                logger.info(now);
                await delay(5000);
                // await nm.end();
            }
        }


    } catch (error) {
        logger.error("Search failed:", error);
    }
}

main().then(() => {
    logger.info("Done");
});