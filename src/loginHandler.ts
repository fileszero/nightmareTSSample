import * as Nightmare from "nightmare";
import * as cheerio from "cheerio";
import * as config from "config";
import { isNumber } from "util";

const loginInfos: any[] = config.get("login");

export async function handleLogin(nm: Nightmare) {
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

    }
}