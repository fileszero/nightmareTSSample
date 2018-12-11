import * as Nightmare from "nightmare";
import * as cheerio from "cheerio";
import * as log4js from "log4js";
import * as config from "config";

import * as mysql from "promise-mysql";

import { link } from "fs";
import { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } from "constants";

/* record search result to DB */

interface IConstructorOptionsEx extends Nightmare.IConstructorOptions {
    switches?: object;
    waitTimeout?: number;
}
const opt: IConstructorOptionsEx = {
    show: true,
    typeInterval: 20,
    timeout: 1000 * 5, // in ms
    waitTimeout: 1000 * 20 // in ms
    , ignoreSslErrors: true,
    switches: {
        // https://github.com/segmentio/nightmare/issues/993
        "ignore-certificate-errors": true
    },
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
        const connection = await mysql.createConnection({
            host: "localhost",
            user: "root",
            database: "nmtest",
            password: "root"
        });
        await nm.goto("about:blank");

        while (true) {
            const now = new Date();
            const search_str = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
            await nm.goto("https://start.duckduckgo.com/");
            try {
                await nm.wait("#search_form_input_homepage");
            } catch (timeout) {
                continue;
            }
            const body = await nm
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
            const results = $("div.result");
            await results.each(async (i, elem) => {
                const link = $(elem).find("a.result__a");
                const content = link.text();
                const url = link.attr("href");
                if (url) {
                    console.log("[" + url + "]");
                    console.log("    " + content);
                    const insert_result = await connection.query(
                        "INSERT INTO `LINKS` (`URL`,`CONTENT`) VALUES (?,?) ON DUPLICATE KEY UPDATE `CONTENT`=?", [url, content, content]);
                }
            });

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

/*
CREATE TABLE `LINKS` (
	`URL` VARCHAR(2048) NOT NULL,
	`CONTENT` TEXT NULL DEFAULT NULL
)
ENGINE=InnoDB
;

*/