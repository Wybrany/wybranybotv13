import chalk from "chalk";
import betterLogging, { MessageConstructionStrategy } from "better-logging";
import { join } from "path";

const options = {
    format: (ctx: any) => `${ctx.date} ${ctx.time24} ${ctx.type} ${ctx.msg}`, //${ctx.STAMP(ctx.type, chalk.blue)}
    saveToFile: `${join(process.cwd(), `logs/${Date.now()}.log`)}`,
    color: {
        base: chalk.greenBright,
        type: {
            debug: chalk.magentaBright,
            info: chalk.blueBright,
            log: chalk.magentaBright,
            error: chalk.redBright,
            warn: chalk.yellowBright,
        }
    },
    messageConstructionStrategy: MessageConstructionStrategy.NONE
}

//@ts-ignore
export const use_better_logging = () => betterLogging(console, options);