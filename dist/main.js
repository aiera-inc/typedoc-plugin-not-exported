"use strict";
/**
 * typedoc-plugin-not-exported
 * TypeDoc plugin that forces inclusion of non-exported symbols (variables)
 * Originally from https://github.com/TypeStrong/typedoc/issues/1474#issuecomment-766178261
 * https://github.com/tomchen/typedoc-plugin-not-exported
 * CC0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const typedoc_1 = require("typedoc"); // version 0.20.16+
const ModuleFlags = typedoc_1.TypeScript.SymbolFlags.ValueModule | typedoc_1.TypeScript.SymbolFlags.NamespaceModule;
exports.load = function ({ application }) {
    let includeTag = 'notExported';
    application.options.addDeclaration({
        name: 'includeTag',
        help: '[typedoc-plugin-not-exported] Specify the tag name for non-exported member to be imported under',
        defaultValue: includeTag,
    });
    application.converter.on(typedoc_1.Converter.EVENT_BEGIN, () => {
        const includeTagTemp = application.options.getValue('includeTag');
        if (typeof includeTagTemp === 'string') {
            includeTag = includeTagTemp.toLocaleLowerCase();
        }
    });
    application.converter.on(typedoc_1.Converter.EVENT_CREATE_DECLARATION, lookForFakeExports);
    function lookForFakeExports(context, _reflection, node) {
        var _a;
        if (!node) {
            return;
        }
        const moduleSymbol = (_a = context.checker.getSymbolAtLocation(node)) !== null && _a !== void 0 ? _a : node.symbol;
        if (!moduleSymbol) {
            // Global file, no point in doing anything here. TypeDoc will already
            // include everything declared in this file.
            return;
        }
        // Make sure we are allowed to call getExportsOfModule
        if ((moduleSymbol.flags & ModuleFlags) === 0) {
            return;
        }
        const exportedSymbols = context.checker.getExportsOfModule(moduleSymbol);
        const symbols = context.checker
            .getSymbolsInScope(node, typedoc_1.TypeScript.SymbolFlags.ModuleMember)
            .filter((symbol) => isInDocumentableScope(symbol, node) &&
            !exportedSymbols.includes(symbol));
        for (const symbol of symbols) {
            if (symbol
                .getJsDocTags()
                .some((tag) => tag.name.toLocaleLowerCase() === includeTag)) {
                context.converter.convertSymbol(context, symbol);
            }
        }
    }
};
function isInDocumentableScope(symbol, node) {
    for (const decl of symbol.getDeclarations() || []) {
        // Case 1: Included in this namespace/source file
        if (decl.parent === node)
            return true;
        // Case 2: Within `declare global {}`
        // We need to check isSourceFile here as well because otherwise it will be picked up
        // in the scope of namespaces while we should be picking it up only in the first case
        if (typedoc_1.TypeScript.isSourceFile(node) &&
            typedoc_1.TypeScript.isModuleBlock(decl.parent) &&
            decl.parent.parent.name.getText() === 'global') {
            return true;
        }
    }
    return false;
}
