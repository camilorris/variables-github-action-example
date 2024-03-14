import * as fs from 'fs';
import * as path from 'path';
import { colorApproximatelyEqual, parseColor } from './color.js';
import { areSetsEqual } from './utils.js';
export function readJsonFiles(files) {
    const tokensJsonByFile = {};
    const seenCollectionsAndModes = new Set();
    files.forEach((file) => {
        const baseFileName = path.basename(file);
        const { collectionName, modeName } = collectionAndModeFromFileName(baseFileName);
        if (seenCollectionsAndModes.has(`${collectionName}.${modeName}`)) {
            throw new Error(`Duplicate collection and mode in file: ${file}`);
        }
        seenCollectionsAndModes.add(`${collectionName}.${modeName}`);
        const fileContent = fs.readFileSync(file, { encoding: 'utf-8' });
        if (!fileContent) {
            throw new Error(`Invalid tokens file: ${file}. File is empty.`);
        }
        const tokensFile = JSON.parse(fileContent);
        tokensJsonByFile[baseFileName] = flattenTokensFile(tokensFile);
    });
    return tokensJsonByFile;
}
function flattenTokensFile(tokensFile) {
    const flattenedTokens = {};
    Object.entries(tokensFile).forEach(([tokenGroup, groupValues]) => {
        traverseCollection({ key: tokenGroup, object: groupValues, tokens: flattenedTokens });
    });
    return flattenedTokens;
}
function traverseCollection({ key, object, tokens, }) {
    if (key.charAt(0) === '$') {
        return;
    }
    if (object.$value !== undefined) {
        tokens[key] = object;
    }
    else {
        Object.entries(object).forEach(([key2, object2]) => {
            if (key2.charAt(0) !== '$' && typeof object2 === 'object') {
                traverseCollection({
                    key: `${key}/${key2}`,
                    object: object2,
                    tokens,
                });
            }
        });
    }
}
function collectionAndModeFromFileName(fileName) {
    const fileNameParts = fileName.split('.');
    if (fileNameParts.length < 3) {
        throw new Error(`Invalid tokens file name: ${fileName}. File names must be in the format: {collectionName}.{modeName}.json`);
    }
    const [collectionName, modeName] = fileNameParts;
    return { collectionName, modeName };
}
function variableResolvedTypeFromToken(token) {
    switch (token.$type) {
        case 'color':
            return 'COLOR';
        case 'number':
            return 'FLOAT';
        case 'string':
            return 'STRING';
        case 'boolean':
            return 'BOOLEAN';
        default:
            throw new Error(`Invalid token $type: ${token.$type}`);
    }
}
function isAlias(value) {
    return value.toString().trim().charAt(0) === '{';
}
function variableValueFromToken(token, localVariablesByCollectionAndName) {
    if (typeof token.$value === 'string' && isAlias(token.$value)) {
        const value = token.$value
            .trim()
            .replace(/\./g, '/')
            .replace(/[\{\}]/g, '');
        for (const localVariablesByName of Object.values(localVariablesByCollectionAndName)) {
            if (localVariablesByName[value]) {
                return {
                    type: 'VARIABLE_ALIAS',
                    id: localVariablesByName[value].id,
                };
            }
        }
        return {
            type: 'VARIABLE_ALIAS',
            id: value,
        };
    }
    else if (typeof token.$value === 'string' && token.$type === 'color') {
        return parseColor(token.$value);
    }
    else {
        return token.$value;
    }
}
function compareVariableValues(a, b) {
    if (typeof a === 'object' && typeof b === 'object') {
        if ('type' in a && 'type' in b && a.type === 'VARIABLE_ALIAS' && b.type === 'VARIABLE_ALIAS') {
            return a.id === b.id;
        }
        else if ('r' in a && 'r' in b) {
            return colorApproximatelyEqual(a, b);
        }
    }
    else {
        return a === b;
    }
    return false;
}
function isCodeSyntaxEqual(a, b) {
    return (Object.keys(a).length === Object.keys(b).length &&
        Object.keys(a).every((key) => a[key] === b[key]));
}
function tokenAndVariableDifferences(token, variable) {
    const differences = {};
    if (token.$description !== undefined &&
        (!variable || token.$description !== variable.description)) {
        differences.description = token.$description;
    }
    if (token.$extensions && token.$extensions['com.figma']) {
        const figmaExtensions = token.$extensions['com.figma'];
        if (figmaExtensions.hiddenFromPublishing !== undefined &&
            (!variable || figmaExtensions.hiddenFromPublishing !== variable.hiddenFromPublishing)) {
            differences.hiddenFromPublishing = figmaExtensions.hiddenFromPublishing;
        }
        if (figmaExtensions.scopes &&
            (!variable || !areSetsEqual(new Set(figmaExtensions.scopes), new Set(variable.scopes)))) {
            differences.scopes = figmaExtensions.scopes;
        }
        if (figmaExtensions.codeSyntax &&
            (!variable || !isCodeSyntaxEqual(figmaExtensions.codeSyntax, variable.codeSyntax))) {
            differences.codeSyntax = figmaExtensions.codeSyntax;
        }
    }
    return differences;
}
export function generatePostVariablesPayload(tokensByFile, localVariables) {
    const localVariableCollectionsByName = {};
    const localVariablesByCollectionAndName = {};
    Object.values(localVariables.meta.variableCollections).forEach((collection) => {
        if (collection.remote) {
            return;
        }
        if (localVariableCollectionsByName[collection.name]) {
            throw new Error(`Duplicate variable collection in file: ${collection.name}`);
        }
        localVariableCollectionsByName[collection.name] = collection;
    });
    Object.values(localVariables.meta.variables).forEach((variable) => {
        if (variable.remote) {
            return;
        }
        if (!localVariablesByCollectionAndName[variable.variableCollectionId]) {
            localVariablesByCollectionAndName[variable.variableCollectionId] = {};
        }
        localVariablesByCollectionAndName[variable.variableCollectionId][variable.name] = variable;
    });
    console.log('Local variable collections in Figma file:', Object.keys(localVariableCollectionsByName));
    const postVariablesPayload = {
        variableCollections: [],
        variableModes: [],
        variables: [],
        variableModeValues: [],
    };
    Object.entries(tokensByFile).forEach(([fileName, tokens]) => {
        const { collectionName, modeName } = collectionAndModeFromFileName(fileName);
        const variableCollection = localVariableCollectionsByName[collectionName];
        const variableCollectionId = variableCollection ? variableCollection.id : collectionName;
        const variableMode = variableCollection === null || variableCollection === void 0 ? void 0 : variableCollection.modes.find((mode) => mode.name === modeName);
        const modeId = variableMode ? variableMode.modeId : modeName;
        if (!variableCollection &&
            !postVariablesPayload.variableCollections.find((c) => c.id === variableCollectionId)) {
            postVariablesPayload.variableCollections.push({
                action: 'CREATE',
                id: variableCollectionId,
                name: variableCollectionId,
                initialModeId: modeId,
            });
            postVariablesPayload.variableModes.push({
                action: 'UPDATE',
                id: modeId,
                name: modeId,
                variableCollectionId,
            });
        }
        if (!variableMode &&
            !postVariablesPayload.variableCollections.find((c) => c.id === variableCollectionId && 'initialModeId' in c && c.initialModeId === modeId)) {
            postVariablesPayload.variableModes.push({
                action: 'CREATE',
                id: modeId,
                name: modeId,
                variableCollectionId,
            });
        }
        const localVariablesByName = localVariablesByCollectionAndName[variableCollection === null || variableCollection === void 0 ? void 0 : variableCollection.id] || {};
        Object.entries(tokens).forEach(([tokenName, token]) => {
            const variable = localVariablesByName[tokenName];
            const variableId = variable ? variable.id : tokenName;
            const variableInPayload = postVariablesPayload.variables.find((v) => v.id === variableId &&
                'variableCollectionId' in v &&
                v.variableCollectionId === variableCollectionId);
            const differences = tokenAndVariableDifferences(token, variable);
            if (!variable && !variableInPayload) {
                postVariablesPayload.variables.push(Object.assign({ action: 'CREATE', id: variableId, name: tokenName, variableCollectionId, resolvedType: variableResolvedTypeFromToken(token) }, differences));
            }
            else if (variable && Object.keys(differences).length > 0) {
                postVariablesPayload.variables.push(Object.assign({ action: 'UPDATE', id: variableId }, differences));
            }
            const existingVariableValue = variable && variableMode ? variable.valuesByMode[modeId] : null;
            const newVariableValue = variableValueFromToken(token, localVariablesByCollectionAndName);
            if (existingVariableValue === null ||
                !compareVariableValues(existingVariableValue, newVariableValue)) {
                postVariablesPayload.variableModeValues.push({
                    variableId,
                    modeId,
                    value: newVariableValue,
                });
            }
        });
    });
    return postVariablesPayload;
}
//# sourceMappingURL=token_import.js.map