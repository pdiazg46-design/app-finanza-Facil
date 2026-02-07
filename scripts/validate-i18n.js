#!/usr/bin/env node

/**
 * Script de Validación Automática de Traducciones
 * 
 * Detecta:
 * 1. Claves faltantes en ES/EN/PT
 * 2. Textos hardcoded en componentes
 * 3. Estructura inconsistente entre idiomas
 * 4. Genera tabla comparativa completa
 * 
 * Uso: node scripts/validate-i18n.js
 */

const fs = require('fs');
const path = require('path');

// Colores para terminal
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Cargar archivos de traducción
const translationsDir = path.join(__dirname, '../lib/translations');
const es = JSON.parse(fs.readFileSync(path.join(translationsDir, 'es.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(translationsDir, 'en.json'), 'utf8'));
const pt = JSON.parse(fs.readFileSync(path.join(translationsDir, 'pt.json'), 'utf8'));

// Función para aplanar objeto JSON
function flattenObj(obj, prefix = '') {
    let result = {};
    for (let key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(result, flattenObj(obj[key], fullKey));
        } else {
            result[fullKey] = obj[key];
        }
    }
    return result;
}

// Aplanar traducciones
const esFlat = flattenObj(es);
const enFlat = flattenObj(en);
const ptFlat = flattenObj(pt);

// Obtener todas las claves únicas
const allKeys = [...new Set([...Object.keys(esFlat), ...Object.keys(enFlat), ...Object.keys(ptFlat)])].sort();

console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║  VALIDACIÓN AUTOMÁTICA DE TRADUCCIONES - FINANZA FÁCIL   ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

// 1. ANÁLISIS DE COMPLETITUD
console.log(`${colors.blue}📊 ANÁLISIS DE COMPLETITUD${colors.reset}\n`);

let complete = 0;
let incomplete = 0;
const missingES = [];
const missingEN = [];
const missingPT = [];

allKeys.forEach(key => {
    const hasES = !!esFlat[key];
    const hasEN = !!enFlat[key];
    const hasPT = !!ptFlat[key];

    if (hasES && hasEN && hasPT) {
        complete++;
    } else {
        incomplete++;
        if (!hasES) missingES.push(key);
        if (!hasEN) missingEN.push(key);
        if (!hasPT) missingPT.push(key);
    }
});

const percentage = Math.round((complete / allKeys.length) * 100);

console.log(`Total de claves: ${allKeys.length}`);
console.log(`${colors.green}Completas (✅): ${complete} (${percentage}%)${colors.reset}`);
console.log(`${colors.yellow}Incompletas (⚠️): ${incomplete}${colors.reset}\n`);

// Mostrar claves faltantes
if (missingES.length > 0) {
    console.log(`${colors.red}❌ Claves faltantes en ESPAÑOL (${missingES.length}):${colors.reset}`);
    missingES.forEach(key => console.log(`   - ${key}`));
    console.log('');
}

if (missingEN.length > 0) {
    console.log(`${colors.red}❌ Claves faltantes en INGLÉS (${missingEN.length}):${colors.reset}`);
    missingEN.forEach(key => console.log(`   - ${key}`));
    console.log('');
}

if (missingPT.length > 0) {
    console.log(`${colors.red}❌ Claves faltantes en PORTUGUÉS (${missingPT.length}):${colors.reset}`);
    missingPT.forEach(key => console.log(`   - ${key}`));
    console.log('');
}

// 2. DETECCIÓN DE TEXTOS HARDCODED
console.log(`${colors.blue}🔍 DETECCIÓN DE TEXTOS HARDCODED${colors.reset}\n`);

const componentsDir = path.join(__dirname, '../components');
const hardcodedPatterns = [
    />\s*[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[a-záéíóúñ]+\s*</g,  // Texto en español entre tags
    /<span>\s*[A-Z][a-z]+.*?<\/span>/g,  // Texto en span
];

let hardcodedFound = 0;

function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            scanDirectory(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(filePath, 'utf8');

            // Buscar textos hardcoded comunes
            const commonHardcoded = [
                'Cuentas por pagar',
                'Ver todo',
                'Riqueza Real',
                'Lo que tengo',
                'Lo que debo',
                'Actividades Recentes',
                'Guardar',
                'Cancelar',
                'Eliminar'
            ];

            commonHardcoded.forEach(text => {
                if (content.includes(`>${text}<`) || content.includes(`"${text}"`) || content.includes(`'${text}'`)) {
                    console.log(`${colors.yellow}⚠️  ${file}: "${text}"${colors.reset}`);
                    hardcodedFound++;
                }
            });
        }
    });
}

try {
    scanDirectory(componentsDir);
    if (hardcodedFound === 0) {
        console.log(`${colors.green}✅ No se encontraron textos hardcoded comunes${colors.reset}\n`);
    } else {
        console.log(`${colors.yellow}\nTotal de textos hardcoded encontrados: ${hardcodedFound}${colors.reset}\n`);
    }
} catch (error) {
    console.log(`${colors.yellow}⚠️  No se pudo escanear componentes: ${error.message}${colors.reset}\n`);
}

// 3. GENERAR TABLA COMPARATIVA
console.log(`${colors.blue}📋 TABLA COMPARATIVA (Primeras 20 claves)${colors.reset}\n`);

console.log('CLAVE | ESPAÑOL | INGLÉS | PORTUGUÉS | STATUS');
console.log('------|---------|--------|-----------|-------');

allKeys.slice(0, 20).forEach(key => {
    const esVal = esFlat[key] || '❌ FALTA';
    const enVal = enFlat[key] || '❌ FALTA';
    const ptVal = ptFlat[key] || '❌ FALTA';
    const status = (esFlat[key] && enFlat[key] && ptFlat[key]) ? '✅' : '⚠️';

    console.log(`${key} | ${esVal.substring(0, 20)} | ${enVal.substring(0, 20)} | ${ptVal.substring(0, 20)} | ${status}`);
});

console.log(`\n... (${allKeys.length - 20} claves más)\n`);

// 4. RESUMEN FINAL
console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║  RESUMEN FINAL                                            ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

if (percentage === 100 && hardcodedFound === 0) {
    console.log(`${colors.green}✅ ¡PERFECTO! Sistema de traducciones 100% completo${colors.reset}`);
    console.log(`${colors.green}✅ No se encontraron textos hardcoded${colors.reset}\n`);
    process.exit(0);
} else {
    if (percentage < 100) {
        console.log(`${colors.yellow}⚠️  Completitud: ${percentage}% (${incomplete} claves faltantes)${colors.reset}`);
    }
    if (hardcodedFound > 0) {
        console.log(`${colors.yellow}⚠️  Textos hardcoded encontrados: ${hardcodedFound}${colors.reset}`);
    }
    console.log(`\n${colors.cyan}💡 Ejecuta este script regularmente para mantener la calidad de las traducciones${colors.reset}\n`);
    process.exit(1);
}
