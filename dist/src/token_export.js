import { rgbToHex } from './color.js';
function tokenTypeFromVariable(variable) {
    switch (variable.resolvedType) {
        case 'BOOLEAN':
            return 'boolean';
        case 'COLOR':
            return 'color';
        case 'FLOAT':
            return 'number';
        case 'STRING':
            return 'string';
    }
}
function tokenValueFromVariable(variable, modeId, localVariables) {
    const value = variable.valuesByMode[modeId];
    if (typeof value === 'object') {
        if ('type' in value && value.type === 'VARIABLE_ALIAS') {
            const aliasedVariable = localVariables[value.id];
            return `{${aliasedVariable.name.replace(/\//g, '.')}}`;
        }
        else if ('r' in value) {
            return rgbToHex(value);
        }
        throw new Error(`Format of variable value is invalid: ${value}`);
    }
    else {
        return value;
    }
}
export function tokenFilesFromLocalVariables(localVariablesResponse) {
    const tokenFiles = {};
    const localVariableCollections = localVariablesResponse.meta.variableCollections;
    const localVariables = localVariablesResponse.meta.variables;
    Object.values(localVariables).forEach((variable) => {
        if (variable.remote) {
            return;
        }
        const collection = localVariableCollections[variable.variableCollectionId];
        collection.modes.forEach((mode) => {
            const fileName = `${collection.name}.${mode.name}.json`;
            if (!tokenFiles[fileName]) {
                tokenFiles[fileName] = {};
            }
            let obj = tokenFiles[fileName];
            variable.name.split('/').forEach((groupName) => {
                obj[groupName] = obj[groupName] || {};
                obj = obj[groupName];
            });
            const token = {
                $type: tokenTypeFromVariable(variable),
                $value: tokenValueFromVariable(variable, mode.modeId, localVariables),
                $description: variable.description,
                $extensions: {
                    'com.figma': {
                        hiddenFromPublishing: variable.hiddenFromPublishing,
                        scopes: variable.scopes,
                        codeSyntax: variable.codeSyntax,
                    },
                },
            };
            Object.assign(obj, token);
        });
    });
    return tokenFiles;
}
//# sourceMappingURL=token_export.js.map