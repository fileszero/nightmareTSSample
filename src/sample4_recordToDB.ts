import * as Nightmare from "nightmare";
import * as cheerio from "cheerio";

import * as mysql from "promise-mysql";

import * as nmutil from "./NMUtil";
import { logger } from "./logger";

/* record search result to DB */

const opt: Nightmare.IConstructorOptions = {
    show: true,
    typeInterval: 20,
    timeout: 1000 * 5, // in ms
    waitTimeout: 1000 * 5 // in ms
    , ignoreSslErrors: true,
    switches: {
        // https://github.com/segmentio/nightmare/issues/993
        "ignore-certificate-errors": true
    },
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
        const connection = await mysql.createConnection({
            host: "db", // docker service name or "localhost",
            user: "root",
            database: "nmtest",
            password: "root"
        });
        await nm.goto("about:blank");

        while (true) {
            const now = new Date();
            const search_str = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
            await nmutil.gotoUrl(nm, "https://start.duckduckgo.com/", "#search_form_input_homepage");
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

            logger.debug(body);
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
        nm.screenshot("./logs/Searchfailed.png");
        logger.error("Search failed:" + JSON.stringify(error), error);
    }
    await nm.end();
}

main().then(() => {
    logger.info("Done");
    process.exit();
});

/*
CREATE TABLE `LINKS` (
	`URL` VARCHAR(2048) NOT NULL,
	`CONTENT` TEXT NULL DEFAULT NULL
)
ENGINE=InnoDB
;

*/