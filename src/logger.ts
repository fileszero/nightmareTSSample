import * as log4js from "log4js";
import * as config from "config";

log4js.configure(config.get("log4js.configure"));
const logger_inst = log4js.getLogger();
logger_inst.level = "debug"; // don't show trace message
logger_inst.info("Start logging");
export const logger = logger_inst;