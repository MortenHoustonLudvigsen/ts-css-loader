import * as path from "path";
// import * as ts from "typescript";
import * as ts_module from "typescript/lib/tsserverlibrary";
import { files, File } from './FileCache';

function plugin({ typescript: ts }: { typescript: typeof ts_module }) {
    return { create };

    function create(info: ts.server.PluginCreateInfo) {
        console.log(`Creating ts-css-loader plugin`);
        const options = info.languageServiceHost.getCompilationSettings();

        updateLanguageServiceHost(info.languageServiceHost, options);

        // changeSourceFiles(info);

        return info.languageService;
    }

    function updateLanguageServiceHost(host: ts.LanguageServiceHost, options: ts.CompilerOptions): void {
        Object.assign(host, {
            resolveModuleNames(moduleNames: string[], containingFile: string): ts.ResolvedModule[] {
                const containingDir = path.normalize(path.dirname(containingFile));
                const resolvedModules: ts.ResolvedModule[] = [];
                for (const moduleName of moduleNames){
                    const resolvedModule = resolveModuleName(moduleName, containingFile, containingDir, options);
                    if (resolvedModule){
                        resolvedModules.push(resolvedModule);
                    }
                }
                return resolvedModules;
            }
        });
    }

    function resolveModuleName(moduleName: string, containingFile: string, containingDir: string, options: ts.CompilerOptions): ts.ResolvedModuleFull | undefined {
        const modulePath = path.resolve(containingDir, moduleName);
        const moduleFile = files.get(modulePath);
        if (moduleFile) {
            return {
                resolvedFileName: path.resolve(moduleFile.path) + '.d.ts',
                extension: ts.Extension.Dts,
                isExternalLibraryImport: false
            };
        }
        // Default resolveModuleName
        const resolvedModule = ts.resolveModuleName(moduleName, containingFile, options, ts.sys /*, cache */);
        return resolvedModule && resolvedModule.resolvedModule;
    }

    function getScriptSnapshot(wrapped: ts.IScriptSnapshot, file: File | undefined): ts.IScriptSnapshot {
        if (file) {
            return {
                getChangeRange: old => wrapped.getChangeRange(old),
                getLength: () => file.contents.length,
                getText: (start, end) => file.contents.slice(start, end),
            };
        }
        return wrapped;
    }

    function changeSourceFiles(info: ts.server.PluginCreateInfo) {
        const origCreateLanguageServiceSourceFile = ts.createLanguageServiceSourceFile;
        const origUpdateLanguageServiceSourceFile = ts.updateLanguageServiceSourceFile;

        function createLanguageServiceSourceFile(fileName: string, scriptSnapshot: ts.IScriptSnapshot, scriptTarget: ts.ScriptTarget, version: string, setNodeParents: boolean, scriptKind?: ts.ScriptKind, cheat?: string): ts.SourceFile {
            scriptSnapshot = getScriptSnapshot(scriptSnapshot, files.get(fileName));
            return origCreateLanguageServiceSourceFile(fileName, scriptSnapshot, scriptTarget, version, setNodeParents, scriptKind);
        }

        function updateLanguageServiceSourceFile(sourceFile: ts.SourceFile, scriptSnapshot: ts.IScriptSnapshot, version: string, textChangeRange: ts.TextChangeRange, aggressiveChecks?: boolean): ts.SourceFile {
            scriptSnapshot = getScriptSnapshot(scriptSnapshot, files.get(sourceFile.fileName));
            return origUpdateLanguageServiceSourceFile(sourceFile, scriptSnapshot, version, textChangeRange, aggressiveChecks);
        }

        ts.createLanguageServiceSourceFile = createLanguageServiceSourceFile;
        ts.updateLanguageServiceSourceFile = updateLanguageServiceSourceFile;
    }
}

export = plugin;
