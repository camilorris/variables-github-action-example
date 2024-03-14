var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import 'dotenv/config';
import * as fs from 'fs';
import FigmaApi from './figma_api.js';
import { green } from './utils.js';
import { tokenFilesFromLocalVariables } from './token_export.js';
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!process.env.PERSONAL_ACCESS_TOKEN || !process.env.FILE_KEY) {
            throw new Error('PERSONAL_ACCESS_TOKEN and FILE_KEY environemnt variables are required');
        }
        const fileKey = process.env.FILE_KEY;
        const api = new FigmaApi(process.env.PERSONAL_ACCESS_TOKEN);
        const localVariables = yield api.getLocalVariables(fileKey);
        const tokensFiles = tokenFilesFromLocalVariables(localVariables);
        let outputDir = 'tokens_new';
        const outputArgIdx = process.argv.indexOf('--output');
        if (outputArgIdx !== -1) {
            outputDir = process.argv[outputArgIdx + 1];
        }
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }
        Object.entries(tokensFiles).forEach(([fileName, fileContent]) => {
            fs.writeFileSync(`${outputDir}/${fileName}`, JSON.stringify(fileContent, null, 2));
            console.log(`Wrote ${fileName}`);
        });
        console.log(green(`✅ Tokens files have been written to the ${outputDir} directory`));
    });
}
main();
//# sourceMappingURL=sync_figma_to_tokens.js.map