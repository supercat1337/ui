import fs from 'node:fs';
import path from 'node:path';

const SRC_TYPES_PATH = './src/component/types.d.ts';
const DIST_FILES = ['./dist/ui.esm.d.ts'];

function bundleTypes() {
    if (!fs.existsSync(SRC_TYPES_PATH)) {
        console.error(`❌ Source types not found: ${SRC_TYPES_PATH}`);
        return;
    }

    // 1. Читаем наш эталонный файл со всеми интерфейсами и типами
    const baseTypes = fs.readFileSync(SRC_TYPES_PATH, 'utf8');

    DIST_FILES.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            const generatedTypes = fs.readFileSync(filePath, 'utf8');

            // 2. Очищаем сгенерированный tsc контент от относительных импортов,
            // так как теперь всё будет в одном файле.
            const cleanedGenerated = generatedTypes.replace(/import\(['"].\/types[^'"]+['"]\)\./g, '');

            // 3. Склеиваем: Базовые типы + Сгенерированные классы
            const finalContent = baseTypes + '\n\n' + cleanedGenerated;

            fs.writeFileSync(filePath, finalContent);
            console.log(`✅ Integrated types into: ${filePath}`);
        } else {
            console.warn(`⚠️ Warning: File not found ${filePath}`);
        }
    });

    fs.copyFileSync("./dist/ui.esm.d.ts", './dist/ui.bundle.esm.d.ts');
}

bundleTypes();
