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
import { generatePostVariablesPayload, readJsonFiles } from './token_import.js';
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!process.env.PERSONAL_ACCESS_TOKEN || !process.env.FILE_KEY) {
            throw new Error('PERSONAL_ACCESS_TOKEN and FILE_KEY environemnt variables are required');
        }
        const fileKey = process.env.FILE_KEY;
        const TOKENS_DIR = 'tokens';
        const tokensFiles = fs.readdirSync(TOKENS_DIR).map((file) => `${TOKENS_DIR}/${file}`);
        const tokensByFile = readJsonFiles(tokensFiles);
        console.log('Read tokens files:', Object.keys(tokensByFile));
        const api = new FigmaApi(process.env.PERSONAL_ACCESS_TOKEN);
        const localVariables = yield api.getLocalVariables(fileKey);
        const postVariablesPayload = generatePostVariablesPayload(tokensByFile, localVariables);
        if (Object.values(postVariablesPayload).every((value) => value.length === 0)) {
            console.log(green('✅ Tokens are already up to date with the Figma file'));
            return;
        }
        const apiResp = yield api.postVariables(fileKey, postVariablesPayload);
        console.log('POST variables API response:', apiResp);
        if (postVariablesPayload.variableCollections && postVariablesPayload.variableCollections.length) {
            console.log('Updated variable collections', postVariablesPayload.variableCollections);
        }
        if (postVariablesPayload.variableModes && postVariablesPayload.variableModes.length) {
            console.log('Updated variable modes', postVariablesPayload.variableModes);
        }
        if (postVariablesPayload.variables && postVariablesPayload.variables.length) {
            console.log('Updated variables', postVariablesPayload.variables);
        }
        if (postVariablesPayload.variableModeValues && postVariablesPayload.variableModeValues.length) {
            console.log('Updated variable mode values', postVariablesPayload.variableModeValues);
        }
        console.log(green('✅ Figma file has been updated with the new tokens'));
    });
}
main();
//# sourceMappingURL=sync_tokens_to_figma.js.map