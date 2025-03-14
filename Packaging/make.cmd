cd %~dp0
del .\*.appx
rmdir /s /q Pack

pushd ..\AquaMai
dotnet cake
copy /y Output\AquaMai.dll ..\MaiChartManager\Resources
popd

pushd ..\MaiChartManager\Front
call pnpm build
popd

pushd ..
dotnet restore -r win-x64 -p:SelfContained=true -p:PublishReadyToRun=true
msbuild /p:Configuration=Release /p:DeployOnBuild=true /p:PublishProfile=FolderProfile
popd

mkdir Pack
copy Base\* Pack
pushd Pack

del .\priconfig.xml
del .\*.pri
makepri.exe createconfig /cf priconfig.xml /dq en-US
makepri.exe new /pr . /cf .\priconfig.xml
del .\priconfig.xml
makeappx pack /d . /p ../Store64.appx

pause