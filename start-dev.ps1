# Script PowerShell pour lancer le serveur de développement Vite
# Usage: .\start-dev.ps1
# Note: WampServer (Apache) doit être démarré séparément pour servir k3ui-docs

Write-Host "🚀 Démarrage du serveur de développement K3UI..." -ForegroundColor Green
Write-Host ""

# Vérifier si WampServer est accessible
$wampServerCheck = Test-NetConnection -ComputerName localhost -Port 80 -InformationLevel Quiet -WarningAction SilentlyContinue

if (-not $wampServerCheck) {
    Write-Host "⚠️  ATTENTION : WampServer (Apache) ne semble pas être démarré !" -ForegroundColor Yellow
    Write-Host "   Veuillez démarrer WampServer avant de continuer." -ForegroundColor Yellow
    Write-Host "   La documentation PHP sera accessible sur http://localhost/k3ui-docs/" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "✅ WampServer détecté et accessible" -ForegroundColor Green
    Write-Host ""
}

Write-Host "📍 URLs disponibles :" -ForegroundColor Yellow
Write-Host "   • Vite Dev Server: http://localhost:5173" -ForegroundColor White
Write-Host "   • Documentation WampServer: http://localhost/k3ui-docs/" -ForegroundColor White
Write-Host "   • Documentation via proxy: http://localhost:5173/k3ui-docs/index.php" -ForegroundColor White
Write-Host ""
Write-Host "💡 Appuyez sur Ctrl+C pour arrêter le serveur Vite" -ForegroundColor Gray
Write-Host "   (WampServer continuera de fonctionner indépendamment)" -ForegroundColor Gray
Write-Host ""
Write-Host "📦 Démarrage du serveur de développement complet..." -ForegroundColor Cyan
Write-Host "   (Vite + SCSS watch + Copie automatique)" -ForegroundColor Gray
Write-Host ""

# Lancer le serveur de développement complet
# Cela lance Vite, SCSS watch et la copie automatique en parallèle
npm run dev:full

