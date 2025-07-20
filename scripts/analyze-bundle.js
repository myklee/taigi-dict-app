#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes the built bundle to provide insights on code splitting and optimization
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DIST_DIR = path.join(__dirname, '../dist')
const WWW_DIR = path.join(__dirname, '../www')

function analyzeDirectory(dir, platform) {
  if (!fs.existsSync(dir)) {
    console.log(`❌ ${platform} build directory not found: ${dir}`)
    return
  }

  console.log(`\n📊 Analyzing ${platform} bundle...`)
  console.log(`Directory: ${dir}`)

  const assetsDir = path.join(dir, 'assets')
  if (!fs.existsSync(assetsDir)) {
    console.log('❌ Assets directory not found')
    return
  }

  const files = fs.readdirSync(assetsDir)
  const jsFiles = files.filter(file => file.endsWith('.js'))
  const cssFiles = files.filter(file => file.endsWith('.css'))

  console.log(`\n📁 JavaScript Files (${jsFiles.length}):`)
  
  let totalJSSize = 0
  const chunks = {}

  jsFiles.forEach(file => {
    const filePath = path.join(assetsDir, file)
    const stats = fs.statSync(filePath)
    const sizeKB = (stats.size / 1024).toFixed(2)
    totalJSSize += stats.size

    // Categorize chunks
    let category = 'other'
    if (file.includes('vendor')) category = 'vendor'
    else if (file.includes('router')) category = 'router'
    else if (file.includes('admin')) category = 'admin'
    else if (file.includes('user')) category = 'user'
    else if (file.includes('dictionary')) category = 'dictionary'
    else if (file.includes('auth')) category = 'auth'
    else if (file.includes('index')) category = 'main'

    if (!chunks[category]) chunks[category] = { files: [], size: 0 }
    chunks[category].files.push({ name: file, size: stats.size })
    chunks[category].size += stats.size

    console.log(`  ${file}: ${sizeKB} KB`)
  })

  console.log(`\n📁 CSS Files (${cssFiles.length}):`)
  
  let totalCSSSize = 0
  cssFiles.forEach(file => {
    const filePath = path.join(assetsDir, file)
    const stats = fs.statSync(filePath)
    const sizeKB = (stats.size / 1024).toFixed(2)
    totalCSSSize += stats.size
    console.log(`  ${file}: ${sizeKB} KB`)
  })

  console.log(`\n📈 Bundle Summary:`)
  console.log(`  Total JS Size: ${(totalJSSize / 1024).toFixed(2)} KB`)
  console.log(`  Total CSS Size: ${(totalCSSSize / 1024).toFixed(2)} KB`)
  console.log(`  Total Bundle Size: ${((totalJSSize + totalCSSSize) / 1024).toFixed(2)} KB`)

  console.log(`\n🎯 Chunk Analysis:`)
  Object.entries(chunks).forEach(([category, data]) => {
    const sizeKB = (data.size / 1024).toFixed(2)
    const percentage = ((data.size / totalJSSize) * 100).toFixed(1)
    console.log(`  ${category}: ${sizeKB} KB (${percentage}%) - ${data.files.length} files`)
  })

  // Performance recommendations
  console.log(`\n💡 Performance Recommendations:`)
  
  if (chunks.vendor && chunks.vendor.size > 200 * 1024) {
    console.log(`  ⚠️  Vendor chunk is large (${(chunks.vendor.size / 1024).toFixed(2)} KB). Consider splitting further.`)
  }
  
  if (chunks.main && chunks.main.size > 100 * 1024) {
    console.log(`  ⚠️  Main chunk is large (${(chunks.main.size / 1024).toFixed(2)} KB). Consider lazy loading more components.`)
  }
  
  if (totalJSSize > 1024 * 1024) {
    console.log(`  ⚠️  Total bundle size is over 1MB. Consider aggressive code splitting.`)
  } else if (totalJSSize > 512 * 1024) {
    console.log(`  ⚠️  Total bundle size is over 512KB. Monitor bundle growth.`)
  } else {
    console.log(`  ✅ Bundle size is reasonable for a modern web application.`)
  }

  if (Object.keys(chunks).length < 5) {
    console.log(`  💡 Consider more granular code splitting for better caching.`)
  } else {
    console.log(`  ✅ Good code splitting strategy with ${Object.keys(chunks).length} chunk categories.`)
  }
}

function main() {
  console.log('🔍 Bundle Analysis Tool')
  console.log('========================')

  // Analyze web build
  analyzeDirectory(DIST_DIR, 'Web')

  // Analyze mobile build
  analyzeDirectory(WWW_DIR, 'Mobile')

  console.log('\n✨ Analysis complete!')
  console.log('\n📝 Tips:')
  console.log('  - Run this script after each build to monitor bundle size')
  console.log('  - Keep vendor chunks under 200KB for optimal loading')
  console.log('  - Lazy load admin and user-specific features')
  console.log('  - Use route-based code splitting for better caching')
}

main()