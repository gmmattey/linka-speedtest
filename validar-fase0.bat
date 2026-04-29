@echo off
chcp 65001 > nul
cd /d "D:\Projetos\linka SpeedTest"
set LOG=.tmp-validate-fase0.log
echo === Fase 0 Validation === > %LOG%
echo Timestamp: %DATE% %TIME% >> %LOG%
echo. >> %LOG%
echo === git status --short === >> %LOG%
git status --short >> %LOG% 2>&1
echo. >> %LOG%
echo === git diff --stat === >> %LOG%
git diff --stat >> %LOG% 2>&1
echo. >> %LOG%
echo === npm test === >> %LOG%
call npm test >> %LOG% 2>&1
echo. >> %LOG%
echo === npm run build === >> %LOG%
call npm run build >> %LOG% 2>&1
echo. >> %LOG%
echo === DONE === >> %LOG%
echo Log: D:\Projetos\linka SpeedTest\.tmp-validate-fase0.log
exit /b 0
