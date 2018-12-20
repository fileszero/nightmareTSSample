import * as Nightmare from "nightmare";
import * as cheerio from "cheerio";
import * as config from "config";
import { logger } from "./logger";

const loginInfos: any[] = config.get("login");

export async function getBody(nm: Nightmare): Promise<string> {
    const body = await nm
        .wait("body")
        .evaluate((): string => {
            return document.getElementsByTagName("body")[0].outerHTML;
        })
        .then((body: string) => {
            return body;
        });
    return body;

}

export async function gotoUrl(nm: Nightmare, url: string, wait: string | number, retry: number = 5): Promise<void> {
    let retried = 0;
    while (true) {
        await nm.goto(url);
        try {
            await nm.wait(wait);
            break;
        } catch (timeout) {
            logger.debug("retry to gotoUrl [" + url + "] error:" + JSON.stringify(timeout));
            nm.screenshot("./logs/timeout.png");
            await handleLogin(nm);
            if (retried > retry) {
                throw new Error("gotoUrl timeout");
            }
            retried++;
            continue;
        }
    }
    return;
}

export async function handleLogin(nm: Nightmare): Promise<boolean> {
    try {
        const url = await nm.url();
        // ログイン情報特定
        const logininfo = loginInfos.find((val) => {
            if (val.url) {
                return val.url.toLowerCase().startsWith(url.toLowerCase());
            }
            return false;
        });

        if (logininfo) {    // ログイン情報あり
            // DOM情報取得
            const body = await nm
                .evaluate((): string => {
                    return document.getElementsByTagName("body")[0].outerHTML;
                })
                .then((body: string) => {
                    return body;
                });
            const $ = cheerio.load(body);

            // ユーザー名パスワード等セット
            for (const selector in logininfo) {
                if (selector !== "url" && selector !== "submit") {
                    const inputelement = $(selector);
                    if (inputelement.length > 0) {
                        await nm.type(selector, logininfo[selector]);
                    }
                }
            }
            await nm.screenshot("./logs/handleLogin_010.png");
            await nm.click(logininfo.submit);
            if (logininfo.wait) {
                await nm.wait(logininfo.wait);
            }
            await nm.wait(500);
            await nm.screenshot("./logs/handleLogin_020.png");
            return true;    // login processed

        }
    } catch (error) {
        logger.error("handle login failed:", error);
        nm.screenshot("./logs/handleLogin_failed.png");
    }
    return false;
}