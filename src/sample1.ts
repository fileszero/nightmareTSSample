import * as Nightmare from "nightmare";
import * as cheerio from "cheerio";
import * as log4js from "log4js";
import * as config from "config";

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
        while (true) {
            const now = new Date();
            const search_str = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
            const body = await nm
                .goto("https://duckduckgo.com")
                .wait("#search_form_input_homepage")
                .type("#search_form_input_homepage", search_str)
                .click("#search_button_homepage")
                .wait("#r1-0")
                .evaluate((): string => {
                    return document.getElementsByTagName("body")[0].outerHTML;
                })
                .then((body: string) => {
                    return body;
                });

            const $ = cheerio.load(body);
            const first_site = $("#r1-0 a.result__a").text();
            logger.info(search_str + " >> " + first_site);
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