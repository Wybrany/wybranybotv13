import betterLogging, { MessageConstructionStrategy } from "better-logging";
import { join } from "path";

const options = {
    format: (ctx: any) => `${ctx.date} ${ctx.time24} ${ctx.type} ${ctx.msg}`, //${ctx.STAMP(ctx.type, chalk.blue)}
    saveToFile: `${join(process.cwd(), `logs/${Date.now()}.log`)}`,
    messageConstructionStrategy: MessageConstructionStrategy.NONE
}

//@ts-ignore
export const use_better_logging = () => betterLogging(console, options);