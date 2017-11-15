import * as Nightmare from "nightmare";
import * as cheerio from "cheerio";

const nm = new Nightmare({
    show: true,
    typeInterval: 20,
    timeout: 1000 // in ms
});

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
            console.log(search_str + " >> " + first_site);
            await delay(5000);
        }
    } catch (error) {
        console.error("Search failed:", error);
    }
    await nm.end();
}

main().then(() => {
    console.log("Done");
});